/**
 * Frontend AI Module Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

export type IntentCategory = 'analytics' | 'backtesting' | 'retail' | 'knowledge' | 'general';
export type PipelineName = 'ANALYTICS_PIPELINE' | 'BACKTEST_PIPELINE' | 'RETAIL_PIPELINE' | 'KNOWLEDGE_PIPELINE' | 'GENERAL_PIPELINE';
export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'kpi' | 'table';
export type ArtifactFormat = 'csv' | 'json' | 'markdown' | 'pdf' | 'excel';
export type SSEStage = 'Thinking...' | 'Planning...' | 'Retrieving...' | 'Generating...' | 'Completed';

export interface SSEEventPayload {
  stage: SSEStage;
  message: string;
  data?: any;
  timestamp: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
}

export interface VisualizationResult {
  id: string;
  chartType: ChartType;
  title: string;
  description?: string;
  chartData: {
    labels: string[];
    datasets: ChartDataset[];
  };
  chartOptions?: Record<string, any>;
}

export interface GeneratedArtifact {
  id: string;
  filename: string;
  format: ArtifactFormat;
  mimeType: string;
  sizeBytes: number;
  content: string;
  downloadUrl?: string;
  createdAt: string;
}

export interface ResponseCitation {
  source: string;
  reference?: string;
}

export interface AIResponseMetadata {
  intent: IntentCategory;
  pipeline: PipelineName;
  tool: string;
  model: string;
  executionTimeMs: number;
  citations?: ResponseCitation[];
}

export interface ChatResponse {
  success: boolean;
  sessionId: string;
  answer: string;
  visualizations?: VisualizationResult[];
  artifacts?: GeneratedArtifact[];
  citations?: ResponseCitation[];
  metadata: AIResponseMetadata;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  visualizations?: VisualizationResult[];
  artifacts?: GeneratedArtifact[];
  citations?: ResponseCitation[];
  metadata?: AIResponseMetadata;
}

export interface SystemMetrics {
  success: boolean;
  timestamp: string;
  processMemory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  metrics: {
    memorySessions: number;
    memoryMessages: number;
    vectorStoreChunks: number;
    vectorStoreDocuments: number;
    activeJobsCount: number;
    uploadedFilesCount: number;
  };
}

export interface SystemHealth {
  status: 'UP' | 'DOWN';
  uptimeSeconds: number;
  timestamp: string;
  services: Record<string, string>;
}
