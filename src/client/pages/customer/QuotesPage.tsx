import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerSidebar, { type MenuKey } from '../../components/layout/CustomerSidebar';
import { useAuth } from '../../hooks/auth/useAuth';
import './QuotesPage.css';

/**
 * ERD: quotes table (ONLY).
 * Decimals are modeled as string to avoid precision issues with SQL decimals.
 */
export interface QuoteRow {
  id: number; // PK
  ticket_id: number; // FK
  version: number; // NOT NULL

  estimated_hours: string; // decimal NOT NULL
  hourly_rate: string; // decimal NOT NULL
  estimated_resolution_time: string; // decimal NOT NULL
  estimated_cost: string; // decimal NOT NULL

  quote_approval_id: number | null; // FK
  suggested_ticket_priority_level_id: number | null; // FK
  quote_effort_level_id: number; // FK NOT NULL
  quote_creator_id: number; // FK NOT NULL

  approved_at: string | null; // timestamp NOT NULL (nullable by meaning)
  is_deleted: boolean; // bool NOT NULL

  updated_at: string; // timestamp NOT NULL
  created_at: string; // timestamp NOT NULL
}

// Placeholder until DB/API is wired
const QUOTES: QuoteRow[] = [];

function formatMoneyGBP(value: string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return `£${value}`;
  return n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

function formatNumber(value: string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString('en-GB', { maximumFractionDigits: 2 });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type QuoteStatusFilter = 'all' | 'pending' | 'approved';

const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeMenu, setActiveMenu] = useState<MenuKey>('Quotes' as MenuKey);
  const [query, setQuery] = useState<string>('');
  const [status, setStatus] = useState<QuoteStatusFilter>('all');

  const visibleQuotes = useMemo(() => {
    const q = query.trim().toLowerCase();

    return QUOTES.filter((row) => {
      if (row.is_deleted) return false;

      const isApproved = Boolean(row.approved_at);
      if (status === 'approved' && !isApproved) return false;
      if (status === 'pending' && isApproved) return false;

      if (q.length === 0) return true;

      const haystack = [
        String(row.id),
        String(row.ticket_id),
        String(row.version),
        row.estimated_hours,
        row.hourly_rate,
        row.estimated_cost,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [query, status]);

  const totalQuoted = useMemo(() => {
    const sum = visibleQuotes.reduce((acc, r) => acc + (Number(r.estimated_cost) || 0), 0);
    return sum.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
  }, [visibleQuotes]);

  const pendingCount = useMemo(
    () => visibleQuotes.filter((r) => !r.approved_at).length,
    [visibleQuotes]
  );

  const approvedCount = useMemo(
    () => visibleQuotes.filter((r) => Boolean(r.approved_at)).length,
    [visibleQuotes]
  );

  const handleMenuChange = (key: MenuKey) => {
    setActiveMenu(key);

    // Keep routing explicit (and lint-safe)
    if (key === ('Dashboard' as MenuKey)) {
      void navigate('/customer');
      return;
    }
    if (key === ('Quotes' as MenuKey)) {
      void navigate('/customer/quotes');
      return;
    }
    if (key === ('Tickets' as MenuKey)) {
      void navigate('/customer/tickets');
      return;
    }
  };

  const onView = (id: number) => {
    void navigate(`/customer/quotes/${String(id)}`);
  };

  const onApprove = (row: QuoteRow) => {
    // Placeholder action (wire to API later)

    alert(`Approve quote #${String(row.id)} (wire this to your API)`);
  };

  return (
    <div className="customerPage">
      <CustomerSidebar
        activeMenu={activeMenu}
        onMenuChange={handleMenuChange}
        brandTitle="GIACOM"
        brandSub="Customer Portal"
        userName={user?.firstName ?? 'Guest'}
        userEmail={user?.email ?? 'guest@giacom'}
      />

      <main className="main" aria-label="Quotes page content">
        <header className="topBar">
          <div>
            <h1 className="pageTitle">Quotes</h1>
            <p className="pageSubtitle">Review, approve, and track your quotes</p>
          </div>
        </header>

        <section className="statsGrid" aria-label="Quote statistics">
          <div className="statCard">
            <div className="statIcon">🧾</div>
            <div className="statValue">{visibleQuotes.length}</div>
            <div className="statLabel">Total Quotes</div>
          </div>

          <div className="statCard">
            <div className="statIcon">🕑</div>
            <div className="statValue">{pendingCount}</div>
            <div className="statLabel">Pending Approval</div>
          </div>

          <div className="statCard">
            <div className="statIcon">✅</div>
            <div className="statValue">{approvedCount}</div>
            <div className="statLabel">Approved</div>
          </div>

          <div className="statCard">
            <div className="statIcon">💷</div>
            <div className="statValue">{totalQuoted}</div>
            <div className="statLabel">Total Estimated Cost</div>
          </div>
        </section>

        <section className="actionsRow" aria-label="Search and filter quotes">
          <div className="searchWrap">
            <span className="searchIcon" aria-hidden="true" />
            <input
              className="searchInput"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="Search quotes by ID, ticket, cost..."
              aria-label="Search quotes"
            />
          </div>

          <div className="quotesFilters" role="group" aria-label="Quote status filter">
            <label className="srOnly" htmlFor="quoteStatus">
              Filter by status
            </label>
            <select
              id="quoteStatus"
              className="select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as QuoteStatusFilter);
              }}
              aria-label="Filter quotes by status"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </section>

        <section className="tableShell tableShellWide" aria-label="Quotes list">
          {visibleQuotes.length === 0 ? (
            <div className="emptyState">No quotes found.</div>
          ) : (
            <div className="tableWrap">
              <table className="quotesTable">
                <caption className="srOnly">
                  Quotes table with quote ID, ticket ID, version, hours, rate, cost, resolution
                  time, status, and actions.
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Quote</th>
                    <th scope="col">Ticket</th>
                    <th scope="col">Version</th>
                    <th scope="col">Est. Hours</th>
                    <th scope="col">Hourly Rate</th>
                    <th scope="col">Est. Cost</th>
                    <th scope="col">Resolution Time</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="thActions">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleQuotes.map((row) => {
                    const isApproved = Boolean(row.approved_at);
                    const quoteId = String(row.id);

                    return (
                      <tr key={quoteId}>
                        <td>
                          <div className="cellPrimary">#{quoteId}</div>
                          <div className="cellMuted">Created {formatDateTime(row.created_at)}</div>
                        </td>

                        <td>
                          <div className="cellPrimary">#{String(row.ticket_id)}</div>
                          <div className="cellMuted">Updated {formatDateTime(row.updated_at)}</div>
                        </td>

                        <td>
                          <span className="pill">v{String(row.version)}</span>
                        </td>

                        <td>{formatNumber(row.estimated_hours)}</td>
                        <td>{formatMoneyGBP(row.hourly_rate)}</td>
                        <td>
                          <strong>{formatMoneyGBP(row.estimated_cost)}</strong>
                        </td>
                        <td>{formatNumber(row.estimated_resolution_time)}</td>

                        <td>
                          {isApproved ? (
                            <span className="status approved" aria-label="Approved">
                              Approved
                            </span>
                          ) : (
                            <span className="status pending" aria-label="Pending approval">
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="rowActions">
                          <button
                            type="button"
                            className="ghostBtn ghostBtnLight"
                            onClick={() => {
                              onView(row.id);
                            }}
                            aria-label={`View quote ${quoteId}`}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="ghostBtn"
                            onClick={() => {
                              onApprove(row);
                            }}
                            disabled={isApproved}
                            aria-disabled={isApproved}
                            aria-label={
                              isApproved
                                ? `Quote ${quoteId} already approved`
                                : `Approve quote ${quoteId}`
                            }
                            title={isApproved ? 'Already approved' : 'Approve this quote'}
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default QuotesPage;
