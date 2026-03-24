import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { useSidebar } from '../../hooks/useSidebar';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import { SidebarIcons } from '../../components/icons/SidebarIcons';
import {
  ADMIN_NAV_ITEMS,
  type AdminMenuKey,
} from '../../features/adminDashboard/adminDashboard.constants';
import './AdminPage.css';

const NAV_ICONS: Record<AdminMenuKey, React.ReactNode> = {
  Dashboard: SidebarIcons.Home,
  'All Tickets': SidebarIcons.Ticket,
  Quotes: SidebarIcons.QuoteDoc,
  Customers: SidebarIcons.Users,
  Analytics: SidebarIcons.Analytics,
  Settings: SidebarIcons.Settings,
};

interface Props {
  activeMenu: AdminMenuKey;
  onMenuChange: (key: AdminMenuKey) => void;
}

const AdminSidebar: React.FC<Props> = ({ activeMenu, onMenuChange }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isCollapsed, toggle } = useSidebar();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(() => {
    if (!user) return '';
    return user.middleName
      ? `${user.firstName} ${user.middleName} ${user.lastName}`
      : `${user.firstName} ${user.lastName}`;
  }, [user]);

  const handleLogout = useCallback(async () => {
    setProfileOpen(false);
    await logout();
    void navigate(CLIENT_ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  const handleViewUserInfo = useCallback(() => {
    setProfileOpen(false);
    // TODO(integration): navigate to admin profile route once defined in CLIENT_ROUTES
    alert('User info (placeholder)');
  }, []);

  const onToggle = useCallback(() => {
    toggle();
    setProfileOpen(false);
  }, [toggle]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  return (
    <aside className="adminSidebar" aria-label="Admin portal sidebar">
      <div className="adminBrandHeader">
        <div className="brandBlock">
          <div className="brandTitle">{isCollapsed ? 'SQ' : 'SmartQuote Admin'}</div>
          {!isCollapsed && <div className="brandSub">Support Team Portal</div>}
        </div>

        <button
          className="collapseBtn"
          type="button"
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="adminNav" aria-label="Admin navigation">
        {ADMIN_NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`adminNavItem ${activeMenu === item.key ? 'active' : ''}`}
            type="button"
            onClick={() => {
              onMenuChange(item.key);
            }}
            aria-current={activeMenu === item.key ? 'page' : undefined}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="adminNavIcon">{NAV_ICONS[item.key]}</span>
            {!isCollapsed && <span className="adminNavLabel">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="adminSidebarFooter" ref={profileRef}>
        <div className="footerDivider" />

        <button
          className="profileTrigger"
          type="button"
          onClick={() => {
            setProfileOpen((v) => !v);
          }}
          aria-label={`Account menu for ${displayName}`}
          aria-expanded={profileOpen && !isCollapsed}
          aria-haspopup="menu"
          disabled={isCollapsed}
        >
          <div className="userAvatar" aria-hidden="true">
            {SidebarIcons.User}
          </div>

          {!isCollapsed && (
            <div className="userMeta">
              <div className="userName">{displayName}</div>
              <div className="userEmail">{user?.email ?? ''}</div>
            </div>
          )}
        </button>

        {profileOpen && !isCollapsed && (
          <div className="profileDropdown" role="menu" aria-label="Account options">
            <button
              className="dropdownItem"
              type="button"
              role="menuitem"
              onClick={handleViewUserInfo}
            >
              View User Information
            </button>
            <button
              className="dropdownItem logout"
              type="button"
              role="menuitem"
              onClick={() => void handleLogout()}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
