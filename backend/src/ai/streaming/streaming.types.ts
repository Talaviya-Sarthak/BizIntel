/**
 * AI Streaming Types
 * PS-05 Enterprise Intelligence Platform
 */

export type SSEStage = 'Thinking...' | 'Planning...' | 'Retrieving...' | 'Generating...' | 'Completed';

export interface SSEEventPayload {
  stage: SSEStage;
  message: string;
  data?: any;
  timestamp: string;
}
