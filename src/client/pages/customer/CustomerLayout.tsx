import React from 'react';
import { type SidebarNavItem } from '../../components/Sidebar.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import { IconDashboard, IconOrganisation, IconSettings } from '../../components/icons/MiscIcons.js';
import BaseLayout from '../../features/shared/BaseLayout.js';

const CUSTOMER_NAV_ITEMS: SidebarNavItem[] = [
  {
    to: CLIENT_ROUTES.CUSTOMER.ROOT,
    label: 'Home',
    icon: <IconDashboard />,
    testId: 'nav-dashboard',
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
  return (
    <BaseLayout
      sidebarNavItems={CUSTOMER_NAV_ITEMS}
      portalLabel="Customer"
      ariaLabel="customer"
      testId="customer"
    />
  );
};

export default CustomerLayout;
