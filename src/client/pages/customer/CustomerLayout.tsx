import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { CLIENT_ROUTES } from '../../constants/client.routes';

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
    <div data-testid="customer-layout">
      <nav aria-label="Customer navigation">
        <span>Smartquote</span>

        <ul role="list">
          <li>
            <NavLink to={CLIENT_ROUTES.CUSTOMER.ROOT} end data-testid="nav-dashboard">
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to={CLIENT_ROUTES.CUSTOMER.TICKETS} data-testid="nav-tickets">
              My Tickets
            </NavLink>
          </li>
          <li>
            <NavLink to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET} data-testid="nav-new-ticket">
              Submit Ticket
            </NavLink>
          </li>
        </ul>

        <div>
          {user && (
            <div data-testid="sidebar-user">
              <span>{fullName}</span>
              <span>{user.role.name}</span>
            </div>
          )}
          <button type="button" onClick={() => void handleLogout()} data-testid="logout-btn">
            Sign out
          </button>
        </div>
      </nav>

      <main data-testid="customer-main">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
