import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const themeSource = readFileSync(new URL('../src/utils/desktopTheme.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(themeSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});

function createBrowser({
  width = 1024,
  prefersDark = false,
  saved = null,
  blockedWrite = false,
  autoDark = false,
  probeFails = false,
  cssSupported = true,
  backgroundColor,
} = {}) {
  const windowListeners = new Map();
  const documentListeners = new Map();
  const media = new Map();
  const values = new Map(saved === null ? [] : [['itplace.desktop-theme', saved]]);
  const root = { dataset: {} };
  const metas = {
    'meta[name="color-scheme"]': createMeta('light'),
    'meta[name="theme-color"]': createMeta('#f7f8fa'),
  };

  const window = {
    matchMedia(query) {
      if (!media.has(query)) {
        const listeners = new Set();
        media.set(query, {
          get matches() {
            return query === '(min-width: 768px)' ? width >= 768 : prefersDark;
          },
          addEventListener(_type, listener) {
            listeners.add(listener);
          },
          removeEventListener(_type, listener) {
            listeners.delete(listener);
          },
          change() {
            for (const listener of listeners) listener({ matches: this.matches });
          },
        });
      }
      return media.get(query);
    },
    addEventListener(type, listener) {
      if (!windowListeners.has(type)) windowListeners.set(type, new Set());
      windowListeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      windowListeners.get(type)?.delete(listener);
    },
    dispatchEvent(event) {
      for (const listener of windowListeners.get(event.type) ?? []) listener(event);
    },
  };
  const localStorage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (blockedWrite) throw new Error('storage blocked');
      values.set(key, value);
    },
  };
  let probesAdded = 0;
  let probesRemoved = 0;
  const document = {
    documentElement: root,
    createElement() {
      return {
        style: { cssText: '' },
        remove() {
          probesRemoved += 1;
        },
      };
    },
    addEventListener(type, listener) {
      if (!documentListeners.has(type)) documentListeners.set(type, new Set());
      documentListeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      documentListeners.get(type)?.delete(listener);
    },
    querySelector(selector) {
      return metas[selector] ?? null;
    },
  };
  root.appendChild = () => {
    probesAdded += 1;
  };

  return {
    window,
    localStorage,
    document,
    getComputedStyle() {
      if (probeFails) throw new Error('probe unavailable');
      return {
        backgroundColor: backgroundColor ?? (autoDark ? 'rgb(18, 18, 18)' : 'rgb(255, 255, 255)'),
      };
    },
    CSS: { supports: () => cssSupported },
    root,
    metas,
    get probeCounts() {
      return { added: probesAdded, removed: probesRemoved };
    },
    setWidth(nextWidth) {
      const wasDesktop = width >= 768;
      width = nextWidth;
      if (wasDesktop !== (width >= 768)) media.get('(min-width: 768px)')?.change();
    },
    setSystemDark(nextValue) {
      prefersDark = nextValue;
      media.get('(prefers-color-scheme: dark)')?.change();
    },
  };
}

function createMeta(content) {
  return {
    content,
    setAttribute(name, value) {
      if (name === 'content') this.content = value;
    },
  };
}

function loadThemeRuntime(browser) {
  const exports = {};
  const cjsModule = { exports };
  vm.runInNewContext(outputText, {
    exports,
    module: cjsModule,
    window: browser.window,
    localStorage: browser.localStorage,
    document: browser.document,
    getComputedStyle: browser.getComputedStyle,
    CSS: browser.CSS,
    Event: class Event {
      constructor(type) {
        this.type = type;
      }
    },
  });
  return cjsModule.exports;
}

function runBootstrap(browser) {
  const { themeBootstrapScript } = loadThemeRuntime(browser);
  vm.runInNewContext(themeBootstrapScript, {
    window: browser.window,
    localStorage: browser.localStorage,
    document: browser.document,
    getComputedStyle: browser.getComputedStyle,
    CSS: browser.CSS,
  });
}

