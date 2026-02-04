// Centralized theme configuration for GenDeck
// This file contains all theme-related styles for easy maintenance

export type Theme = 'dark' | 'light';

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
  
  light: {
    // Background colors
    bg: {
      primary: 'bg-gray-50',
      secondary: 'bg-white',
      tertiary: 'bg-gray-100',
      glass: 'bg-white/70',
      glassHeader: 'bg-white/70',
      input: 'bg-white',
      card: 'bg-white/70',
      hover: 'hover:bg-gray-100',
      sidebar: 'bg-gray-50/50',
    },
    // Text colors
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-700',
      tertiary: 'text-gray-600',
      muted: 'text-gray-500',
      inverse: 'text-white',
    },
    // Border colors
    border: {
      primary: 'border-gray-200',
      secondary: 'border-gray-100',
      hover: 'hover:border-gray-300',
      focus: 'focus:border-purple-500',
      divider: 'bg-gray-200',
    },
    // Input specific
    input: {
      bg: 'bg-white',
      border: 'border-gray-300',
      text: 'text-gray-900',
      placeholder: 'placeholder:text-gray-400',
      focusBorder: 'focus:border-purple-500',
    },
    // Button styles
    button: {
      primary: 'bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300 text-gray-900',
      secondary: 'bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-gray-300 text-gray-900',
      ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      danger: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700',
    },
    // Accent colors
    accent: {
      purple: 'text-purple-600',
      blue: 'text-blue-600',
      green: 'text-emerald-600',
      amber: 'text-amber-600',
      red: 'text-red-600',
    },
    // Status/State backgrounds
    state: {
      active: 'bg-purple-100 border-purple-200',
      success: 'bg-emerald-100 border-emerald-200',
      warning: 'bg-amber-100 border-amber-200',
      error: 'bg-red-100 border-red-200',
      info: 'bg-blue-100 border-blue-200',
    },
    // Shadow
    shadow: {
      card: 'shadow-gray-200/50',
      button: 'shadow-purple-500/25',
      dropdown: 'shadow-gray-200/50',
    },
    // Selection
    selection: {
      active: 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25',
      inactive: 'bg-white border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50',
    },
  },
};

// Helper function to get theme classes
export function getThemeClasses(theme: Theme) {
  return themes[theme];
}

// Helper to combine multiple theme classes
export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
