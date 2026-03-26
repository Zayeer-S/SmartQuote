import type { Knex } from 'knex';
import type {
  BusinessImpactId,
  OrganizationId,
  TicketId,
  TicketSeverityId,
  TicketStatusId,
  TicketTypeId,
  UserId,
} from '../../database/types/ids.js';
import { DeletableDAO } from '../base/deletable.dao.js';
import { LOOKUP_TABLES, MAIN_TABLES } from '../../database/config/table-names.js';
import type { GetManyOptions, QueryOptions } from '../base/types.js';
import type { Ticket, TicketWithDetails } from '../../database/types/tables.js';
import {
  AnalyticsResolutionTimeRow,
  AnalyticsVolumeRow,
} from '../../database/types/sanitized.types.js';

export class TicketsDAO extends DeletableDAO<Ticket, TicketId> {
  constructor(db: Knex) {
    super(
      {
        tableName: MAIN_TABLES.TICKETS,
        primaryKey: 'id',
      },
      db
    );
  }

  /**
   * Find all tickets belonging to an organisation
   *
   * @param organizationId Organisation to filter by
   * @param options Query options
   * @returns Array of matching tickets
   */
  async findByOrganization(
    organizationId: OrganizationId,
    options?: GetManyOptions
  ): Promise<Ticket[]> {
    return this.getMany({ organization_id: organizationId }, options);
  }

  /**
   * Find all tickets assigned to a specific user
   *
   * @param userId Assignee user ID
   * @param options Query options
   * @returns Array of matching tickets
   */
  async findByAssignee(userId: UserId, options?: GetManyOptions): Promise<Ticket[]> {
    return this.getMany({ assigned_to_user_id: userId }, options);
  }

  /**
   * Find all tickets with a given status
   *
   * @param statusId Ticket status ID to filter by
   * @param options Query options
   * @returns Array of matching tickets
   */
  async findByStatus(statusId: TicketStatusId, options?: GetManyOptions): Promise<Ticket[]> {
    return this.getMany({ ticket_status_id: statusId }, options);
  }

  /**
   * Find a single ticket with all lookup fields joined in.
   * Returns human-readable name columns alongside the base ticket row.
   *
   * @param ticketId Ticket ID
   * @param options Query options
   * @returns TicketWithDetails or null if not found
   */
  async findWithDetails(
    ticketId: TicketId,
    options?: QueryOptions
  ): Promise<TicketWithDetails | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await this.buildDetailsQuery(options)
      .where(`${MAIN_TABLES.TICKETS}.id`, ticketId)
      .first();

