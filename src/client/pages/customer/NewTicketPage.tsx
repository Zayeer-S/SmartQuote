import React from 'react';
import { useNavigate } from 'react-router-dom';
import SubmitTicketForm from '../../features/tickets/SubmitTicketForm.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';

const NewTicketPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (): void => {
    void navigate(CLIENT_ROUTES.CUSTOMER.TICKETS);
  };

  return (
    <div data-testid="new-ticket-page">
      <h1>Submit a Ticket</h1>
      <SubmitTicketForm onSuccess={handleSuccess} />
    </div>
  );
};

export default NewTicketPage;
