// Theme Context for global theme management
// Dark theme only - no light/dark mode toggle
import React, { createContext, useContext } from 'react';
import type { Theme } from '../styles/theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always use dark theme
  const theme: Theme = 'dark';

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDark: true 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
