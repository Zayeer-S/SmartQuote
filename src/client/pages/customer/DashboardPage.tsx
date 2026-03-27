import React, { useCallback, useEffect, useState } from 'react';
import { useListTickets } from '../../hooks/tickets/useListTicket.js';
import { useAuth } from '../../hooks/contexts/useAuth.js';
import StatsOverview from '../../features/dashboard/StatsOverview.js';
import TicketStatusChart from '../../features/dashboard/TicketStatusChart.js';
import TicketList from '../../features/tickets/TicketList.js';
import Modal from '../../components/modal/Modal.js';
import SubmitTicketForm from '../../features/customer/dashboard/SubmitTicketForm.js';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
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

      {loading && (
        <p className="loading-text" data-testid="dashboard-loading">
          Loading...
        </p>
      )}

      {error && (
        <p className="feedback-error" role="alert" data-testid="dashboard-error">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="card dashboard-overview" data-testid="dashboard-overview">
          <TicketStatusChart tickets={allTickets} />
          {allTickets.length > 0 && (
            <div className="dashboard-overview-divider" aria-hidden="true" />
          )}
          <StatsOverview tickets={allTickets} />
        </div>
      )}

      {!loading && !error && (
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

          <TicketList tickets={allTickets} />
        </section>
      )}

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

export default DashboardPage;
