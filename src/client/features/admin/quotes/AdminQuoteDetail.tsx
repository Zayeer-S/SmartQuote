import React from 'react';
import type { QuoteWithApprovalResponse } from '../../../../shared/contracts/quote-contracts.js';
import { APPROVAL_STATUS_BADGE } from './AdminQuotePanel.types.js';
import { getCurrency, getTimestamp } from '../../../lib/utils/formatters.js';

interface AdminQuoteDetailProps {
  quote: QuoteWithApprovalResponse;
}

const AdminQuoteDetail: React.FC<AdminQuoteDetailProps> = ({ quote }) => {
  const approvalBadgeClass =
    quote.approvalStatus != null
      ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        (APPROVAL_STATUS_BADGE[quote.approvalStatus] ?? 'badge badge-neutral')
      : 'badge badge-neutral';

  const approvalLabel = quote.approvalStatus ?? 'Not Submitted';

  return (
    <>
      <div className="admin-quote-display" data-testid="admin-quote-display">
        <div className="admin-quote-display-header">
          <span className="admin-quote-version-badge">v{quote.version}</span>
          <span className={approvalBadgeClass}>{approvalLabel}</span>
          <span className="badge badge-neutral">{quote.quoteCreator}</span>
        </div>

        <dl className="admin-detail-dl">
          <div className="admin-detail-dl-row">
            <dt>Estimated Cost</dt>
            <dd data-testid="quote-estimated-cost">{getCurrency(quote.estimatedCost)}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Fixed Cost</dt>
            <dd data-testid="quote-fixed-cost">{getCurrency(quote.fixedCost)}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Final Cost</dt>
            <dd data-testid="quote-final-cost">
              {quote.finalCost != null ? (
                getCurrency(quote.finalCost)
              ) : (
                <em className="admin-detail-unassigned">Not set</em>
              )}
            </dd>
          </div>

          <div className="admin-detail-dl-row">
            <dt>Estimated Hours</dt>
            <dd data-testid="quote-hours">
              {quote.estimatedHoursMinimum}-{quote.estimatedHoursMaximum} hrs
            </dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Est. Resolution Time</dt>
            <dd data-testid="quote-resolution-time">{quote.estimatedResolutionTime} days</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Hourly Rate</dt>
            <dd data-testid="quote-hourly-rate">{getCurrency(quote.hourlyRate)}/hr</dd>
          </div>

          <div className="admin-detail-dl-row">
            <dt>Effort Level</dt>
            <dd data-testid="quote-effort">{quote.quoteEffortLevel}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Confidence Level</dt>
            <dd data-testid="quote-confidence">
              {quote.quoteConfidenceLevel ?? <em className="admin-detail-unassigned">Not set</em>}
            </dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Suggested Priority</dt>
            <dd data-testid="quote-suggested-priority">{quote.suggestedTicketPriority}</dd>
          </div>

          <div className="admin-detail-dl-row">
            <dt>Created</dt>
            <dd data-testid="quote-created-at">{getTimestamp(quote.createdAt)}</dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Last Updated</dt>
            <dd data-testid="quote-updated-at">{getTimestamp(quote.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      {quote.approvalComment && (
        <div className="admin-quote-approval-comment" data-testid="approval-comment">
          <span className="admin-quote-approval-comment-label">Approval Comment</span>
          <p className="admin-quote-approval-comment-body">{quote.approvalComment}</p>
        </div>
      )}
    </>
  );
};

export default AdminQuoteDetail;
