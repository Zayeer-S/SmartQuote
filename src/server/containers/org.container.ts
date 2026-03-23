import type { Knex } from 'knex';
import {
  OrganizationsDAO,
  OrganizationMembersDAO,
} from '../daos/children/organizations.domain.dao.js';
import { OrgPermissionsDAO } from '../daos/children/permissions.dao.js';
import { RolesDAO, OrgRolesDAO } from '../daos/children/roles.dao.js';
import { UsersDAO } from '../daos/children/users.dao.js';
import type { RBACService } from '../services/rbac/rbac.service.js';
import { OrgRBACService } from '../services/rbac/org.rbac.service.js';
import { OrgService } from '../services/org/org.service.js';
import { OrgMembersService } from '../services/org/org.members.service.js';
import { OrgController } from '../controllers/org.controller.js';

export class OrgContainer {
  public readonly orgsDAO: OrganizationsDAO;
  public readonly orgPermissionsDAO: OrgPermissionsDAO;
  public readonly rolesDAO: RolesDAO;
  public readonly orgRolesDAO: OrgRolesDAO;
  public readonly usersDAO: UsersDAO;

  public readonly orgRBACService: OrgRBACService;
  public readonly orgService: OrgService;
  public readonly orgMembersService: OrgMembersService;

  public readonly orgController: OrgController;

  constructor(db: Knex, rbacService: RBACService, orgMembersDAO: OrganizationMembersDAO) {
    this.orgsDAO = new OrganizationsDAO(db);
    this.orgPermissionsDAO = new OrgPermissionsDAO(db);
    this.rolesDAO = new RolesDAO(db);
    this.orgRolesDAO = new OrgRolesDAO(db);
    this.usersDAO = new UsersDAO(db);

    this.orgRBACService = new OrgRBACService(orgMembersDAO, this.orgPermissionsDAO, rbacService);

    this.orgService = new OrgService(this.orgsDAO, rbacService);

    this.orgMembersService = new OrgMembersService(
      orgMembersDAO,
      this.orgsDAO,
      this.usersDAO,
      this.rolesDAO,
      this.orgRolesDAO,
      this.orgRBACService
    );

    this.orgController = new OrgController(this.orgService, this.orgMembersService);
  }
}
