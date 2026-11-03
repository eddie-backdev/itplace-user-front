import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInThisContext } from 'node:vm';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import ts from 'typescript';

const loadStoreHook = (mocks) => {
  const filename = new URL('../src/features/mainPage/hooks/useStoreData.ts', import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const hooks = [];
  const effects = [];
  let hookIndex = 0;
  const react = {
    useState(initial) {
      const index = hookIndex++;
      hooks[index] ??= initial;
      return [hooks[index], (next) => {
        hooks[index] = typeof next === 'function' ? next(hooks[index]) : next;
      }];
    },
    useRef(current) {
      const index = hookIndex++;
      hooks[index] ??= { current };
      return hooks[index];
    },
    useCallback(callback) {
      hookIndex++;
      return callback;
    },
    useEffect(effect) {
      hookIndex++;
      effects.push(effect);
    },
  };
  const dependencies = {
    react,
    '../api/storeApi': mocks.api,
    '../utils/dataTransform': { transformMapStorePreviewsToPlatforms: (items) => items },
    '../utils/mapUtils': { getRadiusByMapLevel: () => 1000 },
    './useApiCall': {
      useApiCall: () => ({
        data: [],
        isLoading: false,
        error: null,
        execute: async (operation, onSuccess) => {
          try {
            const result = await operation();
            onSuccess?.(result);
            return true;
          } catch {
            return false;
          }
        },
      }),
    },
    '../constants': { DEFAULT_RADIUS: 1000 },
  };
  const exports = {};
  runInThisContext(`(function(require, exports) { ${outputText}\n})`, {
    filename: filename.pathname,
  })((name) => {
    const value = dependencies[name];
    if (!value) throw new Error(`Unexpected import: ${name}`);
    return value;
  }, exports);

  const render = () => {
    hookIndex = 0;
    return exports.useStoreData();
  };
  const result = render();
  return { result, effects, render };
};

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
};

const loadModule = (path, dependencies) => {
  const filename = new URL(`../${path}`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  });
  const exports = {};
  runInThisContext(`(function(require, exports) { ${outputText}\n})`, {
    filename: filename.pathname,
  })((name) => {
    const value = dependencies[name];
    if (!value) throw new Error(`Unexpected import: ${name}`);
    return value;
  }, exports);
  return exports;
};

const createApi = (getCurrentLocation, getAllNearbyStorePreviews = async () => ({ data: [] })) => ({
  getCurrentLocation,
  getAllNearbyStorePreviews,
  getStoreClustersInView: async () => ({ data: [] }),
  getAllStorePreviewsInView: async () => ({ data: [] }),
  getAddressFromCoordinates: async () => '현재 위치',
  searchStorePreviews: async () => ({ data: [] }),
});

test('initial location status changes as soon as delayed geolocation supplies real coordinates', async () => {
  const location = deferred();
  const storeFetch = deferred();
  let requestedStoreParams;
  const hook = loadStoreHook({
    api: createApi(() => location.promise, (params) => {
      requestedStoreParams = params;
      return storeFetch.promise;
    }),
  });

  assert.equal(hook.result.initialLocationStatus, 'locating');
  assert.equal(hook.result.userCoords, null);
  hook.effects[1]();
  await flush();
  assert.equal(requestedStoreParams, undefined);

  const coords = { lat: 35.1796, lng: 129.0756 };
  location.resolve(coords);
  await flush();
  assert.equal(hook.render().initialLocationStatus, 'located');
  assert.deepEqual(hook.render().userCoords, coords);
  assert.deepEqual(requestedStoreParams, {
    lat: coords.lat,
    lng: coords.lng,
    radiusMeters: 1000,
    category: undefined,
    userLat: coords.lat,
    userLng: coords.lng,
  });

  storeFetch.resolve({ data: [] });
  await flush();
});

test('geolocation rejection exposes Seoul fallback status and manual location update recovers', async () => {
  const storeRequests = [];
  const hook = loadStoreHook({
    api: createApi(async () => { throw new Error('denied'); }, async (params) => {
      storeRequests.push(params);
      return { data: [] };
    }),
  });
  hook.effects[1]();
  await flush();

  assert.equal(hook.render().initialLocationStatus, 'unavailable');
  assert.deepEqual(hook.render().userCoords, { lat: 37.5665, lng: 126.978 });
  await hook.render().updateToCurrentLocation(35.1796, 129.0756, 4);
  assert.equal(hook.render().initialLocationStatus, 'located');
  assert.deepEqual(hook.render().userCoords, { lat: 35.1796, lng: 129.0756 });
  assert.deepEqual(storeRequests.at(-1), {
    lat: 35.1796,
    lng: 129.0756,
    radiusMeters: 1000,
    category: undefined,
    userLat: 35.1796,
    userLng: 129.0756,
  });
});

test('unmount while geolocation is pending prevents a late location commit', async () => {
  const location = deferred();
  const hook = loadStoreHook({ api: createApi(() => location.promise) });
  const cleanup = hook.effects[1]();
  assert.equal(typeof cleanup, 'function');
  cleanup();
  location.resolve({ lat: 35.1796, lng: 129.0756 });
  await flush();

  assert.equal(hook.render().initialLocationStatus, 'locating');
  assert.equal(hook.render().userCoords, null);
});

