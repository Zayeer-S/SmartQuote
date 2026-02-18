import type { Knex } from 'knex';
import type { OrganizationId, TicketId, TicketStatusId, UserId } from '../../database/types/ids';
import { DeletableDAO } from '../base/deletable.dao';
import { LOOKUP_TABLES, MAIN_TABLES } from '../../database/config/table-names';
import type { GetManyOptions, QueryOptions } from '../base/types';
import type { Ticket, TicketWithDetails } from '../../database/types/tables';

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
    const t = MAIN_TABLES.TICKETS;
    const org = LOOKUP_TABLES.ORGANIZATIONS;
    const types = LOOKUP_TABLES.TICKET_TYPES;
    const severities = LOOKUP_TABLES.TICKET_SEVERITIES;
    const impacts = LOOKUP_TABLES.BUSINESS_IMPACTS;
    const statuses = LOOKUP_TABLES.TICKET_STATUSES;
    const priorities = LOOKUP_TABLES.TICKET_PRIORITIES;

    let query = this.getQuery(options);

    query = query
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
      .leftJoin(org, `${t}.organization_id`, `${org}.id`)
      .where(`${t}.id`, ticketId);

    query = this.applyFilters(query, options);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await query.first();
    return result ? (result as TicketWithDetails) : null;
  }
}
