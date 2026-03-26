import React, { useEffect, useState } from 'react';
import { useGetTicket } from '../../hooks/tickets/useGetTicket.js';
import { useListQuotes } from '../../hooks/quotes/useListQuote.js';
import { useResolveTicket } from '../../hooks/tickets/useResolveTicket.js';
import { useTicketPermissions } from '../../hooks/auth/useTicketPermissions.js';
import {
  getStatusBadgeClass,
  getPriorityBadgeClass,
  getSlaBadgeClass,
} from '../../lib/utils/badge-utils.js';
import type { SlaStatusResponse } from '../../../shared/contracts/sla-contracts.js';
import AssignTicketForm from './AssignTicketForm.js';
import AdminQuotePanel from './AdminQuotePanel.js';
import CommentThread from './CommentThread.js';
import AttachmentList from './AttachmentList.js';
import SimilarTicketsPanel from '../admin/tickets/SimilarTicketsPanel.js';
import './AdminTicketDetail.css';

interface AdminTicketDetailProps {
  ticketId: string;
}

interface SlaSectionProps {
  slaStatus: SlaStatusResponse;
}

const SlaSection: React.FC<SlaSectionProps> = ({ slaStatus }) => {
  return (
    <section
      className="admin-detail-section"
      aria-labelledby="sla-section-heading"
      data-testid="sla-section"
    >
      <h2 className="admin-detail-section-heading" id="sla-section-heading">
        SLA
      </h2>

      <div className="sla-detail-header">
        <span className="sla-detail-policy-name" data-testid="sla-policy-name">
          {slaStatus.policyName}
        </span>
        <span
          className={getSlaBadgeClass(slaStatus.deadlineBreached)}
          data-testid="sla-breach-badge"
        >
          {slaStatus.deadlineBreached ? 'Deadline Breached' : 'Within Deadline'}
        </span>
      </div>

      {slaStatus.severityTarget !== null && (
        <dl className="admin-detail-dl sla-detail-current-target">
          <div className="admin-detail-dl-row">
            <dt>Response Target</dt>
            <dd data-testid="sla-response-target">
              {formatHours(slaStatus.severityTarget.responseTimeHours)}
            </dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Resolution Target</dt>
            <dd data-testid="sla-resolution-target">
              {formatHours(slaStatus.severityTarget.resolutionTimeHours)}
            </dd>
          </div>
        </dl>
      )}

      <table
        className="admin-table sla-detail-targets-table"
        aria-label="SLA targets by severity"
        data-testid="sla-targets-table"
      >
        <thead>
          <tr>
            <th scope="col">Severity</th>
            <th scope="col">Response Target</th>
            <th scope="col">Resolution Target</th>
          </tr>
        </thead>
        <tbody>
          {slaStatus.allSeverityTargets.map((target) => (
            <tr
              key={target.severity}
              data-testid={`sla-target-row-${target.severity.toLowerCase()}`}
            >
              <td>{target.severity}</td>
              <td>{formatHours(target.responseTimeHours)}</td>
              <td>{formatHours(target.resolutionTimeHours)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

/** Format a decimal hour value into a human-readable string. */
function formatHours(hours: number): string {
  if (hours < 1) {
    return `${String(Math.round(hours * 60))} min`;
  }
  if (hours % 1 === 0) {
    return `${String(hours)} hr${hours === 1 ? '' : 's'}`;
  }
  // e.g. 1.5 -> "1 hr 30 min"
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${String(wholeHours)} hr ${String(minutes)} min`;
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

  useEffect(() => {
    console.log('quotes data updated:', JSON.stringify(quotes.data, null, 2));
  }, [quotes.data]);

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

  const isResolved = t.ticketStatus === 'Resolved' || t.ticketStatus === 'Closed';

  return (
    <div className="admin-ticket-detail" data-testid="admin-ticket-detail">
      {/* -- Header -- */}
      <div className="admin-ticket-detail-header">
        <h1 className="admin-ticket-detail-title" data-testid="ticket-title">
          {t.title}
        </h1>
        <div className="admin-ticket-detail-badges">
          <span className={getStatusBadgeClass(t.ticketStatus)} data-testid="ticket-status">
            {t.ticketStatus}
          </span>
          <span className={getPriorityBadgeClass(t.ticketPriority)} data-testid="ticket-priority">
            {t.ticketPriority}
          </span>
          {t.slaStatus !== null && (
            <span
              className={getSlaBadgeClass(t.slaStatus.deadlineBreached)}
              data-testid="ticket-sla-badge-header"
              title={t.slaStatus.policyName}
            >
              {t.slaStatus.deadlineBreached ? 'SLA Breached' : 'SLA OK'}
            </span>
          )}
        </div>
      </div>

      {/* -- Details -- */}
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
            <dd data-testid="ticket-type">{t.ticketType}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Severity</dt>
            <dd data-testid="ticket-severity">{t.ticketSeverity}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Business Impact</dt>
            <dd data-testid="ticket-business-impact">{t.businessImpact}</dd>
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

      {/* -- SLA -- */}
      {t.slaStatus !== null && <SlaSection slaStatus={t.slaStatus} />}

      {/* -- Assignment -- */}
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

      {/* -- Actions -- */}
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

      <section className="admin-detail-section" aria-labelledby="attachments-section-heading">
        <h2 className="admin-detail-section-heading" id="attachments-section-heading">
          Attachments
        </h2>
        <AttachmentList ticketId={ticketId} attachments={t.attachments} />
      </section>

      <section className="admin-detail-section" aria-labelledby="quote-section-heading">
        <AdminQuotePanel
          ticketId={ticketId}
          quotes={quotes.data?.quotes ?? []}
          onQuoteMutated={() => {
            loadTicket();
            void quotes.execute(ticketId).then((result) => {
              console.log('quotes re-fetched:', result);
            });
          }}
        />
      </section>

      {/* -- Similar Tickets -- */}
      <SimilarTicketsPanel ticketId={ticketId} />

      <section className="admin-detail-section">
        <CommentThread ticketId={ticketId} />
      </section>
    </div>
  );
};

export default AdminTicketDetail;
