/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
import type { Knex } from 'knex';
import {
  AUTH_ROLES,
  TICKET_TYPES,
  TICKET_SEVERITIES,
  BUSINESS_IMPACTS,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  QUOTE_CREATORS,
  QUOTE_APPROVAL_STATUSES,
  QUOTE_CONFIDENCE_LEVELS,
  QUOTE_EFFORT_LEVELS,
} from '../../../../shared/constants';

interface LookupIdMap {
  [key: string]: number;
}

interface UuidMap {
  [key: string]: string;
}

export async function generateOrganizations(
  knex: Knex
): Promise<{ org1Id: string; org2Id: string }> {
  const [org1, org2] = await knex('organizations')
    .insert([{ name: 'Demo Corporation' }, { name: 'Test Industries Ltd' }])
    .returning('id');

  return {
    org1Id: org1.id,
    org2Id: org2.id,
  };
}

interface GenerateUsersParams {
  passwordHash: string;
  org1Id: string;
  org2Id: string;
  roleIdMap: LookupIdMap;
}

export async function generateUsers(
  knex: Knex,
  { passwordHash, org1Id, org2Id, roleIdMap }: GenerateUsersParams
): Promise<{
  customer1Id: string;
  customer2Id: string;
  supportAgentId: string;
  managerId: string;
  adminId: string;
}> {
  const users = await knex('users')
    .insert([
      // Customer 1 - belongs to org1
      {
        first_name: 'Joe',
        last_name: 'Bloggs',
        email: 'customer1@demo.com',
        password: passwordHash,
        phone_number: '+44 11 1111 0001',
        role_id: roleIdMap[AUTH_ROLES.CUSTOMER],
        organization_id: org1Id,
        email_verified: true,
      },
      // Customer 2 - belongs to org2
      {
        first_name: 'John',
        last_name: 'Smith',
        email: 'customer2@demo.com',
        password: passwordHash,
        phone_number: '+44 11 1111 0002',
        role_id: roleIdMap[AUTH_ROLES.CUSTOMER],
        organization_id: org2Id,
        email_verified: true,
      },
      // Support Agent - no organization
      {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'agent@giacom.com',
        password: passwordHash,
        phone_number: '+44 11 1111 0003',
        role_id: roleIdMap[AUTH_ROLES.SUPPORT_AGENT],
        organization_id: null,
        email_verified: true,
      },
      // Manager - no organization
      {
        first_name: 'James',
        last_name: 'Jameson',
        email: 'manager@giacom.com',
        password: passwordHash,
        phone_number: '+44 11 1111 0004',
        role_id: roleIdMap[AUTH_ROLES.MANAGER],
        organization_id: null,
        email_verified: true,
      },
      // Admin - no organization
      {
        first_name: 'Robert',
        last_name: 'Robertson',
        email: 'admin@giacom.com',
        password: passwordHash,
        phone_number: '+44 11 1111 0005',
        role_id: roleIdMap[AUTH_ROLES.ADMIN],
        organization_id: null,
        email_verified: true,
      },
    ])
    .returning('*');

  return {
    customer1Id: users[0].id,
    customer2Id: users[1].id,
    supportAgentId: users[2].id,
    managerId: users[3].id,
    adminId: users[4].id,
  };
}

interface GenerateTicketsParams {
  customer1Id: string;
  customer2Id: string;
  supportAgentId: string;
  org1Id: string;
  org2Id: string;
  lookupIds: {
    ticketTypes: LookupIdMap;
    severities: LookupIdMap;
    businessImpacts: LookupIdMap;
    statuses: LookupIdMap;
    priorities: LookupIdMap;
  };
}

