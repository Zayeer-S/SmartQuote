import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/contexts/useAuth';
import { CLIENT_ROUTES } from '../constants/client.routes';

interface Props {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to={CLIENT_ROUTES.LOGIN} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role.name)) {
    return <Navigate to={CLIENT_ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
