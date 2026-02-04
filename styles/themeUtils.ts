// Theme utility functions for easier className construction
import type { Theme } from './theme';
import { themes } from './theme';

/**
 * Get theme-specific className
 * Usage: themeClass(theme, 'bg.card') => 'bg-slate-900/50' for dark, 'bg-white/70' for light
 */
export function themeClass(theme: Theme, path: string): string {
  const parts = path.split('.');
  let value: any = themes[theme];
  
  for (const part of parts) {
    value = value?.[part];
  }
  
  return value || '';
}

/**
 * Get common classes that work for both themes, with theme-specific overrides
 * Usage: themed('rounded-lg p-4', theme, 'bg.card')
 */
export function themed(baseClasses: string, theme: Theme, themePath?: string): string {
  const themeSpecific = themePath ? themeClass(theme, themePath) : '';
  return [baseClasses, themeSpecific].filter(Boolean).join(' ');
}

/**
 * Conditional class based on theme
 * Usage: ifTheme(theme, { dark: 'bg-black', light: 'bg-white' })
 */
export function ifTheme<T>(theme: Theme, options: { dark: T; light: T }): T {
  return options[theme];
}

/**
 * Merge multiple class strings
 */
export function cls(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Pre-defined common component styles
export const componentStyles = {
  container: (theme: Theme) => themed(
    'backdrop-blur rounded-2xl shadow-2xl border',
    theme,
    'bg.card'
  ) + ' ' + (theme === 'dark' ? 'shadow-black/20 border-white/10' : 'shadow-gray-200/50 border-gray-200'),
  
  input: (theme: Theme) => cls(
    'w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
    theme === 'dark' 
      ? 'bg-slate-950 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-500'
  ),
  
  button: {
    primary: (theme: Theme) => cls(
      'rounded-lg font-medium transition-all border',
      theme === 'dark'
        ? 'bg-slate-900/80 hover:bg-slate-800 text-white border-white/10 hover:border-white/20'
        : 'bg-white/80 hover:bg-white text-gray-900 border-gray-200 hover:border-gray-300'
    ),
    danger: (theme: Theme) => cls(
      'rounded-lg font-medium transition-all border',
      theme === 'dark'
        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-200 border-red-500/30'
        : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
    ),
  },
  
  select: (theme: Theme) => cls(
    'w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
    theme === 'dark'
      ? 'bg-slate-950 border-white/10 text-white focus:border-purple-500/50'
      : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'
  ),
  
  card: (theme: Theme) => cls(
    'rounded-lg border',
    theme === 'dark' 
      ? 'bg-slate-900/50 border-white/5' 
      : 'bg-gray-100/50 border-gray-200'
  ),
  
  modal: {
    backdrop: (theme: Theme) => theme === 'dark' ? 'bg-slate-950/80' : 'bg-gray-900/40',
    content: (theme: Theme) => cls(
      'rounded-2xl shadow-2xl border',
      theme === 'dark' 
        ? 'bg-slate-900 border-white/10' 
        : 'bg-white border-gray-200'
    ),
    header: (theme: Theme) => theme === 'dark' ? 'border-white/5' : 'border-gray-100',
    footer: (theme: Theme) => cls(
      'rounded-b-2xl',
      theme === 'dark' ? 'border-white/5 bg-slate-900/50' : 'border-gray-100 bg-gray-50/50'
    ),
  },
};
