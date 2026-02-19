import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { useSidebar } from '../../hooks/useSidebar';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import {
  HomeIcon,
  TicketIcon,
  PoundIcon,
  DocIcon,
  UserIcon,
} from '../../components/icons/CustomerIcons';
import './CustomerSidebar.css';

type MenuKey = 'Dashboard' | 'My Tickets' | 'Quotes' | 'History' | 'Profile';

const ROUTE_TO_MENU: Partial<Record<string, MenuKey>> = {
  [CLIENT_ROUTES.CUSTOMER]: 'Dashboard',
  [CLIENT_ROUTES.CUSTOMER_TICKETS]: 'My Tickets',
  [CLIENT_ROUTES.CUSTOMER_QUOTES]: 'Quotes',
  [CLIENT_ROUTES.CUSTOMER_HISTORY]: 'History',
  [CLIENT_ROUTES.CUSTOMER_PROFILE]: 'Profile',
};

const Icon = {
  User: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4 21a8 8 0 0 1 16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
} as const;

const CustomerSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { isCollapsed, toggle } = useSidebar();

  const activeMenu: MenuKey = ROUTE_TO_MENU[pathname] ?? 'Dashboard';

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const displayName =
    (user as any)?.name ??
    (user as any)?.fullName ??
    user?.email?.split('@')?.[0] ??
    'Guest';

  const handleLogout = useCallback(async () => {
    setProfileOpen(false);
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  }, [logout, navigate]);

  const handleViewUserInfo = useCallback(() => {
    setProfileOpen(false);
    void navigate(CLIENT_ROUTES.CUSTOMER_PROFILE);
  }, [navigate]);

  const onToggle = useCallback(() => {
    toggle();
    setProfileOpen(false);
  }, [toggle]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const root = profileRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) setProfileOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <aside
      className="sidebar"
      aria-label="Customer portal sidebar"
      data-testid="customer-sidebar"
    >
      <div className="brandRow">
        <div className="brand" aria-hidden="true">
          <div className="brandTitle">{isCollapsed ? 'SQ' : 'SmartQuote'}</div>
          {!isCollapsed && <div className="brandSub">Customer Portal</div>}
        </div>

        <button
          className="collapseBtn"
          type="button"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        />
      </div>

      <nav className="menu" aria-label="Customer navigation">
        <button
          className={`menuItem ${activeMenu === 'Dashboard' ? 'active' : ''}`}
          onClick={() => void navigate(CLIENT_ROUTES.CUSTOMER)}
          type="button"
          aria-current={activeMenu === 'Dashboard' ? 'page' : undefined}
          data-testid="nav-dashboard"
        >
          <span className="menuIcon" aria-hidden="true">
            <HomeIcon />
          </span>
          {!isCollapsed && <span className="menuLabel">Dashboard</span>}
        </button>

        <button
          className={`menuItem ${activeMenu === 'My Tickets' ? 'active' : ''}`}
          onClick={() => void navigate(CLIENT_ROUTES.CUSTOMER_TICKETS)}
          type="button"
          aria-current={activeMenu === 'My Tickets' ? 'page' : undefined}
          data-testid="nav-my-tickets"
        >
          <span className="menuIcon" aria-hidden="true">
            <TicketIcon />
          </span>
          {!isCollapsed && <span className="menuLabel">My Tickets</span>}
        </button>

        <button
          className={`menuItem ${activeMenu === 'Quotes' ? 'active' : ''}`}
          onClick={() => void navigate(CLIENT_ROUTES.CUSTOMER_QUOTES)}
          type="button"
          aria-current={activeMenu === 'Quotes' ? 'page' : undefined}
          data-testid="nav-quotes"
        >
          <span className="menuIcon" aria-hidden="true">
            <PoundIcon />
          </span>
          {!isCollapsed && <span className="menuLabel">Quotes</span>}
        </button>

        <button
          className={`menuItem ${activeMenu === 'History' ? 'active' : ''}`}
          onClick={() => void navigate(CLIENT_ROUTES.CUSTOMER_HISTORY)}
          type="button"
          aria-current={activeMenu === 'History' ? 'page' : undefined}
          data-testid="nav-history"
        >
          <span className="menuIcon" aria-hidden="true">
            <DocIcon />
          </span>
          {!isCollapsed && <span className="menuLabel">History</span>}
        </button>

        <button
          className={`menuItem ${activeMenu === 'Profile' ? 'active' : ''}`}
          onClick={() => void navigate(CLIENT_ROUTES.CUSTOMER_PROFILE)}
          type="button"
          aria-current={activeMenu === 'Profile' ? 'page' : undefined}
          data-testid="nav-profile"
        >
          <span className="menuIcon" aria-hidden="true">
            <UserIcon />
          </span>
          {!isCollapsed && <span className="menuLabel">Profile</span>}
        </button>
      </nav>

      <div className="sidebarFooter" ref={profileRef}>
        <button
          className="profileTrigger"
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
        >
          <div className="userAvatar">{Icon.User}</div>
          {!isCollapsed && (
            <div className="userMeta">
              <div className="userName">{displayName}</div>
              <div className="userEmail">{user?.email ?? ''}</div>
            </div>
          )}
        </button>

        {profileOpen && !isCollapsed && (
          <div
            className="profileDropdown"
            role="menu"
            aria-label="Account options"
            data-testid="profile-dropdown"
          >
            <button
              className="dropdownItem"
              type="button"
              role="menuitem"
              onClick={handleViewUserInfo}
              data-testid="profile-view-info"
            >
              View User Information
            </button>

            <button
              className="dropdownItem logout"
              type="button"
              role="menuitem"
              onClick={() => void handleLogout()}
              data-testid="profile-logout"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default CustomerSidebar;
