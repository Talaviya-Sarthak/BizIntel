import { DEFAULT_CHUNK_OVERLAP, DEFAULT_CHUNK_SIZE } from './knowledge.constants';
import type { KnowledgeChunk, KnowledgeDocumentMetadata } from './knowledge.types';
import { estimateTokenCount, normalizeDocumentText } from './knowledge.utils';

export interface ChunkerOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export class KnowledgeChunker {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(options: ChunkerOptions = {}) {
    this.chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
    this.chunkOverlap = options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error('chunkOverlap must be strictly less than chunkSize');
    }
  }

  /**
   * Recursively splits document text into chunks preserving sentence/paragraph boundaries where possible.
   *
   * @param rawText Full raw document text
   * @param metadata Base document metadata
   * @returns Array of KnowledgeChunk objects with chunk indices and token estimates
   */
  public splitDocument(rawText: string, metadata: KnowledgeDocumentMetadata): KnowledgeChunk[] {
    const normalized = normalizeDocumentText(rawText);
    if (!normalized) return [];

    const rawChunks = this.recursiveSplitText(normalized, this.chunkSize, this.chunkOverlap);

    return rawChunks.map((text, index) => {
      const tokenEstimate = estimateTokenCount(text);
      return {
        id: `chk_${metadata.documentId}_${index}`,
        text,
        metadata: {
          ...metadata,
          chunkIndex: index,
          pageNumber: metadata.pageCount ? Math.floor((index / rawChunks.length) * metadata.pageCount) + 1 : 1,
          tokenEstimate,
        },
      };
    });
  }

  private recursiveSplitText(text: string, chunkSize: number, chunkOverlap: number): string[] {
    if (text.length <= chunkSize) {
      return [text];
    }

    const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ' ', ''];
    let chosenSeparator = '';

    for (const sep of separators) {
      if (text.includes(sep)) {
        chosenSeparator = sep;
        break;
      }
    }

    const splits = chosenSeparator ? text.split(chosenSeparator) : [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const split of splits) {
      const piece = currentChunk
        ? currentChunk + (chosenSeparator === ' ' ? ' ' : chosenSeparator) + split
        : split;

      if (piece.length <= chunkSize) {
        currentChunk = piece;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        // Apply overlap from end of currentChunk if possible
        if (currentChunk.length > chunkOverlap) {
          const overlapText = currentChunk.slice(currentChunk.length - chunkOverlap);
          currentChunk = overlapText + (chosenSeparator === ' ' ? ' ' : chosenSeparator) + split;
        } else {
          currentChunk = split;
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

export const knowledgeChunker = new KnowledgeChunker();
