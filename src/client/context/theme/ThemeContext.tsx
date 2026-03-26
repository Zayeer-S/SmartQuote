import React, { useEffect, useState } from 'react';
import { ThemeContext, type Theme } from './theme.context.types.js';
import { KEYS } from '../../lib/storage/keys.js';

const getSystemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(KEYS.THEME) as Theme | null;
  const userHasOverridden = localStorage.getItem(KEYS.THEME_OVERRIDDEN) === 'true';
  if (userHasOverridden && (stored === 'light' || stored === 'dark')) return stored;
  return getSystemTheme();
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const userHasOverridden = localStorage.getItem(KEYS.THEME_OVERRIDDEN) === 'true';
      if (!userHasOverridden) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(KEYS.THEME_OVERRIDDEN, 'true');
      return next;
    });
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};