test('desktop theme bootstrap and runtime preserve responsive preferences', async (t) => {
  await t.test('bootstrap and runtime agree for default, saved desktop, and mobile OS themes', () => {
    for (const scenario of [
      { width: 1024, prefersDark: true, saved: null, expected: 'light' },
      { width: 1024, prefersDark: false, saved: 'dark', expected: 'dark' },
      { width: 390, prefersDark: true, saved: 'light', expected: 'dark' },
      { width: 390, prefersDark: false, autoDark: true, expected: 'dark' },
    ]) {
      const browser = createBrowser(scenario);
      runBootstrap(browser);
      assert.equal(browser.root.dataset.theme, scenario.expected);
      assert.equal(
        browser.metas['meta[name="theme-color"]'].content,
        scenario.expected === 'light' ? '#f7f8fa' : scenario.width < 768 ? '#262523' : '#17191d',
      );
      loadThemeRuntime(browser).applyCurrentTheme();
      assert.equal(browser.root.dataset.theme, scenario.expected);
      assert.equal(
        browser.metas['meta[name="theme-color"]'].content,
        scenario.expected === 'light' ? '#f7f8fa' : scenario.width < 768 ? '#262523' : '#17191d',
      );
    }
  });

  await t.test('auto-dark canvas detection is shared by bootstrap and runtime and cleans up', () => {
    const browser = createBrowser({ width: 390, autoDark: true });
    runBootstrap(browser);
    assert.equal(browser.root.dataset.theme, 'dark');
    assert.equal(browser.metas['meta[name="color-scheme"]'].content, 'dark');
    assert.equal(browser.metas['meta[name="theme-color"]'].content, '#262523');
    loadThemeRuntime(browser).applyCurrentTheme();
    assert.deepEqual(browser.probeCounts, { added: 2, removed: 2 });
  });

  await t.test('probe failures keep the normal media preference and clean up', () => {
    const browser = createBrowser({ width: 390, prefersDark: false, probeFails: true });
    runBootstrap(browser);
    assert.equal(browser.root.dataset.theme, 'light');
    loadThemeRuntime(browser).applyCurrentTheme();
    assert.equal(browser.root.dataset.theme, 'light');
    assert.deepEqual(browser.probeCounts, { added: 2, removed: 2 });
  });

  await t.test('unsupported or transparent canvas results cannot trigger dark mode', () => {
    for (const browser of [
      createBrowser({ width: 390, autoDark: true, cssSupported: false }),
      createBrowser({ width: 390, backgroundColor: 'rgba(0, 0, 0, 0)' }),
    ]) {
      runBootstrap(browser);
      assert.equal(browser.root.dataset.theme, 'light');
      loadThemeRuntime(browser).applyCurrentTheme();
      assert.equal(browser.root.dataset.theme, 'light');
    }
  });

  await t.test('an in-session choice wins when writing over an existing saved value fails', () => {
    const browser = createBrowser({ width: 1024, saved: 'light', blockedWrite: true });
    const theme = loadThemeRuntime(browser);
    theme.applyCurrentTheme();
    theme.setDesktopTheme('dark');
    assert.equal(browser.localStorage.getItem('itplace.desktop-theme'), 'light');
    assert.equal(browser.root.dataset.theme, 'dark');
  });

  await t.test('crossing the mobile breakpoint restores the saved desktop preference', () => {
    const browser = createBrowser({ width: 1024, prefersDark: false, saved: 'dark' });
    const theme = loadThemeRuntime(browser);
    theme.applyCurrentTheme();
    const unsubscribe = theme.subscribeToThemeChanges();

    browser.setWidth(767);
    assert.equal(browser.root.dataset.theme, 'light');
    browser.setWidth(768);
    assert.equal(browser.root.dataset.theme, 'dark');
    assert.equal(browser.metas['meta[name="color-scheme"]'].content, 'dark');
    assert.equal(browser.metas['meta[name="theme-color"]'].content, '#17191d');
    unsubscribe();
  });

  await t.test('crossing from mobile dark to desktop dark restores desktop browser chrome color', () => {
    const browser = createBrowser({ width: 390, prefersDark: true, saved: 'dark' });
    const theme = loadThemeRuntime(browser);
    theme.applyCurrentTheme();
    assert.equal(browser.metas['meta[name="theme-color"]'].content, '#262523');
    const unsubscribe = theme.subscribeToThemeChanges();

    browser.setWidth(768);
    assert.equal(browser.root.dataset.theme, 'dark');
    assert.equal(browser.metas['meta[name="theme-color"]'].content, '#17191d');
    browser.setWidth(767);
    assert.equal(browser.metas['meta[name="theme-color"]'].content, '#262523');
    unsubscribe();
  });
});
