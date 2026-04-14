import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import Breadcrumb from '../../components/Breadcrumb.js';
import TicketTitle from '../../features/shared/TicketTitle.js';
import TabNav, { TabNavItem } from '../../components/TabNav.js';
import TicketDetailCard from '../../features/shared/TicketDetailCard.js';
import TicketDetailSidePanel from '../../features/shared/side-panels/TicketDetailSidePanel.js';
import {
  AdminCreateQuoteForm,
  AdminUpdateQuoteForm,
} from '../../features/admin/quotes/AdminQuoteEditor.js';
import AdminQuoteRevisions from '../../features/admin/quotes/AdminQuoteRevisions.js';
import { useListQuotes } from '../../hooks/quotes/useListQuote.js';
import type {
  MLQuoteEstimate,
  QuoteWithApprovalResponse,
} from '../../../shared/contracts/quote-contracts.js';
import AssignTicketForm from '../../features/admin/tickets/AssignTicketForm.js';
import { useGetTicket } from '../../hooks/tickets/useGetTicket.js';
import { useListEmployeeUsers } from '../../hooks/useListEmployeeUsers.js';
import AdminQuotePanel from '../../features/admin/quotes/AdminQuotePanel.js';
import SlaStatus from '../../features/admin/tickets/SlaStatus.js';
import { useQuoteWsSubscription } from '../../hooks/quotes/useQuoteWsSubscription.js';
import { usePollingRefetch } from '../../hooks/usePollingRefetch.js';

type AdminTab = 'details' | 'quote' | 'revision';

const ADMIN_TABS: TabNavItem<AdminTab>[] = [
  { key: 'details', label: 'Details' },
  { key: 'quote', label: 'Quote' },
  { key: 'revision', label: 'Revise Quote' },
];

const POLL_INTERVAL_MS = 30_000;

function resolveLatestQuote(quotes: QuoteWithApprovalResponse[]): QuoteWithApprovalResponse | null {
  if (quotes.length === 0) return null;
  return quotes.reduce((latest, q) => (q.version > latest.version ? q : latest));
}

const AdminTicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [activeTab, setActiveTab] = useState<AdminTab>('details');
  // Holds the ML estimate from the last auto-generate call.
  // Cleared on any quote mutation so stale estimates never linger.
  const [mlEstimate, setMlEstimate] = useState<MLQuoteEstimate | null>(null);

  const ticket = useGetTicket();
  const quotes = useListQuotes();
  const adminUsers = useListEmployeeUsers();

  const { data: adminData, execute: fetchAdmins } = adminUsers;
  const {
    data: ticketData,
    loading: ticketLoading,
    error: ticketError,
    execute: fetchTickets,
  } = ticket;
  const {
    data: quoteData,
    loading: quoteLoading,
    error: quoteError,
    execute: fetchQuotes,
  } = quotes;

  const latestQuote = quoteData ? resolveLatestQuote(quoteData.quotes) : null;

  useEffect(() => {
    if (ticketId) {
      void fetchQuotes(ticketId);
      void fetchTickets(ticketId);
    }
    void fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleQuoteMutated = useCallback((): void => {
    if (ticketId) {
      void fetchQuotes(ticketId);
      void fetchTickets(ticketId);
    }
    setMlEstimate(null);
  }, [fetchQuotes, fetchTickets, ticketId]);

  const pollRefetch = useCallback((): void => {
    if (ticketId) {
      void fetchQuotes(ticketId);
      void fetchTickets(ticketId);
    }
  }, [fetchQuotes, fetchTickets, ticketId]);

  const handleGenerated = (estimate: MLQuoteEstimate | null): void => {
    setMlEstimate(estimate);
  };

  useQuoteWsSubscription(ticketId ?? '', handleQuoteMutated);
  usePollingRefetch(pollRefetch, POLL_INTERVAL_MS);

  if (!ticketId) {
    return (
      <p className="feedback-error" role="alert" data-testid="admin-ticket-detail-page-no-id">
        No ticket ID provided.
      </p>
    );
  }

  const loadTicket = (): void => {
    void ticket.execute(ticketId);
  };

  return (
    <div className="admin-page ticket-detail-page" data-testid="admin-ticket-detail-page">
      <Breadcrumb
        route={CLIENT_ROUTES.ADMIN.ROOT}
        previousPage="Home"
        currentPage="Ticket Detail"
      />

      <TicketTitle ticketId={ticketId} />

      <div className="ticket-detail-layout" data-testid="ticket-detail-layout">
        <div className="ticket-detail-main" data-testid="ticket-detail-main">
          <TabNav
            tabs={ADMIN_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isCentered={false}
          />

          {activeTab === 'details' && (
            <>
              {ticketLoading && (
                <p className="loading-text" data-testid="quote-loading">
                  Loading ticket details...
                </p>
              )}
              {ticketError && (
                <p className="feedback-error" role="alert" data-testid="ticket-error">
                  {ticketError}
                </p>
              )}
              {!ticketLoading && !ticketError && ticketData && (
                <>
                  <TicketDetailCard ticketId={ticketId} ticket={ticket} />
                  <SlaStatus slaStatus={ticketData.slaStatus} />
                  <AssignTicketForm
                    ticketData={ticketData}
                    adminUsers={adminData}
                    onAssigned={loadTicket}
                  />
                </>
              )}
            </>
          )}

          {activeTab === 'quote' && (
            <>
              {quoteLoading && (
                <p className="loading-text" data-testid="quote-loading">
                  Loading quote...
                </p>
              )}
              {quoteError && (
                <p className="feedback-error" role="alert" data-testid="quote-error">
                  {quoteError}
                </p>
              )}
              {!quoteLoading && !quoteError && (
                <>
                  <AdminCreateQuoteForm
                    ticketId={ticketId}
                    latestQuote={latestQuote}
                    onSuccess={handleQuoteMutated}
                    onGenerated={handleGenerated}
                  />
                  {latestQuote && (
                    <AdminQuotePanel
                      ticketId={ticketId}
                      quote={latestQuote}
                      mlEstimate={mlEstimate}
                      handleQuoteMutated={handleQuoteMutated}
                    />
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'revision' && (
            <>
              {quoteLoading && (
                <p className="loading-text" data-testid="quote-loading-revision">
                  Loading quote...
                </p>
              )}
              {quoteError && (
                <p className="feedback-error" role="alert" data-testid="quote-error-revision">
                  {quoteError}
                </p>
              )}
              {!quoteLoading && !quoteError && latestQuote && (
                <>
                  <AdminUpdateQuoteForm
                    ticketId={ticketId}
                    latestQuote={latestQuote}
                    onSuccess={handleQuoteMutated}
                  />
                  <AdminQuoteRevisions ticketId={ticketId} latestQuote={latestQuote} />
                </>
              )}
              {!quoteLoading && !quoteError && !latestQuote && (
                <p className="loading-text" data-testid="no-quote-for-revision">
                  No quote exists yet.
                </p>
              )}
            </>
          )}
        </div>

        <TicketDetailSidePanel ticketId={ticketId} tabs={['comments', 'similar']} />
      </div>
    </div>
  );
};

export default AdminTicketDetailPage;
