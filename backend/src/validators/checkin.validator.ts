import { z } from 'zod';

export const checkInQuerySchema = z.object({
  date: z.string().optional(),
  userId: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
