import type { Knex } from 'knex';
import { SlaPoliciesDAO } from '../daos/children/sla-policies.dao.js';
import {
  OrganizationsDAO,
  OrganizationMembersDAO,
} from '../daos/children/organizations-domain.dao.js';
import { UsersDAO } from '../daos/children/users-domain.dao.js';
import { RolesDAO } from '../daos/children/roles-domain.dao.js';
import {
  SmartQuoteConfigsDAO,
  SpecialWorkingDaysDAO,
} from '../daos/children/smartquote-configs-domain.dao.js';
import type { RBACService } from '../services/rbac/rbac.service.js';
import { SlaBreachService } from '../services/sla/sla-breach.service.js';
import { SlaService } from '../services/sla/sla.service.js';
import { SlaController } from '../controllers/sla.controller.js';

export class SlaContainer {
  public readonly slaPoliciesDAO: SlaPoliciesDAO;
  public readonly orgsDAO: OrganizationsDAO;
  public readonly usersDAO: UsersDAO;
  public readonly rolesDAO: RolesDAO;
  public readonly smartQuoteConfigsDAO: SmartQuoteConfigsDAO;
  public readonly specialWorkingDaysDAO: SpecialWorkingDaysDAO;

  public readonly slaBreachService: SlaBreachService;
  public readonly slaService: SlaService;
  public readonly slaController: SlaController;

  constructor(db: Knex, rbacService: RBACService, orgMembersDAO: OrganizationMembersDAO) {
    this.slaPoliciesDAO = new SlaPoliciesDAO(db);
    this.orgsDAO = new OrganizationsDAO(db);
    this.usersDAO = new UsersDAO(db);
    this.rolesDAO = new RolesDAO(db);
    this.smartQuoteConfigsDAO = new SmartQuoteConfigsDAO(db);
    this.specialWorkingDaysDAO = new SpecialWorkingDaysDAO(db);

    this.slaBreachService = new SlaBreachService(
      this.smartQuoteConfigsDAO,
      this.specialWorkingDaysDAO
    );

    this.slaService = new SlaService(
      this.slaPoliciesDAO,
      this.orgsDAO,
      orgMembersDAO,
      this.usersDAO,
      this.rolesDAO,
      rbacService,
      this.slaBreachService
    );

    this.slaController = new SlaController(this.slaService);
  }
}
