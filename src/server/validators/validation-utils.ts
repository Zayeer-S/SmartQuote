import z from 'zod';
import { passwordConfig } from '../config/auth-config';

export function buildPasswordSchema() {
  let schema = z
    .string()
    .min(
      passwordConfig.minLength,
      `Password must be at least ${String(passwordConfig.minLength)} characters`
    );

  schema = schema.max(
    passwordConfig.maxLength,
    `Password must be no longer than ${String(passwordConfig.maxLength)} characters`
  );

  if (passwordConfig.requireLowercase)
    schema = schema.regex(/[a-z]/, 'Password must contain at least one lowercase character');

  if (passwordConfig.requireUppercase)
    schema = schema.regex(/[A-Z]/, 'Password must contain at leaast one uppercase character');

  if (passwordConfig.requireNumber)
    schema = schema.regex(/[0-9]/, `Password must contain at least one number`);

  if (passwordConfig.requireSpecialChar)
    schema = schema.regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

  return schema;
}

/**
 * Format Zod validation errors into a user-friendly error message
 *
 * @param error Zod validation error
 * @returns Formatted error message
 */
export function formatValidationError(error: z.ZodError): string {
  const errors = error.issues.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
  return errors.join('; ');
}

/**
 * Validate data against a Zod schema and throw formatted error if invalid
 *
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validated and typed data
 * @throws Error with formatted message if validation fails
 */
export function validateOrThrow<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw new Error(formatValidationError(result.error));
  return result.data;
}

/**
 * Validate data against a Zod schema and return result
 *
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validation result with success flag and data/error
 */
export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success)
    return {
      success: false,
      error: formatValidationError(result.error),
    };

  return {
    success: true,
    data: result.data,
  };
}
