import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { asyncHandler } from '../utils/asyncHandler';

/** Authenticated dashboard summary: real counts, no fabricated analytics. */
export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await dashboardService.getSummary(req.auth!.userId);

  res.status(200).json({
    success: true,
    data: summary,
  });
});
