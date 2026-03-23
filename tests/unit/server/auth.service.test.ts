/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../../src/server/services/auth/auth.service';
import {
  AuthError,
  PasswordValidationError,
  AUTH_ERROR_MSGS,
} from '../../../src/server/services/auth/auth.errors';
import type { UsersDAO } from '../../../src/server/daos/children/users.dao';
import type { SessionService } from '../../../src/server/services/auth/session.service';
import type { PasswordService } from '../../../src/server/services/auth/password.service';
import type { UserId } from '../../../src/server/database/types/ids';
import { makeMockUsersDAO } from '../../utils/mock.daos';
import { makeMockPasswordService, makeMockSessionService } from '../../utils/mock.services';

const USER_ID = 1 as unknown as UserId;
const TOKEN = 'valid-session-token';

const baseUser = {
  id: USER_ID,
  email: 'user@example.com',
  password: 'hashed-password',
  first_name: 'Jane',
  middle_name: null,
  last_name: 'Doe',
  deleted_at: null,
  email_verified: true,
  phone_number: null,
  organization_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
};

const userWithRole = {
  ...baseUser,
  role: { id: 2, name: 'customer' },
};

const session = {
  id: 1,
  user_id: USER_ID,
  session_token: TOKEN,
  expires_at: new Date(Date.now() + 86400000),
  last_activity: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
};

