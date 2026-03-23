import { Knex } from 'knex';
import { LINK_TABLES, LOOKUP_TABLES } from '../../database/config/table-names';
import { OrganizationId, UserId } from '../../database/types/ids';
import { Organization, OrganizationMember } from '../../database/types/tables';
import { ActivatableDAO } from '../base/activatable.dao';
import { CompositeKeyDAO } from '../base/composite.key.dao';
import { QueryOptions } from '../base/types';

export class OrganizationsDAO extends ActivatableDAO<Organization, OrganizationId> {
  constructor(db: Knex) {
    super(
      {
        tableName: LOOKUP_TABLES.ORGANIZATIONS,
        primaryKey: 'id',
        hasActivation: true,
      },
      db
    );
  }
}

export class OrganizationMembersDAO extends CompositeKeyDAO<OrganizationMember> {
  constructor(db: Knex) {
    super(
      {
        tableName: LINK_TABLES.ORGANIZATION_MEMBERS,
        compositeKeys: ['organization_id', 'user_id'],
      },
      db
    );
  }

  /**
   * Find a single membership record for a user in a specific org.
   *
   * @param userId
   * @param organizationId
   * @param options
   * @returns OrganizationMember or null if the user is not a member
   */
  async findMembership(
    userId: UserId,
    organizationId: OrganizationId,
    options?: QueryOptions
  ): Promise<OrganizationMember | null> {
    return this.getOne({ user_id: userId, organization_id: organizationId }, options);
  }

  /**
   * Get all org memberships for a user.
   * Employees may belong to multiple orgs; customers are constrained to one
   * at the service layer but this DAO makes no such assumption.
   *
   * @param userId
   * @param options
   * @returns Array of OrganizationMember rows
   */
  async findByUser(userId: UserId, options?: QueryOptions): Promise<OrganizationMember[] | null> {
    return this.getMany({ user_id: userId }, options);
  }

  /**
   * Get all memberships for an org.
   *
   * @param organizationId
   * @param options
   * @returns Array of OrganizationMember rows
   */
  async findByOrganization(
    organizationId: OrganizationId,
    options?: QueryOptions
  ): Promise<OrganizationMember[] | null> {
    return this.getMany({ organization_id: organizationId }, options);
  }

  /**
   * Check whether a user belongs to a specific org.
   *
   * @param userId
   * @param organizationId
   * @param options
   * @returns True if the membership row exists
   */
  async isMember(
    userId: UserId,
    organizationId: OrganizationId,
    options?: QueryOptions
  ): Promise<boolean> {
    const result = await this.findMembership(userId, organizationId, options);
    return result !== null;
  }
}
