import React, { useState } from 'react';
import TicketCommentThread from './TicketCommentThread.js';
import SimilarTicketsPanel from '../admin/tickets/SimilarTicketsPanel.js';
import './TicketDetailSidePanel.css';

export type SidePanelTab = 'comments' | 'similar';

interface TicketDetailSidePanelProps {
  ticketId: string;
  tabs: SidePanelTab[];
}

const TAB_LABELS: Record<SidePanelTab, string> = {
  comments: 'Comments',
  similar: 'Similar Tickets',
};

const TicketDetailSidePanel: React.FC<TicketDetailSidePanelProps> = ({ ticketId, tabs }) => {
  const [activeTab, setActiveTab] = useState<SidePanelTab>(tabs[0]);

  const showTabNav = tabs.length > 1;

  return (
    <aside className="ticket-detail-side-panel" data-testid="ticket-detail-side-panel">
      {showTabNav && (
        <nav
          className="side-panel-tab-nav"
          aria-label="Side panel navigation"
          data-testid="side-panel-tab-nav"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={[
                'side-panel-tab-btn',
                activeTab === tab ? 'side-panel-tab-btn--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                setActiveTab(tab);
              }}
              aria-current={activeTab === tab ? 'true' : undefined}
              data-testid={`side-panel-tab-${tab}`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </nav>
      )}

      <div className="side-panel-content" data-testid="side-panel-content">
        {activeTab === 'comments' && <TicketCommentThread ticketId={ticketId} />}
        {activeTab === 'similar' && <SimilarTicketsPanel ticketId={ticketId} />}
      </div>
    </aside>
  );
};

export default TicketDetailSidePanel;
