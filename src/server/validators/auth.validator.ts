import { z } from 'zod';
import { buildPasswordSchema } from './validation-utils.js';

export const loginSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password must exist and is required'),
  newPassword: buildPasswordSchema(),
});

/**
 * Session token validation schema
 * Used for extracting and validating Authorization header
 */
export const sessionTokenSchema = z.string().min(1, 'Session token is required');

export type SessionTokenInput = z.infer<typeof sessionTokenSchema>;
