/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerPage.css';

type MenuKey = 'Dashboard' | 'My Tickets' | 'Quotes' | 'History' | 'Profile';

type StatCard = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const CustomerPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState<MenuKey>('Dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [query, setQuery] = useState('');

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // Placeholder user (replace with auth/session later)
  const customer = useMemo(() => ({ name: 'Guest', email: 'guest@giacom' }), []);

  // Placeholder stats (until DB is connected)
  const stats: StatCard[] = useMemo(
    () => [
      { label: 'Total Tickets', value: '0', icon: '🎫' },
      { label: 'Active Tickets', value: '0', icon: '🕒' },
      { label: 'Total Quoted', value: '£0.00', icon: '🧾' },
      { label: 'Pending Quotes', value: '0', icon: '📄' },
    ],
    []
  );

  // No DB yet => no tickets
  const tickets: any[] = [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Optional: clear auth data if you store it
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setProfileOpen(false);
    navigate('/login');
  };

  const handleViewUserInfo = () => {
    setProfileOpen(false);
    // Change route if you have one:
    // navigate("/customer/profile");
    alert('User information page coming soon.');
  };

  return (
    <div className={`customerPage ${isCollapsed ? 'sidebarCollapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brandRow">
          <div className="brand">
            <div className="brandTitle">{isCollapsed ? 'G' : 'GIACOM'}</div>
            {!isCollapsed && <div className="brandSub">Customer Portal</div>}
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
            title={isCollapsed ? 'Dashboard' : undefined}
            type="button"
          >
            <span className="menuIcon">🏠</span>
            {!isCollapsed && <span className="menuLabel">Dashboard</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'My Tickets' ? 'active' : ''}`}
            onClick={() => setActiveMenu('My Tickets')}
            title={isCollapsed ? 'My Tickets' : undefined}
            type="button"
          >
            <span className="menuIcon">🎫</span>
            {!isCollapsed && <span className="menuLabel">My Tickets</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'Quotes' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Quotes')}
            title={isCollapsed ? 'Quotes' : undefined}
            type="button"
          >
            <span className="menuIcon">£</span>
            {!isCollapsed && <span className="menuLabel">Quotes</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'History' ? 'active' : ''}`}
            onClick={() => setActiveMenu('History')}
            title={isCollapsed ? 'History' : undefined}
            type="button"
          >
            <span className="menuIcon">🧾</span>
            {!isCollapsed && <span className="menuLabel">History</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'Profile' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Profile')}
            title={isCollapsed ? 'Profile' : undefined}
            type="button"
          >
            <span className="menuIcon">👤</span>
            {!isCollapsed && <span className="menuLabel">Profile</span>}
          </button>
        </nav>

        {/* Sidebar Footer with dropdown */}
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
                <div className="userName">{customer.name}</div>
                <div className="userEmail">{customer.email}</div>
              </div>
            )}
          </button>

          {profileOpen && (
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
      <main className="main">
        <header className="topBar">
          <div>
            <h1 className="pageTitle">Dashboard</h1>
            <p className="pageSubtitle">Manage your support tickets and view quotes</p>
          </div>
        </header>

        {/* Stats */}
        <section className="statsGrid">
          {stats.map((s) => (
            <div key={s.label} className="statCard">
              {/* If your CSS expects .statIcon.blue/amber/green/orange,
                  you can switch to those styles. This keeps it simple. */}
              <div className="statIcon">{s.icon}</div>
              <div className="statValue">{s.value}</div>
              <div className="statLabel">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Search + New Ticket */}
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

          <button className="primaryBtn" type="button" onClick={() => navigate('/customer/create')}>
            <span className="btnPlus">＋</span>
            New Ticket
          </button>
        </section>

        {/* Empty panel like Admin (until DB wired) */}
        <section className="tableShell">
          {tickets.length === 0 ? (
            <div className="emptyPill">No tickets found.</div>
          ) : (
            <div style={{ width: '100%' }}>{/* Later: render tickets list here */}</div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CustomerPage;