export async function generateTickets(
  knex: Knex,
  params: GenerateTicketsParams
): Promise<{
  ticket1Id: string;
  ticket2Id: string;
  ticket3Id: string;
  ticket4Id: string;
}> {
  const { customer1Id, customer2Id, supportAgentId, org1Id, org2Id, lookupIds } = params;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const tickets = await knex('tickets')
    .insert([
      // Ticket 1: Customer 1, In Progress, Assigned to Support Agent
      {
        creator_user_id: customer1Id,
        assigned_to_user_id: supportAgentId,
        organization_id: org1Id,
        title: 'Email notifications not working',
        description:
          'Users are not receiving email notifications for ticket updates. This started happening after the last system update.',
        ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.INCIDENT],
        ticket_severity_id: lookupIds.severities[TICKET_SEVERITIES.HIGH],
        business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MAJOR],
        ticket_status_id: lookupIds.statuses[TICKET_STATUSES.IN_PROGRESS],
        ticket_priority_id: lookupIds.priorities[TICKET_PRIORITIES.P1],
        deadline: tomorrow,
        users_impacted: 45,
      },
      // Ticket 2: Customer 1, Open, Unassigned
      {
        creator_user_id: customer1Id,
        assigned_to_user_id: null,
        organization_id: org1Id,
        title: 'Request for bulk export feature',
        description:
          'We need the ability to export multiple tickets to CSV format for reporting purposes.',
        ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.ENHANCEMENT],
        ticket_severity_id: lookupIds.severities[TICKET_SEVERITIES.LOW],
        business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MINOR],
        ticket_status_id: lookupIds.statuses[TICKET_STATUSES.OPEN],
        ticket_priority_id: lookupIds.priorities[TICKET_PRIORITIES.P3],
        deadline: nextMonth,
        users_impacted: 5,
      },
      // Ticket 3: Customer 2, Resolved, Assigned to Support Agent
      {
        creator_user_id: customer2Id,
        assigned_to_user_id: supportAgentId,
        resolved_by_user_id: supportAgentId,
        organization_id: org2Id,
        title: 'Unable to login to dashboard',
        description:
          'Getting "Invalid credentials" error even with correct password. Need urgent help.',
        ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.SUPPORT],
        ticket_severity_id: lookupIds.severities[TICKET_SEVERITIES.CRITICAL],
        business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.CRITICAL],
        ticket_status_id: lookupIds.statuses[TICKET_STATUSES.RESOLVED],
        ticket_priority_id: lookupIds.priorities[TICKET_PRIORITIES.P1],
        deadline: now, // Past deadline (resolved on time)
        users_impacted: 1,
      },
      // Ticket 4: Customer 2, Open, Unassigned (awaiting quote approval)
      {
        creator_user_id: customer2Id,
        assigned_to_user_id: null,
        organization_id: org2Id,
        title: 'Custom reporting dashboard integration',
        description:
          'Need to integrate our internal BI tools with the ticketing system API. Requires custom API endpoints and authentication setup.',
        ticket_type_id: lookupIds.ticketTypes[TICKET_TYPES.ENHANCEMENT],
        ticket_severity_id: lookupIds.severities[TICKET_SEVERITIES.MEDIUM],
        business_impact_id: lookupIds.businessImpacts[BUSINESS_IMPACTS.MODERATE],
        ticket_status_id: lookupIds.statuses[TICKET_STATUSES.OPEN],
        ticket_priority_id: lookupIds.priorities[TICKET_PRIORITIES.P2],
        deadline: nextWeek,
        users_impacted: 12,
      },
    ])
    .returning('id');

  return {
    ticket1Id: tickets[0].id,
    ticket2Id: tickets[1].id,
    ticket3Id: tickets[2].id,
    ticket4Id: tickets[3].id,
  };
}

interface GenerateQuoteApprovalsParams {
  managerId: string;
  lookupIds: {
    approvalStatuses: LookupIdMap;
  };
}

export async function generateQuoteApprovals(
  knex: Knex,
  params: GenerateQuoteApprovalsParams
): Promise<{
  approval1Id: number;
  approval2Id: number;
  approval3Id: number;
  approval4Id: number;
}> {
  const { managerId, lookupIds } = params;

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const approvals = await knex('quote_approvals')
    .insert([
      // Approval 1: Approved
      {
        approved_by_user_id: managerId,
        user_role: AUTH_ROLES.MANAGER,
        approval_status_id: lookupIds.approvalStatuses[QUOTE_APPROVAL_STATUSES.APPROVED],
        comment: 'Approved - reasonable estimate for this incident.',
        approved_at: yesterday,
      },
      // Approval 2: Pending
      {
        approved_by_user_id: managerId,
        user_role: AUTH_ROLES.MANAGER,
        approval_status_id: lookupIds.approvalStatuses[QUOTE_APPROVAL_STATUSES.PENDING],
        comment: null,
        approved_at: null,
      },
      // Approval 3: Approved (for resolved ticket)
      {
        approved_by_user_id: managerId,
        user_role: AUTH_ROLES.MANAGER,
        approval_status_id: lookupIds.approvalStatuses[QUOTE_APPROVAL_STATUSES.APPROVED],
        comment: 'Approved - critical issue, justified cost.',
        approved_at: yesterday,
      },
      // Approval 4: Rejected (first version of ticket 4)
      {
        approved_by_user_id: managerId,
        user_role: AUTH_ROLES.MANAGER,
        approval_status_id: lookupIds.approvalStatuses[QUOTE_APPROVAL_STATUSES.REJECTED],
        comment: 'Too high - please revise with more detailed breakdown.',
        approved_at: yesterday,
      },
    ])
    .returning('id');

  return {
    approval1Id: approvals[0].id,
    approval2Id: approvals[1].id,
    approval3Id: approvals[2].id,
    approval4Id: approvals[3].id,
  };
}

interface GenerateQuotesParams {
  ticketIds: UuidMap;
  approvalIds: {
    approval1Id: number;
    approval2Id: number;
    approval3Id: number;
    approval4Id: number;
  };
  lookupIds: {
    priorities: LookupIdMap;
    effortLevels: LookupIdMap;
    creators: LookupIdMap;
    confidenceLevels: LookupIdMap;
    approvalStatuses: LookupIdMap;
  };
}

