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

/**
 * Robust Multi-Stage PDF Extractor (Stage 1: pdfjs-dist, Stage 2: pdf-parse per-page fallback)
 */
async function extractPdfPages(buffer: Buffer): Promise<{ pages: PageContent[]; totalPages: number; ocrPages: number }> {
  const pages: PageContent[] = [];
  let totalPages = 0;
  let ocrPages = 0;

  // Stage 1: Try pdfjs-dist page-by-page extraction
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
    const pdfDoc = await loadingTask.promise;
    totalPages = pdfDoc.numPages;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ');

      pages.push({ pageNumber: pageNum, text: pageText });
    }
  } catch (pdfjsErr) {
    logger.warn({ err: pdfjsErr }, 'pdfjs-dist extraction failed; falling back to pdf-parse per-page render');
    pages.length = 0;
  }

  // Stage 2: Fallback to pdf-parse per-page renderer if pdfjs-dist yielded no pages
  if (pages.length === 0) {
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
      }
    } catch (parseErr) {
      logger.warn({ err: parseErr }, 'pdf-parse fallback failed; extracting raw UTF-8 string');
      const raw = buffer.toString('utf-8');
      pages.push({ pageNumber: 1, text: raw });
      totalPages = 1;
    }
  }

  if (pages.length === 0) {
    const raw = buffer.toString('utf-8');
    pages.push({ pageNumber: 1, text: raw });
    totalPages = 1;
  }

  // Count low-density / empty / scanned pages
  for (const p of pages) {
    if (normalizeDocumentText(p.text).length < 20) {
      ocrPages++;
    }
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
   * Ingests, audits, validates, semantically chunks, embeds, and indexes an enterprise document.
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
      let buffer: Buffer;
      if (Buffer.isBuffer(input.fileContent)) {
        buffer = input.fileContent;
      } else if (typeof input.fileContent === 'string' && input.fileContent.startsWith('data:')) {
        const base64Data = input.fileContent.split(',')[1] || '';
        buffer = Buffer.from(base64Data, 'base64');
      } else if (
        typeof input.fileContent === 'string' &&
        /^[A-Za-z0-9+/=\s]+$/.test(input.fileContent.trim().substring(0, 100))
      ) {
        buffer = Buffer.from(input.fileContent.trim(), 'base64');
      } else {
        buffer = Buffer.from(input.fileContent, 'binary');
      }

      const pdfRes = await extractPdfPages(buffer);
      pages = pdfRes.pages;
      totalPages = pdfRes.totalPages;
      ocrPages = pdfRes.ocrPages;
    } else {
      let text: string;
      if (typeof input.fileContent === 'string' && input.fileContent.startsWith('data:')) {
        const base64Data = input.fileContent.split(',')[1] || '';
        text = Buffer.from(base64Data, 'base64').toString('utf-8');
      } else if (typeof input.fileContent === 'string') {
        text = input.fileContent;
      } else {
        text = input.fileContent.toString('utf-8');
      }
      pages = [{ pageNumber: 1, text }];
      totalPages = 1;
    }

    // 1. Audit & Print Per-Page Character Extraction Logs
    console.log('\n========== PDF INGESTION AUDIT ==========');
    console.log(`Filename: ${input.filename}`);
    console.log(`Pages detected: ${totalPages}`);
    console.log('\nCharacters extracted PER PAGE:');

    let totalCharacters = 0;
    let totalWords = 0;
    let emptyPages = 0;

    for (const page of pages) {
      const normText = normalizeDocumentText(page.text);
      const charCount = normText.length;
      const wordCount = normText.split(/\s+/).filter(Boolean).length;
      totalCharacters += charCount;
      totalWords += wordCount;

      console.log(`Page ${page.pageNumber} : ${charCount} chars (${wordCount} words)`);
      if (charCount < 10) {
        emptyPages++;
      }
    }

    console.log(`\nTotal Characters extracted: ${totalCharacters.toLocaleString()}`);
    console.log(`Total Words extracted: ${totalWords.toLocaleString()}`);

    // 2. Failure Validation Check (If > 30% of pages return 0 chars or total characters < totalPages * 100)
    if (totalPages >= 5 && (emptyPages > totalPages * 0.3 || totalCharacters < totalPages * 100)) {
      console.log(`⚠️ CRITICAL INGESTION ERROR: PDF text extraction produced insufficient content (${totalCharacters} chars across ${totalPages} pages). Aborting indexing.`);
      console.log('=========================================\n');
      extractionErrors++;

      const diagnostics: DocumentValidationDiagnostics = {
        documentId,
        filename: input.filename,
        totalPages,
        extractedPages: pages.length,
        characterCount: totalCharacters,
        wordCount: totalWords,
        ocrPages,
        chunkCount: 0,
        embeddingsCreated: 0,
        status: 'Failed',
        extractionErrors,
      };

      const emptyArray = [] as unknown as IngestDocumentResult;
      emptyArray.diagnostics = diagnostics;
      return emptyArray;
    }

    const metadata: KnowledgeDocumentMetadata = {
      documentId,
      filename: input.filename,
      title: titleFromFilename(input.filename),
      fileType,
      fileSize: Buffer.byteLength(pages.map((p) => p.text).join('')),
      pageCount: totalPages,
      createdAt: new Date().toISOString(),
      source: input.source || input.filename,
    };

    // 3. Word-Based & Semantic Chunking over pages
    const chunks = this.chunker.splitPages(pages, metadata);

    if (chunks.length === 0) {
      console.log('⚠️ ERROR: Document chunking produced 0 valid chunks. Ingestion FAILED.');
      console.log('=========================================\n');
      return [] as unknown as IngestDocumentResult;
    }

    console.log(`\nChunks created: ${chunks.length}`);
    const avgChunkSize = Math.round(totalCharacters / chunks.length);
    console.log(`Average chunk size: ${avgChunkSize} chars`);

    // 4. Chunk Validation Logs
    console.log('\n--- Chunk Validation Overview ---');
    for (let i = 0; i < Math.min(chunks.length, 5); i++) {
      const c = chunks[i];
      if (c) {
        const wordCount = c.text.split(/\s+/).filter(Boolean).length;
        console.log(`Chunk ${c.metadata.chunkIndex + 1} | Page ${c.metadata.pageNumber || 1} | Words: ${wordCount} | Heading: "${c.metadata.sectionHeading || 'General'}"`);
      }
    }
    if (chunks.length > 5) {
      console.log(`... and ${chunks.length - 5} more chunks.`);
    }

    // 5. Generate Real HuggingFace sentence-transformers/all-MiniLM-L6-v2 Embeddings (384-dim)
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await this.embeddingService.embedDocuments(chunkTexts);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk) {
        chunk.vector = embeddings[i];
      }
    }

    console.log(`Embedding count: ${embeddings.length} (384 dimensions)`);

    // 6. Store inside Supabase pgvector
    await this.vectorStore.add(chunks);
    console.log(`Stored vectors in Supabase pgvector: ${chunks.length}`);
    console.log('=========================================\n');

    const executionTimeMs = Date.now() - startTime;
    const diagnostics: DocumentValidationDiagnostics = {
      documentId,
      filename: input.filename,
      totalPages,
      extractedPages: pages.length,
      characterCount: totalCharacters,
      wordCount: totalWords,
      ocrPages,
      chunkCount: chunks.length,
      embeddingsCreated: embeddings.length,
      status: 'Complete',
      extractionErrors: 0,
    };

    logger.info({ diagnostics, executionTimeMs }, 'Complete PDF ingestion, validation, and pgvector storage completed');

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
