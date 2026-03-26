import type { NextFunction, Request, Response } from 'express';
import type { RBACService } from '../services/rbac/rbac.service.js';
import type { RoleId, UserId } from '../database/types/ids.js';
import { error } from '../lib/respond.js';
import { isAuthenticatedRequest } from './auth.middleware.js';
import type { PermissionName } from '../../shared/constants';

/**
 * Require user to have specific permission(s)
 *
 * @param rbacService RBAC service instance
 * @param permissions Permission(s) to check (OR logic if multiple)
 * @returns Express middleware function
 */
export function requirePermission(rbacService: RBACService, ...permissions: PermissionName[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!isAuthenticatedRequest(req)) {
        error(res, 401, 'Authentication required');
        return;
      }

      // Check if user has any of the required permissions
      const hasPermission = await rbacService.hasAnyPermission(req.user.id as UserId, permissions);

      if (!hasPermission) {
        error(res, 403, 'Insufficient permissions. Required: ' + permissions.join(' or '));
        return;
      }

      next();
    } catch (err: unknown) {
      console.error('Permission check error:', err);
      error(res, 500, 'Internal server error during permission check');
    }
  };
}

/**
 * Require user to have all specified permissions
 *
 * @param rbacService RBAC service instance
 * @param permissions Permissions to check (AND logic)
 * @returns Express middleware function
 */
export function requireAllPermissions(rbacService: RBACService, ...permissions: PermissionName[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!isAuthenticatedRequest(req)) {
        error(res, 401, 'Authentication required');
        return;
      }

      // Check if user has all required permissions
      const hasAllPermissions = await rbacService.hasAllPermissions(
        req.user.id as UserId,
        permissions
      );

      if (!hasAllPermissions) {
        error(res, 403, 'Insufficient permissions. Required: ' + permissions.join(' and '));
        return;
      }

      next();
    } catch (err: unknown) {
      console.error('Permission check error:', err);
      error(res, 500, 'Internal server error during permission check');
    }
  };
}

/**
 * Require user to have specific role(s)
 * User must have at least one of the specified roles
 *
 * @param rbacService RBAC service instance
 * @param roleIds Role ID(s) to check (OR logic if multiple)
 * @returns Express middleware function
 */
export function requireRole(rbacService: RBACService, ...roleIds: RoleId[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!isAuthenticatedRequest(req)) {
        error(res, 401, 'Authentication required');
        return;
      }

      // Check if user has any of the required roles
      const hasRole = await rbacService.hasAnyRole(req.user.id as UserId, roleIds);

      if (!hasRole) {
        error(res, 403, 'Insufficient privileges. Required role: ' + roleIds.join(' or '));
        return;
      }

      next();
    } catch (err: unknown) {
      console.error('Role check error:', err);
      error(res, 500, 'Internal server error during role check');
    }
  };
}
