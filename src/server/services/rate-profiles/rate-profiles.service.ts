import { PERMISSIONS } from '../../../shared/constants/lookup-values.js';
import type { RateProfilesDAO } from '../../daos/children/rate-profiles.dao.js';
import type {
  BusinessImpactId,
  RateProfileId,
  TicketSeverityId,
  TicketTypeId,
} from '../../database/types/ids.js';
import type { RateProfile } from '../../database/types/tables.js';
import type { InsertData, TransactionContext } from '../../daos/base/types.js';
import type { RBACService } from '../rbac/rbac.service.js';
import type { UserId } from '../../database/types/ids.js';
import {
  RateProfileError,
  RateProfileForbiddenError,
  RATE_PROFILE_ERROR_MSGS,
} from './rate-profiles.errors.js';

export interface CreateRateProfileData {
  ticket_type_id: number;
  ticket_severity_id: number;
  business_impact_id: number;
  business_hours_rate: number;
  after_hours_rate: number;
  multiplier: number;
  effective_from: Date;
  effective_to: Date;
}

export interface UpdateRateProfileData {
  business_hours_rate?: number;
  after_hours_rate?: number;
  multiplier?: number;
  effective_from?: Date;
  effective_to?: Date;
  is_active?: boolean;
}

export class RateProfileService {
  private rateProfilesDAO: RateProfilesDAO;
  private rbacService: RBACService;

  constructor(rateProfilesDAO: RateProfilesDAO, rbacService: RBACService) {
    this.rateProfilesDAO = rateProfilesDAO;
    this.rbacService = rbacService;
  }

  /**
   * List all rate profiles, including inactive ones.
   * Admin settings page needs the full picture to show what exists
   * and allow reactivation.
   *
   * @param actorId Actor requesting the list
   * @param options Optional transaction context
   * @returns All rate profiles ordered by created_at ASC
   */
  async listRateProfiles(actorId: UserId, options?: TransactionContext): Promise<RateProfile[]> {
    const canRead = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.RATE_PROFILES_READ,
      options
    );
    if (!canRead) throw new RateProfileForbiddenError(RATE_PROFILE_ERROR_MSGS.FORBIDDEN);

