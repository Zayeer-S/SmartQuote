import type { NotificationTypesDAO } from '../../daos/children/notification.types.dao';
import type { UserNotificationPreferencesDAO } from '../../daos/children/user.notification.preferences.dao';
import type { EmailService } from '../email/email.service';

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
   * This file should get the notification type id
   * Check if user has opted in/out of notifications of each type id
   * Send all notification types for which the user has opted in for (e.g. if user has opted in for email when ticket is resolved, this tells the email service to send an email for when ticket is resolved)
   *
   * Note: Types file already exists
   */
}
