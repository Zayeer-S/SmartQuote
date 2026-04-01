import { UserListItem } from '../../../shared/contracts/user-contracts';

export function resolveAssigneeName(
  assignedToUserId: string | null,
  adminUsers: UserListItem[]
): string | null {
  if (!assignedToUserId) return null;
  const user = adminUsers.find((u) => u.id === assignedToUserId);
  if (!user) return null;
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
}
