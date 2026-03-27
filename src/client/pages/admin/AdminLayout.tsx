import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/contexts/useAuth.js';
import { useSidebar } from '../../hooks/contexts/useSidebar.js';
import Sidebar, { type SidebarNavItem } from '../../components/Sidebar.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import {
  IconAnalytics,
  IconOrganisation,
  IconQuotes,
  IconSettings,
  IconSLA,
  IconTickets,
} from '../../components/icons/MiscIcons.js';
import './AdminLayout.css';

const ADMIN_NAV_ITEMS: SidebarNavItem[] = [
  {
    to: CLIENT_ROUTES.ADMIN.TICKETS,
    label: 'Tickets',
    icon: <IconTickets />,
    testId: 'nav-tickets',
  },
  {
    to: CLIENT_ROUTES.ADMIN.QUOTES,
    label: 'Quotes',
    icon: <IconQuotes />,
    testId: 'nav-quotes',
  },
  {
    to: CLIENT_ROUTES.ADMIN.ANALYTICS,
    label: 'Analytics',
    icon: <IconAnalytics />,
    testId: 'nav-analytics',
  },
  {
    // No specific org selected in nav -- resolves to /admin/org/:orgId pattern
    to: CLIENT_ROUTES.ADMIN.ORGANIZATION_MEMBERS(),
    label: 'Organisation Members',
    icon: <IconOrganisation />,
    testId: 'nav-organisation-members',
  },
  {
    to: CLIENT_ROUTES.ADMIN.ORGANIZATIONS(),
    label: 'Organisations',
    icon: <IconOrganisation />,
    testId: 'nav-organisations',
  },
  {
    to: CLIENT_ROUTES.ADMIN.SLA_POLICIES,
    label: 'SLA Policies',
    icon: <IconSLA />,
    testId: 'nav-sla-policies',
  },
  {
    to: CLIENT_ROUTES.ADMIN.SETTINGS,
    label: 'Settings',
    icon: <IconSettings />,
    testId: 'nav-settings',
  },
];

const AdminLayout: React.FC = () => {
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
        subtitle: user.role.name,
        avatarInitial: user.firstName[0].toUpperCase(),
      }
    : null;

  return (
    <div
      className={['admin-layout', isCollapsed ? 'admin-layout--sidebar-collapsed' : '']
        .filter(Boolean)
        .join(' ')}
      data-testid="admin-layout"
    >
      <Sidebar
        navItems={ADMIN_NAV_ITEMS}
        brand={{
          portalLabel: 'Customer Portal',
          logoSrc: 'src/client/components/icons/giacom-logo.webp',
        }}
        user={sidebarUser}
        ariaLabel="Admin navigation"
        testId="admin-sidebar"
        onLogout={() => void handleLogout()}
      />
      <main className="admin-main" data-testid="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
