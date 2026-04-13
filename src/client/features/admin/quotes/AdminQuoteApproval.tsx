import React, { useState } from 'react';
import { useSubmitForApproval } from '../../../hooks/quotes/useSubmitForApproval.js';
import {
  useManagerApproveQuote,
  useManagerRejectQuote,
  useAdminApproveQuote,
} from '../../../hooks/quotes/useApproveQuote.js';
import { useQuotePermissions } from '../../../hooks/auth/useQuotePermissions.js';
import type { QuoteWithApprovalResponse } from '../../../../shared/contracts/quote-contracts.js';
import { isSubmittable, isAwaitingManagerApproval } from './AdminQuotePanel.types.js';
import './AdminQuoteApproval.css';

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
  const { canUpdate, canAgentApprove, canManagerApprove, canManagerReject, canAdminApprove } =
    useQuotePermissions();
  const submitForApproval = useSubmitForApproval();
  const managerApprove = useManagerApproveQuote();
  const managerReject = useManagerRejectQuote();
  const adminApprove = useAdminApproveQuote();

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');

  const status = latestQuote.approvalStatus ?? null;

  const handleSubmitForApproval = (): void => {
    void submitForApproval.execute(ticketId, latestQuote.id).then(onQuoteMutated);
  };

  const handleManagerApprove = (): void => {
    void managerApprove.execute(ticketId, latestQuote.id, {}).then(onQuoteMutated);
  };

  const handleAdminApprove = (): void => {
    void adminApprove.execute(ticketId, latestQuote.id, {}).then(onQuoteMutated);
  };

  const handleRejectSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!rejectionNotes.trim()) return;
    void managerReject.execute(ticketId, latestQuote.id, { comment: rejectionNotes }).then(() => {
      setRejectionNotes('');
      setShowRejectForm(false);
      onQuoteMutated();
    });
  };

  const showSubmit = canUpdate && canAgentApprove && isSubmittable(status);
  const showManagerApprove = canManagerApprove && isAwaitingManagerApproval(status);
  const showManagerReject = canManagerReject && isAwaitingManagerApproval(status);
  const showAdminApprove = canAdminApprove && isAwaitingManagerApproval(status);

  if (!showSubmit && !showManagerApprove && !showManagerReject && !showAdminApprove) return null;

  return (
    <section aria-label="Quote approval" data-testid="admin-quote-approval-section">
      <div className="admin-quote-approval" data-testid="admin-quote-approval-actions">
        {showSubmit && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmitForApproval}
            disabled={submitForApproval.loading}
            aria-busy={submitForApproval.loading}
            data-testid="submit-approval-btn"
          >
            {submitForApproval.loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        )}

        {showManagerApprove && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleManagerApprove}
            disabled={managerApprove.loading}
            aria-busy={managerApprove.loading}
            data-testid="manager-approve-quote-btn"
          >
            {managerApprove.loading ? 'Approving...' : 'Approve'}
          </button>
        )}

        {showAdminApprove && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAdminApprove}
            disabled={adminApprove.loading}
            aria-busy={adminApprove.loading}
            data-testid="admin-approve-quote-btn"
          >
            {adminApprove.loading ? 'Approving...' : 'Approve (Admin)'}
          </button>
        )}

        {showManagerReject && (
          <button
            type="button"
            className={`btn ${showRejectForm ? 'btn-ghost' : 'btn-danger'}`}
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
      {managerApprove.error && (
        <p className="feedback-error" role="alert" data-testid="approve-quote-error">
          {managerApprove.error}
        </p>
      )}
      {adminApprove.error && (
        <p className="feedback-error" role="alert" data-testid="admin-approve-quote-error">
          {adminApprove.error}
        </p>
      )}
      {managerReject.error && (
        <p className="feedback-error" role="alert" data-testid="reject-quote-error">
          {managerReject.error}
        </p>
      )}

      {showRejectForm && (
        <form
          className="admin-quote-reject"
          onSubmit={handleRejectSubmit}
          aria-label="Reject quote"
          data-testid="reject-quote-form"
        >
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
              placeholder="Explain why this quote is being rejected..."
              required
              disabled={managerReject.loading}
              rows={3}
              aria-required="true"
              data-testid="rq-notes"
            />
          </div>

          <button
            type="submit"
            className="btn btn-danger"
            disabled={managerReject.loading || !rejectionNotes.trim()}
            aria-busy={managerReject.loading}
            data-testid="reject-quote-submit-btn"
          >
            {managerReject.loading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </form>
      )}
    </section>
  );
};

export default AdminQuoteApproval;
