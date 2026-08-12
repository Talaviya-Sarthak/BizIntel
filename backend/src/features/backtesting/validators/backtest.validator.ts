import { z } from 'zod';

export const createBacktestSchema = z
  .object({
    datasetId: z.string().uuid('Invalid dataset ID'),
    strategyId: z.string().min(1, 'Strategy ID is required'),
    parameters: z.record(z.number()).default({}),
    initialCapital: z.number().positive('Initial capital must be greater than 0'),
    commission: z.number().min(0, 'Commission must be non-negative').default(0),
    slippage: z.number().min(0, 'Slippage must be non-negative').default(0),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .strict();

export const listBacktestsSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['created_at', 'name', 'status']).default('created_at'),
  })
  .strict();

export type CreateBacktestInput = z.infer<typeof createBacktestSchema>;
export type ListBacktestsInput = z.infer<typeof listBacktestsSchema>;
