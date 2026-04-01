import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import TicketDetailCard from '../../features/shared/TicketDetailCard.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import Breadcrumb from '../../components/Breadcrumb.js';
import TicketTitle from '../../features/shared/TicketTitle.js';
import TabNav, { TabNavItem } from '../../components/TabNav.js';
import TicketDetailSidePanel from '../../features/shared/TicketDetailSidePanel.js';
import { useGetTicket } from '../../hooks/tickets/useGetTicket.js';

type CustomerTab = 'details' | 'quote' | 'revision';

const CUSTOMER_TABS: TabNavItem<CustomerTab>[] = [{ key: 'details', label: 'Details' }];

const CustomerTicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [activeTab, setActiveTab] = useState<CustomerTab>('details');

  const ticket = useGetTicket();

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
          <TabNav tabs={CUSTOMER_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === 'details' && <TicketDetailCard ticketId={ticketId} ticket={ticket} />}
        </div>

        <TicketDetailSidePanel ticketId={ticketId} tabs={['comments']} />
      </div>
    </div>
  );
};

export default CustomerTicketDetailPage;
