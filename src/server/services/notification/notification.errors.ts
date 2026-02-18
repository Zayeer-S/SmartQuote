export class NotificationError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'NotificationError';
    this.statusCode = statusCode;
  }
}

export class NotificationPreferenceError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'NotificationPreferenceError';
    this.statusCode = statusCode;
  }
}

export const NOTIFICATION_ERROR_MSGS = {
  USER_NOT_FOUND: 'User not found for notification',
  NOTIFICATION_TYPE_NOT_FOUND: 'Notification type not found',
  EMAIL_SEND_FAILED: 'Failed to send email notification',
  INVALID_NOTIFICATION_DATA: 'Invalid notification data provided',
};
