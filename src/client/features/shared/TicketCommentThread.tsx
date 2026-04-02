import React, { useEffect, useState } from 'react';
import { useListComments } from '../../hooks/tickets/useListComments.js';
import { useAddComment } from '../../hooks/tickets/useAddComment.js';
import { useTicketPermissions } from '../../hooks/auth/useTicketPermissions.js';
import { COMMENT_TYPES } from '../../../shared/constants/lookup-values.js';
import type { CommentType } from '../../../shared/constants/lookup-values.js';
import './TicketCommentThread.css';

interface CommentThreadProps {
  ticketId: string;
}

const COMMENT_TYPE_CLASS: Record<CommentType, string> = {
  [COMMENT_TYPES.INTERNAL]: 'comment-item comment-item--internal',
  [COMMENT_TYPES.EXTERNAL]: 'comment-item comment-item--external',
  [COMMENT_TYPES.SYSTEM]: 'comment-item comment-item--system',
};

const COMMENT_TYPE_BADGE_CLASS: Record<CommentType, string> = {
  [COMMENT_TYPES.INTERNAL]: 'badge comment-type-badge comment-type-badge--internal',
  [COMMENT_TYPES.EXTERNAL]: 'badge comment-type-badge comment-type-badge--external',
  [COMMENT_TYPES.SYSTEM]: 'badge comment-type-badge comment-type-badge--system',
};

const TicketCommentThread: React.FC<CommentThreadProps> = ({ ticketId }) => {
  const list = useListComments();
  const add = useAddComment();
  const { canUpdateAll } = useTicketPermissions();

  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<CommentType>(COMMENT_TYPES.EXTERNAL);

  // Reset type selection to EXTERNAL if the user loses the canUpdateAll permission
  // (e.g. session change) while INTERNAL is selected
  useEffect(() => {
    if (!canUpdateAll && commentType === COMMENT_TYPES.INTERNAL) {
      setCommentType(COMMENT_TYPES.EXTERNAL);
    }
  }, [canUpdateAll, commentType]);

  useEffect(() => {
    void list.execute(ticketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!commentText.trim()) return;
    void add.execute(ticketId, { commentText, commentType }).then(() => {
      setCommentText('');
      void list.execute(ticketId);
    });
  };

  const comments = list.data?.comments ?? [];

  return (
    <section
      className="comment-thread"
      aria-labelledby="comments-heading"
      data-testid="comment-thread"
    >
      <h2 className="admin-detail-section-heading" id="comments-heading">
        Messages
      </h2>

      {list.loading && (
        <p className="loading-text" data-testid="comments-loading">
          Loading messages...
        </p>
      )}

      {list.error && (
        <p className="feedback-error" role="alert" data-testid="comments-error">
          {list.error}
        </p>
      )}

      {!list.loading && comments.length === 0 && (
        <p className="loading-text" data-testid="comments-empty">
          No messages yet.
        </p>
      )}

      {comments.length > 0 && (
        <ol className="comment-list" role="list" data-testid="comments-list">
          {comments.map((comment) => {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            const itemClass = COMMENT_TYPE_CLASS[comment.commentType] ?? 'comment-item';
            const badgeClass =
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              COMMENT_TYPE_BADGE_CLASS[comment.commentType] ?? 'badge badge-neutral';

            const formattedDate = new Date(comment.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <li
                key={comment.id}
                className={itemClass}
                data-testid={`comment-${String(comment.id)}`}
              >
                <div className="comment-meta">
                  <span className={badgeClass} data-testid={`comment-type-${String(comment.id)}`}>
                    {comment.commentType}
                  </span>
                  <span className="comment-user" data-testid={`comment-user-${String(comment.id)}`}>
                    {comment.authorDisplayName}
                  </span>
                  <span className="comment-date" data-testid={`comment-date-${String(comment.id)}`}>
                    {formattedDate}
                  </span>
                </div>
                <p className="comment-text" data-testid={`comment-text-${String(comment.id)}`}>
                  {comment.commentText}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      <form
        className="add-comment-form"
        onSubmit={handleSubmit}
        aria-label="Add comment"
        data-testid="add-comment-form"
      >
        <div className="add-comment-form-controls">
          {canUpdateAll && (
            <div className="field-group add-comment-type-field">
              <label className="field-label" htmlFor="comment-type">
                Type
              </label>
              <select
                className="field-select"
                id="comment-type"
                value={commentType}
                onChange={(e) => {
                  setCommentType(e.target.value as CommentType);
                }}
                disabled={add.loading}
                data-testid="comment-type-select"
              >
                <option value={COMMENT_TYPES.EXTERNAL}>{COMMENT_TYPES.EXTERNAL}</option>
                <option value={COMMENT_TYPES.INTERNAL}>{COMMENT_TYPES.INTERNAL}</option>
              </select>
            </div>
          )}

          <div className="field-group add-comment-text-field">
            <label className="field-label" htmlFor="comment-text">
              Message
            </label>
            <textarea
              className="field-textarea"
              id="comment-text"
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
              }}
              placeholder={
                commentType === COMMENT_TYPES.INTERNAL
                  ? 'Internal note (not visible to customer)...'
                  : canUpdateAll
                    ? 'Reply to customer'
                    : 'Reply to Giacom'
              }
              required
              disabled={add.loading}
              rows={3}
              aria-required="true"
              data-testid="comment-text-input"
            />
          </div>
        </div>

        {add.error && (
          <p className="feedback-error" role="alert" data-testid="add-comment-error">
            {add.error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={add.loading || !commentText.trim()}
          aria-busy={add.loading}
          data-testid="add-comment-btn"
        >
          {add.loading ? 'Sending...' : 'Send a message'}
        </button>
      </form>
    </section>
  );
};

export default TicketCommentThread;
