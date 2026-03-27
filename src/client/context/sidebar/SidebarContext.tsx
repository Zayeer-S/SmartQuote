import { useCallback, useState } from 'react';
import {
  SidebarContext,
  type SidebarContextValue,
  type SidebarProviderProps,
} from './sidebar.context.types.js';
import { KEYS } from '../../lib/storage/keys.js';

function readCollapsedFromStorage(): boolean {
  try {
    return localStorage.getItem(KEYS.SIDEBAR_COLLAPSED) === 'true';
  } catch {
    // localStorage unavailable (e.g. SSR or private browsing restrictions)
    return false;
  }
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(readCollapsedFromStorage);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(KEYS.SIDEBAR_COLLAPSED, String(next));
      } catch {
        // Silently ignore -- UI state will still work, just won't persist
      }
      return next;
    });
  }, []);

  const value: SidebarContextValue = {
    isCollapsed,
    toggle,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};
