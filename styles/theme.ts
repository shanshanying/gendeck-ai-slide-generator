// Centralized theme configuration for GenDeck
// Dark theme only - no light/dark mode toggle

export type Theme = 'dark';

// Theme configuration object containing all theme values
export const themes = {
  dark: {
    // Background colors
    bg: {
      primary: 'bg-slate-950',
      secondary: 'bg-slate-900',
      tertiary: 'bg-slate-800',
      glass: 'bg-slate-900/50',
      glassHeader: 'bg-slate-950/80',
      input: 'bg-slate-950',
      card: 'bg-slate-900/50',
      hover: 'hover:bg-slate-800',
      sidebar: 'bg-slate-950/50',
    },
    // Text colors
    text: {
      primary: 'text-slate-100',
      secondary: 'text-slate-300',
      tertiary: 'text-slate-400',
      muted: 'text-slate-500',
      inverse: 'text-white',
    },
    // Border colors
    border: {
      primary: 'border-white/10',
      secondary: 'border-white/5',
      hover: 'hover:border-white/20',
      focus: 'focus:border-purple-500/50',
      divider: 'bg-white/5',
    },
    // Input specific
    input: {
      bg: 'bg-slate-950',
      border: 'border-white/10',
      text: 'text-white',
      placeholder: 'placeholder:text-slate-500',
      focusBorder: 'focus:border-purple-500/50',
    },
    // Button styles
    button: {
      primary: 'bg-slate-900/80 hover:bg-slate-800 border-white/10 hover:border-white/20 text-white',
      secondary: 'bg-slate-800 hover:bg-slate-700 border-white/10 hover:border-white/20 text-white',
      ghost: 'text-slate-400 hover:text-white hover:bg-white/5',
      danger: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-200',
    },
    // Accent colors
    accent: {
      purple: 'text-purple-400',
      blue: 'text-blue-400',
      green: 'text-emerald-400',
      amber: 'text-amber-400',
      red: 'text-red-400',
    },
    // Status/State backgrounds
    state: {
      active: 'bg-purple-500/10 border-purple-500/20',
      success: 'bg-emerald-500/10 border-emerald-500/20',
      warning: 'bg-amber-500/10 border-amber-500/20',
      error: 'bg-red-500/10 border-red-500/20',
      info: 'bg-blue-500/10 border-blue-500/20',
    },
    // Shadow
    shadow: {
      card: 'shadow-black/20',
      button: 'shadow-purple-500/25',
      dropdown: 'shadow-black/20',
    },
    // Selection
    selection: {
      active: 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25',
      inactive: 'bg-slate-950 border-white/10 text-slate-400 hover:border-white/20',
    },
  },
};

// Helper function to get theme classes - always returns dark theme
export function getThemeClasses(theme?: Theme) {
  return themes.dark;
}

// Helper to combine multiple theme classes
export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
