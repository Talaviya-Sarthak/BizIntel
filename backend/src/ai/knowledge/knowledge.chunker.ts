import {
  DEFAULT_CHUNK_OVERLAP,
  DEFAULT_CHUNK_SIZE,
  EMBEDDING_VERSION,
} from './knowledge.constants';
import type { KnowledgeChunk, KnowledgeDocumentMetadata } from './knowledge.types';
import { estimateTokenCount, normalizeDocumentText } from './knowledge.utils';

export interface PageContent {
  pageNumber: number;
  text: string;
}

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
   * Splits per-page or full document text into semantic chunks aligned with paragraph,
   * section, and heading boundaries.
   *
   * @param pages Extracted array of page contents (or full document text)
   * @param metadata Base document metadata
   * @returns Array of semantic KnowledgeChunk objects
   */
  public splitPages(pages: PageContent[], metadata: KnowledgeDocumentMetadata): KnowledgeChunk[] {
    const allChunks: { text: string; pageNumber: number; sectionHeading?: string }[] = [];
    let currentHeading = '';

    for (const page of pages) {
      const normalizedPageText = normalizeDocumentText(page.text);
      if (!normalizedPageText) continue;

      // Extract current heading if present on this page
      const headingMatch = normalizedPageText.match(/(?:^|\n)(?:#+\s*|SECTION\s+\d+|CHAPTER\s+\d+|[A-Z0-9\s]{4,30}:?\n)([^\n]+)/i);
      if (headingMatch && headingMatch[1]) {
        currentHeading = headingMatch[1].trim();
      }

      // Split page text semantically into paragraphs and sections
      const rawPageChunks = this.semanticSplitText(normalizedPageText, this.chunkSize, this.chunkOverlap);

      for (const chunkText of rawPageChunks) {
        allChunks.push({
          text: chunkText,
          pageNumber: page.pageNumber,
          sectionHeading: currentHeading || metadata.title,
        });
      }
    }

    const totalChunks = allChunks.length;

    return allChunks.map((c, index) => {
      const tokenEstimate = estimateTokenCount(c.text);
      return {
        id: `chk_${metadata.documentId}_${index}`,
        text: c.text,
        metadata: {
          ...metadata,
          documentName: metadata.title || metadata.filename,
          chunkIndex: index,
          totalChunks,
          pageNumber: c.pageNumber,
          sectionHeading: c.sectionHeading,
          tokenEstimate,
          sourcePath: metadata.source || metadata.filename,
          embeddingVersion: EMBEDDING_VERSION,
        },
      };
    });
  }

  /**
   * Semantic chunking over a single full document string fallback.
   */
  public splitDocument(rawText: string, metadata: KnowledgeDocumentMetadata): KnowledgeChunk[] {
    const pages: PageContent[] = [{ pageNumber: 1, text: rawText }];
    return this.splitPages(pages, metadata);
  }

  /**
   * Recursively splits document text along semantic boundaries (headings, paragraphs, lists, sentences)
   * avoiding cutting paragraphs in half where possible.
   */
  private semanticSplitText(text: string, chunkSize: number, chunkOverlap: number): string[] {
    if (text.length <= chunkSize) {
      return [text];
    }

    // Ordered list of semantic separators
    const separators = ['\n\n---\n\n', '\n\n', '\n# ', '\n## ', '\n### ', '\n• ', '\n- ', '\n', '. ', '? ', '! ', '; ', ' '];
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
        if (currentChunk.trim()) {
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
