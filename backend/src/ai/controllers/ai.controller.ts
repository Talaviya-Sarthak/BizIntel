import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { aiService } from '../ai.service';

/**
 * Express handler for POST /api/v1/ai/chat
 * Executes user query through Intent Router -> AI Orchestrator -> Tool Registry Adapter.
 */
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  const userId = req.auth?.userId || 'guest-user';

  const output = await aiService.chat(message, userId);

  res.status(200).json({
    success: true,
    result: output.result,
    plan: output.plan,
  });
});
