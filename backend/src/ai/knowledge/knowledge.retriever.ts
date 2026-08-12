import { logger } from '../../config/logger';
import { DEFAULT_TOP_K, SIMILARITY_THRESHOLD } from './knowledge.constants';
import { knowledgeEmbeddingService, KnowledgeEmbeddingService } from './knowledge.embeddings';
import type { RetrievalResult, VectorSearchResult } from './knowledge.types';
import { knowledgeVectorStore, KnowledgeVectorStore } from './knowledge.vectorstore';

export interface RetrieverOptions {
  topK?: number;
  minSimilarity?: number;
}

export class KnowledgeRetriever {
  constructor(
    private readonly vectorStore: KnowledgeVectorStore = knowledgeVectorStore,
    private readonly embeddingService: KnowledgeEmbeddingService = knowledgeEmbeddingService,
  ) {}

  /**
   * Retrieves top-K relevant document context chunks for a user question.
   *
   * @param query User natural language question
   * @param options Retrieval options (topK, minSimilarity)
   * @returns RetrievalResult payload
   */
  public async retrieve(query: string, options: RetrieverOptions = {}): Promise<RetrievalResult> {
    const startTime = Date.now();
    const topK = options.topK ?? DEFAULT_TOP_K;
    const minSimilarity = options.minSimilarity ?? SIMILARITY_THRESHOLD;

    if (!query || !query.trim()) {
      return { query, chunks: [], executionTimeMs: Date.now() - startTime };
    }

    try {
      // 1. Generate query embedding vector
      const queryVector = await this.embeddingService.embedQuery(query);

      // 2. Perform Cosine Similarity Search on Vector Store
      const chunks = await this.vectorStore.search(queryVector, topK, minSimilarity);

      const executionTimeMs = Date.now() - startTime;
      logger.info(
        { query, retrievedCount: chunks.length, executionTimeMs },
        'KnowledgeRetriever similarity search complete',
      );

      return {
        query,
        chunks,
        executionTimeMs,
      };
    } catch (error) {
      logger.error({ err: error, query }, 'KnowledgeRetriever query failure');
      return {
        query,
        chunks: [],
        executionTimeMs: Date.now() - startTime,
      };
    }
  }
}

export const knowledgeRetriever = new KnowledgeRetriever();
