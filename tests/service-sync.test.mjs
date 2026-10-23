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

const previewReferenceData = {
  grades: [
    ['LGU', 'BASIC', '우수', 10], ['LGU', 'VIP', 'VIP', 20], ['LGU', 'VVIP', 'VVIP', 30],
    ['LGU', 'DIAMOND', '다이아몬드', 40], ['LGU', 'VIP콕', 'VIP콕', 50],
    ['SKT', 'SKT_SILVER', 'Silver', 10], ['SKT', 'SKT_GOLD', 'Gold', 20], ['SKT', 'SKT_VIP', 'VIP', 30], ['SKT', 'SKT_LITE', 'Lite', 40],
    ['KT', 'KT_GENERAL', '일반', 10], ['KT', 'KT_WHITE', 'White', 20], ['KT', 'KT_SILVER', 'Silver', 30], ['KT', 'KT_GOLD', 'Gold', 40], ['KT', 'KT_VIP', 'VIP', 50], ['KT', 'KT_VVIP', 'VVIP', 60],
  ].map(([carrier, code, label, sortOrder]) => ({ carrier, code, label, sortOrder, active: true, profileSelectable: code !== 'DIAMOND' && code !== 'VIP콕', benefitEnabled: true, allGradeMember: code !== 'VIP콕' })),
  gradeMatches: [
    { carrier: 'LGU', profileGrade: 'VIP', benefitGrade: 'VIP콕' },
    { carrier: 'LGU', profileGrade: 'VVIP', benefitGrade: 'VIP콕' },
  ],
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
  assert.deepEqual(calls[2].params, {});
});

test('상세 URL은 통신사에 맞는 등급만 필터로 허용한다', () => {
  const {
    getCarrierGradeOrder,
    getMembershipFilter,
    getMembershipGradeLabel,
    getMembershipGradeOptions,
  } = load('src/utils/membership.ts');
  const referenceData = { grades: [
    { carrier: 'SKT', code: 'SKT_LITE', label: 'Lite', sortOrder: 40, active: true, profileSelectable: true },
    { carrier: 'SKT', code: 'SKT_VIP', label: 'VIP', sortOrder: 30, active: true, profileSelectable: true },
    { carrier: 'SKT', code: 'SKT_GOLD', label: 'Gold', sortOrder: 20, active: true, profileSelectable: true },
    { carrier: 'SKT', code: 'SKT_SILVER', label: 'Silver', sortOrder: 10, active: true, profileSelectable: true },
    { carrier: 'LGU', code: 'DIAMOND', label: '다이아몬드', sortOrder: 40, active: true, profileSelectable: false },
    { carrier: 'KT', code: 'KT_VIP', label: 'VIP', sortOrder: 50, active: true, profileSelectable: true },
  ] };
  assert.deepEqual(getMembershipFilter('SKT', 'SKT_VIP', referenceData), { carrier: 'SKT', grade: 'SKT_VIP' });
  assert.deepEqual(getMembershipFilter('SKT', 'SKT_LITE', referenceData), { carrier: 'SKT', grade: 'SKT_LITE' });
  assert.deepEqual(getMembershipFilter('LGU', undefined, referenceData), { carrier: 'LGU', grade: undefined });
  assert.equal(getMembershipFilter('KT', 'SKT_LITE', referenceData), undefined);
  assert.equal(getMembershipFilter('SKT', 'KT_VIP', referenceData), undefined);
  assert.equal(getMembershipFilter('UNKNOWN', 'VIP', referenceData), undefined);
  assert.equal(getMembershipGradeLabel('SKT_LITE', referenceData), 'Lite');
  assert.equal(getMembershipGradeLabel('DIAMOND', referenceData), '다이아몬드');
  assert.equal(getMembershipGradeOptions('SKT', referenceData)[0].code, 'SKT_SILVER');
  assert.deepEqual(getCarrierGradeOrder('SKT', [], referenceData), ['SKT_SILVER', 'SKT_GOLD', 'SKT_VIP', 'SKT_LITE']);
  assert.equal(getMembershipFilter('LGU', 'DIAMOND', referenceData), undefined);
  referenceData.grades.push({ carrier: 'SKT', code: 'SKT_PLUS', label: 'Plus', sortOrder: 50, active: true, profileSelectable: true });
  assert.equal(getMembershipFilter('SKT', 'SKT_PLUS', referenceData)?.grade, 'SKT_PLUS');
});

