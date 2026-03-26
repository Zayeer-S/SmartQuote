import type { Knex } from 'knex';
import { AuthController } from '../controllers/auth.controller.js';
import { PermissionsDAO } from '../daos/children/permissions.dao.js';
import { RolesDAO } from '../daos/children/roles.dao.js';
import { SessionsDAO } from '../daos/children/sessions.dao.js';
import { UsersDAO } from '../daos/children/users.dao.js';
import { AuthService } from '../services/auth/auth.service.js';
import { PasswordService } from '../services/auth/password.service.js';
import { SessionService } from '../services/auth/session.service.js';
import { RBACService } from '../services/rbac/rbac.service.js';
import { authConfig, passwordConfig } from '../config/auth-config.js';
import { OrganizationMembersDAO } from '../daos/children/organizations.domain.dao.js';

export class AuthContainer {
  public readonly usersDAO: UsersDAO;
  public readonly sessionsDAO: SessionsDAO;
  public readonly rolesDAO: RolesDAO;
  public readonly permissionsDAO: PermissionsDAO;
  public readonly orgMembersDAO: OrganizationMembersDAO;

  public readonly passwordService: PasswordService;
  public readonly sessionService: SessionService;
  public readonly authService: AuthService;
  public readonly rbacService: RBACService;

  public readonly authController: AuthController;

  constructor(db: Knex) {
    this.usersDAO = new UsersDAO(db);
    this.sessionsDAO = new SessionsDAO(db);
    this.rolesDAO = new RolesDAO(db);
    this.permissionsDAO = new PermissionsDAO(db);
    this.orgMembersDAO = new OrganizationMembersDAO(db);

    this.passwordService = new PasswordService(passwordConfig);
    this.sessionService = new SessionService(authConfig, this.sessionsDAO);
    this.authService = new AuthService(
      this.usersDAO,
      this.orgMembersDAO,
      this.sessionService,
      this.passwordService
    );
    this.rbacService = new RBACService(this.usersDAO, this.permissionsDAO);

    this.authController = new AuthController(this.authService, this.rbacService);
  }
}
