import React from 'react';
import { Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import TicketList from '../../features/tickets/TicketList';

const TicketsPage: React.FC = () => {
  return (
    <div data-testid="tickets-page">
      <div>
        <h1>My Tickets</h1>
        <Link to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET} data-testid="new-ticket-link">
          Submit Ticket
        </Link>
      </div>
      <TicketList />
    </div>
  );
};

export default TicketsPage;
