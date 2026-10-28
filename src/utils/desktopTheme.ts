export type Theme = 'light' | 'dark';

export const DESKTOP_THEME_STORAGE_KEY = 'itplace.desktop-theme';
export const THEME_CHANGE_EVENT = 'itplace:theme-change';

let sessionDesktopTheme: Theme | null = null;

// Runs in <head> before first paint and synchronizes browser chrome metadata.
export const themeBootstrapScript = `(() => {
  var saved = null;
  try {
    var value = localStorage.getItem('${DESKTOP_THEME_STORAGE_KEY}');
    if (value === 'light' || value === 'dark') saved = value;
  } catch {}

  var desktop = window.matchMedia('(min-width: 768px)').matches;
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var autoDark = false;
  if (!desktop && !systemDark) {
    var probe = null;
    try {
      if (CSS.supports('background-color', 'canvas') && CSS.supports('color-scheme', 'light')) {
        probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;color-scheme:light;background-color:canvas';
        document.documentElement.appendChild(probe);
        var match = getComputedStyle(probe).backgroundColor.match(/^rgba?\\(\\s*(\\d+)[,\\s]+(\\d+)[,\\s]+(\\d+)(?:\\s*[,/]\\s*([\\d.]+))?\\s*\\)$/);
        autoDark = !!match && Number(match[4] ?? 1) > 0 && (Number(match[1]) < 255 || Number(match[2]) < 255 || Number(match[3]) < 255);
      }
    } catch {} finally {
      probe?.remove();
    }
  }
  var theme = desktop ? saved === 'dark' ? 'dark' : 'light' : systemDark || autoDark ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  var scheme = document.querySelector('meta[name="color-scheme"]');
  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (scheme && scheme.content !== theme) scheme.content = theme;
  var color = theme === 'dark' ? desktop ? '#17191d' : '#262523' : '#f7f8fa';
  if (themeColor && themeColor.content !== color) themeColor.content = color;
})()`;

function hasBrowserAutoDark() {
  let probe: HTMLDivElement | null = null;
  try {
    if (!CSS.supports('background-color', 'canvas') || !CSS.supports('color-scheme', 'light')) {
      return false;
    }
    probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;color-scheme:light;background-color:canvas';
    document.documentElement.appendChild(probe);
    const match = getComputedStyle(probe).backgroundColor.match(
      /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/,
    );
    return Boolean(
      match &&
        Number(match[4] ?? 1) > 0 &&
        (Number(match[1]) < 255 || Number(match[2]) < 255 || Number(match[3]) < 255),
    );
  } catch {
    return false;
  } finally {
    probe?.remove();
  }
}

export function getDocumentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function applyCurrentTheme() {
  const desktop = window.matchMedia('(min-width: 768px)').matches;
  const theme = desktop
    ? sessionDesktopTheme ?? readSavedDesktopTheme() ?? 'light'
    : window.matchMedia('(prefers-color-scheme: dark)').matches || hasBrowserAutoDark()
      ? 'dark'
      : 'light';
  const root = document.documentElement;
  const changed = root.dataset.theme !== theme;
  if (changed) root.dataset.theme = theme;

  const scheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  const color = theme === 'dark' ? (desktop ? '#17191d' : '#262523') : '#f7f8fa';
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
  window.addEventListener('pageshow', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('storage', handleStorage);
  return () => {
    desktop.removeEventListener('change', sync);
    systemTheme.removeEventListener('change', sync);
    window.removeEventListener('pageshow', sync);
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('storage', handleStorage);
  };
}
