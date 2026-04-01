import React from 'react';
import type { QuoteResponse } from '../../../../shared/contracts/quote-contracts.js';
import QuoteActions from './QuoteActions.js';
import './QuotePanel.css';

interface QuotePanelProps {
  ticketId: string;
  quote: QuoteResponse;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

const QuotePanel: React.FC<QuotePanelProps> = ({ ticketId, quote }) => {
  return (
    <section className="card quote-panel" aria-labelledby="quote-heading" data-testid="quote-panel">
      <h2 className="quote-panel-title" id="quote-heading">
        Quote v{quote.version}
      </h2>

      <dl className="quote-panel-dl">
        <div>
          <dt>Estimated Total Cost</dt>
          <dd data-testid="quote-estimated-cost">{formatCurrency(quote.estimatedCost)}</dd>
        </div>

        <div>
          <dt>Fixed Costs</dt>
          <dd data-testid="quote-fixed-cost">{formatCurrency(quote.fixedCost)}</dd>
        </div>

        <div>
          <dt>Hours Range</dt>
          <dd data-testid="quote-hours">
            {quote.estimatedHoursMinimum}–{quote.estimatedHoursMaximum} hrs
          </dd>
        </div>

        <div>
          <dt>Resolution Time</dt>
          <dd data-testid="quote-resolution-time">{quote.estimatedResolutionTime} hrs</dd>
        </div>
      </dl>

      <QuoteActions ticketId={ticketId} quoteId={quote.id} />
    </section>
  );
};

export default QuotePanel;
