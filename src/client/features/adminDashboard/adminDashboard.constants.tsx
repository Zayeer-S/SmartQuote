import React from 'react';

export type AdminMenuKey =
  | 'Dashboard'
  | 'All Tickets'
  | 'Quotes'
  | 'Customers'
  | 'Analytics'
  | 'Settings';

/** Static definition only — values are derived at runtime from live data */
export interface StatCardDefinition {
  label: string;
  icon: React.ReactNode;
}

export const STAT_COLOR_BY_INDEX = ['blue', 'red', 'orange', 'green'] as const;

// TODO FIX FAST RFRESH
// eslint-disable-next-line react-refresh/only-export-components
export const STAT_CARD_DEFINITIONS: StatCardDefinition[] = [
  {
    label: 'Total Tickets',
    icon: (
      <svg viewBox="0 0 24 24" className="statSvg" aria-hidden="true">
        <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2a2 2 0 0 1-2 2h-1v2h1a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-2a2 2 0 0 1 2-2h1v-2H6a2 2 0 0 1-2-2V7z" />
      </svg>
    ),
  },
  {
    label: 'Urgent Tickets',
    icon: (
      <svg viewBox="0 0 24 24" className="statSvg" aria-hidden="true">
        <path d="M12 2 1 21h22L12 2zm0 6c.55 0 1 .45 1 1v5a1 1 0 1 1-2 0V9c0-.55.45-1 1-1zm0 11a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 12 19z" />
      </svg>
    ),
  },
  {
    label: 'Unassigned',
    icon: (
      <svg viewBox="0 0 24 24" className="statSvg" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2zm1 5v6l5 3-.9 1.5L11 13V7h2z" />
      </svg>
    ),
  },
  {
    label: 'Pending Quotes',
    icon: (
      <svg viewBox="0 0 24 24" className="statSvg" aria-hidden="true">
        <path d="M12 1a1 1 0 0 1 1 1v1.06A8 8 0 0 1 20.94 11H22a1 1 0 1 1 0 2h-1.06A8 8 0 0 1 13 20.94V22a1 1 0 1 1-2 0v-1.06A8 8 0 0 1 3.06 13H2a1 1 0 1 1 0-2h1.06A8 8 0 0 1 11 3.06V2a1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
];

// TODO FIX FAST RFRESH
// eslint-disable-next-line react-refresh/only-export-components
export const ADMIN_NAV_ITEMS: { key: AdminMenuKey; label: string }[] = [
  { key: 'Dashboard', label: 'Dashboard' },
  { key: 'All Tickets', label: 'All Tickets' },
  { key: 'Quotes', label: 'Quotes' },
  { key: 'Customers', label: 'Customers' },
  { key: 'Analytics', label: 'Analytics' },
  { key: 'Settings', label: 'Settings' },
];
