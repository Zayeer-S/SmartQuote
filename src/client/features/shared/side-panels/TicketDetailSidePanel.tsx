import React from 'react';
import SidePanel, { SidePanelTab } from '../../../components/SidePanel.js';
import TicketCommentThread from '../TicketCommentThread.js';
import SimilarTicketsPanel from '../../admin/tickets/SimilarTicketsPanel.js';

export type SidePanelTabKey = 'comments' | 'similar';

interface TicketDetailSidePanelProps {
  ticketId: string;
  tabs: SidePanelTabKey[];
}

const ALL_TABS = (ticketId: string): SidePanelTab<SidePanelTabKey>[] => [
  {
    key: 'comments',
    label: 'Messages',
    render: () => <TicketCommentThread ticketId={ticketId} />,
  },
  {
    key: 'similar',
    label: 'Similar Tickets',
    render: () => <SimilarTicketsPanel ticketId={ticketId} />,
  },
];

const TicketDetailSidePanel: React.FC<TicketDetailSidePanelProps> = ({ ticketId, tabs }) => {
  const tabDefs = ALL_TABS(ticketId).filter((t) => tabs.includes(t.key));

  return <SidePanel tabs={tabDefs} testId="ticket-detail-side-panel" />;
};

export default TicketDetailSidePanel;
