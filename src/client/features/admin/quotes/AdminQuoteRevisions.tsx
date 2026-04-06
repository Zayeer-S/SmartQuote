import React, { useEffect } from 'react';
import { useGetRevisionHistory } from '../../../hooks/quotes/useGetRevisionHistory.js';
import type { QuoteWithApprovalResponse } from '../../../../shared/contracts/quote-contracts.js';
import { getTimestamp } from '../../../lib/utils/formatters.js';
import './AdminQuoteRevisions.css';

interface AdminQuoteRevisionsProps {
  ticketId: string;
  latestQuote: QuoteWithApprovalResponse;
}

const AdminQuoteRevisions: React.FC<AdminQuoteRevisionsProps> = ({ ticketId, latestQuote }) => {
  const revisionHistory = useGetRevisionHistory();

  useEffect(() => {
    void revisionHistory.execute(ticketId, latestQuote.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestQuote.version]);

  if (revisionHistory.loading)
    return (
      <p className="loading-text" data-testid={`revision-history-loading`}>
        Loading tickets...
      </p>
    );

  return (
    <section
      className="revision-quote-subpanel card"
      aria-labelledby="revisions-heading"
      data-testid="revision-quote-revisions-section"
    >
      {revisionHistory.error && (
        <p className="feedback-error" role="alert" data-testid="revisions-error">
          {revisionHistory.error}
        </p>
      )}

      <h3 className="revision-quote-subpanel-heading" id="revisions-heading">
        Revision History
      </h3>

      {revisionHistory.data?.revisions.length === 0 && (
        <p className="loading-text" data-testid="revisions-empty">
          No revisions recorded yet.
        </p>
      )}

      {revisionHistory.data && revisionHistory.data.revisions.length > 0 && (
        <ol className="revision-list" role="list" data-testid="revisions-list">
          {revisionHistory.data.revisions.map((rev) => (
            <li key={rev.id} className="revision-item" data-testid={`revision-${String(rev.id)}`}>
              <div className="revision-meta">
                <span className="revision-field" data-testid={`revision-field-${String(rev.id)}`}>
                  {rev.fieldName}
                </span>
                <span className="revision-date" data-testid={`revision-date-${String(rev.id)}`}>
                  {getTimestamp(rev.createdAt)}
                </span>
                <span className="revision-user" data-testid={`revision-user-${String(rev.id)}`}>
                  {rev.changedByUserId}
                </span>
              </div>
              <div className="revision-diff">
                <span className="revision-old" data-testid={`revision-old-${String(rev.id)}`}>
                  {rev.oldValue}
                </span>
                <span className="revision-arrow" aria-hidden="true">
                  &rarr;
                </span>
                <span className="revision-new" data-testid={`revision-new-${String(rev.id)}`}>
                  {rev.newValue}
                </span>
              </div>
              <p className="revision-reason" data-testid={`revision-reason-${String(rev.id)}`}>
                {rev.reason}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default AdminQuoteRevisions;