test('MapSection forwards the resolved initial center and disables its own geolocation', () => {
  const filename = new URL('../src/features/mainPage/components/MapSection/index.tsx', import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  });
  const mapProps = [];
  const noOp = () => null;
  const dependencies = {
    react: React,
    '../SidebarSection/CategoryTabsSection': noOp,
    './KakaoMap': (props) => { mapProps.push(props); return null; },
    './MapControls': noOp,
    './Roadview/RoadviewContainer': noOp,
    '../../../../utils/toast': { showToast: noOp },
    'react-toastify': { toast: { dismiss: noOp } },
  };
  const exports = {};
  runInThisContext(`(function(require, exports) { ${outputText}\n})`, {
    filename: filename.pathname,
  })((name) => {
    const value = dependencies[name];
    if (!value) throw new Error(`Unexpected import: ${name}`);
    return value;
  }, exports);

  const resolvedCenter = { latitude: 35.1796, longitude: 129.0756 };
  ReactDOMServer.renderToStaticMarkup(React.createElement(exports.default, {
    platforms: [],
    clusters: [],
    selectedPlatform: null,
    onPlatformSelect: noOp,
    onLocationMove: noOp,
    categories: [],
    selectedCategory: '전체',
    onCategorySelect: noOp,
    activeTab: 'nearby',
    initialCenterLocation: resolvedCenter,
  }));

  assert.equal(mapProps.length, 1);
  assert.deepEqual(mapProps[0].initialCenterLocation, resolvedCenter);
  assert.equal(mapProps[0].autoLocate, false);
});

test('manual current-location button requests fresh coordinates and moves using them once', async () => {
  const location = deferred();
  let requestedOptions;
  let locationRequests = 0;
  let locating = false;
  const callbacks = [];
  const reactMock = {
    __esModule: true,
    default: { createElement: React.createElement },
    useState: (initial) => [locating || initial, (next) => { locating = next; }],
  };
  const { default: CurrentLocationButton } = loadModule(
    'src/features/mainPage/components/MapSection/MapControls/CurrentLocationButton.tsx',
    {
      react: reactMock,
      'react-icons/tb': () => null,
      '../../../../../utils/toast': { showToast: (...args) => callbacks.push(['toast', ...args]) },
      '../../../api/storeApi': {
        getCurrentLocation: (options) => {
          locationRequests++;
          requestedOptions = options;
          return location.promise;
        },
      },
    }
  );
  const button = () => CurrentLocationButton({
    onLocationMove: (lat, lng) => callbacks.push(['location', lat, lng]),
  });

  const request = button().props.onClick();
  assert.deepEqual(requestedOptions, { maximumAge: 0 });
  assert.equal(button().props.disabled, true);
  await button().props.onClick();
  assert.equal(locationRequests, 1);
  const coords = { lat: 35.1796, lng: 129.0756 };
  location.resolve(coords);
  await request;

  assert.deepEqual(callbacks, [['location', coords.lat, coords.lng]]);
  assert.equal(button().props.disabled, false);
});

test('manual geolocation passes freshness options to the browser and preserves its error code', async () => {
  const filename = 'src/features/mainPage/api/storeApi.ts';
  const storeApi = loadModule(filename, {
    '../../../apis/axiosInstance': { get: async () => ({ data: {} }) },
    axios: { isAxiosError: () => false },
    '../utils/dataTransform': { expandMapStorePreviewBatch: (data) => data },
  });
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let browserOptions;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      geolocation: {
        getCurrentPosition(_success, failure, options) {
          browserOptions = options;
          failure({ code: 3, message: 'timeout' });
        },
      },
    },
  });

  try {
    await assert.rejects(storeApi.getCurrentLocation({ maximumAge: 0, timeout: 4000 }), {
      code: 3,
      message: 'timeout',
    });
    assert.deepEqual(browserOptions, {
      enableHighAccuracy: true,
      timeout: 4000,
      maximumAge: 0,
    });
  } finally {
    if (originalDescriptor) Object.defineProperty(globalThis, 'navigator', originalDescriptor);
    else delete globalThis.navigator;
  }
});

test('GPS retry after browsing another city refreshes nearby stores at the GPS coordinates', async () => {
  const storeRequests = [];
  const hook = loadStoreHook({
    api: createApi(async () => ({ lat: 37.5665, lng: 126.978 }), async (params) => {
      storeRequests.push(params);
      return { data: [] };
    }),
  });
  hook.effects[1]();
  await flush();
  await hook.render().updateToCurrentLocation(35.1796, 129.0756, 4);

  const lastRequest = storeRequests.at(-1);
  assert.equal(hook.render().initialLocationStatus, 'located');
  assert.deepEqual(hook.render().userCoords, { lat: 35.1796, lng: 129.0756 });
  assert.equal(lastRequest.lat, 35.1796);
  assert.equal(lastRequest.lng, 129.0756);
  assert.equal(lastRequest.userLat, 35.1796);
  assert.equal(lastRequest.userLng, 129.0756);
});

test('GPS permission failure reports guidance and does not move the map', async () => {
  const feedback = [];
  const reactMock = {
    __esModule: true,
    default: { createElement: React.createElement },
    useState: (initial) => [initial, () => {}],
  };
  const { default: CurrentLocationButton } = loadModule(
    'src/features/mainPage/components/MapSection/MapControls/CurrentLocationButton.tsx',
    {
      react: reactMock,
      'react-icons/tb': () => null,
      '../../../../../utils/toast': { showToast: (...args) => feedback.push(['toast', ...args]) },
      '../../../api/storeApi': {
        getCurrentLocation: async () => { throw { code: 1, message: 'denied' }; },
      },
    }
  );
  const element = CurrentLocationButton({ onLocationMove: (...args) => feedback.push(['move', ...args]) });

  await element.props.onClick();
  assert.deepEqual(feedback, [
    ['toast', '브라우저와 기기 설정에서 위치 권한을 허용한 뒤 다시 시도해 주세요.', 'info'],
  ]);
});
