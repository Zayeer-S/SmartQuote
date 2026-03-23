import { vi } from 'vitest';
import { UsersDAO } from '../../src/server/daos/children/users.dao';
import { SessionsDAO } from '../../src/server/daos/children/sessions.dao';

export function makeMockUsersDAO(): UsersDAO {
  return {
    findByEmail: vi.fn(),
    findWithRole: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as UsersDAO;
}

export function makeMockSessionsDAO(): SessionsDAO {
  return {
    create: vi.fn(),
    findByToken: vi.fn(),
    update: vi.fn(),
    deleteToken: vi.fn(),
    deleteAllForUser: vi.fn(),
    deleteExpired: vi.fn(),
  } as unknown as SessionsDAO;
}