export async function generateQuotes(knex: Knex, params: GenerateQuotesParams): Promise<void> {
  const { ticketIds, approvalIds, lookupIds } = params;

  await knex('quotes').insert([
    // Quote for Ticket 1 (In Progress) - Approved, Automated
    {
      ticket_id: ticketIds.ticket1Id,
      version: 1,
      estimated_hours_minimum: 4,
      estimated_hours_maximum: 8,
      estimated_resolution_time: 6,
      hourly_rate: 120,
      estimated_cost: 720, // 6 hours * £120
      fixed_cost: 0,
      final_cost: null, // Not completed yet
      quote_confidence_level_id: lookupIds.confidenceLevels[QUOTE_CONFIDENCE_LEVELS.MEDIUM],
      quote_approval_id: approvalIds.approval1Id,
      suggested_ticket_priority_id: lookupIds.priorities[TICKET_PRIORITIES.P1],
      quote_effort_level_id: lookupIds.effortLevels[QUOTE_EFFORT_LEVELS.LOW],
      quote_creator_id: lookupIds.creators[QUOTE_CREATORS.AUTOMATED],
    },

    // Quote for Ticket 2 (Enhancement) - Pending, Automated
    {
      ticket_id: ticketIds.ticket2Id,
      version: 1,
      estimated_hours_minimum: 12,
      estimated_hours_maximum: 20,
      estimated_resolution_time: 16,
      hourly_rate: 90,
      estimated_cost: 1440, // 16 hours * £90
      fixed_cost: 0,
      final_cost: null,
      quote_confidence_level_id: lookupIds.confidenceLevels[QUOTE_CONFIDENCE_LEVELS.LOW],
      quote_approval_id: approvalIds.approval2Id,
      suggested_ticket_priority_id: lookupIds.priorities[TICKET_PRIORITIES.P3],
      quote_effort_level_id: lookupIds.effortLevels[QUOTE_EFFORT_LEVELS.MEDIUM],
      quote_creator_id: lookupIds.creators[QUOTE_CREATORS.AUTOMATED],
    },

    // Quote for Ticket 3 (Resolved) - Approved, with final cost
    {
      ticket_id: ticketIds.ticket3Id,
      version: 1,
      estimated_hours_minimum: 1,
      estimated_hours_maximum: 3,
      estimated_resolution_time: 2,
      hourly_rate: 150,
      estimated_cost: 300, // 2 hours * £150
      fixed_cost: 0,
      final_cost: 225, // Actual: 1.5 hours * £150 (beat estimate)
      quote_confidence_level_id: lookupIds.confidenceLevels[QUOTE_CONFIDENCE_LEVELS.HIGH],
      quote_approval_id: approvalIds.approval3Id,
      suggested_ticket_priority_id: lookupIds.priorities[TICKET_PRIORITIES.P1],
      quote_effort_level_id: lookupIds.effortLevels[QUOTE_EFFORT_LEVELS.LOW],
      quote_creator_id: lookupIds.creators[QUOTE_CREATORS.AUTOMATED],
    },

    // Version 1: Rejected
    {
      ticket_id: ticketIds.ticket4Id,
      version: 1,
      estimated_hours_minimum: 60,
      estimated_hours_maximum: 100,
      estimated_resolution_time: 80,
      hourly_rate: 110,
      estimated_cost: 8800, // 80 hours * £110
      fixed_cost: 0,
      final_cost: null,
      quote_confidence_level_id: lookupIds.confidenceLevels[QUOTE_CONFIDENCE_LEVELS.LOW],
      quote_approval_id: approvalIds.approval4Id,
      suggested_ticket_priority_id: lookupIds.priorities[TICKET_PRIORITIES.P2],
      quote_effort_level_id: lookupIds.effortLevels[QUOTE_EFFORT_LEVELS.HIGH],
      quote_creator_id: lookupIds.creators[QUOTE_CREATORS.AUTOMATED],
    },
    // Version 2: Revised (manual adjustment)
    {
      ticket_id: ticketIds.ticket4Id,
      version: 2,
      estimated_hours_minimum: 40,
      estimated_hours_maximum: 60,
      estimated_resolution_time: 50,
      hourly_rate: 110,
      estimated_cost: 5500, // 50 hours * £110
      fixed_cost: 0,
      final_cost: null,
      quote_confidence_level_id: lookupIds.confidenceLevels[QUOTE_CONFIDENCE_LEVELS.MEDIUM],
      quote_approval_id: null, // Revised, awaiting new approval
      suggested_ticket_priority_id: lookupIds.priorities[TICKET_PRIORITIES.P2],
      quote_effort_level_id: lookupIds.effortLevels[QUOTE_EFFORT_LEVELS.HIGH],
      quote_creator_id: lookupIds.creators[QUOTE_CREATORS.MANUAL],
    },
  ]);
}
