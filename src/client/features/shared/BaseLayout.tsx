import React from 'react';
import Sidebar, { SidebarNavItem } from '../../components/Sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/contexts/useAuth';
import { useSidebar } from '../../hooks/contexts/useSidebar';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import giacomLogo from '../../components/icons/giacom-logo.webp';
import './BaseLayout.css';

export interface BaseLayoutProps {
  sidebarNavItems: SidebarNavItem[];
  portalLabel: string;
  ariaLabel: string;
  testId: string;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({
  sidebarNavItems,
  portalLabel,
  ariaLabel,
  testId,
}) => {
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
      className={['layout', isCollapsed ? 'layout--sidebar-collapsed' : '']
        .filter(Boolean)
        .join(' ')}
      data-testid={`${testId}-layout`}
    >
      <Sidebar
        navItems={sidebarNavItems}
        brand={{
          portalLabel: `${portalLabel} Portal`,
          logoSrc: giacomLogo,
        }}
        user={sidebarUser}
        ariaLabel={`${ariaLabel} navigation`}
        testId={`${testId}-sidebar`}
        onLogout={() => void handleLogout()}
      />
      <main className="layout-main" data-testid={`${testId}-main`}>
        <Outlet />
      </main>
    </div>
  );
};

export default BaseLayout;
