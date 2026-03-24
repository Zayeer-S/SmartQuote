import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuotesPage.css';

/**
 * ERD: quotes table fields (exact match)
 * Decimals modeled as string to avoid SQL precision issues.
 */
export interface QuoteRow {
  id: number;
  ticket_id: number;
  version: number;
  estimated_hours: string;
  hourly_rate: string;
  estimated_resolution_time: string;
  estimated_cost: string;
  quote_approval_id: number | null;
  suggested_ticket_priority_level_id: number | null;
  quote_effort_level_id: number;
  quote_creator_id: number;
  approved_at: string | null;
  is_deleted: boolean;
  updated_at: string;
  created_at: string;
}

// Placeholder until DB/API is wired
const QUOTES: QuoteRow[] = [];

/* ── SVG Icons ── */
const IconSearch = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="22" y2="22" />
  </svg>
);

const IconFilter = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconFileText = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);

const IconClock = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconPound = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <text x="4" y="18" fontSize="18" fontFamily="Arial" fill="currentColor" stroke="none">
      £
    </text>
  </svg>
);

const IconHash = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

/* ── Helpers ── */
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

  const onView = (id: number) => {
    void navigate(`/customer/quotes/${String(id)}`);
  };

  const onApprove = (row: QuoteRow) => {
    alert(`Approve quote #${String(row.id)} (wire this to your API)`);
  };

  return (
    <div className="quotes-page">
      {/* ── Page header ── */}
      <div className="quotes-header">
        <div>
          <h1 className="quotes-title">Quotes</h1>
          <p className="quotes-subtitle">Review, approve, and track your quotes</p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="quotes-stats-grid" aria-label="Quote statistics">
        <div className="quotes-stat-card quotes-stat-purple">
          <div className="quotes-stat-icon-wrap quotes-stat-icon-purple">
            <IconHash />
          </div>
          <div className="quotes-stat-label">Total Quotes</div>
          <div className="quotes-stat-value">{visibleQuotes.length}</div>
        </div>

        <div className="quotes-stat-card quotes-stat-amber">
          <div className="quotes-stat-icon-wrap quotes-stat-icon-amber">
            <IconClock />
          </div>
          <div className="quotes-stat-label">Pending Approval</div>
          <div className="quotes-stat-value">{pendingCount}</div>
        </div>

        <div className="quotes-stat-card quotes-stat-green">
          <div className="quotes-stat-icon-wrap quotes-stat-icon-green">
            <IconCheck />
          </div>
          <div className="quotes-stat-label">Approved</div>
          <div className="quotes-stat-value">{approvedCount}</div>
        </div>

        <div className="quotes-stat-card quotes-stat-navy">
          <div className="quotes-stat-icon-wrap quotes-stat-icon-navy">
            <IconPound />
          </div>
          <div className="quotes-stat-label">Total Est. Cost</div>
          <div className="quotes-stat-value quotes-stat-value-sm">{totalQuoted}</div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="quotes-toolbar" aria-label="Search and filter quotes">
        <div className="quotes-search-wrap">
          <span className="quotes-search-icon">
            <IconSearch />
          </span>
          <input
            className="quotes-search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Search by quote ID, ticket, cost..."
            aria-label="Search quotes"
          />
        </div>

        <div className="quotes-filter-wrap">
          <span className="quotes-filter-icon">
            <IconFilter />
          </span>
          <select
            className="quotes-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as QuoteStatusFilter);
            }}
            aria-label="Filter quotes by status"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="quotes-table-shell" aria-label="Quotes list">
        {visibleQuotes.length === 0 ? (
          <div className="quotes-empty">
            <div className="quotes-empty-icon-wrap">
              <IconFileText />
            </div>
            <p className="quotes-empty-title">No quotes found</p>
            <p className="quotes-empty-sub">
              {query || status !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Quotes will appear here once raised against your tickets.'}
            </p>
          </div>
        ) : (
          <div className="quotes-table-wrap">
            <table className="quotes-table">
              <caption className="srOnly">
                Quotes table: Quote ID, Ticket, Version, Est. Hours, Hourly Rate, Est. Cost,
                Resolution Time, Status, Actions.
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
                  <th scope="col" className="th-actions">
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
                        <div className="cell-primary">#{quoteId}</div>
                        <div className="cell-muted">Created {formatDateTime(row.created_at)}</div>
                      </td>
                      <td>
                        <div className="cell-primary">#{String(row.ticket_id)}</div>
                        <div className="cell-muted">Updated {formatDateTime(row.updated_at)}</div>
                      </td>
                      <td>
                        <span className="version-pill">v{String(row.version)}</span>
                      </td>
                      <td>{formatNumber(row.estimated_hours)}</td>
                      <td>{formatMoneyGBP(row.hourly_rate)}</td>
                      <td>
                        <strong>{formatMoneyGBP(row.estimated_cost)}</strong>
                      </td>
                      <td>{formatNumber(row.estimated_resolution_time)}</td>
                      <td>
                        {isApproved ? (
                          <span className="quote-status quote-status-approved">
                            <IconCheck /> Approved
                          </span>
                        ) : (
                          <span className="quote-status quote-status-pending">
                            <IconClock /> Pending
                          </span>
                        )}
                      </td>
                      <td className="row-actions">
                        <button
                          type="button"
                          className="quote-btn quote-btn-ghost"
                          onClick={() => {
                            onView(row.id);
                          }}
                          aria-label={`View quote ${quoteId}`}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="quote-btn quote-btn-primary"
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
      </div>
    </div>
  );
};

export default QuotesPage;
