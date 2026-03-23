import { z } from 'zod';
import {
  ALL_QUOTE_EFFORT_LEVELS,
  ALL_QUOTE_CONFIDENCE_LEVELS,
} from '../../shared/constants/lookup-values.js';

const positiveDecimal = z.number().positive();

const baseQuoteFields = z.object({
  estimatedHoursMinimum: positiveDecimal,
  estimatedHoursMaximum: positiveDecimal,
  hourlyRate: positiveDecimal,
  fixedCost: z.number().min(0, 'Fixed cost must be zero or greater'),
  quoteEffortLevel: z.enum(ALL_QUOTE_EFFORT_LEVELS),
  quoteConfidenceLevel: z.enum(ALL_QUOTE_CONFIDENCE_LEVELS).nullable(),
});

export const createManualQuoteSchema = baseQuoteFields.refine(
  (data) => data.estimatedHoursMaximum >= data.estimatedHoursMinimum,
  {
    message: 'Estimated maximum hours must be greater than or equal to minimum hours',
    path: ['estimatedHoursMaximum'],
  }
);

export type CreateManualQuoteInput = z.infer<typeof createManualQuoteSchema>;

export const updateQuoteSchema = baseQuoteFields
  .partial()
  .extend({
    reason: z.string().min(1, 'A reason is required when updating a quote'),
  })
  .refine(
    (data) => {
      // Only validate the range if both bounds are present in this update
      const { estimatedHoursMinimum, estimatedHoursMaximum } = data;
      if (estimatedHoursMinimum !== undefined && estimatedHoursMaximum !== undefined) {
        return estimatedHoursMaximum >= estimatedHoursMinimum;
      }
      return true;
    },
    {
      message: 'Estimated maximum hours must be greater than or equal to minimum hours',
      path: ['estimatedHoursMaximum'],
    }
  )
  .refine(
    (data) => {
      const { reason, ...rest } = data;
      void reason;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return Object.values(rest).some((v) => v !== undefined);
    },
    {
      message: 'At least one field must be provided for update',
    }
  );

export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;

export const approveQuoteSchema = z.object({
  comment: z.string().min(1).nullable().optional().default(null),
});

export type ApproveQuoteInput = z.infer<typeof approveQuoteSchema>;

export const rejectQuoteSchema = z.object({
  comment: z.string().min(1, 'A rejection reason is required'),
});

export type RejectQuoteInput = z.infer<typeof rejectQuoteSchema>;
