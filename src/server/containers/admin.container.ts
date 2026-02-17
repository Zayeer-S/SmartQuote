import type { Knex } from 'knex';
import { RBACService } from '../services/rbac/rbac.service';
import { AdminController } from '../controllers/admin.controller';
import type { AuthService } from '../services/auth/auth.service';
import { UsersDAO } from '../daos/children/users.dao';
import { PermissionsDAO } from '../daos/children/permissions.dao';

export class AdminContainer {
  public readonly usersDAO: UsersDAO;
  public readonly permissionsDAO: PermissionsDAO;

  public readonly rbacService: RBACService;

  public readonly adminController: AdminController;

  constructor(db: Knex, authService: AuthService) {
    this.usersDAO = new UsersDAO(db);
    this.permissionsDAO = new PermissionsDAO(db);

    this.rbacService = new RBACService(this.usersDAO, this.permissionsDAO);

    this.adminController = new AdminController(authService, this.usersDAO);
  }
}
