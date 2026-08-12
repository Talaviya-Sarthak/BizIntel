import {
  EMBEDDING_VERSION,
} from './knowledge.constants';
import type { KnowledgeChunk, KnowledgeDocumentMetadata } from './knowledge.types';
import { estimateTokenCount, normalizeDocumentText } from './knowledge.utils';

export interface PageContent {
  pageNumber: number;
  text: string;
}

export interface ChunkerOptions {
  maxWords?: number;
  overlapWords?: number;
  chunkSize?: number;
  chunkOverlap?: number;
}

export class KnowledgeChunker {
  private readonly maxWords: number;
  private readonly overlapWords: number;

  constructor(options: ChunkerOptions = {}) {
    if (
      options.chunkSize !== undefined &&
      options.chunkOverlap !== undefined &&
      options.chunkOverlap >= options.chunkSize
    ) {
      throw new Error('chunkOverlap must be strictly less than chunkSize');
    }

    if (options.maxWords !== undefined) {
      this.maxWords = options.maxWords;
    } else if (options.chunkSize !== undefined) {
      this.maxWords = Math.max(3, Math.floor(options.chunkSize / 20));
    } else {
      this.maxWords = 500;
    }

    if (options.overlapWords !== undefined) {
      this.overlapWords = options.overlapWords;
    } else if (options.chunkOverlap !== undefined) {
      this.overlapWords = Math.max(1, Math.floor(options.chunkOverlap / 20));
    } else {
      this.overlapWords = 80;
    }
  }

  /**
   * Splits per-page text into word-bounded semantic chunks aligned with paragraph,
   * section, and heading boundaries.
   *
   * @param pages Extracted array of page contents
   * @param metadata Base document metadata
   * @returns Array of semantic KnowledgeChunk objects
   */
  public splitPages(pages: PageContent[], metadata: KnowledgeDocumentMetadata): KnowledgeChunk[] {
    const allChunks: { text: string; pageNumber: number; sectionHeading?: string; wordCount: number }[] = [];
    let currentHeading = metadata.title || 'General';

    for (const page of pages) {
      const normalizedPageText = normalizeDocumentText(page.text);
      if (!normalizedPageText) continue;

      // Extract section title or heading if present on this page
      const headingMatch = normalizedPageText.match(/(?:^|\n)(?:#+\s*|SECTION\s+\d+|CHAPTER\s+\d+|[A-Z0-9\s]{4,30}:?\n)([^\n]+)/i);
      if (headingMatch && headingMatch[1]) {
        currentHeading = headingMatch[1].trim();
      }

      // Split page text semantically into max 500-word chunks with 80-word overlap
      const rawPageChunks = this.wordBoundSemanticSplit(normalizedPageText, this.maxWords, this.overlapWords);

      for (const chunkText of rawPageChunks) {
        const words = chunkText.split(/\s+/).filter(Boolean).length;
        allChunks.push({
          text: chunkText,
          pageNumber: page.pageNumber,
          sectionHeading: currentHeading,
          wordCount: words,
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

  public splitDocument(rawText: string, metadata: KnowledgeDocumentMetadata): KnowledgeChunk[] {
    const pages: PageContent[] = [{ pageNumber: 1, text: rawText }];
    return this.splitPages(pages, metadata);
  }

  /**
   * Word-bounded semantic text splitter (preserves paragraphs, bullet lists, headings, and sentence boundaries).
   */
  private wordBoundSemanticSplit(text: string, maxWords: number, overlapWords: number): string[] {
    const totalWords = text.split(/\s+/).filter(Boolean);
    if (totalWords.length <= maxWords) {
      return [text];
    }

    // Split text into semantic blocks (paragraphs \n\n, lines \n, or sentences . )
    let blocks = text.split(/\n\n+/).filter((b) => b.trim().length > 0);
    if (blocks.length === 1) {
      blocks = text.split(/(?<=\.\s+)/).filter((b) => b.trim().length > 0);
    }

    const chunks: string[] = [];
    let currentBlockGroup: string[] = [];
    let currentWordCount = 0;

    for (const block of blocks) {
      const blockWords = block.split(/\s+/).filter(Boolean).length;

      if (currentWordCount + blockWords <= maxWords) {
        currentBlockGroup.push(block);
        currentWordCount += blockWords;
      } else {
        if (currentBlockGroup.length > 0) {
          chunks.push(currentBlockGroup.join(' ').trim());
        }

        const prevText = currentBlockGroup.join(' ');
        const prevWords = prevText.split(/\s+/).filter(Boolean);

        if (prevWords.length > overlapWords) {
          const overlapStr = prevWords.slice(prevWords.length - overlapWords).join(' ');
          currentBlockGroup = [overlapStr, block];
          currentWordCount = overlapWords + blockWords;
        } else {
          currentBlockGroup = [block];
          currentWordCount = blockWords;
        }
      }
    }

    if (currentBlockGroup.length > 0) {
      chunks.push(currentBlockGroup.join(' ').trim());
    }

    return chunks;
  }
}

export const knowledgeChunker = new KnowledgeChunker();
