import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { aiService } from '../ai.service';
import { streamingService } from '../streaming/streaming.service';
import type { ChatResponse } from '../types';

/**
 * POST /api/v1/ai/chat
 * Complete Enterprise AI endpoint
 */
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message, sessionId } = req.body;
  const userId = req.auth?.userId || 'guest-user';

  const result = await aiService.chat(message, userId, sessionId);

  const payload: ChatResponse = {
    success: true,
    sessionId: result.sessionId,
    answer: result.response.answer,
    visualizations: result.visualizations,
    artifacts: result.artifacts,
    citations: result.response.metadata.citations || [],
    metadata: result.response.metadata,
  };

  res.status(200).json(payload);
});

/**
 * GET /api/v1/ai/stream
 * Server-Sent Events (SSE) progress streaming endpoint
 */
export const streamChat = asyncHandler(async (req: Request, res: Response) => {
  const message = (req.query.message as string) || 'Hello';
  const sessionId = req.query.sessionId as string;
  const userId = req.auth?.userId || 'guest-user';

  streamingService.initSSEHeader(res);

  streamingService.emitEvent(res, 'Thinking...', 'Classifying query intent...');
  await new Promise((resolve) => setTimeout(resolve, 50));

  streamingService.emitEvent(res, 'Planning...', 'Generating execution graph...');
  await new Promise((resolve) => setTimeout(resolve, 50));

  streamingService.emitEvent(res, 'Retrieving...', 'Executing tools and retrieval...');
  const result = await aiService.chat(message, userId, sessionId);

  streamingService.emitEvent(res, 'Generating...', 'Synthesizing response...');
  streamingService.emitEvent(res, 'Completed', 'AI execution completed successfully.', {
    sessionId: result.sessionId,
    answer: result.response.answer,
    metadata: result.response.metadata,
  });

  streamingService.closeStream(res);
});
