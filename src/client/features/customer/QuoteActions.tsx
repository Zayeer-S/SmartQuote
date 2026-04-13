import React, { useState } from 'react';
import {
  useCustomerApproveQuote,
  useCustomerRejectQuote,
} from '../../hooks/quotes/useApproveQuote.js';
import { isAwaitingCustomerAction } from '../../features/admin/quotes/AdminQuotePanel.types.js';
import type { QuoteApprovalStatus } from '../../../shared/constants/lookup-values.js';
import './QuoteActions.css';

interface QuoteActionsProps {
  ticketId: string;
  quoteId: string;
  approvalStatus?: QuoteApprovalStatus | null;
}

const QuoteActions: React.FC<QuoteActionsProps> = ({ ticketId, quoteId, approvalStatus }) => {
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const approve = useCustomerApproveQuote();
  const reject = useCustomerRejectQuote();

  // Only show actions when the quote is waiting for the customer's decision
  if (!isAwaitingCustomerAction(approvalStatus ?? null)) {
    return null;
  }

  const isBusy = approve.loading || reject.loading;

  const handleApprove = (): void => {
    void approve.execute(ticketId, quoteId, {});
  };

  const handleRejectSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!rejectComment.trim()) return;
    void reject.execute(ticketId, quoteId, { comment: rejectComment });
  };

  const handleOpenRejectForm = (): void => {
    setShowRejectForm(true);
  };

  const handleCancelReject = (): void => {
    setShowRejectForm(false);
    setRejectComment('');
  };

  if (approve.data) {
    return (
      <p className="feedback-success" data-testid="approve-success">
        Quote accepted successfully.
      </p>
    );
  }

  if (reject.data) {
    return (
      <p className="feedback-success" data-testid="reject-success">
        Quote rejected successfully.
      </p>
    );
  }

  return (
    <div className="quote-actions" data-testid="quote-actions">
      {approve.error && (
        <p className="feedback-error" role="alert" data-testid="approve-error">
          {approve.error}
        </p>
      )}
      {reject.error && (
        <p className="feedback-error" role="alert" data-testid="reject-error">
          {reject.error}
        </p>
      )}

      <div className="quote-actions-buttons">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleApprove}
          disabled={isBusy || showRejectForm}
          aria-busy={approve.loading}
          data-testid="approve-btn"
        >
          {approve.loading ? 'Accepting...' : 'Accept Quote'}
        </button>

        {!showRejectForm && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleOpenRejectForm}
            disabled={isBusy}
            data-testid="open-reject-btn"
          >
            Reject Quote
          </button>
        )}
      </div>

      {showRejectForm && (
        <form
          className="quote-actions-reject-form"
          onSubmit={handleRejectSubmit}
          data-testid="reject-form"
        >
          <label className="quote-actions-reject-form-label" htmlFor="reject-comment">
            Reason for rejection <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="reject-comment"
            className="field-textarea"
            value={rejectComment}
            onChange={(e) => {
              setRejectComment(e.target.value);
            }}
            placeholder="Please explain why you are rejecting this quote"
            required
            disabled={isBusy}
            rows={3}
            aria-required="true"
            data-testid="reject-comment-input"
          />
          <div className="quote-actions-reject-form-actions">
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isBusy || !rejectComment.trim()}
              aria-busy={reject.loading}
              data-testid="confirm-reject-btn"
            >
              {reject.loading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCancelReject}
              disabled={isBusy}
              data-testid="cancel-reject-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default QuoteActions;
