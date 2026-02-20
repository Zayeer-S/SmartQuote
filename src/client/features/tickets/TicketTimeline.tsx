import React, { useEffect } from 'react';
import { useListComments } from '../../hooks/tickets/useListComments';
import { COMMENT_TYPES, LOOKUP_IDS } from '../../../shared/constants/lookup-values';
import './TicketTimeline.css';

interface TicketTimelineProps {
  ticketId: string;
}

const COMMENT_TYPE_LABELS: Record<number, string> = {
  [LOOKUP_IDS.COMMENT_TYPE.EXTERNAL]: COMMENT_TYPES.EXTERNAL,
  [LOOKUP_IDS.COMMENT_TYPE.SYSTEM]: COMMENT_TYPES.SYSTEM,
};

const TicketTimeline: React.FC<TicketTimelineProps> = ({ ticketId }) => {
  const { execute, data, loading, error } = useListComments();

  useEffect(() => {
    void execute(ticketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  if (loading) {
    return (
      <section className="ticket-timeline" data-testid="ticket-timeline">
        <h2 className="ticket-timeline-title">Timeline</h2>
        <p className="ticket-timeline-empty" data-testid="timeline-loading">
          Loading timeline...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="ticket-timeline" data-testid="ticket-timeline">
        <h2 className="ticket-timeline-title">Timeline</h2>
        <p className="feedback-error" role="alert" data-testid="timeline-error">
          {error}
        </p>
      </section>
    );
  }

  const visibleComments = (data?.comments ?? []).filter(
    (c) => c.commentTypeId !== LOOKUP_IDS.COMMENT_TYPE.INTERNAL
  );

  return (
    <section
      className="ticket-timeline"
      aria-labelledby="timeline-heading"
      data-testid="ticket-timeline"
    >
      <h2 className="ticket-timeline-title" id="timeline-heading">
        Timeline
      </h2>

      {visibleComments.length === 0 ? (
        <p className="ticket-timeline-empty" data-testid="timeline-empty">
          No updates yet.
        </p>
      ) : (
        <ol className="ticket-timeline-list" data-testid="timeline-list">
          {visibleComments.map((comment) => {
            const isSystem = comment.commentTypeId === LOOKUP_IDS.COMMENT_TYPE.SYSTEM;
            const typeLabel = COMMENT_TYPE_LABELS[comment.commentTypeId] ?? '';

            const formattedDate = new Date(comment.createdAt).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <li
                key={comment.id}
                className={['ticket-timeline-item', isSystem ? 'ticket-timeline-item--system' : '']
                  .filter(Boolean)
                  .join(' ')}
                data-testid={`timeline-item-${String(comment.id)}`}
              >
                <div className="ticket-timeline-item-header">
                  {typeLabel && (
                    <span className="badge badge-info" data-testid="comment-type-badge">
                      {typeLabel}
                    </span>
                  )}
                  <time className="ticket-timeline-item-time" dateTime={comment.createdAt}>
                    {formattedDate}
                  </time>
                </div>
                <p className="ticket-timeline-item-text">{comment.commentText}</p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

export default TicketTimeline;
