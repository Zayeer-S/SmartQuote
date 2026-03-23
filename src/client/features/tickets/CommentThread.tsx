import React, { useEffect, useState } from 'react';
import { useListComments } from '../../hooks/tickets/useListComments.js';
import { useAddComment } from '../../hooks/tickets/useAddComment.js';
import { COMMENT_TYPES } from '../../../shared/constants/lookup-values.js';
import type { CommentType } from '../../../shared/constants/lookup-values.js';
import './CommentThread.css';

interface CommentThreadProps {
  ticketId: string;
}

const COMMENT_TYPE_OPTIONS: { value: CommentType; label: string }[] = [
  { value: COMMENT_TYPES.EXTERNAL, label: COMMENT_TYPES.EXTERNAL },
  { value: COMMENT_TYPES.INTERNAL, label: COMMENT_TYPES.INTERNAL },
];

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

const CommentThread: React.FC<CommentThreadProps> = ({ ticketId }) => {
  const list = useListComments();
  const add = useAddComment();

  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<CommentType>(COMMENT_TYPES.EXTERNAL);

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
        Comments
      </h2>

      {list.loading && (
        <p className="loading-text" data-testid="comments-loading">
          Loading comments...
        </p>
      )}

      {list.error && (
        <p className="feedback-error" role="alert" data-testid="comments-error">
          {list.error}
        </p>
      )}

      {!list.loading && comments.length === 0 && (
        <p className="loading-text" data-testid="comments-empty">
          No comments yet.
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
                    {comment.userId}
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
              {COMMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group add-comment-text-field">
            <label className="field-label" htmlFor="comment-text">
              Comment
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
                  : 'Reply to customer...'
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
          {add.loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </section>
  );
};

export default CommentThread;
