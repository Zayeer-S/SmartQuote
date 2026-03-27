import type { Knex } from 'knex';
import { RBACService } from '../services/rbac/rbac.service.js';
import { AdminController } from '../controllers/admin.controller.js';
import type { AuthService } from '../services/auth/auth.service.js';
import { UsersDAO } from '../daos/children/users-domain.dao.js';
import { PermissionsDAO } from '../daos/children/permissions-domain.dao.js';
import { OrganizationMembersDAO } from '../daos/children/organizations-domain.dao.js';

export class AdminContainer {
  public readonly usersDAO: UsersDAO;
  public readonly permissionsDAO: PermissionsDAO;

  public readonly rbacService: RBACService;

  public readonly adminController: AdminController;

  constructor(db: Knex, authService: AuthService, orgMembersDAO: OrganizationMembersDAO) {
    this.usersDAO = new UsersDAO(db);
    this.permissionsDAO = new PermissionsDAO(db);

    this.rbacService = new RBACService(this.usersDAO, this.permissionsDAO);

    this.adminController = new AdminController(authService, this.usersDAO, orgMembersDAO);
  }
}
