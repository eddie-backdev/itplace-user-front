import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
// Execute the actual TypeScript modules with only the HTTP transport substituted.
const load = (path, api, modules = new Map()) => {
  const filename = resolve(path);
  if (modules.has(filename)) return modules.get(filename);
  const loadedModule = { exports: {} };
  modules.set(filename, loadedModule.exports);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const dependency = (name) => {
    if (name.endsWith('/axiosInstance')) return api;
    if (!name.startsWith('.')) return require(name);
    const local = resolve(dirname(filename), name);
    if (local.endsWith('.json')) return JSON.parse(readFileSync(local, 'utf8'));
    return load(existsSync(`${local}.ts`) ? `${local}.ts` : `${local}/index.ts`, api, modules);
  };
  new Function('require', 'module', 'exports', code)(dependency, loadedModule, loadedModule.exports);
  return loadedModule.exports;
};

test('내 멤버십 목록·상세 요청은 등급을 전달하고 기본 혜택 제한을 해제한다', async () => {
  const calls = [];
  const api = {
    get: async (path, options) => {
      calls.push({ path, params: options.params });
      return { data: { data: { carrierGroups: [] } } };
    },
  };
  const benefits = load('src/features/allBenefitsPage/apis/allBenefitsApi.ts', api);
  await benefits.getPartnerBenefits({ carriers: ['LGU'], grade: 'VIP' });
  await benefits.getPartnerBenefitDetail(284, { carrier: 'LGU', grade: 'VIP' });
  assert.equal(calls[0].params.carriers, 'LGU');
  assert.equal(calls[0].params.grade, 'VIP');
  assert.equal(calls[0].params.mainCategory, undefined);
  assert.deepEqual(calls[1].params, { carrier: 'LGU', grade: 'VIP', mainCategory: undefined });
  await benefits.getPartnerBenefitDetail(284);
  assert.deepEqual(calls[2].params, { mainCategory: 'BASIC_BENEFIT' });
});

test('상세 URL은 통신사에 맞는 등급만 필터로 허용한다', () => {
  const { getMembershipFilter } = load('src/utils/membership.ts');
  assert.deepEqual(getMembershipFilter('SKT', 'SKT_VIP'), { carrier: 'SKT', grade: 'SKT_VIP' });
  assert.deepEqual(getMembershipFilter('LGU'), { carrier: 'LGU', grade: undefined });
  assert.equal(getMembershipFilter('SKT', 'KT_VIP'), undefined);
  assert.equal(getMembershipFilter('UNKNOWN', 'VIP'), undefined);
});

test('중복 혜택 병합은 공식 원문·등급 정보를 보존하고 제한없음 문구를 정규화한다', () => {
  const { normalizePartnerBenefitDetail } = load(
    'src/features/allBenefitsPage/apis/partnerBenefitModel.ts'
  );
  const base = {
    benefitId: 1,
    benefitName: '할인',
    usageType: 'OFFLINE',
    tierBenefits: [],
    isFavorite: false,
    favoriteCount: 0,
  };
  const tier = { carrier: 'SKT', grade: 'SKT_VIP', context: '10% 할인', isAll: false };
  const result = normalizePartnerBenefitDetail({
    partnerId: 1,
    carrierGroups: [
      {
        carrier: 'SKT',
        benefits: [
          { ...base, sourceUrl: 'https://example.com/official', tierBenefits: [tier] },
          {
            ...base,
            manual: '매장에서 멤버십 바코드를 보여 주세요.',
            benefitLimit: '제한없음',
            tierBenefits: [tier],
            favoriteCount: 3,
          },
        ],
      },
    ],
  });
  const [benefit] = result.carrierGroups[0].benefits;
  assert.equal(result.carrierGroups[0].benefits.length, 1);
  assert.equal(benefit.sourceUrl, 'https://example.com/official');
  assert.deepEqual(benefit.tierBenefits, [tier]);
  assert.equal(benefit.favoriteCount, 3);
  const display = JSON.parse(readFileSync('src/content/benefit-display.json', 'utf8'));
  assert.equal(benefit.benefitLimit, display.limitLabels['제한없음']);
});

test('compact 지도 응답은 지점 순서·서버 거리·지점별 혜택을 보존한다', () => {
  const { expandMapStorePreviewBatch } = load('src/features/mainPage/utils/dataTransform.ts');
  const result = expandMapStorePreviewBatch(
    {
      partners: [
        { partnerId: 10, partnerName: '카페', category: '카페', tierBenefit: ['partner'] },
      ],
      stores: [
        {
          storeId: 2,
          partnerId: 10,
          storeName: '2호점',
          latitude: 37,
          longitude: 127,
          distance: 8.2,
          tierBenefit: ['store'],
        },
        { storeId: 1, partnerId: 10, storeName: '1호점', latitude: 37, longitude: 127 },
        { storeId: 3, partnerId: 99, storeName: '독립점', latitude: 37, longitude: 127 },
      ],
    },
    37,
    127
  );
  assert.deepEqual(
    result.map((store) => store.storeId),
    [2, 1, 3]
  );
  assert.deepEqual(
    result.map((store) => store.distance),
    [8.2, 0, 0]
  );
  assert.deepEqual(result[0].tierBenefit, ['store']);
  assert.deepEqual(result[1].tierBenefit, ['partner']);
  assert.equal(result[2].partnerName, '독립점');
});

test('compact 미지원 404·405에서만 기존 지도 API로 대체한다', async () => {
  for (const status of [404, 405, 429, 500]) {
    const calls = [];
    const error = { isAxiosError: true, response: { status } };
    const map = load('src/features/mainPage/api/storeApi.ts', {
      get: async (path) => {
        calls.push(path);
        if (path.endsWith('/compact')) throw error;
        return { data: { data: [] } };
      },
    });
    const request = map.getStorePreviewList({ lat: 37, lng: 127 });
    if ([404, 405].includes(status)) {
      assert.deepEqual(await request, { data: [] });
      assert.equal(calls.length, 2);
    } else {
      await assert.rejects(request, (reason) => reason === error);
      assert.equal(calls.length, 1);
    }
  }
});

test('취소된 compact 요청은 기존 API를 재호출하지 않는다', async () => {
  const controller = new AbortController();
  let calls = 0;
  const error = { isAxiosError: true, response: { status: 404 } };
  const map = load('src/features/mainPage/api/storeApi.ts', {
    get: async () => {
      calls++;
      controller.abort();
      throw error;
    },
  });
  await assert.rejects(
    map.getStorePreviewList({ lat: 37, lng: 127 }, controller.signal),
    (reason) => reason === error
  );
  assert.equal(calls, 1);
});

test('문자 인증 발급·확인 요청에 취소 신호와 제한 시간이 전달된다', async () => {
  const calls = [];
  const sms = load('src/features/loginPage/apis/verification.ts', {
    post: async (...args) => {
      calls.push(args);
      return { data: { data: {} } };
    },
  });
  const signal = new AbortController().signal;
  await sms.issueSmsVerificationCode('01012345678', signal);
  await sms.confirmSmsVerificationCode('01012345678', signal);
  assert.deepEqual(
    calls.map(([path]) => path),
    ['/api/v1/verification/sms', '/api/v1/verification/sms/confirm']
  );
  for (const [, body, config] of calls) {
    assert.deepEqual(body, { phoneNumber: '01012345678' });
    assert.equal(config.signal, signal);
    assert.equal(config.timeout, 10000);
  }
});
