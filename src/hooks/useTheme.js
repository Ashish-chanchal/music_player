import { useCallback } from 'react';
import { THEME_KEY } from '../constants';

/** Toggles light/dark by setting data-theme on <html>; the CSS also follows the system when unset. */
export function useTheme() {
  return useCallback(() => {
    const root = document.documentElement;
    const isDark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = isDark ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch { /* storage unavailable */ }
  }, []);
}
