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
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
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
let request;
const api = loadModule('src/features/mainPage/api/storeApi.ts', {
  '../../../apis/axiosInstance': { get: (...args) => request(...args) },
  '../utils/dataTransform': transforms,
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

test('compact expansion preserves server order, zero distance and store benefit overrides', () => {
  const original = JSON.stringify(batch);
  const expanded = transforms.expandMapStorePreviewBatch(batch, 0, 0);
  assert.deepEqual(expanded.map((item) => item.storeId), [30, 10, 20]);
  assert.deepEqual(expanded.map((item) => item.distance), [8, 0, 1]);
  assert.equal(expanded[0].roadName, '테헤란로');
  assert.equal(expanded[1].postCode, '12345');
  assert.equal(expanded[1].partnerName, '브랜드');
  assert.deepEqual(expanded[0].tierBenefit, []);
  assert.equal(expanded[1].tierBenefit, benefits);
  assert.equal(expanded[2].tierBenefit[0].context, '매장 혜택');
  const platforms = transforms.transformMapStorePreviewsToPlatforms(expanded);
  assert.deepEqual(platforms.map((item) => item.id), ['30', '10', '20']);
  assert.equal(platforms[0].roadName, '테헤란로');
  assert.equal(platforms[1].distance, 0);
  assert.deepEqual(platforms[0].benefitDetails, []);
  assert.equal(JSON.stringify(batch), original);
  assert.deepEqual(transforms.expandMapStorePreviewBatch({ stores: [], partners: [] }, 0, 0), []);

  const viewport = transforms.transformMapStorePreviewBatchToPlatforms({
    stores: [store(1), store(2, { latitude: 37.6 }), store(3, { partnerId: 99 })],
    partners: batch.partners,
  }, 37.6, 127.1);
  assert.deepEqual(viewport.map((item) => item.storeId), [2, 1, 3]);
  assert.equal(viewport[0].distance, 0);
  assert.ok(viewport[1].distance > 0);
  assert.equal(viewport[2].partnerName, '매장 3');
  assert.deepEqual(viewport[2].benefitDetails, []);
});

const paths = [
  ['getStorePreviewList', '/api/v1/maps/nearby/previews', { radiusMeters: 1000 }],
  ['getStorePreviewListByCategory', '/api/v1/maps/nearby/category/previews', { radiusMeters: 1000, category: '카페' }],
  ['searchStorePreviews', '/api/v1/maps/nearby/search/previews', { keyword: '브랜드', category: '카페' }],
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
    assert.deepEqual(response.data.map((item) => item.storeId), [30, 10, 20]);
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

test('viewport coverage reuses batches below the limit but refetches when the limit is reached', async () => {
  for (const [count, expectedCalls] of [[0, 1], [299, 1], [300, 2]]) {
    const requests = [];
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
        getCompactStorePreviewsInView: async (params) => {
          requests.push(params);
          return { data: { stores: Array.from({ length: count }, (_, id) => store(id)), partners: batch.partners } };
        },
      },
      '../utils/dataTransform': transforms,
      '../utils/mapUtils': loadModule('src/features/mainPage/utils/mapUtils.ts'),
      '../constants': { DEFAULT_RADIUS: 1000 },
      './useApiCall': {
        useApiCall: () => ({
          data: [],
          execute: async (task, onSuccess) => {
            await task();
            onSuccess?.();
            return true;
          },
        }),
      },
    });
    const hook = useStoreData();
    const outer = { minLat: 1, minLng: 1, maxLat: 9, maxLng: 9 };
    const inner = { minLat: 2, minLng: 2, maxLat: 8, maxLng: 8 };
    assert.equal(await hook.searchInMapBounds(outer, 5, 5, 4), true);
    assert.equal(await hook.searchInMapBounds(inner, 5, 5, 3), true);
    assert.equal(requests.length, expectedCalls, `response count ${count}`);
    assert.ok(requests.every((params) => params.limit === 300));
  }
});

