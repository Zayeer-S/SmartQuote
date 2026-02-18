/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerPage.css';
import CustomerSidebar from './CustomerSidebar';

type MenuKey = 'Dashboard' | 'My Tickets' | 'Quotes' | 'History' | 'Profile';

type StatTone = 'blue' | 'amber' | 'green' | 'orange';

type StatCard = {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: StatTone;
};

type Ticket = {
  id: string;
  title: string;
  status: 'Open' | 'In Progress' | 'Closed';
  createdAt: string;
};

const StatIcon = {
  Ticket: (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">
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
  Clock: (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 7v6l4 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Dollar: (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">
      <path
        d="M12 2v20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 6.5c0-1.9-1.8-3.5-4-3.5s-4 1.6-4 3.5 1.8 3 4 3 4 1.1 4 3-1.8 3.5-4 3.5-4-1.6-4-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
} as const;

const STATS: StatCard[] = [
  { label: 'Total Tickets', value: '0', icon: StatIcon.Ticket, tone: 'blue' },
  { label: 'Active Tickets', value: '0', icon: StatIcon.Clock, tone: 'amber' },
  { label: 'Total Quoted', value: '£0.00', icon: StatIcon.Dollar, tone: 'green' },
  { label: 'Pending Quotes', value: '0', icon: StatIcon.Ticket, tone: 'orange' },
];

// Placeholder until DB is wired
const TICKETS: Ticket[] = [];

const CustomerPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState<MenuKey>('Dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState('');

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((v) => !v);
  }, []);

  return (
    <div className={`customerPage ${isCollapsed ? 'sidebarCollapsed' : ''}`}>
      {/* Sidebar (now reused from CustomerSidebar.tsx) */}
      <CustomerSidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
      />

      {/* Main */}
      <main className="main">
        <header className="topBar">
          <div>
            <h1 className="pageTitle">{activeMenu}</h1>
            <p className="pageSubtitle">Manage your support tickets and view quotes</p>
          </div>
        </header>

        {/* Stats */}
        <section className="statsGrid">
          {STATS.map((s) => (
            <div key={s.label} className="statCard">
              <div className={`statIcon ${s.tone}`}>{s.icon}</div>
              <div className="statValue">{s.value}</div>
              <div className="statLabel">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Search + New Ticket */}
        <section className="actionsRow">
          <div className="searchWrap">
            <span className="searchIcon" aria-hidden="true" />
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

        {/* Empty state */}
        <section className="tableShell">
          {TICKETS.length === 0 ? (
            <div className="emptyState">No tickets found.</div>
          ) : (
            <div style={{ width: '100%' }}>{/* future list */}</div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CustomerPage;
