import { logger } from '../../config/logger';
import { DEFAULT_TOP_K, EMBEDDING_DIMENSIONS, SIMILARITY_THRESHOLD } from './knowledge.constants';
import type { KnowledgeChunk, VectorSearchResult, VectorStoreStats } from './knowledge.types';
import { cosineSimilarity } from './knowledge.utils';

export class KnowledgeVectorStore {
  private readonly chunks = new Map<string, KnowledgeChunk>();

  /**
   * Add chunk vectors into the vector store.
   *
   * @param chunks Array of KnowledgeChunk objects with pre-computed embedding vectors
   */
  public async add(chunks: KnowledgeChunk[]): Promise<void> {
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
    }
    logger.info({ addedCount: chunks.length, totalChunks: this.chunks.size }, 'Chunks added to KnowledgeVectorStore');
  }

  /**
   * Retrieves all stored vector chunks for hybrid search & BM25 scoring.
   */
  public getAllChunks(): KnowledgeChunk[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Performs top-K Cosine Similarity vector search against stored chunks.
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
    const results: VectorSearchResult[] = [];

    for (const chunk of this.chunks.values()) {
      if (!chunk.vector) continue;

      const score = cosineSimilarity(queryVector, chunk.vector);
      if (score >= minSimilarity) {
        results.push({
          chunk,
          similarity: score,
        });
      }
    }

    // Sort descending by similarity score
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, topK);
  }

  /**
   * Removes all chunks belonging to a specific document ID.
   */
  public async delete(documentId: string): Promise<number> {
    let deletedCount = 0;
    for (const [id, chunk] of this.chunks.entries()) {
      if (chunk.metadata.documentId === documentId) {
        this.chunks.delete(id);
        deletedCount++;
      }
    }
    logger.info({ documentId, deletedCount }, 'Deleted document chunks from KnowledgeVectorStore');
    return deletedCount;
  }

  /**
   * Clears all stored vector chunks.
   */
  public async clear(): Promise<void> {
    this.chunks.clear();
    logger.info('Cleared KnowledgeVectorStore');
  }

  /**
   * Returns storage statistics for the vector store.
   */
  public stats(): VectorStoreStats {
    const documentIds = new Set<string>();
    for (const chunk of this.chunks.values()) {
      documentIds.add(chunk.metadata.documentId);
    }

    return {
      totalDocuments: documentIds.size,
      totalChunks: this.chunks.size,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
      memoryUsageBytes: JSON.stringify(Array.from(this.chunks.values())).length,
    };
  }
}

export const knowledgeVectorStore = new KnowledgeVectorStore();
