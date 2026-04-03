import React from 'react';
import type { QuoteWithApprovalResponse } from '../../../../shared/contracts/quote-contracts.js';
import { getCurrency, getTimestamp } from '../../../lib/utils/formatters.js';
import '../../../styles/QuotePanel.css';
import AdminQuoteApproval from './AdminQuoteApproval.js';

interface QuotePanelProps {
  ticketId: string;
  quote: QuoteWithApprovalResponse;
  handleQuoteMutated: () => void;
}

const AdminQuotePanel: React.FC<QuotePanelProps> = ({ ticketId, quote, handleQuoteMutated }) => {
  return (
    <section className="card quote-panel" aria-labelledby="quote-heading" data-testid="quote-panel">
      <h2 className="quote-panel-title" id="quote-heading">
        Quote v{quote.version}
      </h2>

      <dl className="quote-panel-dl">
        <div>
          <dt>Estimated Total Cost</dt>
          <dd data-testid="quote-estimated-cost">{getCurrency(quote.estimatedCost)}</dd>
        </div>

        <div>
          <dt>Fixed Costs</dt>
          <dd data-testid="quote-fixed-cost">{getCurrency(quote.fixedCost)}</dd>
        </div>

        <div className="admin-detail-dl-row">
          <dt>Final Cost</dt>
          <dd data-testid="quote-final-cost">
            {quote.finalCost != null && quote.finalCost != 0 ? (
              getCurrency(quote.finalCost)
            ) : (
              <p className="admin-detail-unassigned">TBD</p>
            )}
          </dd>
        </div>

        <div className="admin-detail-dl-row">
          <dt>Hourly Rate</dt>
          <dd data-testid="quote-hourly-rate">{getCurrency(quote.hourlyRate)}/hr</dd>
        </div>

        <div>
          <dt>Hours Range</dt>
          <dd data-testid="quote-hours">
            {quote.estimatedHoursMinimum}–{quote.estimatedHoursMaximum} hrs
          </dd>
        </div>

        <div>
          <dt>Creator</dt>
          <dd data-testid="quote-creator">{quote.quoteCreator}</dd>
        </div>

        <div>
          <dt>Effort Level</dt>
          <dd data-testid="quote-effort">{quote.quoteEffortLevel}</dd>
        </div>

        <div>
          <dt>Confidence Level</dt>
          <dd data-testid="quote-confidence">
            {quote.quoteConfidenceLevel ?? <em className="admin-detail-unassigned">Not set</em>}
          </dd>
        </div>

        <div>
          <dt>Suggested Priority</dt>
          <dd data-testid="quote-suggested-priority">{quote.suggestedTicketPriority}</dd>
        </div>

        <div>
          <dt>Approved At</dt>
          {quote.approvedAt && (
            <dd data-testid="quote-approved-at">{getTimestamp(quote.approvedAt)}</dd>
          )}{' '}
          {!quote.approvedAt && <dd data-testid="quote-approved-at">Not approved yet</dd>}
        </div>

        <div>
          <dt>Last Updated</dt>
          <dd data-testid="quote-updated-time">{getTimestamp(quote.updatedAt)}</dd>
        </div>

        <div>
          <dt>Created</dt>
          <dd data-testid="quote-created-at">{getTimestamp(quote.createdAt)}</dd>
        </div>
      </dl>

      {quote.approvalComment && (
        <div className="quote-panel-approval-comment" data-testid="approval-comment">
          <h3 className="admin-quote-approval-comment-label">Approval Comment</h3>
          <p className="admin-quote-approval-comment-body">{quote.approvalComment}</p>
        </div>
      )}

      {!quote.approvalComment && (
        <AdminQuoteApproval
          ticketId={ticketId}
          latestQuote={quote}
          onQuoteMutated={handleQuoteMutated}
        />
      )}
    </section>
  );
};

export default AdminQuotePanel;
