import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/contexts/useAuth.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import { AUTH_ROLES } from '../../../shared/constants/index.js';
import './InsufficientPermissionsPage.css';

const InsufficientPermissionsPage: React.FC = () => {
  const { user } = useAuth();

  const dashboardRoute =
    user?.role.name === AUTH_ROLES.CUSTOMER
      ? CLIENT_ROUTES.CUSTOMER.ROOT
      : CLIENT_ROUTES.ADMIN.ROOT;

  return (
    <main className="insufficient-permissions-page" data-testid="insufficient-permissions-page">
      <div className="insufficient-permissions-card">
        <span className="insufficient-permissions-logo">Smartquote</span>

        <h1 className="insufficient-permissions-title">Access denied</h1>

        <p className="insufficient-permissions-body">
          You don't have permission to view this page. If you believe this is a mistake, please
          contact your administrator.
        </p>

        <Link
          to={dashboardRoute}
          className="insufficient-permissions-back"
          data-testid="back-to-dashboard"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
};

export default InsufficientPermissionsPage;
