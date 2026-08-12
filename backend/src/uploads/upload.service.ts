import { logger } from '../config/logger';
import { knowledgeIngestionService, KnowledgeIngestionService } from '../ai/knowledge/knowledge.ingestion';
import type { SupportedDocumentFormat } from '../ai/knowledge/knowledge.types';
import type { IngestionUploadResponse, UploadRecord } from './upload.types';

export class UploadService {
  private readonly records = new Map<string, UploadRecord>();

  constructor(private readonly ingestionService: KnowledgeIngestionService = knowledgeIngestionService) {}

  /**
   * Processes uploaded file and automatically triggers RAG chunking and vector indexing.
   */
  public async processUpload(
    filename: string,
    content: string | Buffer,
    fileTypeHint?: string,
  ): Promise<IngestionUploadResponse> {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const inferredType = this.mapFileType(filename, fileTypeHint);

    logger.info({ fileId, filename, inferredType }, 'Processing uploaded file for RAG ingestion');

    let chunkCount = 0;
    if (['pdf', 'docx', 'txt', 'markdown'].includes(inferredType)) {
      const chunks = await this.ingestionService.ingestDocument({
        documentId: fileId,
        filename,
        fileContent: content,
        fileType: inferredType as SupportedDocumentFormat,
      });
      chunkCount = chunks.length;
    }

    const record: UploadRecord = {
      fileId,
      filename,
      originalName: filename,
      fileType: inferredType,
      sizeBytes: typeof content === 'string' ? Buffer.byteLength(content) : content.length,
      uploadedAt: new Date().toISOString(),
      indexed: chunkCount > 0,
      chunkCount,
    };

    this.records.set(fileId, record);

    return {
      success: true,
      fileId,
      filename,
      chunkCount,
      message: `File "${filename}" successfully ingested and indexed into RAG vector store.`,
    };
  }

  public getRecord(fileId: string): UploadRecord | undefined {
    return this.records.get(fileId);
  }

  public listUploads(): UploadRecord[] {
    return Array.from(this.records.values());
  }

  private mapFileType(filename: string, hint?: string): SupportedDocumentFormat | 'csv' | 'xlsx' {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx' || ext === 'doc') return 'docx';
    if (ext === 'md' || ext === 'markdown') return 'markdown';
    if (ext === 'csv') return 'csv';
    if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
    return 'txt';
  }
}

export const uploadService = new UploadService();
