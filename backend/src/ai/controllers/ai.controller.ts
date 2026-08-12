import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { aiService } from '../ai.service';
import type { ChatResponse } from '../types';

/**
 * Express handler for POST /api/v1/ai/chat
 * Multi-turn, session-aware AI pipeline execution.
 */
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message, sessionId } = req.body;
  const userId = req.auth?.userId || 'guest-user';

  const result = await aiService.chat(message, userId, sessionId);

  const payload: ChatResponse = {
    success: true,
    sessionId: result.sessionId,
    answer: result.response.answer,
    metadata: result.response.metadata,
  };

  res.status(200).json(payload);
});
