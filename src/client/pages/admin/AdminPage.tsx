import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { useListTickets } from '../../hooks/tickets/useListTicket';
import {
  STAT_CARD_DEFINITIONS,
  STAT_COLOR_BY_INDEX,
  type AdminMenuKey,
} from '../../features/adminDashboard/adminDashboard.constants.tsx';
import {
  ALL_TICKET_STATUSES,
  ALL_TICKET_PRIORITIES,
  TICKET_PRIORITIES,
} from '../../../shared/constants/lookup-values';
import './AdminPage.css';

const ALL_STATUSES_LABEL = 'All Status';
const ALL_PRIORITIES_LABEL = 'All Priority';

const AdminPage: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('Dashboard');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES_LABEL);
  const [priorityFilter, setPriorityFilter] = useState(ALL_PRIORITIES_LABEL);

  const { data, loading, error, execute: fetchTickets } = useListTickets();

  useEffect(() => {
    void fetchTickets();
    // You add dep here, you get cascade
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tickets = useMemo(() => data?.tickets ?? [], [data]);

  const statValues = useMemo(
    () => ({
      total: tickets.length,
      urgent: tickets.filter((t) => t.ticketPriorityName === TICKET_PRIORITIES.P1).length,
      unassigned: tickets.filter((t) => t.assignedToUserId === null).length,
      // Pending Quotes requires a cross-ticket aggregate endpoint — not yet available
      pendingQuotes: null,
    }),
    [tickets]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesQuery =
        query.trim() === '' ||
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.id.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === ALL_STATUSES_LABEL || t.ticketStatusName === statusFilter;

      const matchesPriority =
        priorityFilter === ALL_PRIORITIES_LABEL || t.ticketPriorityName === priorityFilter;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [tickets, query, statusFilter, priorityFilter]);

  const statDisplayValues = [
    statValues.total,
    statValues.urgent,
    statValues.unassigned,
    statValues.pendingQuotes,
  ];

  return (
    <div className="adminPage">
      <AdminSidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      <main className="adminMain">
        <header className="topBar">
          <div>
            <h1 className="pageTitle">Admin Dashboard</h1>
            <p className="pageSubtitle">Manage tickets, quotes, and customer requests</p>
          </div>
        </header>

        <section className="statsGrid">
          {STAT_CARD_DEFINITIONS.map((s, idx) => (
            <div key={s.label} className="statCard">
              <div className={`statIcon ${STAT_COLOR_BY_INDEX[idx] ?? 'blue'}`}>{s.icon}</div>
              <div className="statValue">{loading ? '…' : (statDisplayValues[idx] ?? '—')}</div>
              <div className="statLabel">{s.label}</div>
            </div>
          ))}
        </section>

        <section className="actionsRow">
          <div className="searchWrap">
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
        </section>

        <section className="filtersRow">
          <span className="filterGlyph" aria-hidden="true">
            ⚲
          </span>

          <div className="selectWrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
              }}
              aria-label="Status filter"
            >
              <option value={ALL_STATUSES_LABEL}>{ALL_STATUSES_LABEL}</option>
              {ALL_TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="selectWrap">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
              }}
              aria-label="Priority filter"
            >
              <option value={ALL_PRIORITIES_LABEL}>{ALL_PRIORITIES_LABEL}</option>
              {ALL_TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="tableShell">
          {loading && <div className="emptyState">Loading tickets…</div>}

          {!loading && error && <div className="emptyState">Failed to load tickets: {error}</div>}

          {!loading && !error && filteredTickets.length === 0 && (
            <div className="emptyState">No tickets found.</div>
          )}

          {!loading && !error && filteredTickets.length > 0 && (
            <table className="ticketTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="ticketId">{ticket.id}</td>
                    <td>{ticket.title}</td>
                    <td>
                      <span
                        className={`statusBadge status-${ticket.ticketStatusName.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {ticket.ticketStatusName}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`priorityBadge priority-${ticket.ticketPriorityName.toLowerCase()}`}
                      >
                        {ticket.ticketPriorityName}
                      </span>
                    </td>
                    <td>{ticket.ticketTypeName}</td>
                    <td>{ticket.ticketSeverityName}</td>
                    <td>
                      {ticket.assignedToUserId ?? <span className="unassigned">Unassigned</span>}
                    </td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <button
          className="helpFab"
          type="button"
          onClick={() => {
            alert('Help (placeholder)');
          }}
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
