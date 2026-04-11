import { z } from 'zod';

export const createOrgSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters'),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;

export const updateOrgSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name must not be empty')
      .max(255, 'Name must not exceed 255 characters')
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;

export const orgIdParamSchema = z.object({
  orgId: z.uuid('Organization ID must be a valid UUID'),
});

export type OrgIdParam = z.infer<typeof orgIdParamSchema>;

export const addOrgMemberSchema = z.object({
  email: z.email('Must be a valid email address'),
});

export type AddOrgMemberInput = z.infer<typeof addOrgMemberSchema>;

export const orgMemberParamSchema = z.object({
  orgId: z.uuid('Organization ID must be a valid UUID'),
  userId: z.uuid('User ID must be a valid UUID'),
});

export type OrgMemberParam = z.infer<typeof orgMemberParamSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(['Member', 'Manager']),
});
