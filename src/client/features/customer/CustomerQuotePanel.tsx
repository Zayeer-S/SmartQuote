import React from 'react';
import type { QuoteWithApprovalResponse } from '../../../shared/contracts/quote-contracts.js';
import QuoteActions from './QuoteActions.js';
import { getCurrency, getTimestamp } from '../../lib/utils/formatters.js';
import '../../styles/QuotePanel.css';

interface QuotePanelProps {
  ticketId: string;
  quote: QuoteWithApprovalResponse;
}

const CustomerQuotePanel: React.FC<QuotePanelProps> = ({ ticketId, quote }) => {
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

        <div>
          <dt>Hours Range</dt>
          <dd data-testid="quote-hours">
            {quote.estimatedHoursMinimum}–{quote.estimatedHoursMaximum} hrs
          </dd>
        </div>

        <div>
          <dt>Last Updated</dt>
          <dd data-testid="quote-updated-time">{getTimestamp(quote.updatedAt)}</dd>
        </div>
      </dl>

      <QuoteActions ticketId={ticketId} quoteId={quote.id} approvalStatus={quote.approvalStatus} />
    </section>
  );
};

export default CustomerQuotePanel;
