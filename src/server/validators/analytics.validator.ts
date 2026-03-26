import { z } from 'zod';

const isoDate = z
  .string({ error: 'Must be a valid ISO 8601 date (YYYY-MM-DD)' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid ISO 8601 date (YYYY-MM-DD)');

export const analyticsDateRangeSchema = z
  .object({
    from: isoDate,
    to: isoDate,
  })
  .refine((data) => new Date(data.from) <= new Date(data.to), {
    message: 'from must be on or before to',
    path: ['from'],
  });

export type AnalyticsDateRangeInput = z.infer<typeof analyticsDateRangeSchema>;
