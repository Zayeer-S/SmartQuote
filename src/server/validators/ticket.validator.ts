import { z } from 'zod';
import {
  ALL_TICKET_TYPES,
  ALL_TICKET_SEVERITIES,
  ALL_BUSINESS_IMPACTS,
  ALL_TICKET_STATUSES,
  ALL_COMMENT_TYPES,
} from '../../shared/constants/';

const futureDate = z.iso
  .datetime({ message: 'Deadline must be a valid ISO 8601 datetime string' })
  .refine((val) => new Date(val) > new Date(), {
    message: 'Deadline must be in the future',
  });

export const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .default(''),
  ticketType: z.enum(ALL_TICKET_TYPES),
  ticketSeverity: z.enum(ALL_TICKET_SEVERITIES),
  businessImpact: z.enum(ALL_BUSINESS_IMPACTS),
  deadline: futureDate,
  usersImpacted: z.number().int().min(1, 'At least 1 user must be impacted'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title must not be empty')
      .max(255, 'Title must not exceed 255 characters')
      .optional(),
    description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
    ticketType: z.enum(ALL_TICKET_TYPES).optional(),
    ticketSeverity: z.enum(ALL_TICKET_SEVERITIES).optional(),
    businessImpact: z.enum(ALL_BUSINESS_IMPACTS).optional(),
    deadline: futureDate.optional(),
    usersImpacted: z.number().int().min(1, 'At least 1 user must be impacted').optional(),
    ticketStatus: z.enum(ALL_TICKET_STATUSES).optional(),
    assignedToUserId: z.uuid('Assignee ID must be a valid UUID').nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

export const assignTicketSchema = z.object({
  assigneeId: z.uuid('Assignee ID must be a valid UUID'),
});

export type AssignTicketInput = z.infer<typeof assignTicketSchema>;

export const listTicketsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().positive().max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  ticketStatus: z.enum(ALL_TICKET_STATUSES).optional(),
  organizationId: z.uuid().optional(),
  assigneeId: z.uuid().optional(),
});

export type ListTicketsQueryInput = z.infer<typeof listTicketsQuerySchema>;

export const addCommentSchema = z.object({
  commentText: z.string().min(1, 'Comment text is required'),
  commentType: z.enum(ALL_COMMENT_TYPES),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;
