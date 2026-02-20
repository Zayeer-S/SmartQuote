import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/contexts/useAuth';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import './CustomerLayout.css';

const CustomerLayout: React.FC = () => {
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
    <div className="customer-layout" data-testid="customer-layout">
      <nav className="customer-sidebar" aria-label="Customer navigation">
        <div className="customer-sidebar-brand">
          <span className="customer-sidebar-logo">Smartquote</span>
        </div>

        <ul className="customer-sidebar-nav" role="list">
          <li>
            <NavLink
              to={CLIENT_ROUTES.CUSTOMER.ROOT}
              end
              className={({ isActive }) =>
                ['customer-sidebar-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
              }
              data-testid="nav-dashboard"
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to={CLIENT_ROUTES.CUSTOMER.TICKETS}
              className={({ isActive }) =>
                ['customer-sidebar-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
              }
              data-testid="nav-tickets"
            >
              My Tickets
            </NavLink>
          </li>
          <li>
            <NavLink
              to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET}
              className={({ isActive }) =>
                ['customer-sidebar-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
              }
              data-testid="nav-new-ticket"
            >
              Submit Ticket
            </NavLink>
          </li>
          <li>
            <NavLink
              to={CLIENT_ROUTES.CUSTOMER.SETTINGS}
              className={({ isActive }) =>
                ['customer-sidebar-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
              }
              data-testid="nav-settings"
            >
              Settings
            </NavLink>
          </li>
        </ul>

        <div className="customer-sidebar-footer">
          {user && (
            <div className="customer-sidebar-user" data-testid="sidebar-user">
              <span className="customer-sidebar-user-name">{fullName}</span>
              <span className="customer-sidebar-user-role">{user.role.name}</span>
            </div>
          )}
          <button
            type="button"
            className="customer-sidebar-logout"
            onClick={() => void handleLogout()}
            data-testid="logout-btn"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="customer-main" data-testid="customer-main">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
