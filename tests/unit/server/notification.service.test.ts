/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../../../src/server/services/notification/notification.service';
import { EmailService } from '../../../src/server/services/email/email.service';
import { NOTIFICATION_TYPES } from '../../../src/shared/constants/lookup-values';
import { NOTIFICATION_ERROR_MSGS } from '../../../src/server/services/notification/notification.errors';
import {
  makeMockNotificationTypesDAO,
  makeMockUserNotificationPreferencesDAO,
} from './utils/mock.daos';
import type { NotificationTypesDAO } from '../../../src/server/daos/children/notification-types.dao';
import type { UserNotificationPreferencesDAO } from '../../../src/server/daos/children/users-domain.dao';
import type { NotificationType } from '../../../src/server/database/types/tables';
import type { NotificationTypeId } from '../../../src/server/database/types/ids';

// Minimal stub -- unit tests never exercise real transport
function makeMockEmailService(): EmailService {
  return {
    sendTicketReceived: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
    sendQuoteGenerated: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-2' }),
    sendTicketResolved: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-3' }),
  } as unknown as EmailService;
}

const STUB_NOTIFICATION_TYPE: NotificationType = {
  id: 1 as NotificationTypeId,
  name: NOTIFICATION_TYPES.TICKET_RECEIVED,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

const STUB_USER_ID = 'user-abc' as ReturnType<typeof crypto.randomUUID>;

const STUB_TICKET_RECEIVED_DATA = {
  ticketId: 'ticket-1',
  ticketTitle: 'Test ticket',
  ticketDescription: 'A description',
  ticketType: 'Support',
  severity: 'Low',
  createdAt: new Date(),
  userId: STUB_USER_ID,
  userEmail: 'user@example.com',
  userFirstName: 'Alice',
};

const STUB_QUOTE_GENERATED_DATA = {
  quoteId: 'quote-1',
  ticketId: 'ticket-1',
  ticketTitle: 'Test ticket',
  estimatedHoursMin: 2,
  estimatedHoursMax: 4,
  estimatedCost: 200,
  suggestedPriority: 'P2',
  effortLevel: 'Medium',
  userId: STUB_USER_ID,
  userEmail: 'user@example.com',
  userFirstName: 'Alice',
};

const STUB_TICKET_RESOLVED_DATA = {
  ticketId: 'ticket-1',
  ticketTitle: 'Test ticket',
  resolvedBy: 'agent-1',
  resolvedAt: new Date(),
  userId: STUB_USER_ID,
  userEmail: 'user@example.com',
  userFirstName: 'Alice',
};

describe('NotificationService', () => {
  let emailService: EmailService;
  let notificationTypesDAO: NotificationTypesDAO;
  let preferencesDAO: UserNotificationPreferencesDAO;
  let service: NotificationService;

  beforeEach(() => {
    emailService = makeMockEmailService();
    notificationTypesDAO = makeMockNotificationTypesDAO();
    preferencesDAO = makeMockUserNotificationPreferencesDAO();
    service = new NotificationService(emailService, preferencesDAO, notificationTypesDAO);
  });

  // ---------------------------------------------------------------------------
  // dispatchIfEnabled -- shared gating logic
  // ---------------------------------------------------------------------------

  describe('dispatchIfEnabled (via notifyTicketReceived)', () => {
    it('returns skipped result when user has opted out', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(STUB_NOTIFICATION_TYPE);
      vi.mocked(preferencesDAO.hasPreference).mockResolvedValue(false);

      const result = await service.notifyTicketReceived(STUB_TICKET_RECEIVED_DATA);

      expect(result).toEqual({ success: true, skipped: true, skipReason: 'User has opted out' });
      expect(emailService.sendTicketReceived).not.toHaveBeenCalled();
    });

    it('returns error result when notification type is not found in DB', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(null);

      const result = await service.notifyTicketReceived(STUB_TICKET_RECEIVED_DATA);

      expect(result.success).toBe(false);
      expect(result.error).toBe(NOTIFICATION_ERROR_MSGS.NOTIFICATION_TYPE_NOT_FOUND);
      expect(emailService.sendTicketReceived).not.toHaveBeenCalled();
    });

    it('returns error result when preferences DAO throws', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(STUB_NOTIFICATION_TYPE);
      vi.mocked(preferencesDAO.hasPreference).mockRejectedValue(new Error('DB connection lost'));

      const result = await service.notifyTicketReceived(STUB_TICKET_RECEIVED_DATA);

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB connection lost');
    });

    it('returns error result when send callback throws', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(STUB_NOTIFICATION_TYPE);
      vi.mocked(preferencesDAO.hasPreference).mockResolvedValue(true);
      vi.mocked(emailService.sendTicketReceived).mockRejectedValue(new Error('SMTP timeout'));

      const result = await service.notifyTicketReceived(STUB_TICKET_RECEIVED_DATA);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP timeout');
    });

    it('passes the correct notificationTypeId to hasPreference', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(STUB_NOTIFICATION_TYPE);
      vi.mocked(preferencesDAO.hasPreference).mockResolvedValue(false);

      await service.notifyTicketReceived(STUB_TICKET_RECEIVED_DATA);

      expect(preferencesDAO.hasPreference).toHaveBeenCalledWith(
        STUB_USER_ID,
        STUB_NOTIFICATION_TYPE.id
      );
    });
  });

  // ---------------------------------------------------------------------------
  // notifyTicketReceived
  // ---------------------------------------------------------------------------

  describe('notifyTicketReceived', () => {
    it('calls sendTicketReceived with correct data when opted in', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(STUB_NOTIFICATION_TYPE);
      vi.mocked(preferencesDAO.hasPreference).mockResolvedValue(true);

      const result = await service.notifyTicketReceived(STUB_TICKET_RECEIVED_DATA);

      expect(emailService.sendTicketReceived).toHaveBeenCalledWith(STUB_TICKET_RECEIVED_DATA);
      expect(result).toEqual({ success: true, messageId: 'msg-1' });
    });

    it('looks up the TICKET_RECEIVED notification type', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(STUB_NOTIFICATION_TYPE);
      vi.mocked(preferencesDAO.hasPreference).mockResolvedValue(true);

      await service.notifyTicketReceived(STUB_TICKET_RECEIVED_DATA);

      expect(notificationTypesDAO.getOne).toHaveBeenCalledWith({
        name: NOTIFICATION_TYPES.TICKET_RECEIVED,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // notifyQuoteGenerated
  // ---------------------------------------------------------------------------

  describe('notifyQuoteGenerated', () => {
    const quoteNotifType: NotificationType = {
      ...STUB_NOTIFICATION_TYPE,
      name: NOTIFICATION_TYPES.QUOTE_GENERATED,
    };

    it('calls sendQuoteGenerated with correct data when opted in', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(quoteNotifType);
      vi.mocked(preferencesDAO.hasPreference).mockResolvedValue(true);

      const result = await service.notifyQuoteGenerated(STUB_QUOTE_GENERATED_DATA);

      expect(emailService.sendQuoteGenerated).toHaveBeenCalledWith(STUB_QUOTE_GENERATED_DATA);
      expect(result).toEqual({ success: true, messageId: 'msg-2' });
    });

    it('looks up the QUOTE_GENERATED notification type', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(quoteNotifType);
      vi.mocked(preferencesDAO.hasPreference).mockResolvedValue(true);

      await service.notifyQuoteGenerated(STUB_QUOTE_GENERATED_DATA);

      expect(notificationTypesDAO.getOne).toHaveBeenCalledWith({
        name: NOTIFICATION_TYPES.QUOTE_GENERATED,
      });
    });

    it('returns skipped when user opted out of quote notifications', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(quoteNotifType);
      vi.mocked(preferencesDAO.hasPreference).mockResolvedValue(false);

      const result = await service.notifyQuoteGenerated(STUB_QUOTE_GENERATED_DATA);

      expect(result.skipped).toBe(true);
      expect(emailService.sendQuoteGenerated).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // notifyTicketResolved
  // ---------------------------------------------------------------------------

  describe('notifyTicketResolved', () => {
    const resolvedNotifType: NotificationType = {
      ...STUB_NOTIFICATION_TYPE,
      name: NOTIFICATION_TYPES.TICKET_RESOLVED,
    };

    it('calls sendTicketResolved with correct data when opted in', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(resolvedNotifType);
      vi.mocked(preferencesDAO.hasPreference).mockResolvedValue(true);

      const result = await service.notifyTicketResolved(STUB_TICKET_RESOLVED_DATA);

      expect(emailService.sendTicketResolved).toHaveBeenCalledWith(STUB_TICKET_RESOLVED_DATA);
      expect(result).toEqual({ success: true, messageId: 'msg-3' });
    });

    it('looks up the TICKET_RESOLVED notification type', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(resolvedNotifType);
      vi.mocked(preferencesDAO.hasPreference).mockResolvedValue(true);

      await service.notifyTicketResolved(STUB_TICKET_RESOLVED_DATA);

      expect(notificationTypesDAO.getOne).toHaveBeenCalledWith({
        name: NOTIFICATION_TYPES.TICKET_RESOLVED,
      });
    });

    it('returns skipped when user opted out of resolved notifications', async () => {
      vi.mocked(notificationTypesDAO.getOne).mockResolvedValue(resolvedNotifType);
      vi.mocked(preferencesDAO.hasPreference).mockResolvedValue(false);

      const result = await service.notifyTicketResolved(STUB_TICKET_RESOLVED_DATA);

      expect(result.skipped).toBe(true);
      expect(emailService.sendTicketResolved).not.toHaveBeenCalled();
    });
  });
});
