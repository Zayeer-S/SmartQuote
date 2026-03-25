import { vi } from 'vitest';
import { PasswordService } from '../../../../src/server/services/auth/password.service';
import { SessionService } from '../../../../src/server/services/auth/session.service';
import { RBACService } from '../../../../src/server/services/rbac/rbac.service';

export function makeMockSessionService(): SessionService {
  return {
    create: vi.fn(),
    validate: vi.fn(),
    invalidate: vi.fn(),
    invalidateAllForUser: vi.fn(),
  } as unknown as SessionService;
}

export function makeMockPasswordService(): PasswordService {
  return {
    hash: vi.fn(),
    verify: vi.fn(),
    validate: vi.fn(),
  } as unknown as PasswordService;
}

export function makeMockRBACService(): RBACService {
  return {
    hasPermission: vi.fn(),
    hasAnyPermission: vi.fn(),
    hasAllPermissions: vi.fn(),
    hasRole: vi.fn(),
    hasAnyRole: vi.fn(),
    getUserPermissions: vi.fn(),
    getUserPermissionIds: vi.fn(),
  } as unknown as RBACService;
}
