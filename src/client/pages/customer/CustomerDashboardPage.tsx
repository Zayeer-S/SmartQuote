import React, { useCallback, useEffect, useState } from 'react';
import { useListTickets } from '../../hooks/tickets/useListTicket.js';
import { useAuth } from '../../hooks/contexts/useAuth.js';
import StatsOverview from '../../features/shared/StatsOverview.js';
import TicketStatusChart from '../../features/admin/analytics/TicketStatusChart.js';
import Modal from '../../components/Modal.js';
import SubmitTicketForm from '../../features/customer/dashboard/SubmitTicketForm.js';
import './CustomerDashboardPage.css';
import BaseTicketList from '../../features/shared/BaseTicketList.js';
import CustomerTicketCard from '../../features/customer/ticket/CustomerTicketCard.js';

const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { execute, data, loading, error } = useListTickets();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchTickets = useCallback(() => {
    void execute();
  }, [execute]);

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = (): void => {
    setSubmitSuccess(false);
    setModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setModalOpen(false);
    setSubmitSuccess(false);
  };

  const handleSubmitSuccess = (): void => {
    setSubmitSuccess(true);
    fetchTickets();
  };

  const allTickets = data?.tickets ?? [];
  const firstName = user?.firstName ?? '';

  return (
    <div className="dashboard-page" data-testid="dashboard-page">
      <h1 className="dashboard-heading">Welcome back{firstName ? `, ${firstName}` : ''}</h1>

      <div className="dashboard-line" />

      {!loading && !error && (
        <div className="card dashboard-overview" data-testid="dashboard-overview">
          <TicketStatusChart tickets={allTickets} />
          {allTickets.length > 0 && (
            <div className="dashboard-overview-divider" aria-hidden="true" />
          )}
          <StatsOverview tickets={allTickets} />
        </div>
      )}

      <section className="dashboard-section" aria-labelledby="tickets-heading">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title" id="tickets-heading">
            My Tickets
          </h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenModal}
            data-testid="open-new-ticket-modal-btn"
          >
            + New Ticket
          </button>
        </div>

        <BaseTicketList
          tickets={allTickets}
          renderItem={(ticket) => <CustomerTicketCard ticket={ticket} />}
          loading={loading}
          error={error}
          emptyMessage="You have no tickets yet."
          testIdPrefix="tickets"
        />
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Submit a Ticket"
        description="Fill in the details below and we will generate a quote for you."
        testId="new-ticket-modal"
      >
        {submitSuccess ? (
          <div className="feedback-success" role="status" data-testid="ticket-submit-success">
            <div>
              <strong>Ticket submitted successfully.</strong>
              <p>Your ticket has been received. You can close this window or press Esc.</p>
            </div>
          </div>
        ) : (
          <SubmitTicketForm onSuccess={handleSubmitSuccess} />
        )}
      </Modal>
    </div>
  );
};

export default CustomerDashboardPage;
