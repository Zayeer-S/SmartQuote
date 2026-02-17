import type { Knex } from 'knex';
import {
  AUTH_ROLES,
  PERMISSIONS,
  TICKET_TYPES,
  TICKET_SEVERITIES,
  BUSINESS_IMPACTS,
  TICKET_PRIORITIES,
  QUOTE_EFFORT_LEVELS,
} from '../../../shared/constants';
import {
  getDevPasswordHash,
  buildAllLookupIdMaps,
  generateOrganizations,
  generateUsers,
  generateTickets,
  generateQuoteApprovals,
  generateQuotes,
  ROLES_SEED_DATA,
  PERMISSIONS_SEED_DATA,
  NOTIFICATION_TYPES_SEED_DATA,
  NOTIFICATION_TOKEN_TYPES_SEED_DATA,
  FILE_STORAGE_TYPES_SEED_DATA,
  TICKET_TYPES_SEED_DATA,
  TICKET_SEVERITIES_SEED_DATA,
  BUSINESS_IMPACTS_SEED_DATA,
  TICKET_STATUSES_SEED_DATA,
  TICKET_PRIORITIES_SEED_DATA,
  COMMENT_TYPES_SEED_DATA,
  QUOTE_EFFORT_LEVELS_SEED_DATA,
  QUOTE_CREATORS_SEED_DATA,
  QUOTE_APPROVAL_STATUSES_SEED_DATA,
  QUOTE_CONFIDENCE_LEVELS_SEED_DATA,
  ANALYTICS_SCHEMAS_SEED_DATA,
  SMARTQUOTE_CONFIGS_SEED_DATA,
} from './helpers';