    return result ? (result as TicketWithDetails) : null;
  }

  /**
   * Find multiple tickets with all lookup fields joined in.
   * Accepts the same criteria shape as getMany.
   *
   * @param criteria Partial ticket fields to filter by
   * @param options Query and pagination options
   * @returns Array of tickets with resolved lookup names
   */
  async findManyWithDetails(
    criteria: Partial<Ticket>,
    options?: GetManyOptions
  ): Promise<TicketWithDetails[]> {
    let query = this.buildDetailsQuery(options).where(criteria as Record<string, unknown>);

    if (options?.limit !== undefined && options.limit > 0) query = query.limit(options.limit);
    if (options?.offset !== undefined && options.offset > 0) query = query.offset(options.offset);

    if (options?.orderBy) {
      options.orderBy.forEach(({ column, order = 'asc' }) => {
        query = query.orderBy(column, order);
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
    return results as TicketWithDetails[];
  }

  /**
   * Find all resolved, non-deleted tickets in the given (type, severity, impact)
   * bucket, excluding the query ticket itself.
   * Used by TicketSimilarityService as the candidate pool for embedding comparison.
   *
   * Only tickets with a stored resolved_at are returned -- these are the ones
   * with a meaningful outcome to compare against.
   *
   * @param ticketTypeId Ticket type to match
   * @param ticketSeverityId Severity to match
   * @param businessImpactId Business impact to match
   * @param excludeTicketId The query ticket -- must be excluded from its own results
   * @returns Array of matching TicketWithDetails
   */
  async findResolvedByBucket(
    ticketTypeId: TicketTypeId,
    ticketSeverityId: TicketSeverityId,
    businessImpactId: BusinessImpactId,
    excludeTicketId: TicketId
  ): Promise<TicketWithDetails[]> {
    const t = MAIN_TABLES.TICKETS;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await this.buildDetailsQuery()
      .where(`${t}.ticket_type_id`, ticketTypeId)
      .where(`${t}.ticket_severity_id`, ticketSeverityId)
      .where(`${t}.business_impact_id`, businessImpactId)
      .whereNotNull(`${t}.resolved_at`)
      .whereNot(`${t}.id`, excludeTicketId);

    return results as TicketWithDetails[];
  }

  /**
   * Return all resolved tickets in the given date range with their resolution
   * time in hours computed by the database.
   *
   * @param from Range start (inclusive)
   * @param to Range end (inclusive)
   * @returns Array of resolution time rows
   */
  async findAnalyticsResolutionTime(from: Date, to: Date): Promise<AnalyticsResolutionTimeRow[]> {
    const t = MAIN_TABLES.TICKETS;
    const severities = LOOKUP_TABLES.TICKET_SEVERITIES;
    const impacts = LOOKUP_TABLES.BUSINESS_IMPACTS;

    const results = await this.db(t)
      .select(
        `${t}.id as ticketId`,
        `${t}.created_at as createdAt`,
        `${t}.resolved_at as resolvedAt`,
        this.db.raw(
          `EXTRACT(EPOCH FROM (${t}.resolved_at - ${t}.created_at)) / 3600 AS "resolutionTimeHours"`
        ),
        `${severities}.name as ticketSeverity`,
        `${impacts}.name as businessImpact`
      )
      .leftJoin(severities, `${t}.ticket_severity_id`, `${severities}.id`)
      .leftJoin(impacts, `${t}.business_impact_id`, `${impacts}.id`)
      .whereNotNull(`${t}.resolved_at`)
      .whereNull(`${t}.deleted_at`)
      .whereBetween(`${t}.resolved_at`, [from, to])
      .orderBy(`${t}.resolved_at`, 'asc');

    return results as AnalyticsResolutionTimeRow[];
  }

  /**
   * Return ticket counts grouped by calendar day for the given date range.
   * Day is returned as a YYYY-MM-DD string.
   *
   * @param from Range start (inclusive)
   * @param to Range end (inclusive)
   * @returns Array of { day, count } rows
   */
  async findAnalyticsVolumeOverTime(from: Date, to: Date): Promise<AnalyticsVolumeRow[]> {
    const t = MAIN_TABLES.TICKETS;

    const results = await this.db(t)
      .select(
        this.db.raw(`DATE(${t}.created_at) AS day`),
        this.db.raw(`COUNT(*)::integer AS count`)
      )
      .whereNull(`${t}.deleted_at`)
      .whereBetween(`${t}.created_at`, [from, to])
      .groupByRaw(`DATE(${t}.created_at)`)
      .orderByRaw(`DATE(${t}.created_at) ASC`);

    return results as AnalyticsVolumeRow[];
  }

  /**
   * Shared query builder for detail joins.
   * Single source of the join logic -- both findWithDetails and
   * findManyWithDetails build on this so they can never drift apart.
   */
  private buildDetailsQuery(options?: QueryOptions): Knex.QueryBuilder {
    const t = MAIN_TABLES.TICKETS;
    const org = LOOKUP_TABLES.ORGANIZATIONS;
    const types = LOOKUP_TABLES.TICKET_TYPES;
    const severities = LOOKUP_TABLES.TICKET_SEVERITIES;
    const impacts = LOOKUP_TABLES.BUSINESS_IMPACTS;
    const statuses = LOOKUP_TABLES.TICKET_STATUSES;
    const priorities = LOOKUP_TABLES.TICKET_PRIORITIES;

    let query = this.getQuery(options)
      .select(
        `${t}.*`,
        `${types}.name as ticket_type_name`,
        `${severities}.name as ticket_severity_name`,
        `${impacts}.name as business_impact_name`,
        `${statuses}.name as ticket_status_name`,
        `${priorities}.name as ticket_priority_name`,
        `${org}.name as organization_name`
      )
      .leftJoin(types, `${t}.ticket_type_id`, `${types}.id`)
      .leftJoin(severities, `${t}.ticket_severity_id`, `${severities}.id`)
      .leftJoin(impacts, `${t}.business_impact_id`, `${impacts}.id`)
      .leftJoin(statuses, `${t}.ticket_status_id`, `${statuses}.id`)
      .leftJoin(priorities, `${t}.ticket_priority_id`, `${priorities}.id`)
      .leftJoin(org, `${t}.organization_id`, `${org}.id`);

    query = this.applyFilters(query, options);

    return query;
  }
}