    return this.rateProfilesDAO.getAll({
      ...options,
      includeInactive: true,
      orderBy: [{ column: 'created_at', order: 'asc' }],
    });
  }

  /**
   * Get a single rate profile by ID.
   *
   * @param rateProfileId Rate profile to retrieve
   * @param actorId Actor requesting
   * @param options Optional transaction context
   * @returns Rate profile
   * @throws RateProfileError if not found
   * @throws RateProfileForbiddenError if actor lacks RATE_PROFILES_READ
   */
  async getRateProfile(
    rateProfileId: RateProfileId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<RateProfile> {
    const canRead = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.RATE_PROFILES_READ,
      options
    );
    if (!canRead) throw new RateProfileForbiddenError(RATE_PROFILE_ERROR_MSGS.FORBIDDEN);

    const profile = await this.rateProfilesDAO.getById(rateProfileId, {
      ...options,
      includeInactive: true,
    });
    if (!profile) throw new RateProfileError(RATE_PROFILE_ERROR_MSGS.NOT_FOUND, 404);

    return profile;
  }

  /**
   * Create a new rate profile.
   * Enforces:
   *  - effective_from must be before effective_to
   *  - No active profile with the same (ticket_type_id, ticket_severity_id,
   *    business_impact_id) may have an overlapping date range
   *
   * @param data Profile fields
   * @param actorId Actor creating
   * @param options Optional transaction context
   * @returns Created rate profile
   * @throws RateProfileForbiddenError if actor lacks RATE_PROFILES_CREATE
   * @throws RateProfileError if date range is invalid or an overlap exists
   */
  async createRateProfile(
    data: CreateRateProfileData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<RateProfile> {
    const canCreate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.RATE_PROFILES_CREATE,
      options
    );
    if (!canCreate) throw new RateProfileForbiddenError(RATE_PROFILE_ERROR_MSGS.FORBIDDEN);

    this.assertValidDateRange(data.effective_from, data.effective_to);

    await this.assertNoOverlap(
      data.ticket_type_id,
      data.ticket_severity_id,
      data.business_impact_id,
      data.effective_from,
      data.effective_to,
      null,
      options
    );

    return this.rateProfilesDAO.create(
      {
        ticket_type_id: data.ticket_type_id as TicketTypeId,
        ticket_severity_id: data.ticket_severity_id as TicketSeverityId,
        business_impact_id: data.business_impact_id as BusinessImpactId,
        business_hours_rate: data.business_hours_rate,
        after_hours_rate: data.after_hours_rate,
        multiplier: data.multiplier,
        effective_from: data.effective_from,
        effective_to: data.effective_to,
        is_active: true,
      } satisfies InsertData<RateProfile>,
      options
    );
  }

  /**
   * Update a rate profile.
   * The (ticket_type_id, ticket_severity_id, business_impact_id) combo is immutable --
   * that trio is the identity of the profile. To change the combo, deactivate this
   * profile and create a new one.
   *
   * If either effective_from or effective_to is being changed, the overlap check
   * re-runs using the merged date range (new value takes precedence over existing).
   *
   * @param rateProfileId Profile to update
   * @param data Fields to update
   * @param actorId Actor performing the update
   * @param options Optional transaction context
   * @returns Updated rate profile
   * @throws RateProfileForbiddenError if actor lacks RATE_PROFILES_UPDATE
   * @throws RateProfileError if not found, date range invalid, or overlap exists
   */
  async updateRateProfile(
    rateProfileId: RateProfileId,
    data: UpdateRateProfileData,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<RateProfile> {
    const canUpdate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.RATE_PROFILES_UPDATE,
      options
    );
    if (!canUpdate) throw new RateProfileForbiddenError(RATE_PROFILE_ERROR_MSGS.FORBIDDEN);

    const existing = await this.rateProfilesDAO.getById(rateProfileId, {
      ...options,
      includeInactive: true,
    });
    if (!existing) throw new RateProfileError(RATE_PROFILE_ERROR_MSGS.NOT_FOUND, 404);

    const mergedFrom = data.effective_from ?? existing.effective_from;
    const mergedTo = data.effective_to ?? existing.effective_to;

    const dateRangeChanging = data.effective_from !== undefined || data.effective_to !== undefined;

    if (dateRangeChanging) {
      this.assertValidDateRange(mergedFrom, mergedTo);

      await this.assertNoOverlap(
        existing.ticket_type_id as unknown as number,
        existing.ticket_severity_id as unknown as number,
        existing.business_impact_id as unknown as number,
        mergedFrom,
        mergedTo,
        rateProfileId,
        options
      );
    }

    await this.rateProfilesDAO.update(
      { id: rateProfileId },
      {
        business_hours_rate: data.business_hours_rate,
        after_hours_rate: data.after_hours_rate,
        multiplier: data.multiplier,
        effective_from: data.effective_from,
        effective_to: data.effective_to,
        is_active: data.is_active,
      },
      { ...options }
    );

    const updated = await this.rateProfilesDAO.getById(rateProfileId, {
      ...options,
      includeInactive: true,
    });
    if (!updated) throw new RateProfileError(RATE_PROFILE_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }

  /**
   * Soft-delete a rate profile by setting is_active = false.
   * Hard deletes are not permitted -- profiles may be referenced by historical quotes.
   *
   * @param rateProfileId Profile to deactivate
   * @param actorId Actor performing the deletion
   * @param options Optional transaction context
   * @throws RateProfileForbiddenError if actor lacks RATE_PROFILES_DELETE
   * @throws RateProfileError if not found
   */
  async deleteRateProfile(
    rateProfileId: RateProfileId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<void> {
    const canDelete = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.RATE_PROFILES_DELETE,
      options
    );
    if (!canDelete) throw new RateProfileForbiddenError(RATE_PROFILE_ERROR_MSGS.FORBIDDEN);

    const existing = await this.rateProfilesDAO.getById(rateProfileId, {
      ...options,
      includeInactive: true,
    });
    if (!existing) throw new RateProfileError(RATE_PROFILE_ERROR_MSGS.NOT_FOUND, 404);

    await this.rateProfilesDAO.update({ id: rateProfileId }, { is_active: false }, { ...options });
  }

  /** Assert effective_from is strictly before effective_to */
  private assertValidDateRange(from: Date, to: Date): void {
    if (from >= to) throw new RateProfileError(RATE_PROFILE_ERROR_MSGS.INVALID_DATE_RANGE, 422);
  }

  /**
   * Assert no active profile with the same combo has an overlapping date range.
   * Two ranges [A_from, A_to] and [B_from, B_to] overlap when:
   *   A_from <= B_to AND A_to >= B_from
   *
   * @param excludeId Profile ID to exclude from the check (used on update to ignore self)
   */
  private async assertNoOverlap(
    ticketTypeId: number,
    ticketSeverityId: number,
    businessImpactId: number,
    from: Date,
    to: Date,
    excludeId: RateProfileId | null,
    options?: TransactionContext
  ): Promise<void> {
    const existing = await this.rateProfilesDAO.getAll({
      ...options,
      includeInactive: false,
    });

    const conflict = existing.find((profile) => {
      if (excludeId !== null && String(profile.id) === String(excludeId)) return false;

      const sameCombo =
        (profile.ticket_type_id as unknown as number) === ticketTypeId &&
        (profile.ticket_severity_id as unknown as number) === ticketSeverityId &&
        (profile.business_impact_id as unknown as number) === businessImpactId;

      if (!sameCombo) return false;

      return profile.effective_from <= to && profile.effective_to >= from;
    });

    if (conflict) throw new RateProfileError(RATE_PROFILE_ERROR_MSGS.OVERLAP, 422);
  }
}
