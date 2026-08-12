import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { GROQ_LLM_MODEL } from '../constants';
import { knowledgeCitations, KnowledgeCitations } from './knowledge.citations';
import { RAG_GROUNDED_ANSWER_SYSTEM_PROMPT } from './knowledge.prompts';
import { knowledgeRetriever, KnowledgeRetriever } from './knowledge.retriever';

import type { KnowledgeAnswer, VectorSearchResult } from './knowledge.types';

export class KnowledgeService {
  private model: ChatGroq | null = null;

  constructor(
    private readonly retriever: KnowledgeRetriever = knowledgeRetriever,
    private readonly citationsBuilder: KnowledgeCitations = knowledgeCitations,
  ) {
    this.initModel();
  }

  private initModel(): void {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) return;

    try {
      this.model = new ChatGroq({
        apiKey,
        model: GROQ_LLM_MODEL,
        temperature: 0.1,
        maxTokens: 1024,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize KnowledgeService ChatGroq model');
      this.model = null;
    }
  }

  /**
   * Executes full Enterprise RAG retrieval & grounded answer generation.
   *
   * @param question Natural language user query
   * @returns KnowledgeAnswer object carrying answer text, retrieved chunks, citations, and execution timing
   */
  public async queryKnowledge(question: string): Promise<KnowledgeAnswer> {
    const startTime = Date.now();

    if (!question || !question.trim()) {
      return {
        answer: 'Please provide a valid question to search the enterprise knowledge base.',
        chunks: [],
        citations: [],
        executionTimeMs: Date.now() - startTime,
      };
    }

    // 1. Similarity Vector Search for relevant document chunks
    const retrieval = await this.retriever.retrieve(question);
    const chunks = retrieval.chunks;

    // 2. If no matching document chunks found, return polite insufficient info response
    if (chunks.length === 0) {
      return {
        answer: 'The available knowledge base does not contain enough information to answer this question confidently.',
        chunks: [],
        citations: [],
        executionTimeMs: Date.now() - startTime,
      };
    }

    // 3. Extract Citations
    const citations = this.citationsBuilder.extractCitations(chunks);

    // 4. Synthesize Grounded Answer using Groq LLM
    if (!this.model) {
      this.initModel();
    }

    if (!this.model) {
      return {
        answer: this.generateFallbackAnswer(chunks),
        chunks,
        citations,
        executionTimeMs: Date.now() - startTime,
      };
    }

    try {
      const contextText = chunks
        .map((c, i) => `[CHUNK ${i + 1}] (Source: ${c.chunk.metadata.filename || 'Document'}, Page: ${c.chunk.metadata.pageNumber || 1}, Similarity: ${(c.similarity * 100).toFixed(1)}%):\n${c.chunk.text}`)
        .join('\n\n---\n\n');

      const messages = [
        new SystemMessage(RAG_GROUNDED_ANSWER_SYSTEM_PROMPT),
        new HumanMessage(`USER QUESTION:\n"${question}"\n\nRETRIEVED DOCUMENT CONTEXT:\n${contextText}`),
      ];

      const response = await this.model.invoke(messages);
      let answerText = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      answerText = answerText.trim();

      const executionTimeMs = Date.now() - startTime;
      logger.info({ question, chunkCount: chunks.length, executionTimeMs }, 'RAG query grounded synthesis complete');

      return {
        answer: answerText,
        chunks,
        citations,
        executionTimeMs,
      };
    } catch (error) {
      logger.error({ err: error, question }, 'Error generating grounded RAG answer');
      return {
        answer: this.generateFallbackAnswer(chunks),
        chunks,
        citations,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  private generateFallbackAnswer(chunks: VectorSearchResult[]): string {
    const chunkSummaries = chunks.map((c) => `- ${c.chunk.text.slice(0, 150)}...`).join('\n');
    return `### Knowledge Retrieval Output\n\nRelevant document excerpts retrieved:\n${chunkSummaries}`;
  }
}

export const knowledgeService = new KnowledgeService();
