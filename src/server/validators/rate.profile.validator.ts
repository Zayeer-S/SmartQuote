import { z } from 'zod';
import {
  ALL_TICKET_TYPES,
  ALL_TICKET_SEVERITIES,
  ALL_BUSINESS_IMPACTS,
} from '../../shared/constants/lookup-values.js';

const isoDateString = z.iso.datetime({ message: 'Must be a valid ISO 8601 date string' });

const positiveDecimal = z.number().nonnegative('Must be >= 0');

export const createRateProfileSchema = z
  .object({
    ticketType: z.enum(ALL_TICKET_TYPES as [string, ...string[]]),
    ticketSeverity: z.enum(ALL_TICKET_SEVERITIES as [string, ...string[]]),
    businessImpact: z.enum(ALL_BUSINESS_IMPACTS as [string, ...string[]]),
    businessHoursRate: positiveDecimal,
    afterHoursRate: positiveDecimal,
    multiplier: z.number().positive('Multiplier must be > 0'),
    effectiveFrom: isoDateString,
    effectiveTo: isoDateString,
  })
  .refine((data) => new Date(data.effectiveFrom) < new Date(data.effectiveTo), {
    message: 'effectiveFrom must be before effectiveTo',
    path: ['effectiveFrom'],
  });

export const updateRateProfileSchema = z
  .object({
    businessHoursRate: positiveDecimal.optional(),
    afterHoursRate: positiveDecimal.optional(),
    multiplier: z.number().positive('Multiplier must be > 0').optional(),
    effectiveFrom: isoDateString.optional(),
    effectiveTo: isoDateString.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.effectiveFrom !== undefined && data.effectiveTo !== undefined) {
        return new Date(data.effectiveFrom) < new Date(data.effectiveTo);
      }
      return true;
    },
    {
      message: 'effectiveFrom must be before effectiveTo',
      path: ['effectiveFrom'],
    }
  );

export type CreateRateProfileBody = z.infer<typeof createRateProfileSchema>;
export type UpdateRateProfileBody = z.infer<typeof updateRateProfileSchema>;
