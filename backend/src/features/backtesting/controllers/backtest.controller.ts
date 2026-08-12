import type { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import * as backtestService from '../services/backtest.service';
import type { ListBacktestsInput, CreateBacktestInput } from '../validators/backtest.validator';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const options = req.query as unknown as ListBacktestsInput;

  const result = await backtestService.listBacktests(userId, options);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Backtests retrieved successfully',
  });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const id = req.params.id as string;

  const result = await backtestService.getBacktest(userId, id);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Backtest retrieved successfully',
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const config = req.body as CreateBacktestInput;

  const backtest = await backtestService.createAndRunBacktest(userId, config);

  res.status(201).json({
    success: true,
    data: { backtest },
    message: 'Backtest created and completed successfully',
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const id = req.params.id as string;

  await backtestService.deleteBacktest(userId, id);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Backtest deleted successfully',
  });
});

export const getStrategies = asyncHandler(async (_req: Request, res: Response) => {
  const strategies = backtestService.listStrategies();

  res.status(200).json({
    success: true,
    data: { strategies },
    message: 'Strategies retrieved successfully',
  });
});
