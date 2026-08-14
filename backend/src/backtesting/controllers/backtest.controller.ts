import type { Request, Response } from 'express';
import { backtestingService } from '../services/backtesting.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { BacktestCreateInput } from '../validators/backtest.validator.js';

/**
 * Thin HTTP layer for the backtesting module. Handlers stay in the service;
 * controllers only translate requests/responses and never touch SQL or the
 * engine directly.
 */
export const listStrategies = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: backtestingService.listStrategies() });
});

export const getCompatibility = asyncHandler(async (req: Request, res: Response) => {
  const data = await backtestingService.getCompatibility(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data });
});

export const getDateRange = asyncHandler(async (req: Request, res: Response) => {
  const data = await backtestingService.getDatasetDateRange(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data });
});

export const createBacktest = asyncHandler(async (req: Request, res: Response) => {
  const data = await backtestingService.createBacktest(
    req.auth!.userId,
    req.body as BacktestCreateInput,
  );
  res.status(201).json({ success: true, data });
});

export const listBacktests = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit === undefined ? undefined : Number(req.query.limit);
  const offset = req.query.offset === undefined ? undefined : Number(req.query.offset);
  const data = await backtestingService.listBacktests(req.auth!.userId, { limit, offset });
  res.status(200).json({ success: true, data });
});

export const getBacktest = asyncHandler(async (req: Request, res: Response) => {
  const data = await backtestingService.getBacktest(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data });
});

export const getTrades = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit === undefined ? undefined : Number(req.query.limit);
  const offset = req.query.offset === undefined ? undefined : Number(req.query.offset);
  const data = await backtestingService.getTrades(req.auth!.userId, req.params.id!, { limit, offset });
  res.status(200).json({ success: true, data });
});

export const getEquitySeries = asyncHandler(async (req: Request, res: Response) => {
  const data = await backtestingService.getEquitySeries(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data });
});

export const deleteBacktest = asyncHandler(async (req: Request, res: Response) => {
  await backtestingService.deleteBacktest(req.auth!.userId, req.params.id!);
  res.status(200).json({ success: true, data: null });
});
