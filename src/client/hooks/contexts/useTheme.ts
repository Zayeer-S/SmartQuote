import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '../../context/theme/theme.context.types.js';

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