test('reference catalog supports DB-added grade/category values and excludes source-only profile grades', () => {
  const { getMembershipGradeOptions, isValidCarrierGradePair } = load('src/utils/membership.ts');
  const { toCategoryOptions } = load('src/utils/referenceData.ts');
  const { getBenefitMembershipFilter, getBenefitMembershipGradeOptions } = load('src/utils/membership.ts');
  const data = structuredClone(previewReferenceData);
  data.grades.push(
    { carrier: 'SKT', code: 'SKT_PLUS', label: 'Plus', sortOrder: 50, active: true, profileSelectable: true },
    { carrier: 'LGU', code: 'LGU_IMPORT_ONLY', label: 'Import only', sortOrder: 60, active: true, profileSelectable: false },
    { carrier: 'SKT', code: 'SKT_RETIRED', label: 'Retired', sortOrder: 60, active: false, profileSelectable: true }
  );
  data.categories = [
    { code: '푸드', label: '음식·카페', sortOrder: 30, active: true },
    { code: 'NEW_CATEGORY', label: '새 카테고리', sortOrder: 20, active: true },
    { code: 'OLD_CATEGORY', label: '예전 카테고리', sortOrder: 40, active: false },
  ];
  data.grades.find(({ code }) => code === 'LGU_IMPORT_ONLY').benefitEnabled = true;
  data.grades.find(({ code }) => code === 'LGU_IMPORT_ONLY').profileSelectable = false;
  data.grades.find(({ code }) => code === 'LGU_IMPORT_ONLY').allGradeMember = true;
  data.grades.find(({ code }) => code === 'SKT_PLUS').benefitEnabled = true;
  data.grades.find(({ code }) => code === 'SKT_PLUS').allGradeMember = true;
  data.grades.find(({ code }) => code === 'SKT_RETIRED').benefitEnabled = true;
  data.grades.find(({ code }) => code === 'SKT_RETIRED').allGradeMember = true;
  data.grades.find(({ code }) => code === 'LGU_IMPORT_ONLY').label = 'DB 변경 표시명';

  assert.equal(getMembershipGradeOptions('SKT', data).at(-1).code, 'SKT_PLUS');
  assert.equal(isValidCarrierGradePair('SKT', 'SKT_PLUS', data), true);
  assert.equal(isValidCarrierGradePair('SKT', 'SKT_RETIRED', data), false);
  assert.equal(isValidCarrierGradePair('LGU', 'LGU_IMPORT_ONLY', data), false);
  assert.deepEqual(getBenefitMembershipFilter('LGU', 'LGU_IMPORT_ONLY', data), { carrier: 'LGU', grade: 'LGU_IMPORT_ONLY' });
  assert.equal(getBenefitMembershipGradeOptions('LGU', data).some(({ code }) => code === 'LGU_IMPORT_ONLY'), true);
  assert.equal(getBenefitMembershipGradeOptions('LGU', data).some(({ code }) => code === 'VIP콕'), false);
  assert.equal(getBenefitMembershipGradeOptions('SKT', data).some(({ code }) => code === 'SKT_RETIRED'), false);
  const diamond = data.grades.find(({ code }) => code === 'DIAMOND');
  assert.equal(diamond.profileSelectable, false);
  assert.equal(getBenefitMembershipFilter('LGU', 'DIAMOND', data)?.grade, 'DIAMOND');
  assert.equal(load('src/utils/referenceData.ts').getCategoryLabel('푸드', data), '음식·카페');
  assert.equal(load('src/utils/referenceData.ts').getCategoryLabel('UNKNOWN_CATEGORY', data), 'UNKNOWN_CATEGORY');
  assert.deepEqual(toCategoryOptions(data), [
    { id: '전체', name: '전체' },
    { id: 'NEW_CATEGORY', name: '새 카테고리' },
    { id: '푸드', name: '음식·카페' },
  ]);
});

