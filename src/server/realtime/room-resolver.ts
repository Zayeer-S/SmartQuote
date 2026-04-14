import { PERMISSIONS } from '../../shared/constants';
import { WsRoomId } from '../../shared/contracts/realtime-contracts';
import { OrganizationMembersDAO } from '../daos/children/organizations-domain.dao';
import { TicketsDAO } from '../daos/children/tickets-domain.dao';
import { UserId } from '../database/types/ids';
import { RBACService } from '../services/rbac/rbac.service';

export class RoomResolver {
  private rbacService: RBACService;
  private orgMembersDAO: OrganizationMembersDAO;
  private ticketsDAO: TicketsDAO;

  constructor(
    rbacService: RBACService,
    orgMembersDAO: OrganizationMembersDAO,
    ticketsDAO: TicketsDAO
  ) {
    this.rbacService = rbacService;
    this.orgMembersDAO = orgMembersDAO;
    this.ticketsDAO = ticketsDAO;
  }

  async canJoin(userId: UserId, room: WsRoomId): Promise<boolean> {
    const ticketPfx = 'ticket:';
    if (room.startsWith(ticketPfx))
      return this.canJoinTicketRoom(userId, room.slice(ticketPfx.length));

    const orgPfx = 'org:';
    if (room.startsWith(orgPfx)) return this.canJoinOrgRoom(userId, room.slice(orgPfx.length));

    if (room === 'admin:dashboard')
      return this.rbacService.hasPermission(userId, PERMISSIONS.QUOTES_CREATE);

    const userPfx = 'user:';
    if (room.startsWith(userPfx)) return room === `${userPfx}${String(userId)}`;

    if (room === 'sla:monitor')
      return this.rbacService.hasPermission(userId, PERMISSIONS.QUOTES_CREATE);

    return false;
  }

  /**
   * Filter a list of requested rooms down to only those the user is
   * permitted to join. Logs rejections for visibility.
   */
  async resolvePermitted(userId: UserId, requested: WsRoomId[]): Promise<WsRoomId[]> {
    const results = await Promise.all(
      requested.map(async (room) => {
        const permitted = await this.canJoin(userId, room);
        if (!permitted) console.warn(`[WS] user ${String(userId)} denied access to room ${room}`);
        return permitted ? room : null;
      })
    );

    return results.filter((r): r is WsRoomId => r != null);
  }

  private async canJoinTicketRoom(userId: UserId, ticketId: string): Promise<boolean> {
    const canReadAll = await this.rbacService.hasPermission(userId, PERMISSIONS.QUOTES_CREATE);
    if (canReadAll) return true;

    const ticket = await this.ticketsDAO.getById(ticketId as never);
    if (!ticket) return false;

    const memberships = await this.orgMembersDAO.findByUser(userId);
    if (!memberships) return false;

    return memberships.some((m) => m.organization_id === ticket.organization_id);
  }

  private async canJoinOrgRoom(userId: UserId, orgId: string): Promise<boolean> {
    const canReadAll = await this.rbacService.hasPermission(userId, PERMISSIONS.QUOTES_CREATE);
    if (canReadAll) return true;

    const memberships = await this.orgMembersDAO.findByUser(userId);
    if (!memberships) return false;

    return memberships.some((m) => (m.organization_id as string) === orgId);
  }
}
