import React, { useState } from 'react';
import { useSubmitForApproval } from '../../../hooks/quotes/useSubmitForApproval.js';
import { useApproveQuote } from '../../../hooks/quotes/useApproveQuote.js';
import { useRejectQuote } from '../../../hooks/quotes/useRejectQuote.js';
import { useQuotePermissions } from '../../../hooks/auth/useQuotePermissions.js';
import type { QuoteWithApprovalResponse } from '../../../../shared/contracts/quote-contracts.js';
import { isSubmittable, isPending } from './AdminQuotePanel.types.js';

interface AdminQuoteApprovalProps {
  ticketId: string;
  latestQuote: QuoteWithApprovalResponse;
  onQuoteMutated: () => void;
}

const AdminQuoteApproval: React.FC<AdminQuoteApprovalProps> = ({
  ticketId,
  latestQuote,
  onQuoteMutated,
}) => {
  const { canUpdate, canApprove, canReject } = useQuotePermissions();
  const submitForApproval = useSubmitForApproval();
  const approveQuote = useApproveQuote();
  const rejectQuote = useRejectQuote();

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');

  const status = latestQuote.approvalStatus ?? null;

  const handleSubmitForApproval = (): void => {
    void submitForApproval.execute(ticketId, latestQuote.id).then(onQuoteMutated);
  };

  const handleApprove = (): void => {
    void approveQuote.execute(ticketId, latestQuote.id, {}).then(onQuoteMutated);
  };

  const handleRejectSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!rejectionNotes.trim()) return;
    void rejectQuote.execute(ticketId, latestQuote.id, { comment: rejectionNotes }).then(() => {
      setRejectionNotes('');
      setShowRejectForm(false);
      onQuoteMutated();
    });
  };

  const showSubmit = canUpdate && isSubmittable(status);
  const showApprove = canApprove && isPending(status);
  const showReject = canReject && isPending(status);

  if (!showSubmit && !showApprove && !showReject) return null;

  return (
    <section aria-label="Quote approval" data-testid="admin-quote-approval-section">
      <div className="admin-quote-actions" data-testid="admin-quote-approval-actions">
        {showSubmit && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSubmitForApproval}
            disabled={submitForApproval.loading}
            aria-busy={submitForApproval.loading}
            data-testid="submit-approval-btn"
          >
            {submitForApproval.loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        )}

        {showApprove && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleApprove}
            disabled={approveQuote.loading}
            aria-busy={approveQuote.loading}
            data-testid="approve-quote-btn"
          >
            {approveQuote.loading ? 'Approving...' : 'Approve'}
          </button>
        )}

        {showReject && (
          <button
            type="button"
            className={`btn btn-sm ${showRejectForm ? 'btn-ghost' : 'btn-danger'}`}
            onClick={() => {
              setShowRejectForm((prev) => !prev);
            }}
            data-testid="toggle-reject-quote-btn"
          >
            {showRejectForm ? 'Cancel' : 'Reject'}
          </button>
        )}
      </div>

      {submitForApproval.error && (
        <p className="feedback-error" role="alert" data-testid="submit-approval-error">
          {submitForApproval.error}
        </p>
      )}
      {approveQuote.error && (
        <p className="feedback-error" role="alert" data-testid="approve-quote-error">
          {approveQuote.error}
        </p>
      )}
      {rejectQuote.error && (
        <p className="feedback-error" role="alert" data-testid="reject-quote-error">
          {rejectQuote.error}
        </p>
      )}

      {showRejectForm && (
        <form
          className="admin-quote-subpanel"
          onSubmit={handleRejectSubmit}
          aria-label="Reject quote"
          data-testid="reject-quote-form"
        >
          <h3 className="admin-quote-subpanel-heading">Reject Quote</h3>

          <div className="field-group">
            <label className="field-label" htmlFor="rq-notes">
              Rejection Reason
            </label>
            <textarea
              className="field-textarea"
              id="rq-notes"
              value={rejectionNotes}
              onChange={(e) => {
                setRejectionNotes(e.target.value);
              }}
              placeholder="Required -- explain why this quote is being rejected"
              required
              disabled={rejectQuote.loading}
              rows={3}
              aria-required="true"
              data-testid="rq-notes"
            />
          </div>

          <button
            type="submit"
            className="btn btn-danger btn-sm"
            disabled={rejectQuote.loading || !rejectionNotes.trim()}
            aria-busy={rejectQuote.loading}
            data-testid="reject-quote-submit-btn"
          >
            {rejectQuote.loading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </form>
      )}
    </section>
  );
};

export default AdminQuoteApproval;
