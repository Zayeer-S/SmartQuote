import { useNavigate } from 'react-router-dom';
import type { LoginRequest } from '../../shared/contracts/auth-contracts';
import { useState } from 'react';
import { authAPI } from '../lib/api/auth.api';
import { tokenStorage } from '../lib/storage/tokenStorage';
import { AUTH_ROLES } from '../../shared/constants';
import { CLIENT_ROUTES } from '../constants/client.routes';

interface UseLoginReturn {
  login: (credentials: LoginRequest, rememberMe: boolean) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useLogin(): UseLoginReturn {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(credentials: LoginRequest, rememberMe: boolean): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(credentials);
      tokenStorage.save(response.token, rememberMe);
      const destination =
        response.user.role.name.toLowerCase() === AUTH_ROLES.CUSTOMER
          ? CLIENT_ROUTES.CUSTOMER
          : CLIENT_ROUTES.ADMIN;

      await navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, error };
}
