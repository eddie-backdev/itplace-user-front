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
    const dependencyPath = /\.(?:mjs|ts)$/.test(local)
      ? local
      : existsSync(`${local}.ts`)
        ? `${local}.ts`
        : `${local}/index.ts`;
    return load(dependencyPath, api, modules);
  };
  new Function('require', 'module', 'exports', code)(
    dependency,
    loadedModule,
    loadedModule.exports
  );
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

test('혜택 미리보기는 짧은 VIP 조건보다 공통 등급 조건을 보여주며 통신사를 섞지 않는다', () => {
  const { getPartnerBenefitPreview } = load('src/utils/benefitPreview.ts');
  const tiers = [
    { grade: 'SKT_VIP', context: '5% 할인', isAll: false },
    { grade: 'SKT_GOLD', context: '공차 제조 음료 10% 할인 ※ 일부 상품 제외', isAll: false },
    { grade: 'SKT_SILVER', context: '공차 제조 음료 10% 할인 ※ 일부 상품 제외', isAll: false },
  ];
  const partner = {
    partnerName: '공차',
    previews: [
      { carrier: 'SKT', tierBenefits: tiers, usageType: 'OFFLINE', benefitLimit: '월 1회' },
    ],
  };
  const preview = getPartnerBenefitPreview(partner, 'SKT');
  assert.equal(preview.title, '제조 음료 10% 할인');
  assert.equal(preview.grades, 'Silver · Gold');
  assert.equal(preview.condition, '일부 상품 제외');
  assert.equal(preview.limit, '월 1회');
  assert.equal(preview.usage, '오프라인');
  const vipPreview = getPartnerBenefitPreview(partner, 'SKT', 'SKT_VIP');
  assert.equal(vipPreview.title, '5% 할인');
  assert.equal(vipPreview.grades, 'VIP');
  assert.equal(getPartnerBenefitPreview(partner, 'SKT', 'KT_VIP'), null);
  assert.equal(getPartnerBenefitPreview(partner, undefined, 'SKT_VIP'), null);
  const allGradePreview = getPartnerBenefitPreview(
    {
      partnerName: '공차',
      previews: [
        {
          carrier: 'SKT',
          tierBenefits: [{ grade: 'SKT_VIP', context: '전 등급 5% 할인', isAll: true }],
        },
      ],
    },
    'SKT',
    'SKT_SILVER'
  );
  assert.equal(allGradePreview.title, '전 등급 5% 할인');
  assert.equal(allGradePreview.grades, 'Silver');
  const lguKokPreview = getPartnerBenefitPreview(
    {
      partnerName: '공차',
      previews: [
        {
          carrier: 'LGU',
          tierBenefits: [{ grade: 'VIP콕', context: 'VIP콕 할인', isAll: false }],
        },
      ],
    },
    'LGU',
    'VVIP'
  );
  assert.equal(lguKokPreview.title, 'VIP콕 할인');
  assert.equal(lguKokPreview.grades, 'VVIP');
  assert.equal(
    getPartnerBenefitPreview(
      {
        ...partner,
        previews: [
          ...partner.previews,
          { carrier: 'KT', tierBenefits: [{ grade: 'KT_VIP', context: 'KT 할인', isAll: false }] },
        ],
      },
      'SKT',
      'KT_VIP'
    ),
    null
  );
  const bothPreview = getPartnerBenefitPreview(
    {
      ...partner,
      previews: [{ ...partner.previews[0], usageType: 'BOTH' }],
    },
    'SKT'
  );
  assert.equal(bothPreview.usage, '온라인·오프라인');
  assert.equal(getPartnerBenefitPreview(partner, 'KT'), null);
  assert.equal(getPartnerBenefitPreview({ partnerName: '공차' }), null);
  assert.deepEqual(partner.previews[0].tierBenefits, tiers);
});

test('전체 혜택 카드는 통신사별 미리보기를 정렬하고 누락된 조건과 등급 범위를 보존한다', () => {
  const { getPartnerBenefitPreviews } = load('src/utils/benefitPreview.ts');
  const partner = {
    partnerName: 'GS25',
    carriers: ['LGU', 'KT', 'SKT'],
    previews: [
      {
        carrier: 'KT',
        tierBenefits: [
          { grade: 'KT_VIP', context: 'GS25 1,000원당 50원 할인 ※ 행사상품 제외', isAll: false },
        ],
      },
      {
        carrier: 'SKT',
        tierBenefits: [
          { grade: 'SKT_VIP', context: 'GS25 1,000원당 50원 할인', isAll: false },
          { grade: 'SKT_GOLD', context: 'GS25 1,000원당 50원 할인', isAll: false },
          { grade: 'SKT_SILVER', context: 'GS25 1,000원당 50원 할인', isAll: false },
        ],
      },
    ],
  };
  const original = structuredClone(partner);
  const previews = getPartnerBenefitPreviews(partner);

  assert.deepEqual(
    previews.map(({ carrier }) => carrier),
    ['SKT', 'KT', 'LGU']
  );
  assert.equal(previews[0].grades, '');
  assert.equal(previews[0].title, '1,000원당 50원 할인');
  assert.equal(previews[1].grades, 'VIP');
  assert.equal(previews[1].condition, '행사상품 제외');
  assert.equal(previews[2].title, '혜택 조건 확인');
  assert.equal(previews[2].grades, '');
  assert.deepEqual(partner, original);

  const blankPreview = getPartnerBenefitPreviews({
    partnerName: '편의점',
    carriers: ['LGU'],
    previews: [
      { carrier: 'LGU', tierBenefits: [{ grade: 'VIP', context: '  ', isAll: false }] },
    ],
  });
  assert.deepEqual(blankPreview, [
    { carrier: 'LGU', title: '혜택 조건 확인', condition: '', grades: '' },
  ]);
});

