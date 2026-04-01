import React from 'react';
import './TabNav.css';

export interface TabNavItem<T extends string> {
  key: T;
  label: string;
}

interface TabNavProps<T extends string> {
  tabs: TabNavItem<T>[];
  activeTab: T;
  onTabChange: (key: T) => void;
}

function TabNav<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: TabNavProps<T>): React.ReactElement {
  return (
    <nav className="tab-nav" aria-label="Section navigation" data-testid="tab-nav">
      <ul className="tab-nav-list" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <li key={tab.key} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`tab-nav-btn${isActive ? ` tab-nav-btn--active` : ''}`}
                onClick={() => {
                  onTabChange(tab.key);
                }}
                data-testid={`tab-nav-btn-${tab.key}`}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default TabNav;
