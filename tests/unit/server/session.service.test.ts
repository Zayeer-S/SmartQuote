/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionService } from '../../../src/server/services/auth/session.service';
import type { AuthConfig } from '../../../src/server/services/auth/auth.config.types';
import type { SessionsDAO } from '../../../src/server/daos/children/sessions.dao';
import type { Session } from '../../../src/server/database/types/tables';
import type { UserId } from '../../../src/server/database/types/ids';
import { makeMockSessionsDAO } from '../../utils/mock.daos';

const TEST_USER_ID = 1 as unknown as UserId;
const TEST_TOKEN = `test-session-token`;

const config: AuthConfig = {
  expiryHours: 24,
  secret: 'test-secret',
  cleanupIntervalMinutes: 60,
  tokenBytes: 32,
};

function makeSession(overrides: Partial<Session> = {}): Session {
  const now = new Date();
  return {
    id: 1,
    user_id: TEST_USER_ID,
    session_token: TEST_TOKEN,
    last_activity: now,
    expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    created_at: now,
    updated_at: now,
    ...overrides,
  } as Session;
}

describe('SessionService', () => {
  let dao: SessionsDAO;
  let service: SessionService;

  beforeEach(() => {
    dao = makeMockSessionsDAO();
    service = new SessionService(config, dao);
  });

  describe('create', () => {
    it('calls sessionsDAO.create with the correct user_id and a generated token', async () => {
      const session = makeSession();
      vi.mocked(dao.create).mockResolvedValue(session);

      const result = await service.create(TEST_USER_ID);

      expect(dao.create).toHaveBeenCalledOnce();
      const [payload] = vi.mocked(dao.create).mock.calls[0];
      expect(payload.user_id).toBe(TEST_USER_ID);
      expect(typeof payload.session_token).toBe('string');
      expect(payload.session_token.length).toBeGreaterThan(0);
      expect(result).toBe(session);
    });

    it('sets expires_at ~expiryHours from now', async () => {
      const session = makeSession();
      vi.mocked(dao.create).mockResolvedValue(session);

      const before = Date.now();
      await service.create(TEST_USER_ID);
      const after = Date.now();

      const [payload] = vi.mocked(dao.create).mock.calls[0];
      const expiryMs = payload.expires_at.getTime();
      const expectedMs = config.expiryHours * 60 * 60 * 1000;

      expect(expiryMs).toBeGreaterThanOrEqual(before + expectedMs);
      expect(expiryMs).toBeLessThanOrEqual(after + expectedMs);
    });
  });

  describe('validate', () => {
    it('returns the session and updates last_activity for a valid non-expired token', async () => {
      const session = makeSession();
      vi.mocked(dao.findByToken).mockResolvedValue(session);
      vi.mocked(dao.update).mockResolvedValue(true);

      const result = await service.validate(TEST_TOKEN);

      expect(result).toBe(session);
      expect(dao.update).toHaveBeenCalledOnce();
    });

    it('returns null when the token does not exist', async () => {
      vi.mocked(dao.findByToken).mockResolvedValue(null);

      const result = await service.validate('nonexistent-token');

      expect(result).toBeNull();
      expect(dao.deleteToken).not.toHaveBeenCalled();
    });

    it('deletes the session and returns null when the token is expired', async () => {
      const expiredSession = makeSession({
        expires_at: new Date(Date.now() - 1000),
      });
      vi.mocked(dao.findByToken).mockResolvedValue(expiredSession);

      const result = await service.validate(TEST_TOKEN);

      expect(result).toBeNull();
      expect(dao.deleteToken).toHaveBeenCalledWith(TEST_TOKEN, undefined);
      expect(dao.update).not.toHaveBeenCalled();
    });
  });

  describe('invalidate', () => {
    it('returns true and deletes the token when session exists', async () => {
      const session = makeSession();
      vi.mocked(dao.findByToken).mockResolvedValue(session);

      const result = await service.invalidate(TEST_TOKEN);

      expect(result).toBe(true);
      expect(dao.deleteToken).toHaveBeenCalledWith(TEST_TOKEN, undefined);
    });

    it('returns false when the session does not exist', async () => {
      vi.mocked(dao.findByToken).mockResolvedValue(null);

      const result = await service.invalidate('ghost-token');

      expect(result).toBe(false);
      expect(dao.deleteToken).not.toHaveBeenCalled();
    });
  });

  describe('invalidateAllForUser', () => {
    it('delegates to deleteAllForUser and returns the count', async () => {
      vi.mocked(dao.deleteAllForUser).mockResolvedValue(3);

      const count = await service.invalidateAllForUser(TEST_USER_ID);

      expect(count).toBe(3);
      expect(dao.deleteAllForUser).toHaveBeenCalledWith(TEST_USER_ID, undefined);
    });
  });

  describe('cleanupExpired', () => {
    it('delegates to deleteExpired and returns the count', async () => {
      vi.mocked(dao.deleteExpired).mockResolvedValue(7);

      const count = await service.cleanupExpired();

      expect(count).toBe(7);
    });
  });
});
