import type { Knex } from 'knex';
import {
  OrganizationsDAO,
  OrganizationMembersDAO,
} from '../daos/children/organizations.domain.dao.js';
import { PermissionsDAO, OrgPermissionsDAO } from '../daos/children/permissions.dao.js';
import { RolesDAO, OrgRolesDAO } from '../daos/children/roles.dao.js';
import { UsersDAO } from '../daos/children/users.dao.js';
import { RBACService } from '../services/rbac/rbac.service.js';
import { OrgRBACService } from '../services/rbac/org.rbac.service.js';
import { OrgService } from '../services/org/org.service.js';
import { OrgMembersService } from '../services/org/org.members.service.js';
import { OrgController } from '../controllers/org.controller.js';

export class OrgContainer {
  public readonly orgsDAO: OrganizationsDAO;
  public readonly orgMembersDAO: OrganizationMembersDAO;
  public readonly permissionsDAO: PermissionsDAO;
  public readonly orgPermissionsDAO: OrgPermissionsDAO;
  public readonly rolesDAO: RolesDAO;
  public readonly orgRolesDAO: OrgRolesDAO;
  public readonly usersDAO: UsersDAO;

  public readonly rbacService: RBACService;
  public readonly orgRBACService: OrgRBACService;
  public readonly orgService: OrgService;
  public readonly orgMembersService: OrgMembersService;

  public readonly orgController: OrgController;

  constructor(db: Knex) {
    this.orgsDAO = new OrganizationsDAO(db);
    this.orgMembersDAO = new OrganizationMembersDAO(db);
    this.permissionsDAO = new PermissionsDAO(db);
    this.orgPermissionsDAO = new OrgPermissionsDAO(db);
    this.rolesDAO = new RolesDAO(db);
    this.orgRolesDAO = new OrgRolesDAO(db);
    this.usersDAO = new UsersDAO(db);

    this.rbacService = new RBACService(this.usersDAO, this.permissionsDAO);

    this.orgRBACService = new OrgRBACService(
      this.orgMembersDAO,
      this.orgPermissionsDAO,
      this.rbacService
    );

    this.orgService = new OrgService(this.orgsDAO, this.rbacService);

    this.orgMembersService = new OrgMembersService(
      this.orgMembersDAO,
      this.orgsDAO,
      this.usersDAO,
      this.rolesDAO,
      this.orgRolesDAO,
      this.orgRBACService
    );

    this.orgController = new OrgController(this.orgService, this.orgMembersService);
  }
}