test('address requests share pending work, cache one success briefly and reject stale results', async (t) => {
  let now = 100_000;
  t.mock.method(Date, 'now', () => now);
  const requests = [];
  const addresses = [];
  const cleanups = [];
  const { useStoreData } = loadModule('src/features/mainPage/hooks/useStoreData.ts', {
    react: {
      useState: (value) => [value, (next) => {
        if (typeof next === 'string') addresses.push(next);
      }],
      useEffect: (effect, dependencies) => {
        // Register the hook's unmount cleanup without starting geolocation/mount requests.
        if (dependencies.length === 0) cleanups.push(effect());
      },
      useCallback: (callback) => callback,
      useRef: (current) => ({ current }),
    },
    '../api/storeApi': {
      getAddressFromCoordinates: (lat, lng, signal) => new Promise((resolve, reject) => {
        requests.push({ lat, lng, signal, resolve, reject });
      }),
    },
    '../utils/dataTransform': transforms,
    '../utils/mapUtils': loadModule('src/features/mainPage/utils/mapUtils.ts'),
    '../constants': { DEFAULT_RADIUS: 1000 },
    './useApiCall': { useApiCall: () => ({ data: [], execute: async () => true }) },
  });
  const hook = useStoreData();
  const locate = (latitude) => hook.updateLocationFromMap(latitude, 127.1);
  const latestAddress = () => addresses.at(-1);

  const first = locate(37.5);
  assert.equal(locate(37.5), first, 'same coordinates share the pending Promise');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].signal.aborted, false);
  requests[0].resolve('주소 A');
  await first;
  assert.equal(latestAddress(), '주소 A');
  now += 29_999;
  await locate(37.5);
  assert.equal(requests.length, 1, 'recent successful address is reused');
  now += 1;
  const expired = locate(37.5);
  assert.equal(requests.length, 2, '30-second expiry starts a new request');
  requests[1].resolve('갱신한 주소 A');
  await expired;

  const pendingB = locate(37.6);
  await locate(37.5);
  assert.equal(requests.length, 3, 'returning to cached A does not issue another request');
  assert.equal(requests[2].signal.aborted, true, 'A cache hit cancels pending B');
  requests[2].resolve('늦게 도착한 주소 B');
  await pendingB;
  assert.equal(latestAddress(), '갱신한 주소 A');
  await locate(37.5);
  assert.equal(requests.length, 3, 'late B cannot replace the cached A');

  const pendingC = locate(37.7);
  const pendingD = locate(37.8);
  assert.equal(requests[3].signal.aborted, true, 'different coordinates cancel the old request');
  requests[3].resolve('늦게 도착한 주소 C');
  await pendingC;
  assert.equal(latestAddress(), '갱신한 주소 A');
  assert.equal(locate(37.8), pendingD, 'old completion cannot clear the newer pending request');
  assert.equal(requests.length, 5);
  requests[4].resolve('주소 D');
  await pendingD;
  assert.equal(latestAddress(), '주소 D');
  await locate(37.8);
  assert.equal(requests.length, 5);
  const formerA = locate(37.5);
  assert.equal(requests.length, 6, 'only the latest successful coordinate is cached');
  requests[5].resolve('다시 조회한 주소 A');
  await formerA;

  const fallback = locate(37.9);
  requests[6].resolve('현재 위치');
  await fallback;
  const retryFallback = locate(37.9);
  assert.equal(requests.length, 8, 'fallback text must not be cached');
  requests[7].resolve('주소 E');
  await retryFallback;

  const failure = locate(38.0);
  requests[8].reject(new Error('address unavailable'));
  await failure;
  const retryFailure = locate(38.0);
  assert.equal(requests.length, 10, 'failed work is removed so the next call can retry');
  requests[9].resolve('주소 F');
  await retryFailure;

  const pendingUnmount = locate(38.1);
  assert.ok(cleanups.some((cleanup) => typeof cleanup === 'function'));
  cleanups.forEach((cleanup) => cleanup?.());
  assert.equal(requests[10].signal.aborted, true, 'unmount cancels pending address work');
  requests[10].resolve('언마운트 후 도착한 주소 G');
  await pendingUnmount;
  assert.equal(latestAddress(), '주소 F');
});
