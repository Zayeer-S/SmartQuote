import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/contexts/useAuth.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import './CustomerLayout.css';
import {
  IconDashboard,
  IconNewTicket,
  IconOrganisation,
  IconSettings,
  IconSignOut,
  IconTickets,
} from '../../components/icons/MiscIcons.js';

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
        {/* GIACOM Brand */}
        <div className="customer-sidebar-brand">
          <span className="customer-sidebar-logo">
            {' '}
            {/** RESOLVE: USE LOGO */}
            GIACOM<span className="customer-sidebar-logo-dot">.</span>
          </span>
          <span className="customer-sidebar-sub">Customer Portal</span>
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
              <span className="nav-icon">
                <IconDashboard />
              </span>
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
              <span className="nav-icon">
                <IconTickets />
              </span>
              All Tickets
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
              <span className="nav-icon">
                <IconNewTicket />
              </span>
              Submit Ticket
            </NavLink>
          </li>
          <li>
            <NavLink
              to={CLIENT_ROUTES.CUSTOMER.ORG_MEMBERS}
              className={({ isActive }) =>
                ['customer-sidebar-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
              }
              data-testid="nav-organisation"
            >
              <span className="nav-icon">
                <IconOrganisation />
              </span>
              Organisation
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
              <span className="nav-icon">
                <IconSettings />
              </span>
              Settings
            </NavLink>
          </li>
        </ul>

        <div className="customer-sidebar-footer">
          {user && (
            <div className="customer-sidebar-user" data-testid="sidebar-user">
              <div className="customer-sidebar-user-info">
                <span className="customer-sidebar-user-name">{fullName}</span>
                <span className="customer-sidebar-user-role">{user.role.name}</span>
              </div>
            </div>
          )}
          <button
            type="button"
            className="customer-sidebar-logout"
            onClick={() => void handleLogout()}
            data-testid="logout-btn"
          >
            <IconSignOut />
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