test('DIAMOND 혜택은 등급 일치만 적용하고 LGU 혜택으로 묶는다', () => {
  const { isGradeApplicableToProfile } = load('src/utils/membership.ts');
  const referenceData = previewReferenceData;
  const { groupBenefitsByCarrier } = load('src/features/mainPage/utils/benefitGrouping.ts');
  assert.equal(
    isGradeApplicableToProfile({
      benefitCarrier: 'LGU',
      benefitGrade: 'DIAMOND',
      userCarrier: 'LGU',
      userGrade: 'DIAMOND',
      referenceData,
    }),
    true
  );
  for (const userGrade of ['BASIC', 'VIP', 'VVIP']) {
    assert.equal(
      isGradeApplicableToProfile({
        benefitCarrier: 'LGU',
        benefitGrade: 'DIAMOND',
        userCarrier: 'LGU',
        userGrade,
        referenceData,
      }),
      false
    );
  }
  const groups = groupBenefitsByCarrier(
    [{ grade: 'DIAMOND', context: '다이아몬드 전용 혜택' }],
    null,
    referenceData
  );
  assert.equal(groups[0].key, 'LGU');
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
  const preview = getPartnerBenefitPreview(partner, 'SKT', undefined, previewReferenceData);
  assert.equal(preview.title, '혜택 상세 보기');
  assert.equal(preview.grades, '');
  assert.equal(preview.condition, '');
  assert.equal(preview.limit, '월 1회');
  assert.equal(preview.usage, '오프라인');
  const vipPreview = getPartnerBenefitPreview(partner, 'SKT', 'SKT_VIP', previewReferenceData);
  assert.equal(vipPreview.title, '혜택 상세 보기');
  assert.equal(vipPreview.grades, 'VIP');
  assert.equal(getPartnerBenefitPreview(partner, 'SKT', 'KT_VIP').title, '혜택 적용 여부 확인');
  assert.equal(getPartnerBenefitPreview(partner, undefined, 'SKT_VIP').title, '혜택 상세 보기');
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
    'SKT_SILVER',
    previewReferenceData
  );
  assert.equal(allGradePreview.title, '혜택 상세 보기');
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
    'VVIP',
    previewReferenceData
  );
  assert.equal(lguKokPreview.title, '혜택 적용 여부 확인');
  assert.equal(lguKokPreview.grades, 'VVIP');
  assert.equal(getPartnerBenefitPreview({ ...partner, previews: [...partner.previews, { carrier: 'KT', tierBenefits: [{ grade: 'KT_VIP', context: 'KT 할인', isAll: false }] }] }, 'SKT', 'KT_VIP', previewReferenceData).title, '혜택 적용 여부 확인');
  const bothPreview = getPartnerBenefitPreview(
    {
      ...partner,
      previews: [{ ...partner.previews[0], usageType: 'BOTH' }],
    },
    'SKT',
    undefined,
    previewReferenceData
  );
  assert.equal(bothPreview.usage, '온라인 · 오프라인');
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
  const previews = getPartnerBenefitPreviews(partner, previewReferenceData);

  assert.deepEqual(
    previews.map(({ carrier }) => carrier),
    ['SKT', 'KT', 'LGU']
  );
  assert.equal(previews[0].grades, '');
  assert.equal(previews[0].title, '혜택 상세 보기');
  assert.equal(previews[1].grades, '');
  assert.equal(previews[1].title, '혜택 상세 보기');
  assert.equal(previews[1].condition, '');
  assert.equal(previews[2].title, '혜택 조건 확인');
  assert.equal(previews[2].grades, '');
  assert.deepEqual(partner, original);

  const blankPreview = getPartnerBenefitPreviews({
    partnerName: '편의점',
    carriers: ['LGU'],
    previews: [{ carrier: 'LGU', tierBenefits: [{ grade: 'VIP', context: '  ', isAll: false }] }],
  });
  assert.deepEqual(blankPreview, [
    { carrier: 'LGU', title: '혜택 상세 보기', condition: '', grades: '' },
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
            isAll: false,
          },
          {
            grade: 'SKT_GOLD',
            context: '매주 화요일, 프레시 푸드 1천 원당 200원 할인',
            isAll: false,
          },
          {
            grade: 'SKT_SILVER',
            context: '매주 화요일, 프레시 푸드 1천 원당 200원 할인',
            isAll: false,
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
  const [skt, kt, lgu] = getPartnerBenefitPreviews(partner, previewReferenceData);

  assert.equal(skt.grades, '');
  assert.equal(skt.title, '혜택 상세 보기');
  assert.equal(kt.title, '혜택 상세 보기');
  assert.equal(kt.grades, '');
  assert.equal(getPartnerBenefitPreview(partner, 'KT', 'KT_GENERAL', previewReferenceData).title, '혜택 상세 보기');
  assert.equal(getPartnerBenefitPreview(partner, 'KT', 'KT_GENERAL', previewReferenceData).grades, '일반');
  assert.equal(lgu.grades, '');
  assert.equal(lgu.title, '혜택 상세 보기');
});

test('다이아몬드 전용 혜택 미리보기는 전체 등급 혜택으로 표시하지 않는다', () => {
  const { getPartnerBenefitPreview } = load('src/utils/benefitPreview.ts');
  const partner = {
    partnerName: '제휴처',
    previews: [
      {
        carrier: 'LGU',
        tierBenefits: [{ grade: 'DIAMOND', context: '다이아몬드 전용', isAll: false }],
      },
    ],
  };
  const preview = getPartnerBenefitPreview(partner, 'LGU', undefined, previewReferenceData);
  assert.equal(preview.grades, '');
  assert.equal(preview.title, '혜택 상세 보기');
  assert.equal(preview.appliesToEveryGrade, false);
  assert.equal(getPartnerBenefitPreview(partner, 'LGU', 'VIP').title, '혜택 적용 여부 확인');
});

