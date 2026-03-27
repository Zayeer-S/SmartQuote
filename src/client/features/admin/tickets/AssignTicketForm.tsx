import React, { useState } from 'react';
import { useAssignTicket } from '../../../hooks/tickets/useAssignTicket.js';
import type { UserListItem } from '../../../../shared/contracts/user-contracts.js';
import './AssignTicketForm.css';

interface AssignTicketFormProps {
  ticketId: string;
  currentAssigneeId: string | null;
  adminUsers: UserListItem[];
  onAssigned: () => void;
}

function fullName(user: UserListItem): string {
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
}

const AssignTicketForm: React.FC<AssignTicketFormProps> = ({
  ticketId,
  currentAssigneeId,
  adminUsers,
  onAssigned,
}) => {
  const [selectedId, setSelectedId] = useState('');
  const { execute, loading, error } = useAssignTicket();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!selectedId) return;
    void execute(ticketId, { assigneeId: selectedId }).then(() => {
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
          <label className="field-label" htmlFor="assignee-select">
            Assignee
          </label>
          <select
            className="field-input"
            id="assignee-select"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
            }}
            required
            disabled={loading}
            aria-required="true"
            data-testid="assignee-select"
          >
            <option value="" disabled>
              Assign...
            </option>
            {adminUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {fullName(user)} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-sm assign-ticket-submit"
          disabled={loading || !selectedId}
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
