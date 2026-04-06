import React, { useState } from 'react';
import './SidePanel.css';

export interface SidePanelTab<T extends string> {
  key: T;
  label: string;
  render: () => React.ReactNode;
}

interface SidePanelProps<T extends string> {
  tabs: SidePanelTab<T>[];
  testId?: string;
}

function SidePanel<T extends string>({ tabs, testId }: SidePanelProps<T>): React.ReactElement {
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  const activeTabDef = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  return (
    <aside className="side-panel" data-testid={testId ?? 'side-panel'}>
      <nav
        className="side-panel-tab-nav"
        aria-label="Side panel navigation"
        data-testid="side-panel-tab-nav"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={[
              'side-panel-tab-btn',
              activeTab === tab.key ? 'side-panel-tab-btn--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              setActiveTab(tab.key);
            }}
            aria-current={activeTab === tab.key ? 'true' : undefined}
            data-testid={`side-panel-tab-${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="side-panel-content" data-testid="side-panel-content">
        {activeTabDef.render()}
      </div>
    </aside>
  );
}

export default SidePanel;
