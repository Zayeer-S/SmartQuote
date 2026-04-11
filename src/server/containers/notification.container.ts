import type { Knex } from 'knex';
import { NotificationController } from '../controllers/notification.controller.js';
import { NotificationTypesDAO } from '../daos/children/notification-types.dao.js';
import { UserNotificationPreferencesDAO } from '../daos/children/users-domain.dao.js';
import { EmailService } from '../services/email/email.service.js';
import { NotificationService } from '../services/notification/notification.service.js';

export class NotificationContainer {
  public readonly notificationTypesDAO: NotificationTypesDAO;
  public readonly userNotificationPreferencesDAO: UserNotificationPreferencesDAO;

  public readonly emailService: EmailService;
  public readonly notificationService: NotificationService;

  public readonly notificationController: NotificationController;

  constructor(db: Knex) {
    this.notificationTypesDAO = new NotificationTypesDAO(db);
    this.userNotificationPreferencesDAO = new UserNotificationPreferencesDAO(db);

    this.emailService = new EmailService();
    this.notificationService = new NotificationService(
      this.emailService,
      this.userNotificationPreferencesDAO,
      this.notificationTypesDAO
    );

    this.notificationController = new NotificationController(this.notificationService);
  }
}
