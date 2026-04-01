import React, { useState } from 'react';
import { useGetRevisionHistory } from '../../../hooks/quotes/useGetRevisionHistory.js';
import type { QuoteWithApprovalResponse } from '../../../../shared/contracts/quote-contracts.js';
import { fmt } from './AdminQuotePanel.types.js';

interface AdminQuoteRevisionsProps {
  ticketId: string;
  latestQuote: QuoteWithApprovalResponse;
}

const AdminQuoteRevisions: React.FC<AdminQuoteRevisionsProps> = ({ ticketId, latestQuote }) => {
  const revisionHistory = useGetRevisionHistory();
  const [loaded, setLoaded] = useState(false);

  const handleLoad = (): void => {
    setLoaded(true);
    void revisionHistory.execute(ticketId, latestQuote.id);
  };

  return (
    <section
      className="admin-quote-subpanel"
      aria-labelledby="revisions-heading"
      data-testid="admin-quote-revisions-section"
    >
      <div className="admin-quote-actions" data-testid="admin-quote-revisions-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleLoad}
          disabled={revisionHistory.loading}
          aria-busy={revisionHistory.loading}
          data-testid="show-revisions-btn"
        >
          {revisionHistory.loading ? 'Loading...' : 'Load Revision History'}
        </button>
      </div>

      {revisionHistory.error && (
        <p className="feedback-error" role="alert" data-testid="revisions-error">
          {revisionHistory.error}
        </p>
      )}

      {loaded && !revisionHistory.loading && (
        <>
          <h3 className="admin-quote-subpanel-heading" id="revisions-heading">
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
                <li
                  key={rev.id}
                  className="revision-item"
                  data-testid={`revision-${String(rev.id)}`}
                >
                  <div className="revision-meta">
                    <span
                      className="revision-field"
                      data-testid={`revision-field-${String(rev.id)}`}
                    >
                      {rev.fieldName}
                    </span>
                    <span className="revision-date" data-testid={`revision-date-${String(rev.id)}`}>
                      {fmt.date(rev.createdAt)}
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
        </>
      )}
    </section>
  );
};

export default AdminQuoteRevisions;
