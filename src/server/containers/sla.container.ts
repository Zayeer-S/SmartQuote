import type { Knex } from 'knex';
import { SlaPoliciesDAO } from '../daos/children/sla.policies.dao.js';
import {
  OrganizationsDAO,
  OrganizationMembersDAO,
} from '../daos/children/organizations.domain.dao.js';
import { UsersDAO } from '../daos/children/users.dao.js';
import { RolesDAO } from '../daos/children/roles.dao.js';
import type { RBACService } from '../services/rbac/rbac.service.js';
import { SlaService } from '../services/sla/sla.service.js';
import { SlaController } from '../controllers/sla.controller.js';

export class SlaContainer {
  public readonly slaPoliciesDAO: SlaPoliciesDAO;
  public readonly orgsDAO: OrganizationsDAO;
  public readonly usersDAO: UsersDAO;
  public readonly rolesDAO: RolesDAO;

  public readonly slaService: SlaService;
  public readonly slaController: SlaController;

  constructor(db: Knex, rbacService: RBACService, orgMembersDAO: OrganizationMembersDAO) {
    this.slaPoliciesDAO = new SlaPoliciesDAO(db);
    this.orgsDAO = new OrganizationsDAO(db);
    this.usersDAO = new UsersDAO(db);
    this.rolesDAO = new RolesDAO(db);

    this.slaService = new SlaService(
      this.slaPoliciesDAO,
      this.orgsDAO,
      orgMembersDAO,
      this.usersDAO,
      this.rolesDAO,
      rbacService
    );

    this.slaController = new SlaController(this.slaService);
  }
}
