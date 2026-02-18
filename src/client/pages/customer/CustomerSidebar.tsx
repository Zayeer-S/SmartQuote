import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerSidebar.css';

export type MenuKey = 'Dashboard' | 'My Tickets' | 'Quotes' | 'History' | 'Profile';

export type Props = {
  activeMenu: MenuKey;
  setActiveMenu: React.Dispatch<React.SetStateAction<MenuKey>>;
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
  Pound: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 4a4 4 0 0 0-4 4v2h5a1 1 0 1 1 0 2h-5v2c0 1.2-.3 2.3-1 3h8a1 1 0 1 1 0 2H7a1 1 0 0 1-.7-1.7c1.2-1.2 1.7-2.4 1.7-4.3v-1H7a1 1 0 1 1 0-2h1V8a6 6 0 0 1 6-6h2a1 1 0 1 1 0 2h-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  User: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
} as const;

const CustomerSidebar: React.FC<Props> = ({
  activeMenu,
  setActiveMenu,
  isCollapsed,
  toggleSidebar,
}) => {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const customer = useMemo(
    () => ({ name: 'Guest', email: 'guest@smartquote.com' }),
    []
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setProfileOpen(false);
    navigate('/login');
  }, [navigate]);

  const handleViewUserInfo = useCallback(() => {
    setProfileOpen(false);
    navigate('/customer/profile');
  }, [navigate]);

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

  return (
    <aside className="sidebar">
      <div className="brandRow">
        <div className="brand">
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

      <nav className="menu">
        <button
          className={`menuItem ${activeMenu === 'Dashboard' ? 'active' : ''}`}
          onClick={() => {
            setActiveMenu('Dashboard');
            navigate('/customer');
          }}
          type="button"
        >
          <span className="menuIcon">{Icon.Home}</span>
          {!isCollapsed && <span className="menuLabel">Dashboard</span>}
        </button>

        <button
          className={`menuItem ${activeMenu === 'My Tickets' ? 'active' : ''}`}
          onClick={() => {
            setActiveMenu('My Tickets');
            navigate('/customer/tickets');
          }}
          type="button"
        >
          <span className="menuIcon">{Icon.Ticket}</span>
          {!isCollapsed && <span className="menuLabel">My Tickets</span>}
        </button>

        <button
          className={`menuItem ${activeMenu === 'Quotes' ? 'active' : ''}`}
          onClick={() => {
            setActiveMenu('Quotes');
            navigate('/customer/quotes');
          }}
          type="button"
        >
          <span className="menuIcon">{Icon.Pound}</span>
          {!isCollapsed && <span className="menuLabel">Quotes</span>}
        </button>

        <button
          className={`menuItem ${activeMenu === 'History' ? 'active' : ''}`}
          onClick={() => {
            setActiveMenu('History');
            navigate('/customer/history');
          }}
          type="button"
        >
          <span className="menuIcon">{Icon.Doc}</span>
          {!isCollapsed && <span className="menuLabel">History</span>}
        </button>

        <button
          className={`menuItem ${activeMenu === 'Profile' ? 'active' : ''}`}
          onClick={() => {
            setActiveMenu('Profile');
            navigate('/customer/profile');
          }}
          type="button"
        >
          <span className="menuIcon">{Icon.User}</span>
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
              <div className="userName">{customer.name}</div>
              <div className="userEmail">{customer.email}</div>
            </div>
          )}
        </button>

        {profileOpen && !isCollapsed && (
          <div className="profileDropdown" role="menu">
            <button className="dropdownItem" type="button" onClick={handleViewUserInfo}>
              View User Information
            </button>

            <button className="dropdownItem logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default CustomerSidebar;
