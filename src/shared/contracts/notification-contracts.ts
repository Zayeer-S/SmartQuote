export interface NotificationPreference {
  notificationTypeId: number;
  notificationTypeName: string;
  enabled: boolean;
}

export interface GetNotificationPreferencesResponse {
  preferences: NotificationPreference[];
}

export interface UpdateNotificationPreferencesRequest {
  /** Array of notification type IDs to enable. All others will be disabled. */
  enabledNotificationTypeIds: number[];
}

export interface UpdateNotificationPreferencesResponse {
  preferences: NotificationPreference[];
  message: string;
}
