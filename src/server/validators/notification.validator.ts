import { z } from 'zod';

export const updateNotificationPreferencesSchema = z.object({
  enabledNotificationTypeIds: z
    .array(z.number().int().positive())
    .min(0, 'enabledNotificationTypeIds must be an array'),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
