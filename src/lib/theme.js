// Light/dark theme. Light is the default (matches the landing's editorial feel).
// We toggle a `.dark` class on <html>; every --pf-* and Tailwind token reads from it.
import { useEffect, useState } from 'react';

const KEY = 'proofly_theme';

export function getStoredTheme() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent('proofly-theme', { detail: theme }));
}

// Apply the persisted theme on boot — default LIGHT when nothing is stored.
export function initTheme() {
  const theme = getStoredTheme() === 'dark' ? 'dark' : 'light';
  applyTheme(theme);
  return theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => (getStoredTheme() === 'dark' ? 'dark' : 'light'));
  useEffect(() => {
    const onChange = (e) => setThemeState(e.detail);
    window.addEventListener('proofly-theme', onChange);
    return () => window.removeEventListener('proofly-theme', onChange);
  }, []);
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  return { theme, toggle, setTheme };
}
