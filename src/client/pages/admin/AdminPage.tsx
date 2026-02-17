/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

type AdminMenuKey = 'Dashboard' | 'All Tickets' | 'Quotes' | 'Customers' | 'Analytics' | 'Settings';

type StatCard = {
  label: string;
  value: number;
  icon: React.ReactNode;
};

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('Dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const adminUser = useMemo(() => ({ name: 'Admin User', email: 'admin@company.com' }), []);

  // Close dropdown on outside click
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const handleLogout = () => {
    // Optional: clear auth/session data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setProfileOpen(false);
    navigate('/login');
  };

  const handleViewUserInfo = () => {
    setProfileOpen(false);
    alert('View User Information (placeholder)');
    // If you have a route:
    // navigate("/admin/profile");
  };

  const stats: StatCard[] = useMemo(
    () => [
      {
        label: 'Total Tickets',
        value: 0,
        icon: (
          <svg viewBox="0 0 24 24" className="statSvg" aria-hidden="true">
            <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2a2 2 0 0 1-2 2h-1v2h1a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-2a2 2 0 0 1 2-2h1v-2H6a2 2 0 0 1-2-2V7zm3-1a1 1 0 0 0-1 1v2h12V7a1 1 0 0 0-1-1H7zm2 7v2h6v-2H9zm-3 4v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2H6z" />
          </svg>
        ),
      },
      {
        label: 'Urgent Tickets',
        value: 0,
        icon: (
          <svg viewBox="0 0 24 24" className="statSvg" aria-hidden="true">
            <path d="M12 2 1 21h22L12 2zm0 6c.55 0 1 .45 1 1v5a1 1 0 1 1-2 0V9c0-.55.45-1 1-1zm0 11a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 12 19z" />
          </svg>
        ),
      },
      {
        label: 'Unassigned',
        value: 0,
        icon: (
          <svg viewBox="0 0 24 24" className="statSvg" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2zm1 5v6l5 3-.9 1.5L11 13V7h2z" />
          </svg>
        ),
      },
      {
        label: 'Pending Quotes',
        value: 0,
        icon: (
          <svg viewBox="0 0 24 24" className="statSvg" aria-hidden="true">
            <path d="M12 1a1 1 0 0 1 1 1v1.06A8 8 0 0 1 20.94 11H22a1 1 0 1 1 0 2h-1.06A8 8 0 0 1 13 20.94V22a1 1 0 1 1-2 0v-1.06A8 8 0 0 1 3.06 13H2a1 1 0 1 1 0-2h1.06A8 8 0 0 1 11 3.06V2a1 1 0 0 1 1-1z" />
          </svg>
        ),
      },
    ],
    []
  );

  return (
    <div className={`adminPage ${isCollapsed ? 'adminCollapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="adminSidebar">
        <div className="brandRow">
          <div className="brand">
            <div className="brandTitle">{isCollapsed ? 'SQ' : 'SmartQuote Admin'}</div>
            {!isCollapsed && <div className="brandSub">Support Team Portal</div>}
          </div>

          <button
            className="collapseBtn"
            onClick={() => setIsCollapsed((v) => !v)}
            type="button"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            {isCollapsed ? '➡️' : '⬅️'}
          </button>
        </div>

        <nav className="menu">
          <button
            className={`menuItem ${activeMenu === 'Dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Dashboard')}
            type="button"
            title={isCollapsed ? 'Dashboard' : undefined}
          >
            <span className="menuIcon">🏠</span>
            {!isCollapsed && <span className="menuLabel">Dashboard</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'All Tickets' ? 'active' : ''}`}
            onClick={() => setActiveMenu('All Tickets')}
            type="button"
            title={isCollapsed ? 'All Tickets' : undefined}
          >
            <span className="menuIcon">🎫</span>
            {!isCollapsed && <span className="menuLabel">All Tickets</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'Quotes' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Quotes')}
            type="button"
            title={isCollapsed ? 'Quotes' : undefined}
          >
            <span className="menuIcon">£</span>
            {!isCollapsed && <span className="menuLabel">Quotes</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'Customers' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Customers')}
            type="button"
            title={isCollapsed ? 'Customers' : undefined}
          >
            <span className="menuIcon">👥</span>
            {!isCollapsed && <span className="menuLabel">Customers</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'Analytics' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Analytics')}
            type="button"
            title={isCollapsed ? 'Analytics' : undefined}
          >
            <span className="menuIcon">📊</span>
            {!isCollapsed && <span className="menuLabel">Analytics</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'Settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Settings')}
            type="button"
            title={isCollapsed ? 'Settings' : undefined}
          >
            <span className="menuIcon">⚙️</span>
            {!isCollapsed && <span className="menuLabel">Settings</span>}
          </button>
        </nav>

        {/* Footer + dropdown */}
        <div className="sidebarFooter" ref={profileRef}>
          <button
            className="profileTrigger"
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            aria-label="Open profile menu"
          >
            <div className="userAvatar">👤</div>
            {!isCollapsed && (
              <div className="userMeta">
                <div className="userName">{adminUser.name}</div>
                <div className="userEmail">{adminUser.email}</div>
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

      {/* Main */}
      <main className="adminMain">
        <header className="topBar">
          <div>
            <h1 className="pageTitle">Admin Dashboard</h1>
            <p className="pageSubtitle">Manage tickets, quotes, and customer requests</p>
          </div>
        </header>

        <section className="statsGrid">
          {stats.map((s) => (
            <div key={s.label} className="statCard">
              <div className="statIcon">{s.icon}</div>
              <div className="statValue">{s.value}</div>
              <div className="statLabel">{s.label}</div>
            </div>
          ))}
        </section>

        <section className="actionsRow">
          <div className="searchWrap">
            <span className="searchIcon" aria-hidden="true">
              🔎
            </span>
            <input
              className="searchInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tickets..."
              aria-label="Search tickets"
            />
          </div>
        </section>

        <section className="filtersRow">
          <span className="filterGlyph" aria-hidden="true">
            ⚲
          </span>

          <div className="selectWrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Status filter"
            >
              <option>All Status</option>
              <option>New</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
          </div>

          <div className="selectWrap">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Priority filter"
            >
              <option>All Priority</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </section>

        <section className="tableShell">
          <div className="emptyState">No tickets found.</div>
        </section>

        <button
          className="helpFab"
          type="button"
          onClick={() => alert('Help (placeholder)')}
          aria-label="Help"
          title="Help"
        >
          ?
        </button>
      </main>
    </div>
  );
};

export default AdminPage;
