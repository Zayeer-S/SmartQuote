import { vi } from 'vitest';
import { PasswordService } from '../../src/server/services/auth/password.service';
import { SessionService } from '../../src/server/services/auth/session.service';

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
