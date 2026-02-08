// Custom hook for theme management
// Dark theme only - no light/dark mode toggle
import type { Theme } from '../styles/theme';

export function useTheme() {
  // Always use dark theme
  const theme: Theme = 'dark';

  return {
    theme,
    isDark: true,
  };
}
