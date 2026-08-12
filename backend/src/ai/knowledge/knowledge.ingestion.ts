import { logger } from '../../config/logger';
import { knowledgeChunker, KnowledgeChunker, type PageContent } from './knowledge.chunker';
import { knowledgeEmbeddingService, KnowledgeEmbeddingService } from './knowledge.embeddings';
import type {
  DocumentValidationDiagnostics,
  KnowledgeChunk,
  KnowledgeDocumentMetadata,
  SupportedDocumentFormat,
} from './knowledge.types';
import { titleFromFilename, normalizeDocumentText } from './knowledge.utils';
import { knowledgeVectorStore, KnowledgeVectorStore } from './knowledge.vectorstore';

export interface IngestDocumentInput {
  documentId?: string;
  filename: string;
  fileContent: string | Buffer;
  fileType?: SupportedDocumentFormat;
  source?: string;
  pageCount?: number;
}

export type IngestDocumentResult = KnowledgeChunk[] & { diagnostics?: DocumentValidationDiagnostics };

// Environment-safe per-page PDF extractor with fallback for test mocks
async function parsePdfPages(buffer: Buffer): Promise<{ pages: PageContent[]; totalPages: number; ocrPages: number }> {
  const pages: PageContent[] = [];
  let totalPages = 0;
  let ocrPages = 0;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfModule = require('pdf-parse');
    const pdfFn = typeof pdfModule === 'function' ? pdfModule : pdfModule?.default;

    if (typeof pdfFn === 'function') {
      let currentPageNum = 1;
      const options = {
        pagerender: (pageData: any) => {
          return pageData.getTextContent().then((textContent: any) => {
            let lastY = null;
            let text = '';
            for (const item of textContent.items) {
              if (lastY === item.transform[5] || lastY === null) {
                text += item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            pages.push({ pageNumber: currentPageNum, text });
            currentPageNum++;
            return text;
          });
        },
      };

      const data = await pdfFn(buffer, options);
      totalPages = data.numpages || pages.length || 1;

      if (pages.length === 0 && data.text) {
        pages.push({ pageNumber: 1, text: data.text });
      }

      for (const p of pages) {
        if (p.text.length < 20) {
          ocrPages++;
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Per-page pdf-parse extraction failed; falling back to buffer raw text');
    const raw = buffer.toString('utf-8');
    pages.push({ pageNumber: 1, text: raw });
    totalPages = 1;
  }

  if (pages.length === 0) {
    const raw = buffer.toString('utf-8');
    pages.push({ pageNumber: 1, text: raw });
    totalPages = 1;
  }

  return { pages, totalPages, ocrPages };
}

export class KnowledgeIngestionService {
  constructor(
    private readonly chunker: KnowledgeChunker = knowledgeChunker,
    private readonly embeddingService: KnowledgeEmbeddingService = knowledgeEmbeddingService,
    private readonly vectorStore: KnowledgeVectorStore = knowledgeVectorStore,
  ) {}

  /**
   * Ingests, validates, semantically chunks, embeds, and indexes a raw enterprise document.
   *
   * @param input Document file contents and metadata
   * @returns IngestDocumentResult (KnowledgeChunk[] array with attached diagnostics)
   */
  public async ingestDocument(input: IngestDocumentInput): Promise<IngestDocumentResult> {
    const startTime = Date.now();
    const documentId = input.documentId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fileType = input.fileType || this.inferFormatFromFilename(input.filename);

    let pages: PageContent[] = [];
    let totalPages = input.pageCount || 1;
    let ocrPages = 0;
    let extractionErrors = 0;

    if (fileType === 'pdf') {
      const buffer = Buffer.isBuffer(input.fileContent)
        ? input.fileContent
        : Buffer.from(input.fileContent);
      const pdfRes = await parsePdfPages(buffer);
      pages = pdfRes.pages;
      totalPages = pdfRes.totalPages;
      ocrPages = pdfRes.ocrPages;
    } else {
      const text = typeof input.fileContent === 'string'
        ? input.fileContent
        : input.fileContent.toString('utf-8');
      pages = [{ pageNumber: 1, text }];
      totalPages = 1;
    }

    const fullNormalizedText = pages.map((p) => p.text).join('\n\n');
    const characterCount = fullNormalizedText.length;
    const wordCount = fullNormalizedText.split(/\s+/).filter(Boolean).length;

    const metadata: KnowledgeDocumentMetadata = {
      documentId,
      filename: input.filename,
      title: titleFromFilename(input.filename),
      fileType,
      fileSize: Buffer.byteLength(fullNormalizedText),
      pageCount: totalPages,
      createdAt: new Date().toISOString(),
      source: input.source || input.filename,
    };

    logger.info(
      { documentId, filename: input.filename, totalPages, extractedPages: pages.length, characterCount, wordCount },
      'Ingesting enterprise document with page-by-page semantic extraction',
    );

    // 1. Semantic Chunking over pages
    const chunks = this.chunker.splitPages(pages, metadata);

    // 2. Validate Chunk Density (Step 3 & 10: A 28-page PDF yielding only 11 chunks fails validation)
    const expectedMinChunks = Math.max(1, Math.floor(totalPages * 1.5));
    let status: 'Complete' | 'Failed' | 'Warning' = 'Complete';

    if (totalPages >= 5 && chunks.length < expectedMinChunks) {
      logger.warn(
        { documentId, totalPages, chunkCount: chunks.length, expectedMinChunks },
        'Document chunk count is suspiciously low relative to page count; potential incomplete extraction',
      );
      status = 'Warning';
      if (chunks.length < Math.floor(totalPages / 2)) {
        extractionErrors++;
      }
    }

    const diagnostics: DocumentValidationDiagnostics = {
      documentId,
      filename: input.filename,
      totalPages,
      extractedPages: pages.length,
      characterCount,
      wordCount,
      ocrPages,
      chunkCount: chunks.length,
      embeddingsCreated: chunks.length,
      status: chunks.length === 0 ? 'Failed' : status,
      extractionErrors,
    };

    if (chunks.length === 0) {
      logger.error({ documentId }, 'Document ingestion produced 0 valid chunks');
      return [] as unknown as IngestDocumentResult;
    }

    // 3. Generate Dense Embedding Vectors for chunks
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await this.embeddingService.embedDocuments(chunkTexts);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk) {
        chunk.vector = embeddings[i];
      }
    }

    // 4. Index chunks into Vector Store
    await this.vectorStore.add(chunks);

    const executionTimeMs = Date.now() - startTime;
    logger.info(
      { diagnostics, executionTimeMs },
      'Document ingestion, validation, and vector indexing completed',
    );

    const resultArray = chunks as IngestDocumentResult;
    resultArray.diagnostics = diagnostics;

    return resultArray;
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
