import { z } from 'zod';
import { ALL_TICKET_SEVERITIES } from '../../shared/constants/lookup-values.js';

const slaSeverityTargetSchema = z.object({
  severity: z.enum(ALL_TICKET_SEVERITIES as [string, ...string[]]),
  responseTimeHours: z
    .number({ error: 'responseTimeHours must be a number' })
    .positive('responseTimeHours must be positive'),
  resolutionTimeHours: z
    .number({ error: 'resolutionTimeHours must be a number' })
    .positive('resolutionTimeHours must be positive')
    .refine(
      // Resolution target must be >= response target
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (_val) => true, // cross-field check is done in the refinement below
      {}
    ),
});

export const slaContractSchema = z
  .object({
    severityTargets: z
      .array(slaSeverityTargetSchema)
      .min(1, 'At least one severity target is required')
      .refine(
        (targets) => {
          const severities = targets.map((t) => t.severity);
          return new Set(severities).size === severities.length;
        },
        { message: 'Each severity may only appear once in the contract' }
      ),
  })
  .refine(
    (contract) =>
      contract.severityTargets.every((t) => t.resolutionTimeHours >= t.responseTimeHours),
    {
      message: 'resolutionTimeHours must be >= responseTimeHours for every severity target',
    }
  );

export type SlaContractInput = z.infer<typeof slaContractSchema>;

export const createSlaPolicySchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters'),
    userId: z.uuid('userId must be a valid UUID').optional(),
    organizationId: z.uuid('organizationId must be a valid UUID').optional(),
    contract: slaContractSchema,
    effectiveFrom: z.iso.datetime({ message: 'effectiveFrom must be a valid ISO 8601 date' }),
    effectiveTo: z.iso.datetime({ message: 'effectiveTo must be a valid ISO 8601 date' }),
  })
  .refine((data) => Boolean(data.userId) !== Boolean(data.organizationId), {
    message: 'Exactly one of userId or organizationId must be provided',
  })
  .refine((data) => new Date(data.effectiveTo) >= new Date(data.effectiveFrom), {
    message: 'effectiveTo must be on or after effectiveFrom',
  });

export type CreateSlaPolicyInput = z.infer<typeof createSlaPolicySchema>;

export const updateSlaPolicySchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name must not be empty')
      .max(255, 'Name must not exceed 255 characters')
      .optional(),
    contract: slaContractSchema.optional(),
    effectiveFrom: z.iso
      .datetime({ message: 'effectiveFrom must be a valid ISO 8601 date' })
      .optional(),
    effectiveTo: z.iso
      .datetime({ message: 'effectiveTo must be a valid ISO 8601 date' })
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateSlaPolicyInput = z.infer<typeof updateSlaPolicySchema>;

export const slaPolicyIdParamSchema = z.object({
  slaPolicyId: z
    .string()
    .regex(/^\d+$/, 'slaPolicyId must be a positive integer')
    .transform(Number),
});

export type SlaPolicyIdParam = z.infer<typeof slaPolicyIdParamSchema>;
