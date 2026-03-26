import React, { useState } from 'react';
import { useAssignTicket } from '../../hooks/tickets/useAssignTicket.js';
import './AssignTicketForm.css';

interface AssignTicketFormProps {
  ticketId: string;
  currentAssigneeId: string | null;
  onAssigned: () => void;
}

const AssignTicketForm: React.FC<AssignTicketFormProps> = ({
  ticketId,
  currentAssigneeId,
  onAssigned,
}) => {
  const [assigneeId, setAssigneeId] = useState(currentAssigneeId ?? '');
  const { execute, loading, error } = useAssignTicket();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!assigneeId.trim()) return;
    void execute(ticketId, { assigneeId }).then(() => {
      onAssigned();
    });
  };

  return (
    <form
      className="assign-ticket-form"
      onSubmit={handleSubmit}
      aria-label="Assign ticket"
      data-testid="assign-ticket-form"
    >
      <div className="assign-ticket-form-row">
        <div className="field-group assign-ticket-field">
          <label className="field-label" htmlFor="assignee-id">
            Assignee User ID
          </label>
          <input
            className="field-input"
            id="assignee-id"
            type="text"
            value={assigneeId}
            onChange={(e) => {
              setAssigneeId(e.target.value);
            }}
            placeholder="Enter user ID"
            required
            disabled={loading}
            aria-required="true"
            data-testid="assignee-id-input"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-sm assign-ticket-submit"
          disabled={loading || !assigneeId.trim()}
          aria-busy={loading}
          data-testid="assign-submit-btn"
        >
          {loading ? 'Assigning...' : currentAssigneeId ? 'Reassign' : 'Assign'}
        </button>
      </div>

      {error && (
        <p className="feedback-error" role="alert" data-testid="assign-error">
          {error}
        </p>
      )}
    </form>
  );
};

export default AssignTicketForm;