describe('AuthService', () => {
  let usersDAO: UsersDAO;
  let sessionService: SessionService;
  let passwordService: PasswordService;
  let authService: AuthService;

  beforeEach(() => {
    usersDAO = makeMockUsersDAO();
    sessionService = makeMockSessionService();
    passwordService = makeMockPasswordService();
    authService = new AuthService(usersDAO, sessionService, passwordService);
  });

  describe('login', () => {
    it('returns a token and user data on valid credentials', async () => {
      vi.mocked(usersDAO.findByEmail).mockResolvedValue(baseUser as never);
      vi.mocked(passwordService.verify).mockResolvedValue(true);
      vi.mocked(usersDAO.findWithRole).mockResolvedValue(userWithRole as never);
      vi.mocked(sessionService.create).mockResolvedValue(session as never);

      const result = await authService.login({ email: 'user@example.com', password: 'Valid1!ab' });

      expect(result.token).toBe(TOKEN);
      expect(result.user.email).toBe('user@example.com');
      expect(result.user.role.name).toBe('customer');
    });

    it('throws AuthError when the user is not found', async () => {
      vi.mocked(usersDAO.findByEmail).mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@example.com', password: 'Valid1!ab' })
      ).rejects.toThrow(AuthError);
    });

    it('throws AuthError with INVALID_CREDS when user is soft-deleted', async () => {
      vi.mocked(usersDAO.findByEmail).mockResolvedValue({
        ...baseUser,
        deleted_at: new Date(),
      } as never);

      await expect(
        authService.login({ email: 'user@example.com', password: 'Valid1!ab' })
      ).rejects.toThrow(AUTH_ERROR_MSGS.INVALID_CREDS);
    });

    it('throws AuthError with INVALID_CREDS when the password is wrong', async () => {
      vi.mocked(usersDAO.findByEmail).mockResolvedValue(baseUser as never);
      vi.mocked(passwordService.verify).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'user@example.com', password: 'Wrong1!ab' })
      ).rejects.toThrow(AUTH_ERROR_MSGS.INVALID_CREDS);
    });

    it('throws AuthError with ROLE_NOT_FOUND when findWithRole returns null', async () => {
      vi.mocked(usersDAO.findByEmail).mockResolvedValue(baseUser as never);
      vi.mocked(passwordService.verify).mockResolvedValue(true);
      vi.mocked(usersDAO.findWithRole).mockResolvedValue(null);

      await expect(
        authService.login({ email: 'user@example.com', password: 'Valid1!ab' })
      ).rejects.toThrow(AUTH_ERROR_MSGS.ROLE_NOT_FOUND);
    });

    it('does not call sessionService.create when credentials are invalid', async () => {
      vi.mocked(usersDAO.findByEmail).mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@example.com', password: 'Valid1!ab' })
      ).rejects.toThrow(AuthError);

      expect(sessionService.create).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('returns true when the session is successfully invalidated', async () => {
      vi.mocked(sessionService.invalidate).mockResolvedValue(true);

      const result = await authService.logout(TOKEN);

      expect(result).toBe(true);
    });

    it('throws AuthError with INVALID_SESSION when token is not found', async () => {
      vi.mocked(sessionService.invalidate).mockResolvedValue(false);

      await expect(authService.logout('ghost-token')).rejects.toThrow(
        AUTH_ERROR_MSGS.INVALID_SESSION
      );
    });
  });

  describe('getCurrentUser', () => {
    it('returns user data for a valid session token', async () => {
      vi.mocked(sessionService.validate).mockResolvedValue(session as never);
      vi.mocked(usersDAO.findWithRole).mockResolvedValue(userWithRole as never);

      const result = await authService.getCurrentUser(TOKEN);

      expect(result.id).toBe(USER_ID);
      expect(result.email).toBe('user@example.com');
      expect(result.role.name).toBe('customer');
    });

    it('throws AuthError when session is invalid or expired', async () => {
      vi.mocked(sessionService.validate).mockResolvedValue(null);

      await expect(authService.getCurrentUser('expired-token')).rejects.toThrow(AuthError);
    });

    it('throws AuthError when the user no longer exists', async () => {
      vi.mocked(sessionService.validate).mockResolvedValue(session as never);
      vi.mocked(usersDAO.findWithRole).mockResolvedValue(null);

      await expect(authService.getCurrentUser(TOKEN)).rejects.toThrow(AuthError);
    });
  });

  describe('createUser', () => {
    const newUserData = {
      email: 'new@example.com',
      password: 'Valid1!ab',
      firstName: 'John',
      middleName: undefined,
      lastName: 'Smith',
      phoneNumber: null,
      roleId: 2,
      organizationId: 1,
    };

    it('creates and returns a new user when the email is not taken', async () => {
      vi.mocked(usersDAO.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordService.validate).mockReturnValue({ isValid: true, errors: [] });
      vi.mocked(passwordService.hash).mockResolvedValue('hashed');
      vi.mocked(usersDAO.create).mockResolvedValue({
        ...baseUser,
        id: 2 as unknown as UserId,
      } as never);
      vi.mocked(usersDAO.findWithRole).mockResolvedValue({
        ...userWithRole,
        id: 2 as unknown as UserId,
      } as never);

      const result = await authService.createUser(newUserData as never);

      expect(result.email).toBe('user@example.com');
      expect(passwordService.hash).toHaveBeenCalledWith('Valid1!ab');
    });

    it('throws PasswordValidationError when the email is already in use', async () => {
      vi.mocked(usersDAO.findByEmail).mockResolvedValue(baseUser as never);

      await expect(authService.createUser(newUserData as never)).rejects.toThrow(
        PasswordValidationError
      );
    });

    it('throws PasswordValidationError when the password fails validation', async () => {
      vi.mocked(usersDAO.findByEmail).mockResolvedValue(null);
      vi.mocked(passwordService.validate).mockReturnValue({
        isValid: false,
        errors: ['Password too short'],
      });

      await expect(authService.createUser(newUserData as never)).rejects.toThrow(
        PasswordValidationError
      );
      expect(passwordService.hash).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const passwordData = { oldPassword: 'Old1!abcd', newPassword: 'New1!abcd' };

    it('hashes the new password and invalidates all sessions on success', async () => {
      vi.mocked(usersDAO.getById).mockResolvedValue(baseUser as never);
      vi.mocked(passwordService.validate).mockReturnValue({ isValid: true, errors: [] });
      vi.mocked(passwordService.hash).mockResolvedValue('new-hashed');
      vi.mocked(usersDAO.update).mockResolvedValue(undefined as never);
      vi.mocked(sessionService.invalidateAllForUser).mockResolvedValue(1);

      await authService.changePassword(USER_ID, passwordData);

      expect(passwordService.hash).toHaveBeenCalledWith('New1!abcd');
      expect(usersDAO.update).toHaveBeenCalled();
      expect(sessionService.invalidateAllForUser).toHaveBeenCalledWith(USER_ID, undefined);
    });

    it('throws AuthError when the user does not exist', async () => {
      vi.mocked(usersDAO.getById).mockResolvedValue(null);

      await expect(authService.changePassword(USER_ID, passwordData)).rejects.toThrow(AuthError);
      expect(passwordService.hash).not.toHaveBeenCalled();
    });

    it('throws PasswordValidationError when the new password fails validation', async () => {
      vi.mocked(usersDAO.getById).mockResolvedValue(baseUser as never);
      vi.mocked(passwordService.validate).mockReturnValue({
        isValid: false,
        errors: ['Missing uppercase'],
      });

      await expect(authService.changePassword(USER_ID, passwordData)).rejects.toThrow(
        PasswordValidationError
      );
      expect(sessionService.invalidateAllForUser).not.toHaveBeenCalled();
    });
  });
});
