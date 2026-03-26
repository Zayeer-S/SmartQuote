import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/contexts/useAuth.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    void navigate(CLIENT_ROUTES.LOGIN);
  };

  const fullName = user
    ? [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ')
    : '';

  return (
    <div className="admin-layout" data-testid="admin-layout">
      <nav className="admin-nav" aria-label="Admin navigation">
        <span className="admin-nav-brand">Smartquote</span>

        <ul className="admin-nav-links" role="list">
          <li>
            <NavLink
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`
              }
              to={CLIENT_ROUTES.ADMIN.TICKETS}
              data-testid="nav-tickets"
            >
              Tickets
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`
              }
              to={CLIENT_ROUTES.ADMIN.QUOTES}
              data-testid="nav-quotes"
            >
              Quotes
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`
              }
              to={CLIENT_ROUTES.ADMIN.ANALYTICS}
              data-testid="nav-analytics"
            >
              Analytics
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`
              }
              to={CLIENT_ROUTES.ADMIN.SLA_POLICIES}
              data-testid="nav-sla-policies"
            >
              SLA Policies
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`
              }
              to={CLIENT_ROUTES.ADMIN.SETTINGS}
              data-testid="nav-settings"
            >
              Settings
            </NavLink>
          </li>
        </ul>

        <div className="admin-nav-footer">
          {user && (
            <div className="admin-nav-user" data-testid="sidebar-user">
              <span className="admin-nav-user-name">{fullName}</span>
              <span className="admin-nav-user-role">{user.role.name}</span>
            </div>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm admin-nav-signout"
            onClick={() => void handleLogout()}
            data-testid="logout-btn"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="admin-main" data-testid="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
