import { z } from 'zod';

export const chatInputSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, 'Message cannot be empty')
      .max(4096, 'Message cannot exceed 4096 characters'),
  })
  .strict();

export type ChatInputSchema = z.infer<typeof chatInputSchema>;
