import type { Knex } from 'knex';
import { buildLookupIdMap } from '../database/seeds/helpers/lookup-id-maps.js';

export interface LookupMaps {
  ticketStatuses: Record<string, number>;
  ticketTypes: Record<string, number>;
  ticketSeverities: Record<string, number>;
  businessImpacts: Record<string, number>;
  ticketPriorities: Record<string, number>;
  commentTypes: Record<string, number>;
  quoteEffortLevels: Record<string, number>;
  quoteConfidenceLevels: Record<string, number>;
  quoteCreators: Record<string, number>;
  quoteApprovalStatuses: Record<string, number>;
}

export async function loadLookupMaps(knex: Knex): Promise<LookupMaps> {
  const [
    ticketStatuses,
    ticketTypes,
    ticketSeverities,
    businessImpacts,
    ticketPriorities,
    commentTypes,
    quoteEffortLevels,
    quoteConfidenceLevels,
    quoteCreators,
    quoteApprovalStatuses,
  ] = await Promise.all([
    buildLookupIdMap(knex, 'ticket_statuses'),
    buildLookupIdMap(knex, 'ticket_types'),
    buildLookupIdMap(knex, 'ticket_severities'),
    buildLookupIdMap(knex, 'business_impacts'),
    buildLookupIdMap(knex, 'ticket_priorities'),
    buildLookupIdMap(knex, 'comment_types'),
    buildLookupIdMap(knex, 'quote_effort_levels'),
    buildLookupIdMap(knex, 'quote_confidence_levels'),
    buildLookupIdMap(knex, 'quote_creators'),
    buildLookupIdMap(knex, 'quote_approval_statuses'),
  ]);

  return {
    ticketStatuses,
    ticketTypes,
    ticketSeverities,
    businessImpacts,
    ticketPriorities,
    commentTypes,
    quoteEffortLevels,
    quoteConfidenceLevels,
    quoteCreators,
    quoteApprovalStatuses,
  };
}
