import React from 'react';
import CustomerSidebar from './CustomerSidebar';
import { useSidebar } from '../../hooks/useSidebar';
import './CustomerPage.css';

interface Props {
  children: React.ReactNode;
}

const CustomerLayout: React.FC<Props> = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={`customerPage ${isCollapsed ? 'sidebarCollapsed' : ''}`}
      data-testid="customer-layout"
    >
      <CustomerSidebar />
      <main className="main" data-testid="customer-main">
        {children}
      </main>
    </div>
  );
};

export default CustomerLayout;
