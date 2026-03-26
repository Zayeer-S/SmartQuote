import { createContext } from 'react';
import type { GetCurrentUserResponse } from '../../../shared/contracts/auth-contracts.js';

export interface AuthContextValue extends AuthState {
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

export interface AuthState {
  user: GetCurrentUserResponse | null;
  permissions: Set<string>;
  isLoading: boolean;
  error: string | null;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