test('선택 멤버십 응답의 VIP콕 혜택을 공통 비교 데이터에 합친다', () => {
  const { mergePartnerBenefitDetails } = load(
    'src/features/allBenefitsPage/apis/partnerBenefitModel.ts'
  );
  const makeBenefit = (benefitId, carrier, grade, context) => ({
    benefitId,
    benefitName: '제휴 혜택',
    description: '',
    benefitLimit: null,
    manual: '',
    usageType: 'OFFLINE',
    tierBenefits: [{ carrier, grade, context, isAll: false }],
    isFavorite: false,
    favoriteCount: 0,
  });
  const canonical = {
    partnerId: 999,
    partnerName: '검증 제휴처',
    category: null,
    image: null,
    carrierGroups: [
      { carrier: 'LGU', benefits: [makeBenefit(1, 'LGU', 'VIP', '일반 VIP 혜택')] },
      { carrier: 'SKT', benefits: [makeBenefit(2, 'SKT', 'SKT_VIP', 'SKT 혜택')] },
    ],
  };
  const selected = {
    ...canonical,
    carrierGroups: [
      { carrier: 'LGU', benefits: [makeBenefit(3, 'LGU', 'VIP콕', 'VIP콕 특별 혜택')] },
    ],
  };

  const merged = mergePartnerBenefitDetails(canonical, selected);
  assert.deepEqual(
    merged.carrierGroups
      .find(({ carrier }) => carrier === 'LGU')
      .benefits.map(({ benefitId }) => benefitId),
    [1, 3]
  );
  assert.equal(
    merged.carrierGroups.find(({ carrier }) => carrier === 'SKT').benefits[0].benefitId,
    2
  );
});

