import { NOTIFICATION_TYPES } from '../../../shared/constants/lookup-values.js';
import type {
  GetNotificationPreferencesResponse,
  UpdateNotificationPreferencesRequest,
  UpdateNotificationPreferencesResponse,
} from '../../../shared/contracts/notification-contracts.js';
import type { NotificationTypesDAO } from '../../daos/children/notification-types.dao.js';
import { UserNotificationPreferencesDAO } from '../../daos/children/users-domain.dao.js';
import type { NotificationTypeId } from '../../database/types/ids.js';
import type { UserId } from '../../database/types/ids.js';
import type { EmailService } from '../email/email.service.js';
import { NOTIFICATION_ERROR_MSGS, NotificationError } from './notification.errors.js';
import type {
  NotificationResult,
  NotifyQuoteGeneratedData,
  NotifyTicketReceivedData,
  NotifyTicketResolvedData,
} from './notification.service.types.js';

export class NotificationService {
  private emailService: EmailService;
  private userNotificationPreferencesDAO: UserNotificationPreferencesDAO;
  private notificationTypesDAO: NotificationTypesDAO;

  constructor(
    emailService: EmailService,
    userNotificationPreferencesDAO: UserNotificationPreferencesDAO,
    notificationTypesDAO: NotificationTypesDAO
  ) {
    this.emailService = emailService;
    this.userNotificationPreferencesDAO = userNotificationPreferencesDAO;
    this.notificationTypesDAO = notificationTypesDAO;
  }

  /**
   * Notify the ticket creator that their ticket has been received.
   * Gated on the user having opted in to TICKET_RECEIVED notifications.
   * Fire-and-forget safe -- never throws, logs failures instead.
   */
  async notifyTicketReceived(data: NotifyTicketReceivedData): Promise<NotificationResult> {
    return this.dispatchIfEnabled(data.userId as UserId, NOTIFICATION_TYPES.TICKET_RECEIVED, () =>
      this.emailService.sendTicketReceived(data)
    );
  }

  /**
   * Notify the ticket owner that a quote has been generated for their ticket.
   * Gated on the user having opted in to QUOTE_GENERATED notifications.
   * Fire-and-forget safe -- never throws, logs failures instead.
   */
  async notifyQuoteGenerated(data: NotifyQuoteGeneratedData): Promise<NotificationResult> {
    return this.dispatchIfEnabled(data.userId as UserId, NOTIFICATION_TYPES.QUOTE_GENERATED, () =>
      this.emailService.sendQuoteGenerated(data)
    );
  }

  /**
   * Notify the ticket owner that their ticket has been resolved.
   * Gated on the user having opted in to TICKET_RESOLVED notifications.
   * Fire-and-forget safe -- never throws, logs failures instead.
   */
  async notifyTicketResolved(data: NotifyTicketResolvedData): Promise<NotificationResult> {
    return this.dispatchIfEnabled(data.userId as UserId, NOTIFICATION_TYPES.TICKET_RESOLVED, () =>
      this.emailService.sendTicketResolved(data)
    );
  }

  /**
   * Get all notification preferences for a user.
   * Returns all known notification types with enabled flag based on DB rows.
   */
  async getPreferences(userId: UserId): Promise<GetNotificationPreferencesResponse> {
    const [allTypes, enabledIds] = await Promise.all([
      this.notificationTypesDAO.getAll(),
      this.userNotificationPreferencesDAO.getEnabledNotificationTypes(userId),
    ]);

    const enabledSet = new Set(enabledIds);

    const preferences = allTypes.map((type) => ({
      notificationTypeId: type.id as unknown as number,
      notificationTypeName: type.name,
      enabled: enabledSet.has(type.id),
    }));

    return { preferences };
  }

  /**
   * Replace a user's notification preferences with the provided set.
   * Any type not in enabledNotificationTypeIds is treated as disabled.
   */
  async updatePreferences(
    userId: UserId,
    body: UpdateNotificationPreferencesRequest
  ): Promise<UpdateNotificationPreferencesResponse> {
    await this.userNotificationPreferencesDAO.setPreferences(
      userId,
      body.enabledNotificationTypeIds as unknown as NotificationTypeId[]
    );

    const updated = await this.getPreferences(userId);

    return {
      preferences: updated.preferences,
      message: 'Notification preferences updated successfully',
    };
  }

  /**
   * Check whether the user has opted in to the given notification type, then
   * dispatch the send callback if so. Returns a skipped result if opted out.
   *
   * All errors from the preference lookup and send are caught here so callers
   * can fire-and-forget with void without risking unhandled rejection.
   */
  private async dispatchIfEnabled(
    userId: UserId,
    typeName: string,
    send: () => Promise<NotificationResult>
  ): Promise<NotificationResult> {
    try {
      const notificationType = await this.notificationTypesDAO.getOne({ name: typeName });
      if (!notificationType) {
        throw new NotificationError(NOTIFICATION_ERROR_MSGS.NOTIFICATION_TYPE_NOT_FOUND);
      }

      const isEnabled = await this.userNotificationPreferencesDAO.hasPreference(
        userId,
        notificationType.id
      );

      if (!isEnabled) {
        return { success: true, skipped: true, skipReason: 'User has opted out' };
      }

      return await send();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown notification error';
      console.error(`NotificationService.dispatchIfEnabled failed [${typeName}]:`, message);
      return { success: false, error: message };
    }
  }
}
