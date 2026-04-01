import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import Breadcrumb from '../../components/Breadcrumb.js';
import TicketTitle from '../../features/shared/TicketTitle.js';
import TabNav, { TabNavItem } from '../../components/TabNav.js';
import TicketDetailCard from '../../features/shared/TicketDetailCard.js';
import TicketDetailSidePanel from '../../features/shared/TicketDetailSidePanel.js';

type AdminTab = 'details' | 'quote' | 'revision';

const ADMIN_TABS: TabNavItem<AdminTab>[] = [
  { key: 'details', label: 'Details' },
  { key: 'quote', label: 'Quote' },
  { key: 'revision', label: 'Revise Quote' },
];

const AdminTicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [activeTab, setActiveTab] = useState<AdminTab>('details');

  if (!ticketId) {
    return (
      <p className="feedback-error" role="alert" data-testid="admin-ticket-detail-page-no-id">
        No ticket ID provided.
      </p>
    );
  }

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
          <TabNav tabs={ADMIN_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === 'details' && <TicketDetailCard ticketId={ticketId} />}
        </div>

        <TicketDetailSidePanel ticketId={ticketId} tabs={['comments', 'similar']} />
      </div>
    </div>
  );
};

export default AdminTicketDetailPage;
