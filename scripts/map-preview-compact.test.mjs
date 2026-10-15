import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { runInThisContext } from 'node:vm';
import ts from 'typescript';
import { AxiosError } from 'axios';

// Run the actual TypeScript modules with explicit dependency substitutes, without a new framework.
const require = createRequire(import.meta.url);
const loadModule = (path, dependencies = {}) => {
  const filename = new URL(`../${path}`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const exports = {};
  runInThisContext(`(function(require, exports) { ${outputText}\n})`, {
    filename: filename.pathname,
  })((name) => dependencies[name] ?? require(name), exports);
  return exports;
};
const membership = loadModule('src/utils/membership.ts', {
  '../content/benefit-display.json': require('../src/content/benefit-display.json'),
});
const storeUtils = loadModule('src/features/mainPage/utils/storeUtils.ts', {
  '../../../utils/membership': membership,
});
const transforms = loadModule('src/features/mainPage/utils/dataTransform.ts', {
  './storeUtils': storeUtils,
});
const mapUtils = loadModule('src/features/mainPage/utils/mapUtils.ts');
let request;
const api = loadModule('src/features/mainPage/api/storeApi.ts', {
  '../../../apis/axiosInstance': { get: (...args) => request(...args) },
  '../utils/dataTransform': transforms,
});
const favoritesState = {
  current: { _persist: { rehydrated: false }, auth: { isLoggedIn: false } },
};
let favoritesRequest;
let favoritesHttpCalls = 0;
const favoritesApi = loadModule('src/features/mainPage/api/favoritesListApi.ts', {
  '../../../apis/axiosInstance': {
    get: (...args) => {
      favoritesHttpCalls++;
      return favoritesRequest(...args);
    },
  },
  '../../../store': { store: { getState: () => favoritesState.current } },
});

const benefits = [{ grade: 'VIP', context: '10% 할인', carrier: 'KT' }];
const store = (storeId, extra = {}) => ({
  storeId,
  partnerId: 9,
  storeName: `매장 ${storeId}`,
  latitude: 37.5,
  longitude: 127.1,
  hasCoupon: false,
  ...extra,
});
const batch = {
  stores: [
    store(30, { distance: 8, roadName: '테헤란로', tierBenefit: [] }),
    store(10, { distance: 0, address: '주소', postCode: '12345' }),
    store(20, { distance: 1, tierBenefit: [{ grade: 'VIP', context: '매장 혜택' }] }),
  ],
  partners: [
    { partnerId: 9, partnerName: '구 이름', category: '카페', tierBenefit: [] },
    { partnerId: 9, partnerName: '브랜드', category: '카페', tierBenefit: benefits },
  ],
};
const envelope = { code: 'SUCCESS', status: 'SUCCESS', message: '성공', data: batch };

test('favorites list skips transport until auth is rehydrated and logged in', async () => {
  const privateFavorites = [{ benefitId: 11, partnerName: '회원 전용 혜택' }];
  favoritesHttpCalls = 0;
  favoritesState.current = { _persist: { rehydrated: false }, auth: { isLoggedIn: false } };
  favoritesRequest = async () => ({ data: { data: privateFavorites } });

  assert.deepEqual(await favoritesApi.getFavoritesList({ category: '카페' }), []);
  assert.equal(favoritesHttpCalls, 0);

  favoritesState.current = { _persist: { rehydrated: true }, auth: { isLoggedIn: false } };
  assert.deepEqual(await favoritesApi.getFavoritesList({ category: '카페' }), []);
  assert.equal(favoritesHttpCalls, 0);
});

test('authenticated favorites preserve category params and deduplicate concurrent requests', async () => {
  const privateFavorites = [{ benefitId: 11, partnerName: '회원 전용 혜택' }];
  favoritesState.current = { _persist: { rehydrated: true }, auth: { isLoggedIn: true } };
  favoritesHttpCalls = 0;
  let resolveRequest;
  favoritesRequest = (url, config) => {
    assert.equal(url, '/api/v1/favorites/search');
    assert.deepEqual(config.params, { category: '카페' });
    return new Promise((resolve) => {
      resolveRequest = () => resolve({ data: { data: privateFavorites } });
    });
  };

  const first = favoritesApi.getFavoritesList({ category: '카페' });
  const duplicate = favoritesApi.getFavoritesList({ category: '카페' });
  assert.equal(favoritesHttpCalls, 1);
  resolveRequest();
  assert.deepEqual(await first, privateFavorites);
  assert.deepEqual(await duplicate, privateFavorites);
});

test('guest requests do not reuse an authenticated in-flight favorites promise', async () => {
  const privateFavorites = [{ benefitId: 11, partnerName: '회원 전용 혜택' }];
  favoritesState.current = { _persist: { rehydrated: true }, auth: { isLoggedIn: true } };
  favoritesHttpCalls = 0;
  let resolveRequest;
  favoritesRequest = () =>
    new Promise((resolve) => {
      resolveRequest = () => resolve({ data: { data: privateFavorites } });
    });

  const authenticatedRequest = favoritesApi.getFavoritesList({ category: '카페' });
  favoritesState.current = { _persist: { rehydrated: true }, auth: { isLoggedIn: false } };
  assert.deepEqual(await favoritesApi.getFavoritesList({ category: '카페' }), []);
  assert.equal(favoritesHttpCalls, 1);

  resolveRequest();
  assert.deepEqual(await authenticatedRequest, privateFavorites);
  favoritesState.current = { _persist: { rehydrated: false }, auth: { isLoggedIn: false } };
});

test('authenticated favorites transport failures still propagate', async () => {
  const failure = new Error('favorites unavailable');
  favoritesState.current = { _persist: { rehydrated: true }, auth: { isLoggedIn: true } };
  favoritesHttpCalls = 0;
  favoritesRequest = async () => {
    throw failure;
  };

  const originalError = console.error;
  console.error = () => {};
  try {
    await assert.rejects(
      favoritesApi.getFavoritesList({ category: '카페' }),
      (error) => error === failure
    );
  } finally {
    console.error = originalError;
  }
});

test('map resize updates viewport state without clearing or searching results', () => {
  assert.deepEqual(mapUtils.getViewportChangeActions('resize', 'nearby', ''), {
    clearPendingSearch: false,
    searchBounds: false,
  });
  assert.deepEqual(mapUtils.getViewportChangeActions('interaction', 'nearby', ''), {
    clearPendingSearch: true,
    searchBounds: true,
  });
  assert.deepEqual(mapUtils.getViewportChangeActions('interaction', 'nearby', 'coffee'), {
    clearPendingSearch: true,
    searchBounds: false,
  });
  assert.deepEqual(mapUtils.getViewportChangeActions('interaction', 'favorites', ''), {
    clearPendingSearch: true,
    searchBounds: false,
  });
});

test('compact expansion preserves server order, zero distance and store benefit overrides', () => {
  const original = JSON.stringify(batch);
  const expanded = transforms.expandMapStorePreviewBatch(batch, 0, 0);
  assert.deepEqual(
    expanded.map((item) => item.storeId),
    [30, 10, 20]
  );
  assert.deepEqual(
    expanded.map((item) => item.distance),
    [8, 0, 1]
  );
  assert.equal(expanded[0].roadName, '테헤란로');
  assert.equal(expanded[1].postCode, '12345');
  assert.equal(expanded[1].partnerName, '브랜드');
  assert.deepEqual(expanded[0].tierBenefit, []);
  assert.equal(expanded[1].tierBenefit, benefits);
  assert.equal(expanded[2].tierBenefit[0].context, '매장 혜택');
  const platforms = transforms.transformMapStorePreviewsToPlatforms(expanded);
  assert.deepEqual(
    platforms.map((item) => item.id),
    ['30', '10', '20']
  );
  assert.equal(platforms[0].roadName, '테헤란로');
  assert.equal(platforms[1].distance, 0);
  assert.deepEqual(platforms[0].benefitDetails, []);
  assert.equal(JSON.stringify(batch), original);
  assert.deepEqual(transforms.expandMapStorePreviewBatch({ stores: [], partners: [] }, 0, 0), []);

  const viewport = transforms.transformMapStorePreviewBatchToPlatforms(
    {
      stores: [store(1), store(2, { latitude: 37.6 }), store(3, { partnerId: 99 })],
      partners: batch.partners,
    },
    37.6,
    127.1
  );
  assert.deepEqual(
    viewport.map((item) => item.storeId),
    [2, 1, 3]
  );
  assert.equal(viewport[0].distance, 0);
  assert.ok(viewport[1].distance > 0);
  assert.equal(viewport[2].partnerName, '매장 3');
  assert.deepEqual(viewport[2].benefitDetails, []);
});

const paths = [
  ['getStorePreviewList', '/api/v1/maps/nearby/previews', { radiusMeters: 1000 }],
  [
    'getStorePreviewListByCategory',
    '/api/v1/maps/nearby/category/previews',
    { radiusMeters: 1000, category: '카페' },
  ],
  [
    'searchStorePreviews',
    '/api/v1/maps/nearby/search/previews',
    { keyword: '브랜드', category: '카페' },
  ],
];

test('all web preview paths expand compact responses and propagate query parameters and AbortSignal', async () => {
  const signal = new AbortController().signal;
  for (const [method, path, extra] of paths) {
    const params = { lat: 37.5, lng: 127.1, userLat: 0, userLng: 0, ...extra };
    let calls = 0;
    request = async (url, config) => {
      calls++;
      assert.equal(url, `${path}/compact`);
      assert.deepEqual(config.params, params);
      assert.equal(config.signal, signal);
      return { data: envelope };
    };
    const response = await api[method](params, signal);
    assert.equal(calls, 1);
    assert.equal(response.code, envelope.code);
    assert.deepEqual(
      response.data.map((item) => item.storeId),
      [30, 10, 20]
    );
    assert.equal(response.data[1].distance, 0);
  }
});

test('only unavailable compact routes fall back; failures and cancellation do not retry', async () => {
  const legacy = { ...envelope, data: [] };
  for (const [method, path, extra] of paths) {
    for (const status of [404, 405, 401, 500, undefined]) {
      const controller = new AbortController();
      const params = { lat: 37.5, lng: 127.1, ...extra };
      const calls = [];
      const error = new AxiosError('request failed', undefined, undefined, undefined, { status });
      request = async (url, config) => {
        calls.push(url);
        assert.equal(config.signal, controller.signal);
        if (calls.length === 1) throw error;
        return { data: legacy };
      };
      if (status === 404 || status === 405) {
        assert.equal(await api[method](params, controller.signal), legacy);
        assert.deepEqual(calls, [`${path}/compact`, path]);
      } else {
        await assert.rejects(api[method](params, controller.signal), (actual) => actual === error);
        assert.equal(calls.length, 1);
      }
      calls.length = 0;
      controller.abort();
      await assert.rejects(api[method](params, controller.signal), (actual) => actual === error);
      assert.equal(calls.length, 1);
    }
  }
});

const pageEnvelope = (stores, partners, hasMore, nextCursor) => ({
  code: 'SUCCESS',
  status: 'SUCCESS',
  message: '성공',
  data: { stores, partners, hasMore, nextCursor },
});

test('paged viewport and nearby preview APIs accumulate every page, expanding each page before deduplication', async () => {
  const signal = new AbortController().signal;
  const calls = [];
  request = async (url, config) => {
    calls.push({ url, params: config.params, signal: config.signal });
    const { afterStoreId } = config.params;
    if (url.includes('/in-view/')) {
      if (afterStoreId === 0)
        return {
          data: pageEnvelope(
            Array.from({ length: 300 }, (_, i) => store(i + 1, { distance: 601 - i })),
            [{ partnerId: 9, partnerName: '페이지 1', category: '카페', tierBenefit: benefits }],
            true,
            300
          ),
        };
      if (afterStoreId === 300)
        return {
          data: pageEnvelope(
            Array.from({ length: 300 }, (_, i) => store(i + 301, { distance: 301 - i })),
            [{ partnerId: 9, partnerName: '페이지 2', category: '카페', tierBenefit: [] }],
            true,
            600
          ),
        };
      return { data: pageEnvelope([store(601, { distance: 0 })], [], false, null) };
    }
    if (afterStoreId === 0)
      return { data: pageEnvelope([store(1, { distance: 3 })], batch.partners, true, 1) };
    return { data: pageEnvelope([], [], false, null) };
  };

  const viewport = await api.getAllStorePreviewsInView(
    {
      minLat: 1,
      minLng: 2,
      maxLat: 3,
      maxLng: 4,
      category: '카페',
      pageSize: 25,
    },
    signal
  );
  assert.equal(calls.length, 3, JSON.stringify(calls.map(({ url, params }) => ({ url, params }))));
  assert.equal(viewport.data.length, 601);
  assert.deepEqual(
    viewport.data.map(({ distance }) => distance),
    [...viewport.data.map(({ distance }) => distance)].sort((a, b) => a - b)
  );
  assert.equal(viewport.data.find(({ storeId }) => storeId === 1).partnerName, '페이지 1');
  assert.deepEqual(viewport.data.find(({ storeId }) => storeId === 1).tierBenefit, benefits);
  assert.deepEqual(viewport.data.find(({ storeId }) => storeId === 301).tierBenefit, []);
  assert.deepEqual(
    calls.slice(0, 3).map(({ params }) => params.afterStoreId),
    [0, 300, 600]
  );
  assert.ok(
    calls
      .slice(0, 3)
      .every(
        ({ url, params, signal: actualSignal }) =>
          url === '/api/v1/maps/stores/in-view/previews/compact/page' &&
          params.pageSize === 300 &&
          params.category === '카페' &&
          actualSignal === signal
      )
  );

  calls.length = 0;
  const nearby = await api.getAllNearbyStorePreviews(
    {
      lat: 37.5,
      lng: 127.1,
      userLat: 0,
      userLng: 0,
      radiusMeters: 1000,
      category: '카페',
      pageSize: 1,
    },
    signal
  );
  assert.equal(nearby.data.length, 1);
  assert.equal(nearby.data[0].distance, 3);
  assert.deepEqual(
    calls.map(({ params }) => params.afterStoreId),
    [0, 1]
  );
  assert.ok(
    calls.every(
      ({ url, params, signal: actualSignal }) =>
        url === '/api/v1/maps/nearby/category/previews/compact/page' &&
        params.pageSize === 300 &&
        params.category === '카페' &&
        params.userLat === 0 &&
        params.userLng === 0 &&
        actualSignal === signal
    )
  );
});

test('paged previews handle exact page boundaries, empty final pages and overlapping IDs', async () => {
  let page = 0;
  request = async () => {
    page++;
    if (page === 1)
      return {
        data: pageEnvelope(
          Array.from({ length: 300 }, (_, i) => store(i + 1, { distance: 2 })),
          batch.partners,
          true,
          300
        ),
      };
    return { data: pageEnvelope([], [], false, null) };
  };
  const exact = await api.getAllNearbyStorePreviews({ lat: 1, lng: 2, radiusMeters: 1000 });
  assert.equal(exact.data.length, 300);
  assert.equal(page, 2);

  page = 0;
  request = async (_url, config) => {
    page++;
    if (page === 1)
      return {
        data: pageEnvelope(
          [store(1, { distance: 5 }), store(2, { distance: 6 })],
          batch.partners,
          true,
          2
        ),
      };
    assert.equal(config.params.afterStoreId, 2);
    return {
      data: pageEnvelope([store(2, { distance: 0 }), store(3, { distance: 1 })], [], false, null),
    };
  };
  const overlap = await api.getAllNearbyStorePreviews({ lat: 1, lng: 2, radiusMeters: 1000 });
  assert.deepEqual(
    overlap.data.map(({ storeId }) => storeId),
    [3, 1, 2]
  );
  assert.equal(overlap.data.find(({ storeId }) => storeId === 2).distance, 6);
});

test('paged previews reject aborts, failures, malformed metadata and nonadvancing cursors', async () => {
  const controller = new AbortController();
  let calls = 0;
  request = async (_url, config) => {
    calls++;
    assert.equal(config.signal, controller.signal);
    controller.abort();
    return { data: pageEnvelope([store(1)], batch.partners, true, 1) };
  };
  await assert.rejects(
    api.getAllNearbyStorePreviews({ lat: 1, lng: 2, radiusMeters: 1000 }, controller.signal)
  );
  assert.equal(calls, 1);

  const preaborted = new AbortController();
  preaborted.abort();
  calls = 0;
  request = async () => {
    calls++;
    return { data: pageEnvelope([], [], false, null) };
  };
  await assert.rejects(
    api.getAllNearbyStorePreviews({ lat: 1, lng: 2, radiusMeters: 1000 }, preaborted.signal)
  );
  assert.equal(calls, 0);

  const pageOne = pageEnvelope([store(1)], batch.partners, true, 1);
  request = async (_url, config) => {
    if (config.params.afterStoreId === 0) return { data: pageOne };
    throw new Error('second page failed');
  };
  await assert.rejects(
    api.getAllNearbyStorePreviews({ lat: 1, lng: 2, radiusMeters: 1000 }),
    /second page failed/
  );

  for (const malformed of [
    { ...pageOne, data: { ...pageOne.data, hasMore: undefined } },
    { ...pageOne, data: { ...pageOne.data, nextCursor: 0 } },
  ]) {
    request = async () => ({ data: malformed });
    await assert.rejects(api.getAllNearbyStorePreviews({ lat: 1, lng: 2, radiusMeters: 1000 }));
  }
});

test('viewport coverage reuses completed paged results, including 300+ stores', async () => {
  for (const count of [0, 299, 300, 601]) {
    const requests = [];
    let committedPlatforms = [];
    const { useStoreData } = loadModule('src/features/mainPage/hooks/useStoreData.ts', {
      // Keep callbacks and refs alive for consecutive viewport events; skip mount effects.
      react: {
        useState: (value) => [value, () => {}],
        useEffect: () => {},
        useCallback: (callback) => callback,
        useRef: (current) => ({ current }),
      },
      '../api/storeApi': {
        getAddressFromCoordinates: async () => '검증 위치',
        getAllStorePreviewsInView: async (params) => {
          requests.push(params);
          return {
            data: Array.from({ length: count }, (_, id) => ({
              ...store(id),
              distance: id,
              partnerName: '브랜드',
              category: '카페',
              tierBenefit: [],
            })),
          };
        },
      },
      '../utils/dataTransform': transforms,
      '../utils/mapUtils': loadModule('src/features/mainPage/utils/mapUtils.ts'),
      '../constants': { DEFAULT_RADIUS: 1000 },
      './useApiCall': {
        useApiCall: () => ({
          data: [],
          execute: async (task, onSuccess) => {
            committedPlatforms = await task();
            onSuccess?.();
            return true;
          },
        }),
      },
    });
    // React is fully substituted above; each case starts an independent hook harness.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const hook = useStoreData();
    const outer = { minLat: 1, minLng: 1, maxLat: 9, maxLng: 9 };
    const inner = { minLat: 2, minLng: 2, maxLat: 8, maxLng: 8 };
    assert.equal(await hook.searchInMapBounds(outer, 5, 5, 4), true);
    assert.equal(await hook.searchInMapBounds(inner, 5, 5, 3), true);
    assert.equal(requests.length, 1, `response count ${count}`);
    assert.equal(committedPlatforms.length, count, `retained platforms ${count}`);
    assert.ok(requests.every((params) => !('limit' in params)));
    if (count === 299) {
      const originalNow = Date.now;
      Date.now = () => originalNow() + 31_000;
      try {
        assert.equal(await hook.searchInMapBounds(inner, 5, 5, 3), true);
      } finally {
        Date.now = originalNow;
      }
      assert.equal(requests.length, 2, 'expired coverage refetches');
    }
    if (count === 601) {
      const outside = { minLat: -5, minLng: -5, maxLat: 0, maxLng: 0 };
      assert.equal(await hook.searchInMapBounds(outside, -2, -2, 3), true);
      assert.equal(requests.length, 2, 'bounds outside completed coverage refetch');
    }
  }
});

test('cluster zoom uses bounds clusters for cleared search and defers current-location details to viewport updates', async () => {
  const clusterRequests = [];
  let nearbyCalls = 0;
  const { useStoreData } = loadModule('src/features/mainPage/hooks/useStoreData.ts', {
    react: {
      useState: (value) => [value, () => {}],
      useEffect: () => {},
      useCallback: (callback) => callback,
      useRef: (current) => ({ current }),
    },
    '../api/storeApi': {
      getAddressFromCoordinates: async () => '검증 위치',
      getStoreClustersInView: async (params) => {
        clusterRequests.push(params);
        return { data: [] };
      },
      getAllNearbyStorePreviews: async () => {
        nearbyCalls++;
        return { data: [] };
      },
    },
    '../utils/dataTransform': transforms,
    '../utils/mapUtils': loadModule('src/features/mainPage/utils/mapUtils.ts'),
    '../constants': { DEFAULT_RADIUS: 1000 },
    './useApiCall': {
      useApiCall: () => ({
        data: [],
        execute: async (task) => {
          try {
            await task();
            return true;
          } catch {
            return false;
          }
        },
      }),
    },
  });

  // React is substituted above; effects are skipped to isolate explicit map events.
  const hook = useStoreData();
  const bounds = { minLat: 1, minLng: 1, maxLat: 9, maxLng: 9 };
  assert.equal(await hook.searchInMapBounds(bounds, 5, 5, 5), true);
  await hook.searchByKeyword('', 5, 5, 5);
  await hook.updateToCurrentLocation(6, 6, 5);

  assert.equal(clusterRequests.length, 2);
  assert.ok(clusterRequests.every((params) => params.mapLevel === 5 && params.minLat === 1));
  assert.equal(nearbyCalls, 0);
});

test('viewport coverage is invalidated when the selected category changes', async () => {
  const states = [];
  const refs = [];
  let stateIndex = 0;
  let refIndex = 0;
  const categories = [];
  const { useStoreData } = loadModule('src/features/mainPage/hooks/useStoreData.ts', {
    react: {
      useState: (initial) => {
        const index = stateIndex++;
        states[index] ??= initial;
        return [
          states[index],
          (next) => {
            states[index] = typeof next === 'function' ? next(states[index]) : next;
          },
        ];
      },
      useEffect: () => {},
      useCallback: (callback) => callback,
      useRef: (current) => {
        const index = refIndex++;
        refs[index] ??= { current };
        return refs[index];
      },
    },
    '../api/storeApi': {
      getAddressFromCoordinates: async () => '검증 위치',
      getAllStorePreviewsInView: async (params) => {
        categories.push(params.category);
        return { data: [] };
      },
    },
    '../utils/dataTransform': transforms,
    '../utils/mapUtils': loadModule('src/features/mainPage/utils/mapUtils.ts'),
    '../constants': { DEFAULT_RADIUS: 1000 },
    './useApiCall': {
      useApiCall: () => ({
        data: [],
        execute: async (task, onSuccess) => {
          try {
            const result = await task();
            onSuccess?.(result);
            return true;
          } catch {
            return false;
          }
        },
      }),
    },
  });
  const render = () => {
    stateIndex = 0;
    refIndex = 0;
    // React is substituted above; effects are skipped to retain a focused viewport harness.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStoreData();
  };

  let hook = render();
  const outer = { minLat: 1, minLng: 1, maxLat: 9, maxLng: 9 };
  const inner = { minLat: 2, minLng: 2, maxLat: 8, maxLng: 8 };
  assert.equal(await hook.searchInMapBounds(outer, 5, 5, 4), true);
  assert.equal(await hook.searchInMapBounds(inner, 5, 5, 4), true);
  assert.equal(categories.length, 1);

  hook.setCategoryOnly('카페', 4);
  hook = render();
  assert.equal(await hook.searchInMapBounds(inner, 5, 5, 4), true);
  assert.deepEqual(categories, [undefined, '카페']);
});

test('late initial geolocation updates user coordinates without committing stale nearby data or address', async () => {
  const states = [];
  const refs = [];
  let stateIndex = 0;
  let refIndex = 0;
  let effects = [];
  let resolveLocation;
  const location = new Promise((resolve) => {
    resolveLocation = resolve;
  });
  const detailedRequests = [];
  const addressRequests = [];
  const { useStoreData } = loadModule('src/features/mainPage/hooks/useStoreData.ts', {
    react: {
      useState: (initial) => {
        const index = stateIndex++;
        states[index] ??= initial;
        return [
          states[index],
          (next) => {
            states[index] = typeof next === 'function' ? next(states[index]) : next;
          },
        ];
      },
      useEffect: (effect) => {
        effects.push(effect);
      },
      useCallback: (callback) => callback,
      useRef: (current) => {
        const index = refIndex++;
        refs[index] ??= { current };
        return refs[index];
      },
    },
    '../api/storeApi': {
      getCurrentLocation: () => location,
      getAddressFromCoordinates: async (lat, lng) => {
        addressRequests.push([lat, lng]);
        return `주소 ${lat},${lng}`;
      },
      getAllStorePreviewsInView: async (params) => {
        detailedRequests.push(params.category);
        return { data: [] };
      },
    },
    '../utils/dataTransform': transforms,
    '../utils/mapUtils': loadModule('src/features/mainPage/utils/mapUtils.ts'),
    '../constants': { DEFAULT_RADIUS: 1000 },
    './useApiCall': {
      useApiCall: () => ({
        data: [],
        execute: async (task, onSuccess) => {
          try {
            const result = await task();
            onSuccess?.(result);
            return true;
          } catch {
            return false;
          }
        },
      }),
    },
  });
  const render = () => {
    stateIndex = 0;
    refIndex = 0;
    effects = [];
    // React is substituted above; the harness manually runs only the relevant effects.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStoreData();
  };

  let hook = render();
  void effects[1]();
  const bounds = { minLat: 1, minLng: 1, maxLat: 9, maxLng: 9 };
  assert.equal(await hook.searchInMapBounds(bounds, 5, 5, 4), true);
  assert.deepEqual(detailedRequests, [undefined]);

  resolveLocation({ lat: 37.5, lng: 127.1 });
  await new Promise((resolve) => setImmediate(resolve));
  hook = render();
  assert.deepEqual(hook.userCoords, { lat: 37.5, lng: 127.1 });
  assert.deepEqual(
    detailedRequests,
    [undefined],
    'stale initial request does not fetch nearby stores'
  );
  assert.deepEqual(
    addressRequests,
    [[5, 5]],
    'stale initial address does not replace viewport address'
  );

  hook.setCategoryOnly('카페', 4);
  hook = render();
  effects[2](); // user-coordinate effect clears the initial-load guard
  hook = render();
  await effects[3](); // category reload now uses the settled user coordinates and current bounds
  assert.deepEqual(detailedRequests, [undefined, '카페']);
});
