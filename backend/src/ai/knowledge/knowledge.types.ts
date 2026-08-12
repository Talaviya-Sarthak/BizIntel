/**
 * Enterprise Knowledge Engine (RAG) Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

import type { MemoryContext } from '../memory/memory.types';
import type { ResponseCitation } from '../generator/response.types';

/** Supported document formats for enterprise ingestion */
export type SupportedDocumentFormat = 'pdf' | 'docx' | 'txt' | 'markdown';

/** Document Metadata attached to ingested files */
export interface KnowledgeDocumentMetadata {
  documentId: string;
  filename: string;
  title: string;
  fileType: SupportedDocumentFormat;
  fileSize: number;
  pageCount?: number;
  createdAt: string;
  source: string;
  [key: string]: any;
}

/** Individual text chunk with metadata and position tracking */
export interface KnowledgeChunkMetadata extends KnowledgeDocumentMetadata {
  chunkIndex: number;
  pageNumber?: number;
  tokenEstimate: number;
}

/** Vector document chunk stored in the Knowledge Engine */
export interface KnowledgeChunk {
  id: string;
  text: string;
  vector?: number[];
  metadata: KnowledgeChunkMetadata;
}

/** Search result returned by Vector Store query */
export interface VectorSearchResult {
  chunk: KnowledgeChunk;
  similarity: number;
}

/** Result returned by KnowledgeRetriever */
export interface RetrievalResult {
  query: string;
  chunks: VectorSearchResult[];
  executionTimeMs: number;
}

/** Input context supplied to KnowledgePromptBuilder */
export interface KnowledgePromptContext {
  question: string;
  retrievedChunks: VectorSearchResult[];
  memoryContext?: MemoryContext;
}

/** Answer object returned by KnowledgeService */
export interface KnowledgeAnswer {
  answer: string;
  chunks: VectorSearchResult[];
  citations: ResponseCitation[];
  executionTimeMs: number;
}

/** Statistics overview for the Vector Store and Document Registry */
export interface VectorStoreStats {
  totalDocuments: number;
  totalChunks: number;
  embeddingDimensions: number;
  memoryUsageBytes: number;
}
