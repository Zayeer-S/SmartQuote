import type { Knex } from 'knex';
import { AuthController } from '../controllers/auth.controller';
import { RolesDAO } from '../daos/children/roles.dao';
import { SessionsDAO } from '../daos/children/sessions.dao';
import { UsersDAO } from '../daos/children/users.dao';
import { AuthService } from '../services/auth/auth.service';
import { PasswordService } from '../services/auth/password.service';
import { SessionService } from '../services/auth/session.service';
import { authConfig, passwordConfig } from '../config/auth-config';

export class AuthContainer {
  public readonly usersDAO: UsersDAO;
  public readonly sessionsDAO: SessionsDAO;
  public readonly rolesDAO: RolesDAO;

  public readonly passwordService: PasswordService;
  public readonly sessionService: SessionService;
  public readonly authService: AuthService;

  public readonly authController: AuthController;

  constructor(db: Knex) {
    this.usersDAO = new UsersDAO(db);
    this.sessionsDAO = new SessionsDAO(db);
    this.rolesDAO = new RolesDAO(db);

    this.passwordService = new PasswordService(passwordConfig);
    this.sessionService = new SessionService(authConfig, this.sessionsDAO);
    this.authService = new AuthService(this.usersDAO, this.sessionService, this.passwordService);

    this.authController = new AuthController(this.authService);
  }
}
