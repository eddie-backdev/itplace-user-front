export type Theme = 'light' | 'dark';

export const DESKTOP_THEME_STORAGE_KEY = 'itplace.desktop-theme';
export const THEME_CHANGE_EVENT = 'itplace:theme-change';

let sessionDesktopTheme: Theme | null = null;

// Runs in <head> before first paint; browser chrome metadata updates after hydration.
export const themeBootstrapScript = `(() => {
  var saved = null;
  try {
    var value = localStorage.getItem('${DESKTOP_THEME_STORAGE_KEY}');
    if (value === 'light' || value === 'dark') saved = value;
  } catch {}

  var desktop = window.matchMedia('(min-width: 768px)').matches;
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = desktop
    ? saved === 'dark' ? 'dark' : 'light'
    : systemDark ? 'dark' : 'light';
})()`;

export function getDocumentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function applyCurrentTheme() {
  const theme = window.matchMedia('(min-width: 768px)').matches
    ? sessionDesktopTheme ?? readSavedDesktopTheme() ?? 'light'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  const root = document.documentElement;
  const changed = root.dataset.theme !== theme;
  if (changed) root.dataset.theme = theme;

  const scheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  const color = theme === 'dark' ? '#17191d' : '#f7f8fa';
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (scheme?.content !== theme) scheme?.setAttribute('content', theme);
  if (themeColor?.content !== color) themeColor?.setAttribute('content', color);
  if (changed) window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function readSavedDesktopTheme(): Theme | null {
  try {
    const theme = localStorage.getItem(DESKTOP_THEME_STORAGE_KEY);
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch {
    return null;
  }
}

export function setDesktopTheme(theme: Theme) {
  sessionDesktopTheme = theme;
  try {
    localStorage.setItem(DESKTOP_THEME_STORAGE_KEY, theme);
  } catch {
    // Keep the in-session choice even when browser storage is blocked.
  }
  applyCurrentTheme();
}

export function updateThemeFromStorage(value: string | null) {
  sessionDesktopTheme = value === 'light' || value === 'dark' ? value : null;
  applyCurrentTheme();
}

export function subscribeToThemeChanges() {
  const sync = () => applyCurrentTheme();
  const desktop = window.matchMedia('(min-width: 768px)');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const handleStorage = (event: StorageEvent) => {
    if (event.key === DESKTOP_THEME_STORAGE_KEY || event.key === null) {
      updateThemeFromStorage(event.key === null ? null : event.newValue);
    }
  };
  desktop.addEventListener('change', sync);
  systemTheme.addEventListener('change', sync);
  window.addEventListener('storage', handleStorage);
  return () => {
    desktop.removeEventListener('change', sync);
    systemTheme.removeEventListener('change', sync);
    window.removeEventListener('storage', handleStorage);
  };
}
