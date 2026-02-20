import React, { useEffect, useState } from 'react';
import { useGetTicket } from '../../hooks/tickets/useGetTicket';
import { useListQuotes } from '../../hooks/quotes/useListQuote';
import { useResolveTicket } from '../../hooks/tickets/useResolveTicket';
import { useTicketPermissions } from '../../hooks/auth/useTicketPermissions';
import { getStatusBadgeClass, getPriorityBadgeClass } from '../../lib/utils/badge-utils';
import AssignTicketForm from './AssignTicketForm';
import AdminQuotePanel from './AdminQuotePanel';
import CommentThread from './CommentThread';
import './AdminTicketDetail.css';

interface AdminTicketDetailProps {
  ticketId: string;
}

const AdminTicketDetail: React.FC<AdminTicketDetailProps> = ({ ticketId }) => {
  const ticket = useGetTicket();
  const quotes = useListQuotes();
  const resolve = useResolveTicket();
  const { canAssign } = useTicketPermissions();

  const [showAssignForm, setShowAssignForm] = useState(false);

  const loadTicket = (): void => {
    void ticket.execute(ticketId);
  };

  useEffect(() => {
    loadTicket();
    void quotes.execute(ticketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleResolve = (): void => {
    void resolve.execute(ticketId).then(loadTicket);
  };

  const handleAssigned = (): void => {
    setShowAssignForm(false);
    loadTicket();
  };

  const isLoading = ticket.loading || quotes.loading;
  const error = ticket.error ?? quotes.error;

  if (isLoading) {
    return (
      <p className="loading-text" data-testid="admin-ticket-detail-loading">
        Loading ticket...
      </p>
    );
  }

  if (error) {
    return (
      <p className="feedback-error" role="alert" data-testid="admin-ticket-detail-error">
        {error}
      </p>
    );
  }

  if (!ticket.data) {
    return (
      <p className="loading-text" data-testid="admin-ticket-detail-not-found">
        Ticket not found.
      </p>
    );
  }

  const t = ticket.data;

  const formattedDeadline = new Date(t.deadline).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedCreated = new Date(t.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isResolved = t.ticketStatusName === 'Resolved' || t.ticketStatusName === 'Closed';

  return (
    <div className="admin-ticket-detail" data-testid="admin-ticket-detail">
      {/* ── Header ── */}
      <div className="admin-ticket-detail-header">
        <h1 className="admin-ticket-detail-title" data-testid="ticket-title">
          {t.title}
        </h1>
        <div className="admin-ticket-detail-badges">
          <span className={getStatusBadgeClass(t.ticketStatusName)} data-testid="ticket-status">
            {t.ticketStatusName}
          </span>
          <span
            className={getPriorityBadgeClass(t.ticketPriorityName)}
            data-testid="ticket-priority"
          >
            {t.ticketPriorityName}
          </span>
        </div>
      </div>

      {/* ── Details ── */}
      <section className="admin-detail-section" aria-labelledby="ticket-info-heading">
        <h2 className="admin-detail-section-heading" id="ticket-info-heading">
          Details
        </h2>

        <p className="admin-ticket-detail-description" data-testid="ticket-description">
          {t.description}
        </p>

        <dl className="admin-detail-dl">
          <div className="admin-detail-dl-row">
            <dt>Type</dt>
            <dd data-testid="ticket-type">{t.ticketTypeName}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Severity</dt>
            <dd data-testid="ticket-severity">{t.ticketSeverityName}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Business Impact</dt>
            <dd data-testid="ticket-business-impact">{t.businessImpactName}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Users Impacted</dt>
            <dd data-testid="ticket-users-impacted">{t.usersImpacted}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Deadline</dt>
            <dd data-testid="ticket-deadline">{formattedDeadline}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Organisation</dt>
            <dd data-testid="ticket-organisation">{t.organizationName}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Submitted</dt>
            <dd data-testid="ticket-created">{formattedCreated}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Assigned To</dt>
            <dd data-testid="ticket-assignee">
              {t.assignedToUserId ?? <em className="admin-detail-unassigned">Unassigned</em>}
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Assignment ── */}
      {canAssign && (
        <section className="admin-detail-section" aria-labelledby="assign-heading">
          <h2 className="admin-detail-section-heading" id="assign-heading">
            Assignment
          </h2>
          {!showAssignForm ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setShowAssignForm(true);
              }}
              data-testid="open-assign-form-btn"
            >
              {t.assignedToUserId ? 'Reassign Ticket' : 'Assign Ticket'}
            </button>
          ) : (
            <div className="admin-detail-assign-block">
              <AssignTicketForm
                ticketId={ticketId}
                currentAssigneeId={t.assignedToUserId}
                onAssigned={handleAssigned}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAssignForm(false);
                }}
                data-testid="cancel-assign-btn"
              >
                Cancel
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Actions ── */}
      {!isResolved && (
        <section className="admin-detail-section" aria-labelledby="resolve-heading">
          <h2 className="admin-detail-section-heading" id="resolve-heading">
            Actions
          </h2>
          {resolve.error && (
            <p className="feedback-error" role="alert" data-testid="resolve-error">
              {resolve.error}
            </p>
          )}
          <div className="admin-ticket-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleResolve}
              disabled={resolve.loading}
              aria-busy={resolve.loading}
              data-testid="resolve-ticket-btn"
            >
              {resolve.loading ? 'Resolving...' : 'Mark as Resolved'}
            </button>
          </div>
        </section>
      )}

      <section className="admin-detail-section" aria-labelledby="quote-section-heading">
        <AdminQuotePanel
          ticketId={ticketId}
          quotes={quotes.data?.quotes ?? []}
          onQuoteMutated={loadTicket}
        />
      </section>

      <section className="admin-detail-section">
        <CommentThread ticketId={ticketId} />
      </section>
    </div>
  );
};

export default AdminTicketDetail;
