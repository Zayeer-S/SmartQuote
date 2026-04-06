import React, { useEffect, useState } from 'react';
import { useListComments } from '../../hooks/tickets/useListComments.js';
import { useAddComment } from '../../hooks/tickets/useAddComment.js';
import { useTicketPermissions } from '../../hooks/auth/useTicketPermissions.js';
import { COMMENT_TYPES } from '../../../shared/constants/lookup-values.js';
import type { CommentType } from '../../../shared/constants/lookup-values.js';
import TabNav from '../../components/TabNav.js';
import type { TabNavItem } from '../../components/TabNav.js';
import './TicketCommentThread.css';

interface CommentThreadProps {
  ticketId: string;
}

type CommentChannel = 'customer' | 'internal';

const CHANNEL_TABS: TabNavItem<CommentChannel>[] = [
  { key: 'customer', label: 'External' },
  { key: 'internal', label: 'Internal' },
];

// Customer channel shows public-facing traffic; internal is staff-only.
// SYSTEM comments are informational and belong alongside the customer channel.
const CHANNEL_TYPES: Record<CommentChannel, CommentType[]> = {
  customer: [COMMENT_TYPES.EXTERNAL, COMMENT_TYPES.SYSTEM],
  internal: [COMMENT_TYPES.INTERNAL],
};

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

  const [activeChannel, setActiveChannel] = useState<CommentChannel>('customer');
  const [commentText, setCommentText] = useState('');

  // If the user loses admin permission mid-session while on the internal channel,
  // snap back to the customer channel so they cannot see or submit internal messages.
  useEffect(() => {
    if (!canUpdateAll && activeChannel === 'internal') {
      setActiveChannel('customer');
    }
  }, [canUpdateAll, activeChannel]);

  useEffect(() => {
    void list.execute(ticketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  // Derived from active channel -- no separate state needed.
  const commentType: CommentType =
    activeChannel === 'internal' ? COMMENT_TYPES.INTERNAL : COMMENT_TYPES.EXTERNAL;

  const allComments = list.data?.comments ?? [];
  const visibleComments = allComments.filter((c) =>
    CHANNEL_TYPES[activeChannel].includes(c.commentType)
  );

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!commentText.trim()) return;
    void add.execute(ticketId, { commentText, commentType }).then(() => {
      setCommentText('');
      void list.execute(ticketId);
    });
  };

  return (
    <section
      className="comment-thread"
      aria-labelledby="comments-heading"
      data-testid="comment-thread"
    >
      {canUpdateAll && (
        <div className="comment-thread-tabs" data-testid="comment-thread-tabs">
          <TabNav
            tabs={CHANNEL_TABS}
            activeTab={activeChannel}
            onTabChange={(key) => {
              setActiveChannel(key);
              setCommentText('');
            }}
            isCentered={true}
          />
        </div>
      )}

      {list.loading && (
        <p className="loading-text comment-selection" data-testid="comments-loading">
          Loading messages...
        </p>
      )}

      {list.error && (
        <p className="feedback-error comment-selection" role="alert" data-testid="comments-error">
          {list.error}
        </p>
      )}

      {!list.loading && visibleComments.length === 0 && (
        <p className="loading-text comment-selection" data-testid="comments-empty">
          {activeChannel === 'internal' ? 'No internal messages yet.' : 'No messages yet.'}
        </p>
      )}

      {visibleComments.length > 0 && (
        <ol className="comment-list" role="list" data-testid="comments-list">
          {visibleComments.map((comment) => {
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
        <textarea
          className="field-textarea"
          id="comment-text"
          value={commentText}
          onChange={(e) => {
            setCommentText(e.target.value);
          }}
          placeholder={
            activeChannel === 'internal'
              ? 'Internal message (not visible to customer)...'
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

        {add.error && (
          <p className="feedback-error" role="alert" data-testid="add-comment-error">
            {add.error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={add.loading || !commentText.trim()}
          aria-busy={add.loading}
          data-testid="add-comment-btn"
        >
          {add.loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </section>
  );
};

export default TicketCommentThread;
