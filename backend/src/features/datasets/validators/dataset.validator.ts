import { z } from 'zod';

export const createDatasetSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(200, 'Name must be at most 200 characters'),
    description: z
      .string()
      .trim()
      .max(2000, 'Description must be at most 2000 characters')
      .optional()
      .default(''),
  })
  .strict();

export const listDatasetsSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['created_at', 'name', 'file_size', 'row_count']).default('created_at'),
  })
  .strict();

export type CreateDatasetInput = z.infer<typeof createDatasetSchema>;
export type ListDatasetsInput = z.infer<typeof listDatasetsSchema>;
