import { createContext } from 'react';
import type { GetCurrentUserResponse } from '../../../shared/contracts/auth-contracts';

export interface AuthContextValue extends AuthState {
  hasPermission: (permission: string) => boolean;
  refetch: () => Promise<void>;
}

export interface AuthState {
  user: GetCurrentUserResponse | null;
  perrmissions: Set<string>;
  isLoading: boolean;
  error: string | null;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
