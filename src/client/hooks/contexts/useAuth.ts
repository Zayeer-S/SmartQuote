import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../../context/auth/auth.context.types';

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
