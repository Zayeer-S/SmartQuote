import React from 'react';
import SidePanel, { SidePanelTab } from '../../../components/SidePanel.js';
import StatsOverview from '../StatsOverview.js';
import TicketStatusChart from '../../admin/analytics/TicketStatusChart.js';
import type { TicketResponse } from '../../../../shared/contracts/ticket-contracts.js';

interface DashboardSidePanelProps {
  tickets: TicketResponse[];
}

type DashboardSidePanelTab = 'stats' | 'chart';

const DashboardSidePanel: React.FC<DashboardSidePanelProps> = ({ tickets }) => {
  const tabs: SidePanelTab<DashboardSidePanelTab>[] = [
    {
      key: 'stats',
      label: 'Stats',
      render: () => <StatsOverview tickets={tickets} />,
    },
    {
      key: 'chart',
      label: 'Status',
      render: () => <TicketStatusChart tickets={tickets} />,
    },
  ];

  return <SidePanel tabs={tabs} testId="dashboard-side-panel" />;
};

export default DashboardSidePanel;
