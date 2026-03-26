import React from 'react';
import AdminTicketList from '../../features/tickets/AdminTicketList.js';
import './AdminTicketsPage.css';

const AdminTicketsPage: React.FC = () => {
  return (
    <div className="admin-page" data-testid="admin-tickets-page">
      <div className="page-header">
        <h1 className="page-title">Tickets</h1>
      </div>
      <AdminTicketList />
    </div>
  );
};

export default AdminTicketsPage;
