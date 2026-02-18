import type { Knex } from 'knex';
import { getDb } from '../database/connection';
import { LINK_TABLES, LOOKUP_TABLES, MAIN_TABLES } from '../database/config/table-names';
import { RolesDAO } from './children/roles.dao';
import { PermissionsDAO } from './children/permissions.dao';
import { UsersDAO } from './children/users.dao';
import { TicketsDAO } from './children/tickets.dao';
import { SessionsDAO } from './children/sessions.dao';
import { TicketCommentsDAO } from './children/ticket.comments.dao';
import { TicketAttachmentsDAO } from './children/ticket.attachments.dao';

type DaoConstructor<T> = new (db: Knex) => T;

export class DAOFactory {
  private db: Knex;
  private instances = new Map<string, unknown>();

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  private setup<T>(tableName: string, DAO: DaoConstructor<T>): T {
    if (!this.instances.has(tableName)) this.instances.set(tableName, new DAO(this.db));
    return this.instances.get(tableName) as T;
  }

  get roles(): RolesDAO {
    return this.setup(LOOKUP_TABLES.ROLES, RolesDAO);
  }

  get permissions(): PermissionsDAO {
    return this.setup(LOOKUP_TABLES.PERMISSIONS, PermissionsDAO);
  }

  get users(): UsersDAO {
    return this.setup(MAIN_TABLES.USERS, UsersDAO);
  }

  get tickets(): TicketsDAO {
    return this.setup(MAIN_TABLES.TICKETS, TicketsDAO);
  }

  get sessions(): SessionsDAO {
    return this.setup(LINK_TABLES.SESSIONS, SessionsDAO);
  }

  get ticketComments(): TicketCommentsDAO {
    return this.setup(LINK_TABLES.TICKET_COMMENTS, TicketCommentsDAO);
  }

  get ticketAttachments(): TicketAttachmentsDAO {
    return this.setup(LINK_TABLES.TICKET_ATTACHMENTS, TicketAttachmentsDAO);
  }

  /** Clears all cached DAO instances. Returns true if empty, false if failed. */
  clearCache(): boolean {
    this.instances.clear();
    return this.instances.size === 0;
  }

  /** Get count of instantiated DAOs */
  getCacheSize(): number {
    return this.instances.size;
  }

  /** Get list of instantiated DAO names */
  getInstantiatedDAOs(): string[] {
    return Array.from(this.instances.keys());
  }
}

export const dao = new DAOFactory();
