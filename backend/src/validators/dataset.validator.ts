import { z } from 'zod';

/**
 * Optional metadata fields accompanying a CSV upload (multipart text fields).
 * The file itself is validated by the upload middleware and ValidationService.
 */
export const datasetUploadSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name must be at least 1 character')
      .max(120, 'Name must be at most 120 characters')
      .optional()
      .or(z.literal('')),
    description: z
      .string()
      .trim()
      .max(500, 'Description must be at most 500 characters')
      .optional()
      .or(z.literal('')),
  })
  .strict();

export type DatasetUploadInput = z.infer<typeof datasetUploadSchema>;

export const datasetPreviewQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type DatasetPreviewQuery = z.infer<typeof datasetPreviewQuerySchema>;
