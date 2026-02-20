import { useCallback, useState } from 'react';
import {
  SidebarContext,
  type SidebarContextValue,
  type SidebarProviderProps,
} from './sidebar.context.types';

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggle = useCallback(() => {
    setIsCollapsed((v) => !v);
  }, []);

  const value: SidebarContextValue = {
    isCollapsed,
    toggle,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};
