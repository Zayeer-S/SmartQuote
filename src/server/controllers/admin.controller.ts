/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { Request, Response } from 'express';
import type { UsersDAO } from '../daos/children/users.dao';
import type { AuthService } from '../services/auth/auth.service';
import { validateOrThrow } from '../validators/validation-utils';
import { createUserSchema, listUsersQuerySchema } from '../validators/user.validator';
import type { CreateUserRequest } from '../../shared/contracts/user-contracts';
import { error, success } from '../lib/respond';

export class AdminController {
  private authService: AuthService;
  private usersDAO: UsersDAO;

  constructor(authService: AuthService, usersDAO: UsersDAO) {
    this.authService = authService;
    this.usersDAO = usersDAO;
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
      if (queryParams.organizationId) criteria.organization_id = queryParams.organizationId;

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
            organizationId: userWithRole?.organization_id,
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