export async function seed(knex: Knex): Promise<void> {
  console.log('Truncating existing tables');

  const truncateTables = [
    // Link
    'notification_tokens',
    'quote_effort_level_ranges',
    'resource_utilizations',
    'sessions',
    'sla_policies',
    'organization_members',
    'ticket_attachments',
    'ticket_comments',
    'quote_detail_revisions',
    'user_notification_preferences',
    'role_permissions',
    // Main
    'analytics',
    'quote_calculation_rules',
    'rate_profiles',
    'quotes',
    'quote_approvals',
    'tickets',
    'users',
    // Config
    'smartquote_configs',
    // Lookup
    'analytics_schemas',
    'notification_token_types',
    'quote_confidence_levels',
    'quote_approval_statuses',
    'quote_creators',
    'quote_effort_levels',
    'comment_types',
    'ticket_priorities',
    'ticket_statuses',
    'business_impacts',
    'ticket_severities',
    'ticket_types',
    'file_storage_types',
    'organizations',
    'permissions',
    'notification_types',
    'roles',
  ];

  for (const table of truncateTables) {
    await knex(table).del();
  }

  console.log('Starting seeding');

  await knex('roles').insert(ROLES_SEED_DATA);

  await knex('permissions').insert(PERMISSIONS_SEED_DATA);

  const { org1Id, org2Id } = await generateOrganizations(knex);

  await knex('notification_types').insert(NOTIFICATION_TYPES_SEED_DATA);

  await knex('file_storage_types').insert(FILE_STORAGE_TYPES_SEED_DATA);

  await knex('ticket_types').insert(TICKET_TYPES_SEED_DATA);

  await knex('ticket_severities').insert(TICKET_SEVERITIES_SEED_DATA);

  await knex('business_impacts').insert(BUSINESS_IMPACTS_SEED_DATA);

  await knex('ticket_statuses').insert(TICKET_STATUSES_SEED_DATA);

  await knex('ticket_priorities').insert(TICKET_PRIORITIES_SEED_DATA);

  await knex('comment_types').insert(COMMENT_TYPES_SEED_DATA);

  await knex('quote_effort_levels').insert(QUOTE_EFFORT_LEVELS_SEED_DATA);

  await knex('quote_creators').insert(QUOTE_CREATORS_SEED_DATA);

  await knex('quote_approval_statuses').insert(QUOTE_APPROVAL_STATUSES_SEED_DATA);

  await knex('quote_confidence_levels').insert(QUOTE_CONFIDENCE_LEVELS_SEED_DATA);

  await knex('notification_token_types').insert(NOTIFICATION_TOKEN_TYPES_SEED_DATA);

  await knex('analytics_schemas').insert(ANALYTICS_SCHEMAS_SEED_DATA);

  const lookupIds = await buildAllLookupIdMaps(knex);

  const passwordHash = await getDevPasswordHash();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { customer1Id, customer2Id, supportAgentId, managerId, adminId } = await generateUsers(
    knex,
    {
      passwordHash,
      org1Id,
      org2Id,
      roleIdMap: lookupIds.roles,
    }
  );

  const ticketIds = await generateTickets(knex, {
    customer1Id,
    customer2Id,
    supportAgentId,
    org1Id,
    org2Id,
    lookupIds: {
      ticketTypes: lookupIds.ticketTypes,
      severities: lookupIds.ticketSeverities,
      businessImpacts: lookupIds.businessImpacts,
      statuses: lookupIds.ticketStatuses,
      priorities: lookupIds.ticketPriorities,
    },
  });

  // Generate quote approvals
  const approvalIds = await generateQuoteApprovals(knex, {
    managerId,
    lookupIds: {
      approvalStatuses: lookupIds.quoteApprovalStatuses,
    },
  });

  // Generate quotes
  await generateQuotes(knex, {
    ticketIds,
    approvalIds,
    lookupIds: {
      priorities: lookupIds.ticketPriorities,
      effortLevels: lookupIds.quoteEffortLevels,
      creators: lookupIds.quoteCreators,
      confidenceLevels: lookupIds.quoteConfidenceLevels,
      approvalStatuses: lookupIds.quoteApprovalStatuses,
    },
  });

  // Generate rate profiles (representative combinations)
  await knex('rate_profiles').insert([
    // Critical Business Impact across all severities
    {
      name: 'Critical Impact - Low Severity',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.SUPPORT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.LOW],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.CRITICAL],
      base_hourly_rate: 100,
      multiplier: 1.5,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 year
    },
    {
      name: 'Critical Impact - Medium Severity',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.SUPPORT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.MEDIUM],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.CRITICAL],
      base_hourly_rate: 110,
      multiplier: 1.75,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Critical Impact - High Severity',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.INCIDENT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.HIGH],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.CRITICAL],
      base_hourly_rate: 120,
      multiplier: 2.0,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Critical Impact - Critical Severity',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.INCIDENT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.CRITICAL],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.CRITICAL],
      base_hourly_rate: 150,
      multiplier: 2.5,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },

    // Critical Severity across all business impacts
    {
      name: 'Critical Severity - Minor Impact',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.SUPPORT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.CRITICAL],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MINOR],
      base_hourly_rate: 120,
      multiplier: 1.8,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Critical Severity - Moderate Impact',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.INCIDENT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.CRITICAL],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MODERATE],
      base_hourly_rate: 130,
      multiplier: 2.0,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Critical Severity - Major Impact',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.INCIDENT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.CRITICAL],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MAJOR],
      base_hourly_rate: 140,
      multiplier: 2.25,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },

    // Common medium scenarios
    {
      name: 'Medium Severity - Moderate Impact',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.SUPPORT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.MEDIUM],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MODERATE],
      base_hourly_rate: 90,
      multiplier: 1.25,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Medium Severity - Major Impact',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.INCIDENT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.MEDIUM],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MAJOR],
      base_hourly_rate: 100,
      multiplier: 1.5,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },

    // Enhancement-specific rates
    {
      name: 'Enhancement - Low Priority',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.ENHANCEMENT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.LOW],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MINOR],
      base_hourly_rate: 75,
      multiplier: 1.0,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Enhancement - Medium Priority',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.ENHANCEMENT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.MEDIUM],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MODERATE],
      base_hourly_rate: 85,
      multiplier: 1.1,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Enhancement - High Priority',
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.ENHANCEMENT],
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.HIGH],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MAJOR],
      base_hourly_rate: 95,
      multiplier: 1.3,
      is_active: true,
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  ]);

  // Generate quote calculation rules
  await knex('quote_calculation_rules').insert([
    // Critical severity + Critical impact = P1
    {
      name: 'P1 - Critical/Critical',
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.CRITICAL],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.CRITICAL],
      suggested_ticket_priority_id: lookupIds.ticketPriorities[TICKET_PRIORITIES.P1],
      users_impacted_min: 1,
      users_impacted_max: 999999,
      urgency_multiplier: 2.5,
      priority_order: 1,
      is_active: true,
    },
    // High severity + Critical impact = P1
    {
      name: 'P1 - High/Critical',
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.HIGH],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.CRITICAL],
      suggested_ticket_priority_id: lookupIds.ticketPriorities[TICKET_PRIORITIES.P1],
      users_impacted_min: 10,
      users_impacted_max: 999999,
      urgency_multiplier: 2.0,
      priority_order: 2,
      is_active: true,
    },
    // Critical severity + Major impact = P1
    {
      name: 'P1 - Critical/Major',
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.CRITICAL],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MAJOR],
      suggested_ticket_priority_id: lookupIds.ticketPriorities[TICKET_PRIORITIES.P1],
      users_impacted_min: 5,
      users_impacted_max: 999999,
      urgency_multiplier: 2.0,
      priority_order: 3,
      is_active: true,
    },

    // High severity + Major impact = P2
    {
      name: 'P2 - High/Major',
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.HIGH],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MAJOR],
      suggested_ticket_priority_id: lookupIds.ticketPriorities[TICKET_PRIORITIES.P2],
      users_impacted_min: 5,
      users_impacted_max: 999999,
      urgency_multiplier: 1.75,
      priority_order: 4,
      is_active: true,
    },
    // Medium severity + Critical impact = P2
    {
      name: 'P2 - Medium/Critical',
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.MEDIUM],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.CRITICAL],
      suggested_ticket_priority_id: lookupIds.ticketPriorities[TICKET_PRIORITIES.P2],
      users_impacted_min: 10,
      users_impacted_max: 999999,
      urgency_multiplier: 1.75,
      priority_order: 5,
      is_active: true,
    },
    // Medium severity + Major impact = P2
    {
      name: 'P2 - Medium/Major',
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.MEDIUM],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MAJOR],
      suggested_ticket_priority_id: lookupIds.ticketPriorities[TICKET_PRIORITIES.P2],
      users_impacted_min: 10,
      users_impacted_max: 999999,
      urgency_multiplier: 1.5,
      priority_order: 6,
      is_active: true,
    },

    // Medium severity + Moderate impact = P3
    {
      name: 'P3 - Medium/Moderate',
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.MEDIUM],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MODERATE],
      suggested_ticket_priority_id: lookupIds.ticketPriorities[TICKET_PRIORITIES.P3],
      users_impacted_min: 1,
      users_impacted_max: 999999,
      urgency_multiplier: 1.25,
      priority_order: 7,
      is_active: true,
    },
    // High severity + Moderate impact = P3
    {
      name: 'P3 - High/Moderate',
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.HIGH],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MODERATE],
      suggested_ticket_priority_id: lookupIds.ticketPriorities[TICKET_PRIORITIES.P3],
      users_impacted_min: 1,
      users_impacted_max: 10,
      urgency_multiplier: 1.25,
      priority_order: 8,
      is_active: true,
    },

    // Low severity scenarios = P4
    {
      name: 'P4 - Low/Minor',
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.LOW],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MINOR],
      suggested_ticket_priority_id: lookupIds.ticketPriorities[TICKET_PRIORITIES.P4],
      users_impacted_min: 1,
      users_impacted_max: 999999,
      urgency_multiplier: 1.0,
      priority_order: 9,
      is_active: true,
    },
    {
      name: 'P4 - Low/Moderate',
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.LOW],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MODERATE],
      suggested_ticket_priority_id: lookupIds.ticketPriorities[TICKET_PRIORITIES.P4],
      users_impacted_min: 1,
      users_impacted_max: 5,
      urgency_multiplier: 1.0,
      priority_order: 10,
      is_active: true,
    },
    {
      name: 'P4 - Medium/Minor',
      ticket_severity_id: lookupIds.ticketSeverities[TICKET_SEVERITIES.MEDIUM],
      business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MINOR],
      suggested_ticket_priority_id: lookupIds.ticketPriorities[TICKET_PRIORITIES.P4],
      users_impacted_min: 1,
      users_impacted_max: 5,
      urgency_multiplier: 1.0,
      priority_order: 11,
      is_active: true,
    },
  ]);

  // Role Permissions
  await knex('role_permissions').insert([
    // CUSTOMER permissions
    {
      role_id: lookupIds.roles[AUTH_ROLES.CUSTOMER],
      permission_id: lookupIds.permissions[PERMISSIONS.TICKETS_CREATE],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.CUSTOMER],
      permission_id: lookupIds.permissions[PERMISSIONS.TICKETS_READ_OWN],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.CUSTOMER],
      permission_id: lookupIds.permissions[PERMISSIONS.TICKETS_UPDATE_OWN],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.CUSTOMER],
      permission_id: lookupIds.permissions[PERMISSIONS.QUOTES_READ_OWN],
    },

    // SUPPORT AGENT permissions
    {
      role_id: lookupIds.roles[AUTH_ROLES.SUPPORT_AGENT],
      permission_id: lookupIds.permissions[PERMISSIONS.TICKETS_READ_ALL],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.SUPPORT_AGENT],
      permission_id: lookupIds.permissions[PERMISSIONS.TICKETS_UPDATE_ALL],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.SUPPORT_AGENT],
      permission_id: lookupIds.permissions[PERMISSIONS.TICKETS_ASSIGN],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.SUPPORT_AGENT],
      permission_id: lookupIds.permissions[PERMISSIONS.QUOTES_CREATE],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.SUPPORT_AGENT],
      permission_id: lookupIds.permissions[PERMISSIONS.QUOTES_READ_ALL],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.SUPPORT_AGENT],
      permission_id: lookupIds.permissions[PERMISSIONS.QUOTES_UPDATE],
    },

    // MANAGER permissions (all Support Agent perms + approval)
    {
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      permission_id: lookupIds.permissions[PERMISSIONS.TICKETS_READ_ALL],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      permission_id: lookupIds.permissions[PERMISSIONS.TICKETS_UPDATE_ALL],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      permission_id: lookupIds.permissions[PERMISSIONS.TICKETS_ASSIGN],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      permission_id: lookupIds.permissions[PERMISSIONS.QUOTES_CREATE],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      permission_id: lookupIds.permissions[PERMISSIONS.QUOTES_READ_ALL],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      permission_id: lookupIds.permissions[PERMISSIONS.QUOTES_UPDATE],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      permission_id: lookupIds.permissions[PERMISSIONS.QUOTES_APPROVE],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      permission_id: lookupIds.permissions[PERMISSIONS.QUOTES_REJECT],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      permission_id: lookupIds.permissions[PERMISSIONS.USERS_CREATE],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      permission_id: lookupIds.permissions[PERMISSIONS.USERS_READ],
    },
    {
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      permission_id: lookupIds.permissions[PERMISSIONS.ANALYTICS_READ],
    },

    // ADMIN permissions (all permissions)
    ...Object.values(PERMISSIONS).map((permission) => ({
      role_id: lookupIds.roles[AUTH_ROLES.ADMIN],
      permission_id: lookupIds.permissions[permission],
    })),
  ]);

  // Organization Members - map customers to their orgs
  await knex('organization_members').insert([
    {
      organization_id: org1Id,
      user_id: customer1Id,
      role_id: lookupIds.roles[AUTH_ROLES.CUSTOMER],
    },
    {
      organization_id: org2Id,
      user_id: customer2Id,
      role_id: lookupIds.roles[AUTH_ROLES.CUSTOMER],
    },
  ]);

  // Quote Effort Level Ranges
  await knex('quote_effort_level_ranges').insert([
    {
      quote_effort_level_id: lookupIds.quoteEffortLevels[QUOTE_EFFORT_LEVELS.LOW],
      hours_minimum: 1,
      hours_maximum: 8,
      is_active: true,
    },
    {
      quote_effort_level_id: lookupIds.quoteEffortLevels[QUOTE_EFFORT_LEVELS.MEDIUM],
      hours_minimum: 8,
      hours_maximum: 40,
      is_active: true,
    },
    {
      quote_effort_level_id: lookupIds.quoteEffortLevels[QUOTE_EFFORT_LEVELS.HIGH],
      hours_minimum: 40,
      hours_maximum: 160,
      is_active: true,
    },
  ]);

  // Resource Utilizations - map roles to ticket types with % allocation
  await knex('resource_utilizations').insert([
    // Support tickets
    {
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.SUPPORT],
      role_id: lookupIds.roles[AUTH_ROLES.SUPPORT_AGENT],
      percent: 90,
      is_active: true,
    },
    {
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.SUPPORT],
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      percent: 10,
      is_active: true,
    },

    // Incident tickets
    {
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.INCIDENT],
      role_id: lookupIds.roles[AUTH_ROLES.SUPPORT_AGENT],
      percent: 80,
      is_active: true,
    },
    {
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.INCIDENT],
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      percent: 20,
      is_active: true,
    },

    // Enhancement tickets
    {
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.ENHANCEMENT],
      role_id: lookupIds.roles[AUTH_ROLES.SUPPORT_AGENT],
      percent: 70,
      is_active: true,
    },
    {
      ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.ENHANCEMENT],
      role_id: lookupIds.roles[AUTH_ROLES.MANAGER],
      percent: 30,
      is_active: true,
    },
  ]);

  // SLA Policies
  await knex('sla_policies').insert([
    {
      name: 'Demo Corporation - Standard SLA',
      user_id: null,
      organization_id: org1Id,
      contract: {
        hourly_rate: 120,
        response_times: {
          critical: '1 hour',
          high: '4 hours',
          medium: '1 business day',
          low: '3 business days',
        },
        resolution_times: {
          critical: '4 hours',
          high: '1 business day',
          medium: '3 business days',
          low: '5 business days',
        },
      },
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Test Industries Ltd - Premium SLA',
      user_id: null,
      organization_id: org2Id,
      contract: {
        hourly_rate: 150,
        response_times: {
          critical: '30 minutes',
          high: '2 hours',
          medium: '4 hours',
          low: '1 business day',
        },
        resolution_times: {
          critical: '2 hours',
          high: '4 hours',
          medium: '1 business day',
          low: '3 business days',
        },
      },
      effective_from: new Date(),
      effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  ]);

  await knex('smartquote_configs').insert(SMARTQUOTE_CONFIGS_SEED_DATA);

  console.log('\nSeeding complete');
  console.log('Summary:');
  console.log('\t- 2 Organizations');
  console.log('\t- 5 Users (all password: "password")');
  console.log('\t- 4 Tickets');
  console.log('\t- 6 Quotes (including version history)');
  console.log('\t- 12 Rate Profiles');
  console.log('\t- 11 Calculation Rules');
  console.log('\t- 2 SLA Policies');
  console.log('\t- All lookup tables populated\n');
  console.log('Test User Logins:');
  console.log('\t - customer1@demo.com - Customer at Demo Corporation');
  console.log('\t - customer2@demo.com - Customer at Test Industries Ltd');
  console.log('\t - agent@giacom.com - Support Agent');
  console.log('\t - manager@giacom.com - Manager');
  console.log('\t - admin@giacom.com - Admin\n');
}
