import { logger } from '../../config/logger';
import { knowledgeChunker, KnowledgeChunker } from './knowledge.chunker';
import { knowledgeEmbeddingService, KnowledgeEmbeddingService } from './knowledge.embeddings';
import type {
  KnowledgeChunk,
  KnowledgeDocumentMetadata,
  SupportedDocumentFormat,
} from './knowledge.types';
import { titleFromFilename } from './knowledge.utils';
import { knowledgeVectorStore, KnowledgeVectorStore } from './knowledge.vectorstore';

export interface IngestDocumentInput {
  documentId?: string;
  filename: string;
  fileContent: string | Buffer;
  fileType?: SupportedDocumentFormat;
  source?: string;
  pageCount?: number;
}

export class KnowledgeIngestionService {
  constructor(
    private readonly chunker: KnowledgeChunker = knowledgeChunker,
    private readonly embeddingService: KnowledgeEmbeddingService = knowledgeEmbeddingService,
    private readonly vectorStore: KnowledgeVectorStore = knowledgeVectorStore,
  ) {}

  /**
   * Ingests, parses, chunks, embeds, and indexes a raw enterprise document.
   *
   * @param input Document file contents and metadata
   * @returns Array of indexed KnowledgeChunk objects
   */
  public async ingestDocument(input: IngestDocumentInput): Promise<KnowledgeChunk[]> {
    const startTime = Date.now();
    const documentId = input.documentId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fileType = input.fileType || this.inferFormatFromFilename(input.filename);
    const textContent = typeof input.fileContent === 'string'
      ? input.fileContent
      : input.fileContent.toString('utf-8');

    const metadata: KnowledgeDocumentMetadata = {
      documentId,
      filename: input.filename,
      title: titleFromFilename(input.filename),
      fileType,
      fileSize: Buffer.byteLength(textContent),
      pageCount: input.pageCount,
      createdAt: new Date().toISOString(),
      source: input.source || input.filename,
    };

    logger.info({ documentId, filename: input.filename, fileType }, 'Starting document ingestion');

    // 1. Chunk document text
    const chunks = this.chunker.splitDocument(textContent, metadata);

    if (chunks.length === 0) {
      logger.warn({ documentId }, 'Document text chunking produced 0 chunks');
      return [];
    }

    // 2. Generate Dense Embedding Vectors for chunks
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await this.embeddingService.embedDocuments(chunkTexts);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk) {
        chunk.vector = embeddings[i];
      }
    }

    // 3. Index chunks into Vector Store
    await this.vectorStore.add(chunks);

    const executionTimeMs = Date.now() - startTime;
    logger.info(
      { documentId, chunkCount: chunks.length, executionTimeMs },
      'Document ingestion and vector indexing completed',
    );

    return chunks;
  }

  private inferFormatFromFilename(filename: string): SupportedDocumentFormat {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx' || ext === 'doc') return 'docx';
    if (ext === 'md' || ext === 'markdown') return 'markdown';
    return 'txt';
  }
}

export const knowledgeIngestionService = new KnowledgeIngestionService();
