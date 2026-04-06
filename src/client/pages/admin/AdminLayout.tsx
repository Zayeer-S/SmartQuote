import React from 'react';
import { type SidebarNavItem } from '../../components/Sidebar.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import {
  IconAnalytics,
  IconOrganisation,
  IconQuotes,
  IconSettings,
  IconSLA,
  IconTickets,
} from '../../components/icons/MiscIcons.js';
import BaseLayout from '../../features/shared/BaseLayout.js';

const ADMIN_NAV_ITEMS: SidebarNavItem[] = [
  {
    to: CLIENT_ROUTES.ADMIN.ROOT,
    label: 'Home',
    icon: <IconTickets />, // TODO CHANGE
    testId: 'nav-home',
  },
  {
    to: CLIENT_ROUTES.ADMIN.ANALYTICS,
    label: 'Analytics',
    icon: <IconAnalytics />,
    testId: 'nav-analytics',
  },
  {
    to: CLIENT_ROUTES.ADMIN.ORGANIZATIONS_LIST,
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
    to: CLIENT_ROUTES.ADMIN.RATE_PROFILES,
    label: 'Rate Profiles',
    icon: <IconQuotes />, // RESOLVE
    testId: 'nav-rate-profiles',
  },
  {
    to: CLIENT_ROUTES.ADMIN.USER_MANAGEMENT,
    label: 'User Management',
    icon: <IconOrganisation />, // RESOLVE
    testId: 'nav-user-management',
  },
  {
    to: CLIENT_ROUTES.ADMIN.SYSTEM_CONFIG,
    label: 'System Config',
    icon: <IconSettings />, // RESOLVE
    testId: 'nav-system-config',
  },
  {
    to: CLIENT_ROUTES.ADMIN.SETTINGS,
    label: 'Settings',
    icon: <IconSettings />,
    testId: 'nav-settings',
  },
];

const AdminLayout: React.FC = () => {
  return (
    <BaseLayout
      sidebarNavItems={ADMIN_NAV_ITEMS}
      portalLabel="Admin"
      ariaLabel="admin"
      testId="admin"
    />
  );
};

export default AdminLayout;
