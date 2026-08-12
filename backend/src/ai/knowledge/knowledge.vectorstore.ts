import { supabasePool } from '../../config/database';
import { logger } from '../../config/logger';
import { DEFAULT_TOP_K, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, SIMILARITY_THRESHOLD } from './knowledge.constants';
import type { KnowledgeChunk, VectorSearchResult, VectorStoreStats } from './knowledge.types';
import { cosineSimilarity } from './knowledge.utils';

export class KnowledgeVectorStore {
  private readonly memoryChunks = new Map<string, KnowledgeChunk>();
  private schemaInitialized = false;

  public async initSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    try {
      await supabasePool.query(`
        CREATE EXTENSION IF NOT EXISTS vector;
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

        CREATE TABLE IF NOT EXISTS documents (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            name        TEXT        NOT NULL,
            file_path   TEXT,
            uploaded_by TEXT        DEFAULT 'system',
            page_count  INTEGER     DEFAULT 1,
            status      TEXT        NOT NULL DEFAULT 'Complete',
            created_at  TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS document_chunks (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id UUID        REFERENCES documents(id) ON DELETE CASCADE,
            page_number INTEGER     DEFAULT 1,
            chunk_index INTEGER     NOT NULL,
            heading     TEXT,
            content     TEXT        NOT NULL,
            token_count INTEGER     DEFAULT 0,
            metadata    JSONB       DEFAULT '{}'::jsonb,
            created_at  TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS embeddings (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            chunk_id    UUID        REFERENCES document_chunks(id) ON DELETE CASCADE,
            embedding   VECTOR(384),
            model       TEXT        NOT NULL DEFAULT 'all-MiniLM-L6-v2',
            created_at  TIMESTAMPTZ DEFAULT now()
        );
      `);
      this.schemaInitialized = true;
      logger.info('Supabase pgvector RAG schema initialized successfully.');
    } catch (err) {
      logger.warn({ err }, 'Could not auto-initialize pgvector schema; using existing tables or fallback');
    }
  }

  /**
   * Add chunks and embeddings into Supabase PostgreSQL + pgvector atomically using a transaction.
   *
   * @param chunks Array of KnowledgeChunk objects with pre-computed embedding vectors
   */
  public async add(chunks: KnowledgeChunk[]): Promise<void> {
    if (!chunks || chunks.length === 0) return;

    // Update local in-memory state
    for (const chunk of chunks) {
      this.memoryChunks.set(chunk.id, chunk);
    }

    try {
      await this.initSchema();
      const client = await supabasePool.connect();
      try {
        await client.query('BEGIN');

        const firstMeta = chunks[0]?.metadata;
        const documentId = firstMeta?.documentId || `doc_${Date.now()}`;
        const filename = firstMeta?.filename || firstMeta?.title || 'Document';
        const pageCount = firstMeta?.pageCount || 1;

        // 1. Insert or update parent Document record
        await client.query(
          `INSERT INTO documents (id, name, file_path, page_count, status)
           VALUES ($1::uuid, $2, $3, $4, 'Complete')
           ON CONFLICT (id) DO UPDATE SET page_count = EXCLUDED.page_count, status = 'Complete'`,
          [
            this.toValidUuid(documentId),
            filename,
            firstMeta?.sourcePath || filename,
            pageCount,
          ],
        );

        // 2. Insert document_chunks and embeddings inside the same transaction
        for (const chunk of chunks) {
          const chunkUuid = this.toValidUuid(chunk.id);
          const docUuid = this.toValidUuid(chunk.metadata.documentId);

          const chunkRes = await client.query(
            `INSERT INTO document_chunks (id, document_id, page_number, chunk_index, heading, content, token_count, metadata)
             VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::jsonb)
             ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content
             RETURNING id`,
            [
              chunkUuid,
              docUuid,
              chunk.metadata.pageNumber || 1,
              chunk.metadata.chunkIndex,
              chunk.metadata.sectionHeading || null,
              chunk.text,
              chunk.metadata.tokenEstimate || 0,
              JSON.stringify(chunk.metadata),
            ],
          );

          if (chunk.vector && chunk.vector.length > 0) {
            const vectorString = `[${chunk.vector.join(',')}]`;
            await client.query(
              `INSERT INTO embeddings (chunk_id, embedding, model)
               VALUES ($1::uuid, $2::vector, $3)
               ON CONFLICT DO NOTHING`,
              [chunkRes.rows[0].id, vectorString, EMBEDDING_MODEL],
            );
          }
        }

        await client.query('COMMIT');
        logger.info({ addedCount: chunks.length, documentId }, 'Transactional insertion to Supabase pgvector complete');
      } catch (err) {
        await client.query('ROLLBACK');
        logger.warn({ err }, 'Supabase pgvector transaction failed; rolling back and maintaining in-memory store');
      } finally {
        client.release();
      }
    } catch (dbErr) {
      logger.warn({ err: dbErr }, 'PostgreSQL connection unavailable; using in-memory store fallback');
    }
  }

  /**
   * Retrieves all stored vector chunks for hybrid search & BM25 scoring fallback.
   */
  public getAllChunks(): KnowledgeChunk[] {
    return Array.from(this.memoryChunks.values());
  }

  /**
   * Performs top-K Cosine Similarity vector search against Supabase pgvector.
   *
   * @param queryVector Embedding vector of the query
   * @param topK Number of top matching chunks to return
   * @param minSimilarity Minimum Cosine Similarity score threshold
   * @returns Array of VectorSearchResult objects sorted by descending similarity
   */
  public async search(
    queryVector: number[],
    topK: number = DEFAULT_TOP_K,
    minSimilarity: number = SIMILARITY_THRESHOLD,
  ): Promise<VectorSearchResult[]> {
    try {
      await this.initSchema();
      const vectorString = `[${queryVector.join(',')}]`;
      const query = `
        SELECT
          dc.id,
          dc.document_id,
          dc.page_number,
          dc.chunk_index,
          dc.heading,
          dc.content,
          dc.metadata,
          1 - (e.embedding <=> $1::vector) as similarity
        FROM document_chunks dc
        JOIN embeddings e ON e.chunk_id = dc.id
        WHERE (1 - (e.embedding <=> $1::vector)) >= $2
        ORDER BY similarity DESC
        LIMIT $3;
      `;

      const res = await supabasePool.query(query, [vectorString, minSimilarity, topK]);

      if (res.rows.length > 0) {
        return res.rows.map((row) => ({
          chunk: {
            id: row.id,
            text: row.content,
            metadata: row.metadata || {
              documentId: row.document_id,
              filename: 'Document',
              title: 'Document',
              fileType: 'pdf',
              fileSize: 1024,
              chunkIndex: row.chunk_index,
              pageNumber: row.page_number,
              sectionHeading: row.heading,
              tokenEstimate: 100,
              createdAt: new Date().toISOString(),
              source: 'Supabase pgvector',
            },
          },
          similarity: Number(row.similarity),
        }));
      }
    } catch (err) {
      logger.warn({ err }, 'Supabase pgvector query failed; utilizing in-memory vector store search');
    }

    // In-memory fallback search
    const results: VectorSearchResult[] = [];
    for (const chunk of this.memoryChunks.values()) {
      if (!chunk.vector) continue;
      const score = cosineSimilarity(queryVector, chunk.vector);
      if (score >= minSimilarity) {
        results.push({ chunk, similarity: score });
      }
    }
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * Removes all chunks belonging to a specific document ID cascadingly in Supabase.
   */
  public async delete(documentId: string): Promise<number> {
    let deletedCount = 0;

    for (const [id, chunk] of this.memoryChunks.entries()) {
      if (chunk.metadata.documentId === documentId) {
        this.memoryChunks.delete(id);
        deletedCount++;
      }
    }

    try {
      const docUuid = this.toValidUuid(documentId);
      const res = await supabasePool.query('DELETE FROM documents WHERE id = $1::uuid', [docUuid]);
      logger.info({ documentId, deletedRows: res.rowCount }, 'Deleted document and cascading chunks from Supabase');
    } catch (err) {
      logger.warn({ err, documentId }, 'Supabase document delete operation failed');
    }

    return deletedCount;
  }

  /**
   * Clears all stored vector chunks.
   */
  public async clear(): Promise<void> {
    this.memoryChunks.clear();
    try {
      await supabasePool.query('TRUNCATE TABLE documents CASCADE;');
    } catch {
      // Ignore if DB offline
    }
    logger.info('Cleared KnowledgeVectorStore');
  }

  /**
   * Returns storage statistics for the vector store.
   */
  public stats(): VectorStoreStats {
    const documentIds = new Set<string>();
    for (const chunk of this.memoryChunks.values()) {
      documentIds.add(chunk.metadata.documentId);
    }

    return {
      totalDocuments: documentIds.size,
      totalChunks: this.memoryChunks.size,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
      memoryUsageBytes: JSON.stringify(Array.from(this.memoryChunks.values())).length,
    };
  }

  private toValidUuid(idStr: string): string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idStr)) return idStr;

    // Convert string deterministically to pseudo-UUID format
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = (hash << 5) - hash + idStr.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(12, '0');
    return `00000000-0000-4000-8000-${hex.slice(0, 12)}`;
  }
}

export const knowledgeVectorStore = new KnowledgeVectorStore();
