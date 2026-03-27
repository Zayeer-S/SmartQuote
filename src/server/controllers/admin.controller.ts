/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { Request, Response } from 'express';
import type { UsersDAO } from '../daos/children/users-domain.dao.js';
import type { AuthService } from '../services/auth/auth.service.js';
import { validateOrThrow } from '../validators/validation-utils.js';
import { createUserSchema, listUsersQuerySchema } from '../validators/user.validator.js';
import type { CreateUserRequest } from '../../shared/contracts/user-contracts.js';
import { error, success } from '../lib/respond.js';
import { OrganizationMembersDAO } from '../daos/children/organizations-domain.dao.js';

export class AdminController {
  private authService: AuthService;
  private usersDAO: UsersDAO;
  private organizationMembersDAO: OrganizationMembersDAO;

  constructor(
    authService: AuthService,
    usersDAO: UsersDAO,
    organizationMembersDAO: OrganizationMembersDAO
  ) {
    this.authService = authService;
    this.usersDAO = usersDAO;
    this.organizationMembersDAO = organizationMembersDAO;
  }

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData = validateOrThrow(createUserSchema, req.body) as CreateUserRequest;

      const newUser = await this.authService.createUser(userData);

      success(res, newUser, 201);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        error(res, err.statusCode ?? 400, err.message);
        return;
      }

      if (err.message.includes(':')) {
        error(res, 400, err.message);
        return;
      }

      console.error('Create user error:', err);
      error(res, 500, 'Internal server error');
    }
  };

  listUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryParams = validateOrThrow(listUsersQuerySchema, req.query);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const criteria: any = {};
      if (queryParams.roleId) criteria.role_id = queryParams.roleId;

      const users = await this.usersDAO.getMany(criteria, {
        limit: queryParams.limit,
        offset: queryParams.offset,
        orderBy: [{ column: 'created_at', order: 'desc' }],
      });

      const total = await this.usersDAO.count(criteria);

      const userList = await Promise.all(
        users.map(async (user) => {
          const userWithRole = await this.usersDAO.findWithRole(user.id);
          return {
            id: userWithRole?.id,
            email: userWithRole?.email,
            firstName: userWithRole?.first_name,
            lastName: userWithRole?.last_name,
            phoneNumber: userWithRole?.phone_number,
            emailVerified: userWithRole?.email_verified,
            role: {
              id: userWithRole?.role.id,
              name: userWithRole?.role.name,
            },
            organizationId: userWithRole
              ? this.organizationMembersDAO.findByUser(userWithRole.id)
              : null,
            createdAt: userWithRole?.created_at.toISOString(),
          };
        })
      );

      success(
        res,
        {
          users: userList,
          total,
          limit: queryParams.limit,
          offset: queryParams.offset,
        },
        200
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.message.includes(':')) {
        error(res, 400, err.message);
        return;
      }

      console.error('List users error:', err);
      error(res, 500, 'Internal server error');
    }
  };
}
