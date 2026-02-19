import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminSidebar.css';

export type AdminMenuKey =
  | 'Dashboard'
  | 'All Tickets'
  | 'Quotes'
  | 'Customers'
  | 'Analytics'
  | 'Settings';

export type AdminSidebarProps = {
  activeMenu: AdminMenuKey;
  setActiveMenu: React.Dispatch<React.SetStateAction<AdminMenuKey>>;
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

const Icon = {
  Home: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Ticket: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 9h6M9 12h6M9 15h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Doc: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3h10l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M17 3v5h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M8 12h8M8 16h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Users: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M2.5 20a6.5 6.5 0 0 1 13 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 11a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 20 11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M17 20a5 5 0 0 1 4.5 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Chart: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 19V5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 19h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 15v-5M12 19v-9M16 19v-13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Gear: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0-3.5-3.5 3.5 3.5 0 0 0 3.5 3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a8 8 0 0 0 .1-2l2-1.1-2-3.4-2.2.7a7.6 7.6 0 0 0-1.7-1L15.3 6 11 6l-.3 2.2a7.6 7.6 0 0 0-1.7 1l-2.2-.7-2 3.4 2 1.1a8 8 0 0 0 .1 2l-2 1.1 2 3.4 2.2-.7a7.6 7.6 0 0 0 1.7 1L11 22h4.3l.3-2.2a7.6 7.6 0 0 0 1.7-1l2.2.7 2-3.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
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

type MeResponse = { firstName?: string; lastName?: string; name?: string; email?: string };

const ME_URL = '/api/me'; // change if needed

function displayName(me: MeResponse | null): string {
  if (!me) return 'Admin User';
  const full = [me.firstName, me.lastName].filter(Boolean).join(' ').trim();
  return me.name ?? (full || 'Admin User');
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeMenu,
  setActiveMenu,
  isCollapsed,
  toggleSidebar,
}) => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const [me, setMe] = useState<MeResponse | null>(null);

  const admin = useMemo(
    () => ({
      name: displayName(me),
      email: me?.email ?? 'admin@company.com',
    }),
    [me]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setProfileOpen(false);
    navigate('/login');
  }, [navigate]);

  // Fetch admin user (Option 3)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(ME_URL, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          signal: controller.signal,
        });

        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }

        if (res.ok) {
          const data = (await res.json()) as MeResponse;
          setMe(data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('AdminSidebar: failed to load user', err);
      }
    })();

    return () => controller.abort();
  }, [handleLogout]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const root = profileRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onToggle = useCallback(() => {
    toggleSidebar();
    setProfileOpen(false);
  }, [toggleSidebar]);

  const go = useCallback(
    (key: AdminMenuKey, path: string) => {
      setActiveMenu(key);
      navigate(path);
    },
    [navigate, setActiveMenu]
  );

  return (
    <aside className="adminSidebar">
      <div className="adminBrandRow">
        <div className="adminBrand">
          <div className="adminBrandTitle">{isCollapsed ? 'SQ' : 'SmartQuote Admin'}</div>
          {!isCollapsed && <div className="adminBrandSub">Support Team Portal</div>}
        </div>

        <button
          className="adminCollapseBtn"
          type="button"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        />
      </div>

      <nav className="adminMenu">
        <button
          className={`adminMenuItem ${activeMenu === 'Dashboard' ? 'active' : ''}`}
          onClick={() => go('Dashboard', '/admin')}
          type="button"
          title={isCollapsed ? 'Dashboard' : undefined}
        >
          <span className="adminMenuIcon">{Icon.Home}</span>
          {!isCollapsed && <span className="adminMenuLabel">Dashboard</span>}
        </button>

        <button
          className={`adminMenuItem ${activeMenu === 'All Tickets' ? 'active' : ''}`}
          onClick={() => go('All Tickets', '/admin/tickets')}
          type="button"
          title={isCollapsed ? 'All Tickets' : undefined}
        >
          <span className="adminMenuIcon">{Icon.Ticket}</span>
          {!isCollapsed && <span className="adminMenuLabel">All Tickets</span>}
        </button>

        <button
          className={`adminMenuItem ${activeMenu === 'Quotes' ? 'active' : ''}`}
          onClick={() => go('Quotes', '/admin/quotes')}
          type="button"
          title={isCollapsed ? 'Quotes' : undefined}
        >
          <span className="adminMenuIcon">{Icon.Doc}</span>
          {!isCollapsed && <span className="adminMenuLabel">Quotes</span>}
        </button>

        <button
          className={`adminMenuItem ${activeMenu === 'Customers' ? 'active' : ''}`}
          onClick={() => go('Customers', '/admin/customers')}
          type="button"
          title={isCollapsed ? 'Customers' : undefined}
        >
          <span className="adminMenuIcon">{Icon.Users}</span>
          {!isCollapsed && <span className="adminMenuLabel">Customers</span>}
        </button>

        <button
          className={`adminMenuItem ${activeMenu === 'Analytics' ? 'active' : ''}`}
          onClick={() => go('Analytics', '/admin/analytics')}
          type="button"
          title={isCollapsed ? 'Analytics' : undefined}
        >
          <span className="adminMenuIcon">{Icon.Chart}</span>
          {!isCollapsed && <span className="adminMenuLabel">Analytics</span>}
        </button>

        <button
          className={`adminMenuItem ${activeMenu === 'Settings' ? 'active' : ''}`}
          onClick={() => go('Settings', '/admin/settings')}
          type="button"
          title={isCollapsed ? 'Settings' : undefined}
        >
          <span className="adminMenuIcon">{Icon.Gear}</span>
          {!isCollapsed && <span className="adminMenuLabel">Settings</span>}
        </button>
      </nav>

      <div className="adminSidebarFooter" ref={profileRef}>
        <button
          className="adminProfileTrigger"
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          aria-label="Open profile menu"
          aria-haspopup="menu"
          aria-expanded={profileOpen}
        >
          <div className="adminUserAvatar">{Icon.User}</div>
          {!isCollapsed && (
            <div className="adminUserMeta">
              <div className="adminUserName">{admin.name}</div>
              <div className="adminUserEmail">{admin.email}</div>
            </div>
          )}
        </button>

        {profileOpen && !isCollapsed && (
          <div className="adminProfileDropdown" role="menu">
            <button className="adminDropdownItem logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