test('GS25 통신사별 미리보기는 공통 등급 범위와 원문 요일·등급 조건을 유지한다', () => {
  const { getPartnerBenefitPreview, getPartnerBenefitPreviews } = load(
    'src/utils/benefitPreview.ts'
  );
  const partner = {
    partnerName: 'GS25',
    carriers: ['LGU', 'KT', 'SKT'],
    previews: [
      {
        carrier: 'SKT',
        tierBenefits: [
          {
            grade: 'SKT_VIP',
            context: '매주 화요일, 프레시 푸드 1천 원당 200원 할인',
            isAll: true,
          },
          {
            grade: 'SKT_GOLD',
            context: '매주 화요일, 프레시 푸드 1천 원당 200원 할인',
            isAll: true,
          },
          {
            grade: 'SKT_SILVER',
            context: '매주 화요일, 프레시 푸드 1천 원당 200원 할인',
            isAll: true,
          },
        ],
      },
      {
        carrier: 'KT',
        tierBenefits: [
          { grade: 'KT_VVIP', context: '1,000원당 100원 할인', isAll: false },
          { grade: 'KT_VIP', context: '1,000원당 100원 할인', isAll: false },
          { grade: 'KT_GOLD', context: '1,000원당 100원 할인', isAll: false },
          { grade: 'KT_GENERAL', context: '1,000원당 50원 할인', isAll: false },
        ],
      },
      {
        carrier: 'LGU',
        tierBenefits: [
          {
            grade: 'VVIP',
            context: 'VVIP/VIP : 1천원당 100원 할인 우수 : 1천원당 50원 할인',
            isAll: true,
          },
          {
            grade: 'VIP',
            context: 'VVIP/VIP : 1천원당 100원 할인 우수 : 1천원당 50원 할인',
            isAll: true,
          },
          {
            grade: 'BASIC',
            context: 'VVIP/VIP : 1천원당 100원 할인 우수 : 1천원당 50원 할인',
            isAll: true,
          },
        ],
      },
    ],
  };
  const [skt, kt, lgu] = getPartnerBenefitPreviews(partner);

  assert.equal(skt.grades, '');
  assert.equal(skt.title, '매주 화요일, 프레시 푸드 1천 원당 200원 할인');
  assert.equal(kt.title, '1,000원당 100원 할인');
  assert.equal(kt.grades, 'Gold · VIP · VVIP');
  assert.equal(getPartnerBenefitPreview(partner, 'KT', 'KT_GENERAL').title, '1,000원당 50원 할인');
  assert.equal(getPartnerBenefitPreview(partner, 'KT', 'KT_GENERAL').grades, '일반');
  assert.equal(lgu.grades, '');
  assert.equal(lgu.title, 'VVIP/VIP : 1천원당 100원 할인 우수 : 1천원당 50원 할인');
});

test('편집 해설은 선택 통신사에 일치하는 제휴처 메모만 반환한다', () => {
  const notes = JSON.parse(readFileSync('src/content/partner-notes.json', 'utf8'));
  const { getPartnerNoteForCarrier } = load('src/utils/partnerNotes.ts');
  assert.equal(notes.length, 8);
  for (const note of notes) {
    assert.equal(note.carrier, [287, 21].includes(note.partnerId) ? 'KT' : 'SKT');
  }
  const gs25 = getPartnerNoteForCarrier(notes, 112, 'SKT');
  assert.equal(gs25.carrier, 'SKT');
  assert.equal(gs25.checks[0], '오늘이 화요일인지');
  assert.equal(getPartnerNoteForCarrier(notes, 112, 'KT'), null);
  assert.equal(getPartnerNoteForCarrier(notes, 287, 'KT').carrier, 'KT');
  assert.equal(getPartnerNoteForCarrier(notes, 21, 'KT').carrier, 'KT');
  assert.equal(getPartnerNoteForCarrier(notes, 112), null);
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
  const verificationText = 'A'.repeat(32);
  await sms.issueSmsVerificationCode('01012345678', signal);
  await sms.confirmSmsVerificationCode('01012345678', verificationText, signal);
  assert.deepEqual(
    calls.map(([path]) => path),
    ['/api/v1/verification/sms', '/api/v1/verification/sms/confirm']
  );
  assert.deepEqual(calls[0][1], { phoneNumber: '01012345678' });
  assert.deepEqual(calls[1][1], {
    phoneNumber: '01012345678',
    verificationText,
  });
  for (const [, , config] of calls) {
    assert.equal(config.signal, signal);
    assert.equal(config.timeout, 10000);
  }
});
