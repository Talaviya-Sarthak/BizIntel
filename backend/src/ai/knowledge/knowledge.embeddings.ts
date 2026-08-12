import { EMBEDDING_DIMENSIONS } from './knowledge.constants';

/**
 * Interface that all embedding providers (HuggingFace, OpenAI, Voyage, Local) must implement.
 */
export interface IEmbeddingService {
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
}

export class KnowledgeEmbeddingService implements IEmbeddingService {
  private readonly dimensions: number;

  constructor(dimensions: number = EMBEDDING_DIMENSIONS) {
    this.dimensions = dimensions;
  }

  public getDimensions(): number {
    return this.dimensions;
  }

  /**
   * Embeds a user search query into a normalized dense vector.
   *
   * @param text Query input text
   * @returns Array of numbers representing dense 384-dim embedding
   */
  public async embedQuery(text: string): Promise<number[]> {
    return this.generateEmbedding(text);
  }

  /**
   * Embeds an array of document texts into a matrix of dense vectors.
   *
   * @param texts Array of document chunk texts
   * @returns Matrix of dense embedding vectors
   */
  public async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.generateEmbedding(t)));
  }

  /**
   * Deterministic, normalized feature-projection embedding generator.
   * Computes n-gram semantic frequency features and projects them into a 384-dimensional unit hypersphere.
   */
  private generateEmbedding(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    // Strip non-alphanumeric characters for clean semantic n-gram hashing
    const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
    if (!cleaned) return vector;

    const tokens = cleaned.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      this.accumulateHash(token, vector, 1.0);
      for (let i = 0; i < token.length - 1; i++) {
        const bigram = token.substring(i, i + 2);
        this.accumulateHash(bigram, vector, 0.5);
      }
    }

    // Normalize to unit length L2 norm
    let sumSq = 0;
    for (let i = 0; i < this.dimensions; i++) {
      const val = vector[i] ?? 0;
      sumSq += val * val;
    }

    const norm = Math.sqrt(sumSq);
    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        const val = vector[i] ?? 0;
        vector[i] = val / norm;
      }
    }

    return vector;
  }

  private accumulateHash(key: string, vector: number[], weight: number): void {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }

    const idx = Math.abs(hash) % this.dimensions;
    const sign = hash >= 0 ? 1 : -1;
    const val = vector[idx] ?? 0;
    vector[idx] = val + sign * weight;
  }
}

export const knowledgeEmbeddingService = new KnowledgeEmbeddingService();
