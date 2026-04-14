/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomResolver } from '../../../src/server/realtime/room-resolver';
import { makeMockRBACService } from './utils/mock.services';
import { makeMockOrganizationMembersDAO, makeMockTicketsDAO } from './utils/mock.daos';
import type { RBACService } from '../../../src/server/services/rbac/rbac.service';
import type { OrganizationMembersDAO } from '../../../src/server/daos/children/organizations-domain.dao';
import type { TicketsDAO } from '../../../src/server/daos/children/tickets-domain.dao';
import type { UserId } from '../../../src/server/database/types/ids';
import type { WsRoomId } from '../../../src/shared/contracts/realtime-contracts';

const USER = 'user-1' as UserId;
const ADMIN = 'admin-1' as UserId;
const ORG_ID = 'org-abc';
const TICKET_ID = 'ticket-xyz';

describe('RoomResolver', () => {
  let rbac: RBACService;
  let orgMembersDAO: OrganizationMembersDAO;
  let ticketsDAO: TicketsDAO;
  let resolver: RoomResolver;

  beforeEach(() => {
    rbac = makeMockRBACService();
    orgMembersDAO = makeMockOrganizationMembersDAO();
    ticketsDAO = makeMockTicketsDAO();
    resolver = new RoomResolver(rbac, orgMembersDAO, ticketsDAO);

    // Default: not an admin
    vi.mocked(rbac.hasPermission).mockResolvedValue(false);
  });

  // ---------------------------------------------------------------------------
  // admin:dashboard
  // ---------------------------------------------------------------------------

  describe('admin:dashboard', () => {
    it('admits a user with QUOTES_CREATE permission', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      expect(await resolver.canJoin(ADMIN, 'admin:dashboard')).toBe(true);
    });

    it('rejects a user without QUOTES_CREATE permission', async () => {
      expect(await resolver.canJoin(USER, 'admin:dashboard')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // sla:monitor
  // ---------------------------------------------------------------------------

  describe('sla:monitor', () => {
    it('admits a user with QUOTES_CREATE permission', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      expect(await resolver.canJoin(ADMIN, 'sla:monitor')).toBe(true);
    });

    it('rejects a user without the permission', async () => {
      expect(await resolver.canJoin(USER, 'sla:monitor')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // user:<id>
  // ---------------------------------------------------------------------------

  describe('user:<id>', () => {
    it('admits a user for their own user room', async () => {
      const room = `user:${String(USER)}` as WsRoomId;
      expect(await resolver.canJoin(USER, room)).toBe(true);
    });

    it('rejects a user trying to join another user room', async () => {
      const room = `user:${String(USER)}` as WsRoomId;
      expect(await resolver.canJoin('other-user' as UserId, room)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // org:<id>
  // ---------------------------------------------------------------------------

  describe('org:<id>', () => {
    const room = `org:${ORG_ID}` as WsRoomId;

    it('admits an admin regardless of membership', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      expect(await resolver.canJoin(ADMIN, room)).toBe(true);
      expect(orgMembersDAO.findByUser).not.toHaveBeenCalled();
    });

    it('admits a member of the org', async () => {
      vi.mocked(orgMembersDAO.findByUser).mockResolvedValue([
        { organization_id: ORG_ID, user_id: USER } as never,
      ]);
      expect(await resolver.canJoin(USER, room)).toBe(true);
    });

    it('rejects a user who is not a member', async () => {
      vi.mocked(orgMembersDAO.findByUser).mockResolvedValue([
        { organization_id: 'other-org', user_id: USER } as never,
      ]);
      expect(await resolver.canJoin(USER, room)).toBe(false);
    });

    it('rejects when findByUser returns null', async () => {
      vi.mocked(orgMembersDAO.findByUser).mockResolvedValue(null);
      expect(await resolver.canJoin(USER, room)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // ticket:<id>
  // ---------------------------------------------------------------------------

  describe('ticket:<id>', () => {
    const room = `ticket:${TICKET_ID}` as WsRoomId;

    it('admits an admin regardless of org membership', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      expect(await resolver.canJoin(ADMIN, room)).toBe(true);
      expect(ticketsDAO.getById).not.toHaveBeenCalled();
    });

    it('admits a user whose org owns the ticket', async () => {
      vi.mocked(ticketsDAO.getById).mockResolvedValue({
        id: TICKET_ID,
        organization_id: ORG_ID,
      } as never);
      vi.mocked(orgMembersDAO.findByUser).mockResolvedValue([
        { organization_id: ORG_ID, user_id: USER } as never,
      ]);
      expect(await resolver.canJoin(USER, room)).toBe(true);
    });

    it('rejects when the ticket does not exist', async () => {
      vi.mocked(ticketsDAO.getById).mockResolvedValue(null);
      expect(await resolver.canJoin(USER, room)).toBe(false);
    });

    it('rejects when user has no memberships', async () => {
      vi.mocked(ticketsDAO.getById).mockResolvedValue({
        id: TICKET_ID,
        organization_id: ORG_ID,
      } as never);
      vi.mocked(orgMembersDAO.findByUser).mockResolvedValue(null);
      expect(await resolver.canJoin(USER, room)).toBe(false);
    });

    it('rejects when user belongs to a different org than the ticket', async () => {
      vi.mocked(ticketsDAO.getById).mockResolvedValue({
        id: TICKET_ID,
        organization_id: ORG_ID,
      } as never);
      vi.mocked(orgMembersDAO.findByUser).mockResolvedValue([
        { organization_id: 'different-org', user_id: USER } as never,
      ]);
      expect(await resolver.canJoin(USER, room)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // unknown room prefix
  // ---------------------------------------------------------------------------

  describe('unknown room', () => {
    it('rejects unrecognized room prefixes', async () => {
      expect(await resolver.canJoin(USER, 'unknown:something' as WsRoomId)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // resolvePermitted
  // ---------------------------------------------------------------------------

  describe('resolvePermitted', () => {
    it('returns only rooms the user is permitted to join', async () => {
      const ownUserRoom = `user:${String(USER)}` as WsRoomId;
      const otherUserRoom = `user:other` as WsRoomId;

      const permitted = await resolver.resolvePermitted(USER, [ownUserRoom, otherUserRoom]);

      expect(permitted).toEqual([ownUserRoom]);
    });

    it('returns an empty array when no rooms are permitted', async () => {
      const permitted = await resolver.resolvePermitted(USER, ['admin:dashboard']);
      expect(permitted).toEqual([]);
    });

    it('returns all rooms when all are permitted', async () => {
      vi.mocked(rbac.hasPermission).mockResolvedValue(true);
      const rooms: WsRoomId[] = ['admin:dashboard', 'sla:monitor'];
      const permitted = await resolver.resolvePermitted(ADMIN, rooms);
      expect(permitted).toEqual(rooms);
    });

    it('handles an empty input array', async () => {
      const permitted = await resolver.resolvePermitted(USER, []);
      expect(permitted).toEqual([]);
    });
  });
});
