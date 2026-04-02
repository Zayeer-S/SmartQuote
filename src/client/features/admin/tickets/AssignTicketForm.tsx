import React, { useState } from 'react';
import { useAssignTicket } from '../../../hooks/tickets/useAssignTicket.js';
import type { UserListItem } from '../../../../shared/contracts/user-contracts.js';
import './AssignTicketForm.css';
import { UseGetTicketReturn } from '../../../hooks/tickets/useGetTicket.js';

interface AssignTicketFormProps {
  ticketData: UseGetTicketReturn['data'];
  adminUsers: UserListItem[] | null;
  onAssigned: () => void;
}

function fullName(user: UserListItem): string {
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
}

const AssignTicketForm: React.FC<AssignTicketFormProps> = ({
  ticketData,
  adminUsers,
  onAssigned,
}) => {
  const [selectedId, setSelectedId] = useState('');
  const { execute, loading, error } = useAssignTicket();

  if (!ticketData) {
    return (
      <p
        className="feedback-error"
        role="alert"
        data-testid="admin-ticket-detail-page-no-ticket-data"
      >
        No ticket data.
      </p>
    );
  }

  const currentAssigneeId = ticketData.assignedToUserId;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!selectedId) return;
    void execute(ticketData.id, { assigneeId: selectedId }).then(() => {
      onAssigned();
    });
  };

  return (
    <>
      <h3 id="assign-ticket-heading">Assign Ticket</h3>
      <form
        className="card card-padded-reduced assign-ticket-form"
        onSubmit={handleSubmit}
        aria-label="Assign ticket"
        data-testid="assign-ticket-form"
      >
        <div className="assign-ticket-form-row">
          <div className="field-group assign-ticket-field">
            <select
              className="field-input assign"
              id="assignee-select"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
              }}
              required
              disabled={loading}
              aria-required="true"
              aria-labelledby="assign-ticket-heading"
              data-testid="assignee-select"
            >
              <option value="" disabled>
                Assign...
              </option>
              {adminUsers
                ? adminUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {fullName(user)} ({user.email})
                    </option>
                  ))
                : 'No employee accounts found'}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary  assign-ticket-submit"
            disabled={loading || !selectedId}
            aria-busy={loading}
            data-testid="assign-submit-btn"
          >
            {loading ? 'Assigning...' : currentAssigneeId ? 'Reassign' : 'Assign...'}
          </button>
        </div>

        {error && (
          <p className="feedback-error" role="alert" data-testid="assign-error">
            {error}
          </p>
        )}
      </form>
    </>
  );
};

export default AssignTicketForm;
