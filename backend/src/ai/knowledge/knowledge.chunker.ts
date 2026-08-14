import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { EMBEDDING_VERSION } from './knowledge.constants.js';
import type { KnowledgeChunk, KnowledgeDocumentMetadata } from './knowledge.types.js';
import { estimateTokenCount, normalizeDocumentText } from './knowledge.utils.js';

export interface PageContent {
  pageNumber: number;
  text: string;
}

export interface ChunkerOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  maxWords?: number;
  overlapWords?: number;
}

export class KnowledgeChunker {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(options: ChunkerOptions = {}) {
    this.chunkSize = options.chunkSize ?? 500;
    this.chunkOverlap = options.chunkOverlap ?? 100;

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error('chunkOverlap must be strictly less than chunkSize');
    }
  }

  /**
   * Splits per-page document text into chunks using LangChain RecursiveCharacterTextSplitter
   * with chunkSize=800 and chunkOverlap=150.
   *
   * @param pages Extracted array of page contents
   * @param metadata Base document metadata
   * @returns Array of semantic KnowledgeChunk objects
   */
  public async splitPagesAsync(
    pages: PageContent[],
    metadata: KnowledgeDocumentMetadata,
  ): Promise<KnowledgeChunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });

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

      // Split page text using RecursiveCharacterTextSplitter
      const rawPageChunks = await splitter.splitText(normalizedPageText);

      for (const chunkText of rawPageChunks) {
        // Do NOT filter out chunks < 100 characters; retain all chunks
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

  public splitPages(pages: PageContent[], metadata: KnowledgeDocumentMetadata): KnowledgeChunk[] {
    // Synchronous fallback for legacy callers using simple Recursive character splitting
    const allChunks: { text: string; pageNumber: number; sectionHeading?: string; wordCount: number }[] = [];
    let currentHeading = metadata.title || 'General';

    for (const page of pages) {
      const normalizedPageText = normalizeDocumentText(page.text);
      if (!normalizedPageText) continue;

      const headingMatch = normalizedPageText.match(/(?:^|\n)(?:#+\s*|SECTION\s+\d+|CHAPTER\s+\d+|[A-Z0-9\s]{4,30}:?\n)([^\n]+)/i);
      if (headingMatch && headingMatch[1]) {
        currentHeading = headingMatch[1].trim();
      }

      const rawPageChunks = this.recursiveCharacterSplitSync(normalizedPageText, this.chunkSize, this.chunkOverlap);

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

  private recursiveCharacterSplitSync(text: string, chunkSize: number, chunkOverlap: number): string[] {
    if (text.length <= chunkSize) return [text];

    const separators = ['\n\n', '\n', ' ', ''];
    const chunks: string[] = [];

    const split = (str: string, sepIndex: number): string[] => {
      if (str.length <= chunkSize) return [str];
      const sep = separators[sepIndex] ?? '';
      const parts = sep ? str.split(sep) : str.split('');
      const result: string[] = [];
      let current = '';

      for (const part of parts) {
        const candidate = current ? current + sep + part : part;
        if (candidate.length <= chunkSize) {
          current = candidate;
        } else {
          if (current) result.push(current);
          if (part.length > chunkSize && sepIndex < separators.length - 1) {
            result.push(...split(part, sepIndex + 1));
            current = '';
          } else {
            current = part;
          }
        }
      }
      if (current) result.push(current);
      return result;
    };

    const initialChunks = split(text, 0);

    // Apply overlap
    for (let i = 0; i < initialChunks.length; i++) {
      const chunk = initialChunks[i] || '';
      if (i > 0 && chunkOverlap > 0) {
        const prev = initialChunks[i - 1] || '';
        const overlapStr = prev.slice(-chunkOverlap);
        chunks.push(overlapStr + chunk);
      } else {
        chunks.push(chunk);
      }
    }

    return chunks;
  }
}

export const knowledgeChunker = new KnowledgeChunker();
