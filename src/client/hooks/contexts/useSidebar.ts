import { useContext } from 'react';
import {
  SidebarContext,
  type SidebarContextValue,
} from '../../context/sidebar/sidebar.context.types.js';

/**
 * Hook to access sidebar context
 * Must be used within SidebarProvider
 */
export const useSidebar = (): SidebarContextValue => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};
