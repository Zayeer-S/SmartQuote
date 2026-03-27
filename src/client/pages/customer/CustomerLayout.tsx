import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/contexts/useAuth.js';
import { useSidebar } from '../../hooks/contexts/useSidebar.js';
import Sidebar, { type SidebarNavItem } from '../../components/sidebar/Sidebar.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import {
  IconDashboard,
  IconOrganisation,
  IconSettings,
  IconTickets,
} from '../../components/icons/MiscIcons.js';
import './CustomerLayout.css';

const CUSTOMER_NAV_ITEMS: SidebarNavItem[] = [
  {
    to: CLIENT_ROUTES.CUSTOMER.ROOT,
    label: 'Dashboard',
    icon: <IconDashboard />,
    testId: 'nav-dashboard',
    end: true,
  },
  {
    to: CLIENT_ROUTES.CUSTOMER.ROOT,
    label: 'My Tickets',
    icon: <IconTickets />,
    testId: 'nav-tickets',
    end: true,
  },
  {
    to: CLIENT_ROUTES.CUSTOMER.ORG_MEMBERS,
    label: 'Organisation',
    icon: <IconOrganisation />,
    testId: 'nav-organisation',
  },
  {
    to: CLIENT_ROUTES.CUSTOMER.SETTINGS,
    label: 'Settings',
    icon: <IconSettings />,
    testId: 'nav-settings',
  },
];

const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    void navigate(CLIENT_ROUTES.LOGIN);
  };

  const sidebarUser = user
    ? {
        fullName: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' '),
      }
    : null;

  return (
    <div
      className={['customer-layout', isCollapsed ? 'customer-layout--sidebar-collapsed' : '']
        .filter(Boolean)
        .join(' ')}
      data-testid="customer-layout"
    >
      <Sidebar
        navItems={CUSTOMER_NAV_ITEMS}
        brand={{
          portalLabel: 'Customer Portal',
          logoSrc: 'src/client/components/icons/giacom-logo.webp',
        }}
        user={sidebarUser}
        ariaLabel="Customer navigation"
        testId="customer-sidebar"
        onLogout={() => void handleLogout()}
      />
      <main className="customer-main" data-testid="customer-main">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
