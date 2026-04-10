import React from 'react';
import type {
  MLQuoteEstimate,
  QuoteWithApprovalResponse,
} from '../../../../shared/contracts/quote-contracts.js';
import { getCurrency, getTimestamp } from '../../../lib/utils/formatters.js';
import AdminQuoteApproval from './AdminQuoteApproval.js';
import '../../../styles/QuotePanel.css';

interface QuotePanelProps {
  ticketId: string;
  quote: QuoteWithApprovalResponse;
  mlEstimate: MLQuoteEstimate | null;
  handleQuoteMutated: () => void;
}

const AdminQuotePanel: React.FC<QuotePanelProps> = ({
  ticketId,
  quote,
  mlEstimate,
  handleQuoteMutated,
}) => {
  return (
    <section className="card quote-panel" aria-labelledby="quote-heading" data-testid="quote-panel">
      <h2 className="quote-panel-title" id="quote-heading">
        Quote v{quote.version}
      </h2>

      <p className="quote-panel-source-label quote-panel-source-label--rule">Rule-based estimate</p>
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
          {quote.approvedAt ? (
            <dd data-testid="quote-approved-at">{getTimestamp(quote.approvedAt)}</dd>
          ) : (
            <dd data-testid="quote-approved-at">Not approved yet</dd>
          )}
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

      {mlEstimate !== null && (
        <div className="quote-panel-ml" data-testid="quote-ml-estimate">
          <p className="quote-panel-source-label quote-panel-source-label--ml">
            ML estimate
            <span className="quote-panel-ml-confidence" data-testid="quote-ml-confidence">
              {Math.round(mlEstimate.priorityConfidence * 100)}% priority confidence
            </span>
          </p>
          <dl className="quote-panel-dl quote-panel-dl--ml">
            <div>
              <dt>Estimated Cost</dt>
              <dd data-testid="quote-ml-estimated-cost">{getCurrency(mlEstimate.estimatedCost)}</dd>
            </div>

            <div>
              <dt>Hours Range</dt>
              <dd data-testid="quote-ml-hours">
                {mlEstimate.estimatedHoursMinimum}–{mlEstimate.estimatedHoursMaximum} hrs
              </dd>
            </div>

            <div>
              <dt>Suggested Priority</dt>
              <dd data-testid="quote-ml-suggested-priority">
                {mlEstimate.suggestedTicketPriority}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {mlEstimate === null && (
        <p className="quote-panel-ml-unavailable" data-testid="quote-ml-unavailable">
          ML estimate unavailable -- ticket embedding may still be processing.
        </p>
      )}

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
