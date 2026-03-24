import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/contexts/useAuth';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import './CustomerLayout.css';

/* ── Inline SVG icons ── */
const IconDashboard = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconTickets = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V9z" />
    <line x1="9" y1="7" x2="9" y2="17" strokeDasharray="2 2" />
  </svg>
);

const IconQuotes = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);

const IconNewTicket = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const IconSettings = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconSignOut = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

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
            GIACOM<span className="customer-sidebar-logo-dot">.</span>
          </span>
          <span className="customer-sidebar-sub">Customer Portal</span>
        </div>

        {/* Nav */}
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
              My Tickets
            </NavLink>
          </li>
          <li>
            <NavLink
              to={CLIENT_ROUTES.CUSTOMER.QUOTES}
              className={({ isActive }) =>
                ['customer-sidebar-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
              }
              data-testid="nav-quotes"
            >
              <span className="nav-icon">
                <IconQuotes />
              </span>
              Quotes
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

        {/* Footer */}
        <div className="customer-sidebar-footer">
          {user && (
            <div className="customer-sidebar-user" data-testid="sidebar-user">
              <div className="customer-sidebar-avatar">
                {user.firstName[0].toUpperCase()}
              </div>
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
