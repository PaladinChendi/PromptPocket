// src/utils/theme.ts

import { ExtensionSettings } from '../types';

type Theme = ExtensionSettings['theme']; // 'light' | 'dark' | 'system'

/**
 * Resolve the effective theme ('light' | 'dark') from the user's preference.
 * 'system' follows the OS `prefers-color-scheme` media query.
 */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }
  // system
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply the theme to the document by setting `data-theme` on <html>.
 * CSS uses `[data-theme="dark"]` to switch the dark palette; light is the
 * base style (no attribute needed, but we keep `data-theme="light"` explicit
 * for clarity).
 */
export function applyTheme(theme: Theme): 'light' | 'dark' {
  const effective = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', effective);
  return effective;
}

/**
 * Subscribe to OS color-scheme changes. Only relevant while the user has
 * selected 'system' — the callback re-applies the theme so the popup tracks
 * the OS in real time. Returns an unsubscribe function.
 */
export function watchSystemTheme(callback: () => void): () => void {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => callback();
  // addEventListener is supported on all modern Chromium (MV3) browsers.
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}
