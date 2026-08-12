/**
 * Knowledge Engine (RAG) Constants
 * PS-05 Enterprise Intelligence Platform
 */

/** Default text chunk size in characters */
export const DEFAULT_CHUNK_SIZE = 800;

/** Default text chunk overlap in characters */
export const DEFAULT_CHUNK_OVERLAP = 150;

/** Default number of top relevant chunks to retrieve */
export const DEFAULT_TOP_K = 4;

/** Maximum context chunks passed to prompt builder */
export const MAX_CONTEXT_CHUNKS = 6;

/** Minimum cosine similarity threshold (0.0 to 1.0) for a chunk to be considered relevant */
export const SIMILARITY_THRESHOLD = 0.15;

/** Embedding vector dimensionality (384-dimensional feature space) */
export const EMBEDDING_DIMENSIONS = 384;

/** Model identifier for embedding generation service */
export const EMBEDDING_MODEL = 'all-MiniLM-L6-v2';

/** Active vector store backend identifier */
export const VECTOR_STORE_TYPE = 'memory';
