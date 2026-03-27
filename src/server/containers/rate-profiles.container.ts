import type { Knex } from 'knex';
import type { RBACService } from '../services/rbac/rbac.service.js';
import type { LookupResolver } from '../lib/lookup-resolver.js';

import { RateProfilesDAO } from '../daos/children/rate-profiles.dao.js';
import { RateProfileService } from '../services/rate-profiles/rate-profiles.service.js';
import { RateProfileController } from '../controllers/rate-profiles.controller.js';

export class RateProfileContainer {
  public readonly rateProfilesDAO: RateProfilesDAO;
  public readonly rateProfileService: RateProfileService;
  public readonly rateProfileController: RateProfileController;

  constructor(db: Knex, rbacService: RBACService, lookup: LookupResolver) {
    this.rateProfilesDAO = new RateProfilesDAO(db);
    this.rateProfileService = new RateProfileService(this.rateProfilesDAO, rbacService);
    this.rateProfileController = new RateProfileController(this.rateProfileService, lookup);
  }
}
