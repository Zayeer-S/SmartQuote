import React from 'react';
import { ClockIcon, DollarIcon, TicketIcon } from '../../components/icons/CustomerIcons';

type StatTone = 'blue' | 'amber' | 'green' | 'orange';

export interface StatCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: StatTone;
}

export const DASHBOARD_STATS: StatCard[] = [
  { label: 'Total Tickets', value: '0', icon: React.createElement(TicketIcon), tone: 'blue' },
  { label: 'Active Tickets', value: '0', icon: React.createElement(ClockIcon), tone: 'amber' },
  { label: 'Total Quoted', value: '£0.00', icon: React.createElement(DollarIcon), tone: 'green' },
  { label: 'Pending Quotes', value: '0', icon: React.createElement(TicketIcon), tone: 'orange' },
];
