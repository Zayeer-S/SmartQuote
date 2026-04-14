import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TicketDetailCard from '../../features/shared/TicketDetailCard.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import Breadcrumb from '../../components/Breadcrumb.js';
import TicketTitle from '../../features/shared/TicketTitle.js';
import TabNav, { TabNavItem } from '../../components/TabNav.js';
import TicketDetailSidePanel from '../../features/shared/side-panels/TicketDetailSidePanel.js';
import { useGetTicket } from '../../hooks/tickets/useGetTicket.js';
import CustomerQuotePanel from '../../features/customer/CustomerQuotePanel.js';
import { useListQuotes } from '../../hooks/quotes/useListQuote.js';
import { useQuoteWsSubscription } from '../../hooks/quotes/useQuoteWsSubscription.js';

type CustomerTab = 'details' | 'quote' | 'revision';

const CUSTOMER_TABS: TabNavItem<CustomerTab>[] = [
  { key: 'details', label: 'Details' },
  { key: 'quote', label: 'Quote' },
];

const CustomerTicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [activeTab, setActiveTab] = useState<CustomerTab>('details');

  const ticket = useGetTicket();
  const quotes = useListQuotes();

  const { execute: fetchTickets } = ticket;
  const { execute: fetchQuotes } = quotes;

  const latestQuote =
    quotes.data && quotes.data.quotes.length > 0
      ? quotes.data.quotes.reduce((a, b) => (a.version > b.version ? a : b))
      : null;

  useEffect(() => {
    if (ticketId) {
      void fetchQuotes(ticketId);
      void fetchTickets(ticketId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleQuoteMutated = (): void => {
    if (ticketId) {
      void fetchQuotes(ticketId);
      void fetchTickets(ticketId);
    }
  };

  useQuoteWsSubscription(ticketId ?? '', handleQuoteMutated);

  if (!ticketId) {
    return (
      <div data-testid="ticket-detail-page-error">
        <p>Invalid ticket link</p>
      </div>
    );
  }

  return (
    <div className="ticket-detail-page" data-testid="ticket-detail-page">
      {/* Breadcrumb spans full width above the two-column split */}
      <Breadcrumb
        route={CLIENT_ROUTES.CUSTOMER.ROOT}
        previousPage="Home"
        currentPage="Ticket Detail"
      />

      <TicketTitle ticketId={ticketId} />

      <div className="ticket-detail-layout" data-testid="ticket-detail-layout">
        <div className="ticket-detail-main" data-testid="ticket-detail-main">
          <TabNav
            tabs={CUSTOMER_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isCentered={false}
          />
          {activeTab === 'details' && <TicketDetailCard ticketId={ticketId} ticket={ticket} />}
          {activeTab === 'quote' &&
            (latestQuote ? (
              <CustomerQuotePanel ticketId={ticketId} quote={latestQuote} />
            ) : (
              <p className="empty-state-message" data-testid="no-quote">
                No quote has been generated yet.
              </p>
            ))}
        </div>

        <TicketDetailSidePanel ticketId={ticketId} tabs={['comments']} />
      </div>
    </div>
  );
};

export default CustomerTicketDetailPage;
