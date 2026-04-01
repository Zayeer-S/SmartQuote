import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import TicketDetailCard from '../../features/shared/TicketDetailCard.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import Breadcrumb from '../../components/Breadcrumb.js';
import TicketTitle from '../../features/shared/TicketTitle.js';
import TabNav, { TabNavItem } from '../../components/TabNav.js';

type CustomerTabs = 'details' | 'comments';

const CUSTOMER_TABS: TabNavItem<CustomerTabs>[] = [{ key: 'details', label: 'Details' }];

const CustomerTicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [activeTab, setActiveTab] = useState<CustomerTabs>('details');

  if (!ticketId) {
    return (
      <div data-testid="ticket-detail-page-error">
        <p>Invalid ticket link</p>
      </div>
    );
  }

  return (
    <div data-testid="ticket-detail-page">
      <Breadcrumb
        route={CLIENT_ROUTES.CUSTOMER.ROOT}
        previousPage="Home"
        currentPage="Ticket Detail"
      />

      <TicketTitle ticketId={ticketId} />

      <TabNav tabs={CUSTOMER_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'details' && <TicketDetailCard ticketId={ticketId} />}
    </div>
  );
};

export default CustomerTicketDetailPage;
