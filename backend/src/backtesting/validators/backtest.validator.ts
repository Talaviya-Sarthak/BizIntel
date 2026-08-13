import { z } from 'zod';

/** ISO 8601 date bounds are optional; range validity is checked per-run. */
export const backtestCreateSchema = z
  .object({
    datasetId: z.string().uuid('A valid dataset id is required'),
    strategyId: z.string().trim().min(1, 'Strategy id is required').max(100),
    parameters: z.record(z.unknown()).optional().default({}),
    initialCapital: z.number().min(100, 'Initial capital must be at least 100').max(10_000_000),
    commission: z.number().min(0, 'Commission cannot be negative').max(0.05, 'Commission must be below 5%').default(0),
    slippage: z.number().min(0, 'Slippage cannot be negative').max(0.05, 'Slippage must be below 5%').default(0),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be a YYYY-MM-DD date')
      .nullable()
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be a YYYY-MM-DD date')
      .nullable()
      .optional(),
    name: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export type BacktestCreateInput = z.infer<typeof backtestCreateSchema>;

export const backtestIdParamsSchema = z.object({
  id: z.string().uuid('A valid backtest id is required'),
});

export const datasetIdParamsSchema = z.object({
  id: z.string().uuid('A valid dataset id is required'),
});

export const backtestListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const backtestTradesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
