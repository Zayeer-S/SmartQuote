import { vi } from 'vitest';
import {
  UserNotificationPreferencesDAO,
  UsersDAO,
} from '../../../../src/server/daos/children/users-domain.dao';
import { SessionsDAO } from '../../../../src/server/daos/children/sessions.dao';
import { OrganizationMembersDAO } from '../../../../src/server/daos/children/organizations-domain.dao';
import { RateProfilesDAO } from '../../../../src/server/daos/children/rate-profiles.dao';
import { TicketsDAO } from '../../../../src/server/daos/children/tickets-domain.dao';
import {
  QuoteCalculationRulesDAO,
  QuotesDAO,
} from '../../../../src/server/daos/children/quotes-domain.dao';
import { NotificationTypesDAO } from '../../../../src/server/daos/children/notification-types.dao';

export function makeMockUsersDAO(): UsersDAO {
  return {
    findByEmail: vi.fn(),
    findWithRole: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as UsersDAO;
}

export function makeMockSessionsDAO(): SessionsDAO {
  return {
    create: vi.fn(),
    findByToken: vi.fn(),
    update: vi.fn(),
    deleteToken: vi.fn(),
    deleteAllForUser: vi.fn(),
    deleteExpired: vi.fn(),
  } as unknown as SessionsDAO;
}

export function makeMockOrganizationMembersDAO(): OrganizationMembersDAO {
  return {
    findByUser: vi.fn(),
    findByOrganization: vi.fn(),
    findMembership: vi.fn(),
    isMember: vi.fn(),
  } as unknown as OrganizationMembersDAO;
}

export function makeMockRateProfilesDAO(): RateProfilesDAO {
  return {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findActive: vi.fn(),
  } as unknown as RateProfilesDAO;
}

export function makeMockQuotesDAO(): QuotesDAO {
  return {
    create: vi.fn(),
    findLatestForTicket: vi.fn().mockResolvedValue(null),
  } as unknown as QuotesDAO;
}

export function makeMockTicketsDAO(): TicketsDAO {
  return {
    getById: vi.fn(),
    update: vi.fn(),
  } as unknown as TicketsDAO;
}

export function makeMockRulesDAO(): QuoteCalculationRulesDAO {
  return {
    getAll: vi.fn(),
  } as unknown as QuoteCalculationRulesDAO;
}

export function makeMockUserNotificationPreferencesDAO(): UserNotificationPreferencesDAO {
  return {
    findByUserId: vi.fn(),
    hasPreference: vi.fn(),
    setPreference: vi.fn(),
    removePreference: vi.fn(),
    setPreferences: vi.fn(),
    getEnabledNotificationTypes: vi.fn(),
  } as unknown as UserNotificationPreferencesDAO;
}

export function makeMockNotificationTypesDAO(): NotificationTypesDAO {
  return {
    getOne: vi.fn(),
    findByName: vi.fn(),
    getAll: vi.fn(),
  } as unknown as NotificationTypesDAO;
}
