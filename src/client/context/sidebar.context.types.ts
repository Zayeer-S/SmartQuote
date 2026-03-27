import { createContext } from 'react';

export interface SidebarContextValue {
  isCollapsed: boolean;
  toggle: () => void;
}

export interface SidebarProviderProps {
  children: React.ReactNode;
}

export const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);
