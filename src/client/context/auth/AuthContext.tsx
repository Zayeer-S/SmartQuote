import { useCallback, useEffect, useState } from 'react';
import { tokenStorage } from '../../lib/storage/tokenStorage';
import { authAPI } from '../../lib/api/auth.api';
import {
  AuthContext,
  type AuthContextValue,
  type AuthProviderProps,
  type AuthState,
} from './auth.context.types';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthState['user']>(null);
  const [permissions, setPermissions] = useState<AuthState['permissions']>(new Set());
  const [isLoading, setIsLoading] = useState<AuthState['isLoading']>(true);
  const [error, setError] = useState<AuthState['error']>(null);

  const fetchAuth = useCallback(async () => {
    if (!tokenStorage.exists()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [userData, permissionsData] = await Promise.all([
        authAPI.getCurrentUser(),
        authAPI.getPermissions(),
      ]);

      setUser(userData);
      setPermissions(new Set(permissionsData.permissions));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch auth data';
      setError(errorMessage);
      setUser(null);
      setPermissions(new Set());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAuth();
  }, [fetchAuth]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return permissions.has(permission);
    },
    [permissions]
  );

  const logout = useCallback(async () => {
    // Gate rendering immediately so ProtectedRoute blocks before navigation
    setIsLoading(true);

    try {
      await authAPI.logout();
    } finally {
      tokenStorage.clear();
      setUser(null);
      setPermissions(new Set());
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    permissions,
    isLoading,
    error,
    hasPermission,
    logout,
    refetch: fetchAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
