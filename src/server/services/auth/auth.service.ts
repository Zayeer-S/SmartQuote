import type {
  ChangePasswordRequest,
  GetCurrentUserResponse,
  LoginRequest,
  LoginResponse,
} from '../../../shared/contracts/auth-contracts';
import type {
  CreateUserRequest,
  CreateUserResponse,
} from '../../../shared/contracts/user-contracts';
import type { TransactionContext } from '../../daos/base/types';
import type { UsersDAO } from '../../daos/children/users.dao';
import type { OrganizationId, RoleId, UserId } from '../../database/types/ids';
import { AUTH_ERROR_MSGS, AuthError, PasswordValidationError } from './auth.errors';
import type { PasswordService } from './password.service';
import type { SessionService } from './session.service';

export class AuthService {
  private usersDAO: UsersDAO;
  private sessionService: SessionService;
  private passwordService: PasswordService;

  constructor(
    usersDAO: UsersDAO,
    sessionService: SessionService,
    passwordService: PasswordService
  ) {
    this.usersDAO = usersDAO;
    this.sessionService = sessionService;
    this.passwordService = passwordService;
  }

  /**
   * Authenticate user and create session
   *
   * @param credentials Login credentials
   * @param options Optional transaction context
   * @returns Login response with user data and session token
   * @throws AuthError if credentials invalid or user not found
   */
  async login(credentials: LoginRequest, options?: TransactionContext): Promise<LoginResponse> {
    const user = await this.usersDAO.findByEmail(credentials.email, {
      ...options,
      includeDeleted: true,
      includeInactive: true,
    });

    if (!user) throw new AuthError(AUTH_ERROR_MSGS.INVALID_CREDS);
    if (user.deleted_at) throw new AuthError(AUTH_ERROR_MSGS.INVALID_CREDS);

    const isPasswordValid = await this.passwordService.verify(credentials.password, user.password);
    if (!isPasswordValid) throw new AuthError(AUTH_ERROR_MSGS.INVALID_CREDS);

    const userWithRole = await this.usersDAO.findWithRole(user.id, options);
    if (!userWithRole) throw new AuthError(AUTH_ERROR_MSGS.ROLE_NOT_FOUND);

    const session = await this.sessionService.create(user.id, options);

    return {
      token: session.session_token,
      user: {
        id: userWithRole.id,
        email: userWithRole.email,
        firstName: userWithRole.first_name,
        middleName: userWithRole.middle_name,
        lastName: userWithRole.last_name,
        role: {
          id: userWithRole.role.id,
          name: userWithRole.role.name,
        },
      },
    };
  }

  /**
   * Logout user by invalidating session
   *
   * @param token Session token
   * @param options Optional transaction context
   * @returns True if logout successful
   * @throws AuthError if session not found
   */
  async logout(token: string, options?: TransactionContext): Promise<boolean> {
    const invalidated = await this.sessionService.invalidate(token, options);
    if (!invalidated) throw new AuthError(AUTH_ERROR_MSGS.INVALID_SESSION);
    return true;
  }

  /**
   * Get current user from session token
   *
   * @param token - Session token
   * @param options - Optional transaction context
   * @returns User data
   * @throws AuthError if session invalid
   */
  async getCurrentUser(
    token: string,
    options?: TransactionContext
  ): Promise<GetCurrentUserResponse> {
    // Validate session
    const session = await this.sessionService.validate(token, options);

    if (!session) {
      throw new AuthError('Invalid or expired session');
    }

    // Get user with role
    const user = await this.usersDAO.findWithRole(session.user_id, options);

    if (!user) {
      throw new AuthError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      middleName: user.middle_name,
      lastName: user.last_name,
      emailVerified: user.email_verified,
      phoneNumber: user.phone_number,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
      organizationId: user.organization_id,
      createdAt: user.created_at.toISOString(),
    };
  }

  /**
   * Create a new user (admin only - permission check done in controller/middleware)
   *
   * @param userData User creation data
   * @param options Optional transaction context
   * @returns Created user data
   * @throws ValidationError if data invalid
   */
  async createUser(
    userData: CreateUserRequest,
    options?: TransactionContext
  ): Promise<CreateUserResponse> {
    const existingUser = await this.usersDAO.findByEmail(userData.email, {
      ...options,
      includeDeleted: true,
    });

    if (existingUser) {
      throw new PasswordValidationError('Email already in use');
    }

    const passwordValidation = this.passwordService.validate(userData.password);
    if (!passwordValidation.isValid) {
      throw new PasswordValidationError(passwordValidation.errors.join(', '));
    }

    const hashedPassword = await this.passwordService.hash(userData.password);

    const user = await this.usersDAO.create(
      {
        first_name: userData.firstName,
        middle_name: userData.middleName,
        last_name: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        phone_number: userData.phoneNumber,
        role_id: userData.roleId as RoleId,
        organization_id: userData.organizationId as OrganizationId,
        email_verified: false,
        deleted_at: null,
      },
      options
    );

    const userWithRole = await this.usersDAO.findWithRole(user.id, options);

    if (!userWithRole) {
      throw new Error('Failed to retrieve created user');
    }

    return {
      id: userWithRole.id,
      email: userWithRole.email,
      firstName: userWithRole.first_name,
      middleName: userWithRole.middle_name,
      lastName: userWithRole.last_name,
      phoneNumber: userWithRole.phone_number,
      role: {
        id: userWithRole.role.id,
        name: userWithRole.role.name,
      },
      organizationId: userWithRole.organization_id,
      createdAt: userWithRole.created_at.toISOString(),
    };
  }

  /**
   * Change user password
   * Invalidates all sessions to force re-login
   *
   * @param userId User ID
   * @param passwordData Old and new passwords
   * @param options Optional transaction context
   * @throws AuthError if old password incorrect
   * @throws ValidationError if new password doesn't meet requirements
   */
  async changePassword(
    userId: UserId,
    passwordData: ChangePasswordRequest,
    options?: TransactionContext
  ): Promise<void> {
    const user = await this.usersDAO.getById(userId, options);
    if (!user) throw new AuthError(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const { isValid, errors } = this.passwordService.validate(passwordData.newPassword);
    if (!isValid) throw new PasswordValidationError(errors.join(', '));

    const hashedPassword = await this.passwordService.hash(passwordData.newPassword);

    await this.usersDAO.update({ id: userId }, { password: hashedPassword }, options);

    await this.sessionService.invalidateAllForUser(userId, options);
  }
}