test('편집 해설은 선택 통신사에 일치하는 제휴처 메모만 반환한다', () => {
  const notes = JSON.parse(readFileSync('src/content/partner-notes.json', 'utf8'));
  const { getPartnerNoteForCarrier } = load('src/utils/partnerNotes.ts');
  assert.equal(notes.length, 10);
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

test('미리보기 이용 채널은 제휴처별 추정 없이 API 값을 표시한다', () => {
  const { getPartnerBenefitPreview } = load('src/utils/benefitPreview.ts');
  const makePartner = (partnerId, partnerName, usageType) => ({
    partnerId,
    partnerName,
    previews: [
      {
        carrier: 'SKT',
        usageType,
        tierBenefits: [{ grade: 'SKT_VIP', context: '혜택', isAll: false }],
      },
    ],
  });

  for (const partnerId of [131, 112, 288]) {
    for (const [usageType, expected] of [
      ['ONLINE', '온라인'],
      ['OFFLINE', '오프라인'],
      ['BOTH', '온라인 · 오프라인'],
      ['UNKNOWN', '이용 방식 확인 필요'],
      [null, '이용 방식 확인 필요'],
    ]) {
      assert.equal(
        getPartnerBenefitPreview(
          makePartner(partnerId, '제휴처', usageType),
          'SKT',
          undefined,
          previewReferenceData
        ).usage,
        expected
      );
    }
  }
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

test('중복 병합은 새 조건 필드와 출처 확인일을 레거시 값에 덮어쓰지 않는다', () => {
  const { normalizePartnerBenefitDetail } = load(
    'src/features/allBenefitsPage/apis/partnerBenefitModel.ts'
  );
  const official = {
    benefitId: 1,
    benefitName: '할인',
    usageType: 'OFFLINE',
    tierBenefits: [],
    isFavorite: false,
    favoriteCount: 0,
    sourceCapturedAt: '2026-10-19T00:00:00Z',
    conditions: { products: ['전체 상품'], availability: ['매일'] },
  };
  const legacy = {
    ...official,
    manual: '매장에서 멤버십 바코드를 보여 주세요.',
    sourceCapturedAt: null,
    conditions: { products: [], limits: ['일 1회'] },
  };
  for (const benefits of [
    [official, legacy],
    [legacy, official],
  ]) {
    const result = normalizePartnerBenefitDetail({
      partnerId: 1,
      carrierGroups: [{ carrier: 'SKT', benefits }],
    });
    const [benefit] = result.carrierGroups[0].benefits;
    assert.equal(benefit.sourceCapturedAt, official.sourceCapturedAt);
    assert.deepEqual(benefit.conditions, {
      products: ['전체 상품'],
      availability: ['매일'],
      limits: ['일 1회'],
    });
  }
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

test('offer 미리보기는 선택 등급에 맞는 단위 혜택만 표시하고 혼합 요약을 대체하지 않는다', () => {
  const { getPartnerBenefitPreview } = load('src/utils/benefitPreview.ts');
  const offers = [
    { key: 'movie', title: 'CGV 티켓 할인', sourceText: 'CGV 티켓 할인', usageType: 'ONLINE', gradeCodes: ['SKT_GOLD'], allGrades: false, products: ['영화 티켓'], availability: [], limits: ['월 1회'], usage: [], exclusions: [], channelEvidence: ['온라인 예매'] },
    { key: 'combo', title: '콤보 할인', sourceText: '매장 콤보 할인', usageType: 'OFFLINE', gradeCodes: ['SKT_SILVER'], allGrades: false, products: ['콤보'], availability: [], limits: [], usage: [], exclusions: [], channelEvidence: ['매장 이용'] },
  ];
  const partner = { partnerName: 'CGV', previews: [{ carrier: 'SKT', usageType: 'BOTH', summary: { offerKey: 'movie', title: 'CGV 티켓 할인', condition: '영화 티켓', limit: '월 1회', usage: 'ONLINE', grades: ['SKT_GOLD'], allGrades: false, version: '1' }, tierBenefits: [{ grade: 'SKT_VIP', context: '온라인·오프라인 모두 할인', isAll: true }], offers, offerResolution: 'SCOPED' }] };
  const selected = getPartnerBenefitPreview(partner, 'SKT', 'SKT_GOLD', previewReferenceData);
  assert.equal(selected.title, 'CGV 티켓 할인');
  assert.equal(selected.usage, '온라인');
  assert.equal(selected.limit, '월 1회');
  const unknown = getPartnerBenefitPreview({ partnerName: 'CGV', previews: [{ ...partner.previews[0], summary: null }] }, 'SKT', 'SKT_VIP', previewReferenceData);
  assert.equal(unknown.title, '혜택 적용 여부 확인');
  assert.equal(unknown.usage, '이용 채널 확인 필요');
  const unresolved = getPartnerBenefitPreview({ partnerName: 'CGV', previews: [{ carrier: 'SKT', summary: null, tierBenefits: [{ grade: 'SKT_VIP', context: '혼합 부모 조건', isAll: true }], offers: [], offerResolution: 'UNRESOLVED' }] }, 'SKT', 'SKT_VIP', previewReferenceData);
  assert.equal(unresolved.title, '혜택 적용 여부 확인');

  const singlePartner = {
    partnerName: '영화관',
    previews: [{
      carrier: 'SKT',
      usageType: 'BOTH',
      offerResolution: 'SINGLE',
      summary: { offerKey: 'movie', title: '15% 할인', condition: '영화 티켓', limit: '월 1회', usage: 'BOTH', grades: ['SKT_VIP', 'SKT_GOLD', 'SKT_SILVER'], allGrades: false, version: '1' },
      offers: [{ ...offers[0], title: '영화관', usageType: 'BOTH', gradeCodes: ['SKT_VIP', 'SKT_GOLD', 'SKT_SILVER'] }],
      tierBenefits: [
        { grade: 'SKT_VIP', context: '15% 할인', isAll: false },
        { grade: 'SKT_GOLD', context: '15% 할인', isAll: false },
        { grade: 'SKT_SILVER', context: '5% 할인', isAll: false },
      ],
    }],
  };
  const singleSelected = getPartnerBenefitPreview(singlePartner, 'SKT', 'SKT_GOLD', previewReferenceData);
  assert.equal(singleSelected.title, '15% 할인');
  assert.equal(singleSelected.condition, '영화 티켓');
  assert.equal(singleSelected.usage, '온라인 · 오프라인');
  const singleUnselected = getPartnerBenefitPreview(singlePartner, 'SKT', undefined, previewReferenceData);
  assert.equal(singleUnselected.title, '15% 할인');
});

test('KT GS25 White preview leads with verified reward and keeps its maximum qualifier', () => {
  const { getPartnerBenefitPreview } = load('src/utils/benefitPreview.ts');
  const selected = getPartnerBenefitPreview({ partnerName: 'GS25', previews: [{
    carrier: 'KT', offerResolution: 'SCOPED', tierBenefits: [],
    summary: { offerKey: 'white', title: '최대 50원 할인 (1,000원당)', condition: 'GS25 상품', limit: '', usage: 'OFFLINE', grades: ['KT_WHITE'], allGrades: false, version: '1' },
    offers: [{ key: 'white', title: '▶대상:SILVER/WHITE/일반', sourceText: '1,000원당 최대 50원 할인', usageType: 'OFFLINE',
      gradeCodes: ['KT_WHITE'], allGrades: false, products: ['GS25 상품'], availability: [], limits: [], usage: [], exclusions: [],
      facts: [{ type: 'DISCOUNT_AMOUNT', value: 50, unit: 'KRW', basisAmount: 1000, basisUnit: 'KRW', qualifier: 'MAX', sourceText: '1,000원당 최대 50원 할인' }] }],
  }] }, 'KT', 'KT_WHITE', previewReferenceData);
  assert.equal(selected.title, '최대 50원 할인 (1,000원당)');
  assert.equal(selected.condition, 'GS25 상품');
});

test('partial 미리보기는 matched reward fact와 canonical tier를 보존하고 확인 필요를 표시한다', () => {
  const { getPartnerBenefitPreview } = load('src/utils/benefitPreview.ts');
  const partner = { partnerName: '쇼핑몰', previews: [{
    carrier: 'KT', usageType: 'ONLINE', offerResolution: 'PARTIAL', normalizationIssues: [{ code: 'UNASSIGNED_SHARED_RULE' }],
    summary: { offerKey: 'vip', title: '15% 적립', condition: '', limit: 'VIP 초이스 통합 최대 6회/년', usage: 'ONLINE', grades: ['KT_VIP'], allGrades: false, version: '1' },
    tierBenefits: [{ grade: 'KT_VIP', context: 'VIP 연 6회 무료', isAll: false }],
    offers: [{ key: 'vip', title: 'VIP 온라인 적립', sourceText: '15% 적립', usageType: 'ONLINE', gradeCodes: ['KT_VIP'], allGrades: false,
      products: [], availability: [], limits: [], usage: [], exclusions: [], channelEvidence: ['온라인'], facts: [{ type: 'REWARD_RATE', value: 15, unit: 'PERCENT', qualifier: 'EXACT', sourceText: '15% 적립' }, { type: 'USAGE_LIMIT', value: 6, unit: 'COUNT', period: 'YEAR', qualifier: 'MAX', sharedLimitGroup: 'KT:VIP_CHOICE', sourceText: '초이스 연 6회' }] }],
  }] };
  const selected = getPartnerBenefitPreview(partner, 'KT', 'KT_VIP', previewReferenceData);
  assert.match(selected.title, /15% 적립/);
  assert.equal(selected.title, '15% 적립');
  assert.equal(selected.limit, 'VIP 초이스 통합 최대 6회/년');
  assert.equal(selected.condition, '');

  const canonicalFallback = getPartnerBenefitPreview({ partnerName: '쇼핑몰', previews: [{
    carrier: 'KT', usageType: 'UNKNOWN', offerResolution: 'PARTIAL', offers: [],
    tierBenefits: [{ grade: 'KT_VIP', context: 'VIP 연 6회 무료', isAll: false }],
  }] }, 'KT', 'KT_VIP', previewReferenceData);
  assert.equal(canonicalFallback.title, '혜택 상세 보기');
  assert.equal(canonicalFallback.condition, '');
});

test('긴 GS25·공차 원문은 한 보상과 짧은 범위만 카드에 요약한다', () => {
  const { getPartnerBenefitPreview } = load('src/utils/benefitPreview.ts');
  const long = '상세 이용 안내 및 제외 대상 '.repeat(30);
  const mk = (name, title, products, limits, facts, summary) => getPartnerBenefitPreview({ partnerName: name, previews: [{
    carrier: 'SKT', offerResolution: 'SCOPED', tierBenefits: [], summary, offers: [
      { key: 'a', title, sourceText: long, usageType: 'OFFLINE', gradeCodes: ['SKT_VIP'], allGrades: false,
        products, availability: [long], usage: [long], exclusions: [long], limits, facts, channelEvidence: [long] },
      { key: 'b', title: '다른 혜택', sourceText: long, usageType: 'ONLINE', gradeCodes: ['SKT_VIP'], allGrades: false,
        products: [long], availability: [long], usage: [long], exclusions: [long], limits: [], facts: [{ type: 'DISCOUNT_RATE', value: 20, unit: 'PERCENT', qualifier: 'EXACT', sourceText: '20% 할인' }] },
    ],
  }] }, 'SKT', 'SKT_VIP', previewReferenceData);
  const gs25 = mk('GS25', '▶대상:SILVER/WHITE/일반', ['GS25 상품'], [long], [
    { type: 'DISCOUNT_AMOUNT', value: 50, unit: 'KRW', basisAmount: 1000, basisUnit: 'KRW', qualifier: 'MAX', sourceText: '1천원당 최대 50원 할인' },
    { type: 'MIN_SPEND', value: 1000, unit: 'KRW', qualifier: 'MIN', sourceText: '1천원 이상 구매' },
    { type: 'USAGE_LIMIT', value: 1, unit: 'COUNT', period: 'MONTH', qualifier: 'MAX', sourceText: '월 1회' },
  ], { offerKey: 'a', title: '최대 50원 할인 (1,000원당)', condition: 'GS25 상품 · 최소 1,000원 이상 결제', limit: '최대 1회/월', usage: 'OFFLINE', grades: ['SKT_VIP'], allGrades: false, version: '1' });
  assert.equal(gs25.title, '최대 50원 할인 (1,000원당)');
  assert.equal(gs25.condition, 'GS25 상품 · 최소 1,000원 이상 결제');
  assert.equal(gs25.limit, '최대 1회/월');
  const gongcha = mk('공차', '공차 제조 음료 할인', ['제조 음료'], [], [
    { type: 'DISCOUNT_RATE', value: 10, unit: 'PERCENT', qualifier: 'EXACT', sourceText: '10% 할인' },
  ], { offerKey: 'a', title: '10% 할인', condition: '제조 음료', limit: '', usage: 'OFFLINE', grades: ['SKT_VIP'], allGrades: false, version: '1' });
  assert.equal(gongcha.title, '10% 할인');
  assert.equal(gongcha.condition, '제조 음료');
  assert.equal(gongcha.limit, undefined);
  const noReward = getPartnerBenefitPreview({ partnerName: '공차', previews: [{ carrier: 'SKT', summary: null, tierBenefits: [], offerResolution: 'SCOPED', offers: [
    { key: 'unknown', title: '▶대상: 상세 원문', sourceText: long, usageType: 'OFFLINE', gradeCodes: ['SKT_VIP'], allGrades: false,
      products: [long], availability: [long], usage: [long], exclusions: [long], limits: [long], facts: [] },
  ] }] }, 'SKT', 'SKT_VIP', previewReferenceData);
  assert.equal(noReward.title, '혜택 적용 여부 확인');
  assert.equal(noReward.condition, '공식 안내에서 등급과 이용 조건을 확인해 주세요.');
  assert.equal(noReward.limit, undefined);
  const partialTierFallback = getPartnerBenefitPreview({ partnerName: 'GS25', previews: [{
    carrier: 'SKT', offerResolution: 'PARTIAL', tierBenefits: [{ grade: 'SKT_SILVER', context: '매주 화요일, 프레시 푸드 1천 원당 200원 할인', isAll: false }],
    summary: { offerKey: 'partial', title: '매주 화요일, 프레시 푸드 1천 원당 200원 할인', condition: '', limit: '', usage: 'OFFLINE', grades: ['SKT_VIP', 'SKT_GOLD', 'SKT_SILVER'], allGrades: false, version: '1' },
    offers: [{ key: 'partial', title: '할인형', usageType: 'OFFLINE', gradeCodes: ['SKT_VIP', 'SKT_GOLD', 'SKT_SILVER'], allGrades: false,
      products: ['VIP/GOLD/SILVER: 매주 화요일, 프레시 푸드 1천 원당 200원 할인'], availability: [long], usage: [long], exclusions: [long], limits: [long], facts: [] }],
  }] }, 'SKT', 'SKT_VIP', previewReferenceData);
  assert.equal(partialTierFallback.title, '매주 화요일, 프레시 푸드 1천 원당 200원 할인');
  assert.equal(partialTierFallback.condition, '');
});

test('PARTIAL 등급의 포인트 사용 조건은 할인율로 바꾸지 않고 간결하게 남긴다', () => {
  const { getPartnerBenefitPreview } = load('src/utils/benefitPreview.ts');
  const preview = getPartnerBenefitPreview({ partnerName: '공차', previews: [{
    carrier: 'SKT', offerResolution: 'PARTIAL',
    summary: { offerKey: 'points', title: '포인트 사용가능 (100%, 10P 단위)', condition: '', limit: '', usage: 'OFFLINE', grades: ['SKT_LITE'], allGrades: false, version: '1' },
    tierBenefits: [{ grade: 'SKT_LITE', context: '포인트 사용가능 (100%, 10P 단위)', isAll: false }],
    offers: [{ key: 'points', title: '포인트형', usageType: 'OFFLINE', gradeCodes: ['SKT_LITE'], allGrades: false,
      products: [], availability: [], limits: [], usage: [], exclusions: [], facts: [] }],
  }] }, 'SKT', 'SKT_LITE', previewReferenceData);
  assert.equal(preview.title, '포인트 사용가능 (100%, 10P 단위)');
});

test('단일 PARTIAL 공차 offer는 매칭된 tier의 상품 범위를 보존한다', () => {
  const { getPartnerBenefitPreview } = load('src/utils/benefitPreview.ts');
  const preview = getPartnerBenefitPreview({ partnerName: '공차', previews: [{
    carrier: 'KT', offerResolution: 'PARTIAL',
    summary: { offerKey: 'drink', title: '제조음료 구매 시 10% 할인', condition: '', limit: '', usage: 'OFFLINE', grades: [], allGrades: true, version: '1' },
    tierBenefits: [{ grade: 'KT_GENERAL', context: '제조음료 구매 시 10% 할인', isAll: false }],
    offers: [{ key: 'drink', title: '할인형', usageType: 'OFFLINE', gradeCodes: [], allGrades: true,
      products: [], availability: [], limits: [], usage: [], exclusions: [], facts: [] }],
  }] }, 'KT', 'KT_GENERAL', previewReferenceData);
  assert.equal(preview.title, '제조음료 구매 시 10% 할인');
  assert.equal(preview.condition, '');
  assert.equal(preview.appliesToEveryGrade, true);
});

test('structured offers decide grade eligibility when canonical tier rows are absent', () => {
  const { hasEligibleStructuredOffer, hasStructuredOffers } = load(
    'src/features/allBenefitsPage/apis/partnerBenefitModel.ts'
  );
  const allGrade = {
    offerResolution: 'SINGLE',
    offers: [{ key: 'all', title: '혜택', gradeCodes: [], allGrades: true }],
  };
  assert.equal(hasStructuredOffers(allGrade), true);
  assert.equal(hasEligibleStructuredOffer(allGrade, 'SKT', 'SKT_LITE', previewReferenceData), true);
  const scopedAlias = {
    offerResolution: 'SCOPED',
    offers: [{ key: 'vipkok', title: '혜택', gradeCodes: ['VIP콕'], allGrades: false }],
  };
  assert.equal(hasEligibleStructuredOffer(scopedAlias, 'LGU', 'VIP', previewReferenceData), true);
  assert.equal(hasEligibleStructuredOffer(scopedAlias, 'LGU', 'BASIC', previewReferenceData), false);
  assert.equal(hasEligibleStructuredOffer({ offerResolution: 'UNRESOLVED', offers: [] }, 'SKT', 'SKT_VIP', previewReferenceData), false);
});

test('structured duplicate benefit merge keeps one source snapshot offer and tier scope', () => {
  const { normalizePartnerBenefitDetail } = load(
    'src/features/allBenefitsPage/apis/partnerBenefitModel.ts'
  );
  const offer = (key) => ({ key, title: key, sourceText: key, usageType: 'ONLINE', gradeCodes: ['SKT_VIP'], allGrades: false, products: [], availability: [], limits: [], usage: [], exclusions: [], channelEvidence: [] });
  const benefit = (sourceCapturedAt, key, context) => ({
    benefitId: 300,
    benefitName: '제휴 혜택',
    sourceCapturedAt,
    conditions: { offers: [offer(key)], offerResolution: 'SINGLE', channelDecision: null },
    tierBenefits: [{ carrier: 'SKT', grade: 'SKT_VIP', context, isAll: false }],
    usageType: 'ONLINE',
    isFavorite: false,
    favoriteCount: 0,
  });
  const merged = normalizePartnerBenefitDetail({
    partnerId: 1,
    partnerName: '제휴처',
    category: null,
    image: null,
    hasStores: false,
    carrierGroups: [{ carrier: 'SKT', benefits: [benefit('2026-08-01T00:00:00Z', 'old', '이전 조건'), benefit('2026-10-01T00:00:00Z', 'new', '최신 조건')] }],
  });
  const result = merged.carrierGroups[0].benefits[0];
  assert.deepEqual(result.conditions.offers.map(({ key }) => key), ['new']);
  assert.deepEqual(result.tierBenefits.map(({ context }) => context), ['최신 조건']);
});

test('captured structured snapshot stays coherent against a richer undated legacy duplicate', () => {
  const { normalizePartnerBenefitDetail } = load(
    'src/features/allBenefitsPage/apis/partnerBenefitModel.ts'
  );
  const makeBenefit = (overrides) => ({
    benefitId: 300,
    benefitName: '제휴 혜택',
    description: '조건 안내',
    benefitLimit: null,
    manual: null,
    url: null,
    sourceUrl: null,
    sourceCapturedAt: null,
    conditions: null,
    tierBenefits: [],
    usageType: 'UNKNOWN',
    isFavorite: false,
    favoriteCount: 0,
    ...overrides,
  });
  const captured = makeBenefit({
    sourceCapturedAt: '2026-10-19T00:00:00Z',
    manual: '',
    conditions: {
      offers: [{ key: 'new', title: '최신 혜택', sourceText: '최신 안내', usageType: 'ONLINE', gradeCodes: ['SKT_VIP'], allGrades: false, products: [], availability: [], limits: [], usage: [], exclusions: [], channelEvidence: [] }],
      offerResolution: 'SINGLE',
      products: ['최신 상품'],
      exclusions: [],
    },
    tierBenefits: [{ carrier: 'SKT', grade: 'SKT_VIP', context: '최신 조건', isAll: false }],
  });
  const oldUndated = makeBenefit({
    description: '구형 안내',
    benefitLimit: '구형 월 5회',
    manual: '구형 이용 방법이 길게 적혀 있지만 더 이상 이 자료와 함께 쓰이면 안 됩니다.',
    url: 'https://old.example.test',
    sourceUrl: 'https://old-source.example.test',
    conditions: {
      offers: [{ key: 'old', title: '구형 혜택', sourceText: '구형 안내', usageType: 'OFFLINE', gradeCodes: ['SKT_VIP'], allGrades: false, products: [], availability: [], limits: [], usage: [], exclusions: ['구형 제외 조건'], channelEvidence: [] }],
      offerResolution: 'SCOPED',
      exclusions: ['구형 제외 조건'],
    },
    tierBenefits: [{ carrier: 'SKT', grade: 'SKT_VIP', context: '구형 조건', isAll: false }],
  });
  const merged = normalizePartnerBenefitDetail({
    partnerId: 1,
    partnerName: '제휴처',
    category: null,
    image: null,
    hasStores: false,
    carrierGroups: [{ carrier: 'SKT', benefits: [oldUndated, captured] }],
  }).carrierGroups[0].benefits[0];
  assert.equal(merged.sourceCapturedAt, '2026-10-19T00:00:00Z');
  assert.equal(merged.manual, '');
  assert.equal(merged.benefitLimit, null);
  assert.equal(merged.url, null);
  assert.equal(merged.sourceUrl, null);
  assert.deepEqual(merged.conditions.offers.map(({ key }) => key), ['new']);
  assert.deepEqual(merged.conditions.exclusions, []);
  assert.deepEqual(merged.tierBenefits.map(({ context }) => context), ['최신 조건']);
});
