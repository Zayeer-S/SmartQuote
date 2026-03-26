import type { PermissionName } from '../../../shared/constants';
import type { TransactionContext } from '../../daos/base/types.js';
import { PermissionsDAO } from '../../daos/children/permissions.dao.js';
import type { UsersDAO } from '../../daos/children/users.dao.js';
import type { PermissionId, RoleId, UserId } from '../../database/types/ids.js';

export class RBACService {
  private usersDAO: UsersDAO;
  private permissionsDAO: PermissionsDAO;

  constructor(usersDAO: UsersDAO, permissionsDAO: PermissionsDAO) {
    this.usersDAO = usersDAO;
    this.permissionsDAO = permissionsDAO;
  }

  /**
   * Check if a user has a specific permission
   *
   * @param userId User ID
   * @param permissionName Permission name to check
   * @param options Optional transaction context
   * @returns True if user has permission, false otherwise
   */
  async hasPermission(
    userId: UserId,
    permissionName: PermissionName,
    options?: TransactionContext
  ): Promise<boolean> {
    const user = await this.usersDAO.getById(userId, options);
    if (!user) return false;

    const permissions = await this.permissionsDAO.findByRoleId(user.role_id, options);

    return permissions.some((p) => p.name === permissionName);
  }

  /**
   * Check if a user has ANY of the specified permissions
   *
   * @param userId User ID
   * @param permissionNames Array of permission names
   * @param options Optional transaction context
   * @returns True if user has at least one permission, false otherwise
   */
  async hasAnyPermission(
    userId: UserId,
    permissionNames: PermissionName[],
    options?: TransactionContext
  ): Promise<boolean> {
    const user = await this.usersDAO.getById(userId, options);

    if (!user) return false;

    const permissions = await this.permissionsDAO.findByRoleId(user.role_id, options);

    const permissionNamesSet = new Set(permissions.map((p) => p.name));

    return permissionNames.some((name) => permissionNamesSet.has(name));
  }

  /**
   * Check if a user has ALL of the specified permissions
   *
   * @param userId User ID
   * @param permissionNames Array of permission names
   * @param options Optional transaction context
   * @returns True if user has all permissions, false otherwise
   */
  async hasAllPermissions(
    userId: UserId,
    permissionNames: PermissionName[],
    options?: TransactionContext
  ): Promise<boolean> {
    const user = await this.usersDAO.getById(userId, options);
    if (!user) return false;

    const permissions = await this.permissionsDAO.findByRoleId(user.role_id, options);

    const permissionNamesSet = new Set(permissions.map((p) => p.name));

    return permissionNames.every((name) => permissionNamesSet.has(name));
  }

  /**
   * Check if a user has a specific role
   *
   * @param userId User ID
   * @param roleId Role ID to check
   * @param options Optional transaction context
   * @returns True if user has role, false otherwise
   */
  async hasRole(userId: UserId, roleId: RoleId, options?: TransactionContext): Promise<boolean> {
    const user = await this.usersDAO.getById(userId, options);
    if (!user) return false;

    return user.role_id === roleId;
  }

  /**
   * Check if a user has ANY of the specified roles
   *
   * @param userId User ID
   * @param roleIds Array of role IDs
   * @param options Optional transaction context
   * @returns True if user has at least one role, false otherwise
   */
  async hasAnyRole(
    userId: UserId,
    roleIds: RoleId[],
    options?: TransactionContext
  ): Promise<boolean> {
    const user = await this.usersDAO.getById(userId, options);
    if (!user) return false;

    return roleIds.includes(user.role_id);
  }

  /**
   * Get all permissions for a user (based on their role)
   *
   * @param userId User ID
   * @param options Optional transaction context
   * @returns Array of permission names
   */
  async getUserPermissions(
    userId: UserId,
    options?: TransactionContext
  ): Promise<PermissionName[]> {
    const user = await this.usersDAO.getById(userId, options);
    if (!user) return [];

    const permissions = await this.permissionsDAO.findByRoleId(user.role_id, options);

    return permissions.map((p) => p.name as PermissionName);
  }

  /**
   * Get all permission IDs for a user's role
   *
   * @param userId User ID
   * @param options Optional transaction context
   * @returns Array of permission IDs
   */
  async getUserPermissionIds(
    userId: UserId,
    options?: TransactionContext
  ): Promise<PermissionId[]> {
    const user = await this.usersDAO.getById(userId, options);
    if (!user) return [];

    const permissions = await this.permissionsDAO.findByRoleId(user.role_id, options);

    return permissions.map((p) => p.id);
  }
}
