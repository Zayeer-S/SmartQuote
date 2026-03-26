import React from 'react';
import { Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import TicketList from '../../features/tickets/TicketList.js';

const TicketsPage: React.FC = () => {
  return (
    <div data-testid="tickets-page">
      <div className="page-header">
        <h1 className="page-title">My Tickets</h1>
        <Link
          to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET}
          className="btn btn-primary"
          data-testid="new-ticket-link"
        >
          Submit Ticket
        </Link>
      </div>
      <TicketList />
    </div>
  );
};

export default TicketsPage;
