import { parsePhoneNumberFromString } from 'libphonenumber-js';
import z from 'zod';
import { buildPasswordSchema } from './validation-utils';

const phoneNumberSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine(
    (value: string) => {
      const phoneNumber = parsePhoneNumberFromString(value);
      return phoneNumber?.isValid() ?? false;
    },
    { message: 'Phone number is invalid' }
  );

export const createUserSchema = z.object({
  email: z.email('Invalid email format'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  phoneNumber: phoneNumberSchema,
  password: buildPasswordSchema(),
  roleId: z.number().int().positive('Role ID must be a positive integer'),
  organizationId: z.uuid('Organization ID must be a valid UUID').optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const listUsersQuerySchema = z.object({
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
  roleId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
  organizationId: z.uuid().optional(),
});

export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
