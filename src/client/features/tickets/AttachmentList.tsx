import React from 'react';
import type { AttachmentResponse } from '../../../shared/contracts/ticket-contracts.js';
import { useGetAttachmentUrl } from '../../hooks/tickets/useGetAttachmentUrl.js';
import './AttachmentList.css';

interface AttachmentListProps {
  ticketId: string;
  attachments: AttachmentResponse[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return ':page_facing_up:';
  if (mimeType.startsWith('image/')) return ':frame_with_picture:';
  return ':paperclip:';
}

const AttachmentList: React.FC<AttachmentListProps> = ({ ticketId, attachments }) => {
  const { loading, error, openAttachment } = useGetAttachmentUrl();

  if (attachments.length === 0) {
    return (
      <p className="attachment-list-empty" data-testid="attachment-list-empty">
        No attachments.
      </p>
    );
  }

  return (
    <div className="attachment-list" data-testid="attachment-list">
      {error && (
        <p className="feedback-error attachment-list-error" role="alert">
          {error}
        </p>
      )}
      <ul className="attachment-list-items">
        {attachments.map((attachment) => (
          <li key={attachment.id} className="attachment-item" data-testid="attachment-item">
            <span className="attachment-icon" aria-hidden="true">
              {fileIcon(attachment.mimeType)}
            </span>
            <span className="attachment-name" title={attachment.originalName}>
              {attachment.originalName}
            </span>
            <span className="attachment-size">{formatBytes(attachment.sizeBytes)}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm attachment-open-btn"
              disabled={loading}
              onClick={() => void openAttachment(ticketId, attachment.id)}
              data-testid="attachment-open-btn"
            >
              {loading ? 'Opening...' : 'View / Download'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttachmentList;
