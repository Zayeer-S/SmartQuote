/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
import type { Knex } from 'knex';

/**
 * Lookup ID Helpers
 *
 * Utilities for building maps of lookup table names to their IDs.
 * Makes it easy to reference lookup values by their constant names
 * instead of hardcoding IDs.
 */

export interface LookupIdMap {
  [key: string]: number;
}

export interface UuidIdMap {
  [key: string]: string;
}

/**
 * Build a map of lookup table values to their IDs
 *
 * @example
 * const roleMap = await buildLookupIdMap(knex, 'roles');
 * // { 'Customer': 1, 'Support Agent': 2, ... }
 */
export async function buildLookupIdMap(knex: Knex, tableName: string): Promise<LookupIdMap> {
  const rows = await knex(tableName).select('id', 'name');

  return rows.reduce((map, row) => {
    map[row.name] = row.id;
    return map;
  }, {} as LookupIdMap);
}

/**
 * Build a map of UUID-based lookup table values to their IDs
 *
 * @example
 * const orgMap = await buildUuidLookupIdMap(knex, 'organizations');
 * // { 'Demo Corporation': 'uuid-here', ... }
 */
export async function buildUuidLookupIdMap(knex: Knex, tableName: string): Promise<UuidIdMap> {
  const rows = await knex(tableName).select('id', 'name');

  return rows.reduce((map, row) => {
    map[row.name] = row.id;
    return map;
  }, {} as UuidIdMap);
}

/**
 * Build all lookup ID maps at once
 * Returns an object with all maps for easy access
 */
export async function buildAllLookupIdMaps(knex: Knex) {
  const [
    roles,
    permissions,
    notificationTypes,
    notificationTokenTypes,
    fileStorageTypes,
    ticketTypes,
    ticketSeverities,
    businessImpacts,
    ticketStatuses,
    ticketPriorities,
    commentTypes,
    quoteEffortLevels,
    quoteCreators,
    quoteApprovalStatuses,
    quoteConfidenceLevels,
  ] = await Promise.all([
    buildLookupIdMap(knex, 'roles'),
    buildLookupIdMap(knex, 'permissions'),
    buildLookupIdMap(knex, 'notification_types'),
    buildLookupIdMap(knex, 'notification_token_types'),
    buildLookupIdMap(knex, 'file_storage_types'),
    buildLookupIdMap(knex, 'ticket_types'),
    buildLookupIdMap(knex, 'ticket_severities'),
    buildLookupIdMap(knex, 'business_impacts'),
    buildLookupIdMap(knex, 'ticket_statuses'),
    buildLookupIdMap(knex, 'ticket_priorities'),
    buildLookupIdMap(knex, 'comment_types'),
    buildLookupIdMap(knex, 'quote_effort_levels'),
    buildLookupIdMap(knex, 'quote_creators'),
    buildLookupIdMap(knex, 'quote_approval_statuses'),
    buildLookupIdMap(knex, 'quote_confidence_levels'),
  ]);

  return {
    roles,
    permissions,
    notificationTypes,
    notificationTokenTypes,
    fileStorageTypes,
    ticketTypes,
    ticketSeverities,
    businessImpacts,
    ticketStatuses,
    ticketPriorities,
    commentTypes,
    quoteEffortLevels,
    quoteCreators,
    quoteApprovalStatuses,
    quoteConfidenceLevels,
  };
}
