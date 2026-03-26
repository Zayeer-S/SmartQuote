import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AuthError, PasswordValidationError } from '../services/auth/auth.errors.js';
import { formatValidationError } from '../validators/validation-utils.js';
import { error } from '../lib/respond.js';
import { ForbiddenError, TicketError } from '../services/ticket/ticket.errors.js';

/**
 * Global Error Handling Middleware
 * Catches all errors and formats them consistently
 * Must be registered last in middleware chain
 */

// Let _next stay unused - Express silently skips error middleware that doesn't have exactly four parameters
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AuthError) {
    error(res, err.statusCode, err.message);
    return;
  }

  if (err instanceof PasswordValidationError) {
    error(res, err.statusCode, err.message);
    return;
  }

  if (err instanceof TicketError) {
    error(res, err.statusCode, err.message);
    return;
  }

  if (err instanceof ForbiddenError) {
    error(res, err.statusCode, err.message);
    return;
  }

  if (err instanceof ZodError) {
    error(res, 400, formatValidationError(err));
    return;
  }

  if (err.name === 'UnauthorizedError') {
    error(res, 401, 'Invalid or expired token');
    return;
  }

  if (err.name === 'ValidationError') {
    error(res, 400, err.message);
    return;
  }

  error(res, 500, process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message);
}

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  error(res, 404, `Route not found: ${req.method} ${req.path}`);
}
