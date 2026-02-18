import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerSidebar, { type MenuKey } from '../../components/layout/CustomerSidebar';
import { useAuth } from '../../hooks/auth/useAuth';
import './CustomerPage.css';

interface StatCard {
  label: string;
  value: string;
  icon: React.ReactNode;
}

// Placeholder until DB is wired
const STATS: StatCard[] = [
  { label: 'Total Tickets', value: '0', icon: '🎫' },
  { label: 'Active Tickets', value: '0', icon: '🕑' },
  { label: 'Total Quoted', value: '£0.00', icon: '🧾' },
  { label: 'Pending Quotes', value: '0', icon: '🔄' },
];

// Placeholder until DB is wired
const TICKETS: never[] = [];

const CustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeMenu, setActiveMenu] = useState<MenuKey>('Dashboard');
  const [query, setQuery] = useState('');

  return (
    <div className="customerPage">
      <CustomerSidebar
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        brandTitle="GIACOM"
        brandSub="Customer Portal"
        userName={user?.firstName ?? 'Guest'}
        userEmail={user?.email ?? 'guest@giacom'}
      />

      <main className="main">
        <header className="topBar">
          <div>
            <h1 className="pageTitle">Dashboard</h1>
            <p className="pageSubtitle">Manage your support tickets and view quotes</p>
          </div>
        </header>

        <section className="statsGrid">
          {STATS.map((s) => (
            <div key={s.label} className="statCard">
              <div className="statIcon">{s.icon}</div>
              <div className="statValue">{s.value}</div>
              <div className="statLabel">{s.label}</div>
            </div>
          ))}
        </section>

        <section className="actionsRow">
          <div className="searchWrap">
            <span className="searchIcon" aria-hidden="true" />
            <input
              className="searchInput"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="Search tickets..."
              aria-label="Search tickets"
            />
          </div>

          <button
            className="primaryBtn"
            type="button"
            onClick={() => void navigate('/customer/create')}
          >
            <span className="btnPlus">＋</span>
            New Ticket
          </button>
        </section>

        <section className="tableShell">
          {TICKETS.length === 0 ? (
            <div className="emptyState">No tickets found.</div>
          ) : (
            <div style={{ width: '100%' }}>{/* Later: render tickets list here */}</div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CustomerPage;
