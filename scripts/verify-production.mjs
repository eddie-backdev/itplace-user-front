import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';

const workers = process.argv.includes('--workers');
const standalone = process.argv.includes('--standalone');
assert.ok(!(workers && standalone), 'Workers와 standalone 검증은 함께 실행할 수 없습니다');
const runtimeName = workers ? 'workers' : standalone ? 'standalone' : 'production';

if (standalone) {
  const standaloneDir = resolve('.next/standalone');
  assert.ok(existsSync(resolve(standaloneDir, 'server.js')), 'standalone server.js가 있어야 합니다');
  mkdirSync(resolve(standaloneDir, '.next'), { recursive: true });
  cpSync(resolve('.next/static'), resolve(standaloneDir, '.next/static'), { recursive: true });
  cpSync(resolve('public'), resolve(standaloneDir, 'public'), { recursive: true });
}

const mockPartner = {
  partnerId: 284,
  partnerName: '스타벅스',
  category: '카페',
  image: null,
  carriers: ['SKT'],
  previews: [
    {
      carrier: 'SKT',
      benefitId: 502,
      benefitName: '별 적립 혜택',
      benefitLimit: '월 1회',
      usageType: 'OFFLINE',
      tierBenefits: [{ grade: 'SKT_VIP', context: '음료 10% 할인', isAll: false }],
    },
  ],
};

const homePartnersByCarrier = Object.fromEntries(
  ['SKT', 'KT', 'LGU'].map((carrier, carrierIndex) => [
    carrier,
    Array.from({ length: 12 }, (_, index) => ({
      partnerId: 700 + carrierIndex * 10 + index,
      partnerName: `${carrier} 인기 ${index + 1}`,
      category: '카페',
      image: null,
      carriers: [carrier],
      previews: [
        {
          carrier,
          benefitId: 800 + carrierIndex * 10 + index,
          benefitName: `${carrier} 혜택 ${index + 1}`,
          benefitLimit: '월 1회',
          usageType: 'OFFLINE',
          tierBenefits: [
            {
              grade: carrier === 'LGU' ? 'VIP' : `${carrier}_VIP`,
              context: `${carrier} 혜택 ${index + 1}※1만7천원 이상 주문 시 사용 가능`,
              isAll: false,
            },
          ],
        },
      ],
    })),
  ])
);

const mockPartnerDetail = {
  partnerId: 284,
  partnerName: '스타벅스',
  category: '카페',
  image: null,
  carrierGroups: [
    {
      carrier: 'SKT',
      benefits: [
        {
          benefitId: 502,
          benefitName: '별 적립 혜택',
          description: '',
          benefitLimit: '',
          manual: '',
          url: '',
          usageType: 'OFFLINE',
          tierBenefits: [
            { carrier: 'SKT', grade: 'SKT_VIP', context: '음료 10% 할인', isAll: false },
          ],
          isFavorite: false,
          favoriteCount: 1,
        },
        {
          benefitId: 502,
          benefitName: '별 적립 혜택',
          description: '월 1회 받을 수 있는 상세 혜택',
          benefitLimit: '월 1회',
          manual: '매장에서 멤버십 바코드를 제시하세요.',
          url: 'https://example.com/starbucks',
          usageType: 'OFFLINE',
          tierBenefits: [
            { carrier: 'SKT', grade: 'SKT_VIP', context: '음료 10% 할인', isAll: false },
          ],
          isFavorite: false,
          favoriteCount: 2,
        },
      ],
    },
  ],
};

const mockRenamedPartnerDetail = {
  ...mockPartnerDetail,
  partnerId: 5,
  partnerName: '굽네치킨 리뉴얼',
};

const json = (response, status, body) => {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
};

const startMockApi = async () => {
  let listAvailable = true;
  const unavailableCarriers = new Set();
  const emptyCarriers = new Set();
  const requests = [];
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    requests.push(url);

    if (url.pathname === '/api/v1/benefits/partners') {
      const carrier = url.searchParams.get('carriers');
      const isHomeRequest = url.searchParams.get('size') === '12';
      if (!listAvailable || (isHomeRequest && carrier && unavailableCarriers.has(carrier))) {
        json(response, 503, { data: null });
        return;
      }
      const page = Number(url.searchParams.get('page') ?? '0');
      const categoryFiltered = url.searchParams.get('category') === '푸드' && carrier === 'SKT';
      if (isHomeRequest && carrier && homePartnersByCarrier[carrier]) {
        json(response, 200, {
          data: {
            content: emptyCarriers.has(carrier)
              ? []
              : page === 0
                ? homePartnersByCarrier[carrier]
                : [],
            currentPage: page,
            totalPages: 1,
            totalElements: emptyCarriers.has(carrier) ? 0 : 12,
            hasNext: false,
          },
        });
        return;
      }
      let partner = categoryFiltered
        ? {
            ...mockPartner,
            partnerId: 285,
            partnerName: '푸드 필터 테스트 제휴처',
            category: '푸드',
          }
        : mockPartner;
      const requestedGrade = url.searchParams.get('grade');
      if (requestedGrade === 'SKT_VIP') {
        partner = {
          ...mockPartner,
          partnerId: 286,
          partnerName: 'SKT VIP 등급 테스트 제휴처',
          previews: [
            {
              ...mockPartner.previews[0],
              tierBenefits: [{ grade: 'SKT_VIP', context: '선택 등급 조건', isAll: false }],
            },
          ],
        };
      } else if (url.searchParams.get('carriers') === 'SKT') {
        partner = {
          ...partner,
          previews: [
            {
              ...mockPartner.previews[0],
              tierBenefits: [{ grade: 'SKT_VIP', context: 'VIP 전용 조건', isAll: false }],
            },
          ],
        };
      }
      json(response, 200, {
        data: {
          content: page === 0 ? [partner] : [],
          currentPage: page,
          totalPages: 1,
          totalElements: 1,
          hasNext: false,
        },
      });
      return;
    }

    if (url.pathname === '/api/v1/benefits/partners/284') {
      if (url.searchParams.get('carrier') === 'SKT') {
        assert.equal(url.searchParams.has('mainCategory'), false);
        const grade = url.searchParams.get('grade');
        json(response, 200, {
          data: {
            ...mockPartnerDetail,
            carrierGroups:
              grade === 'SKT_GOLD'
                ? []
                : [
                    {
                      carrier: 'SKT',
                      benefits: [
                        {
                          ...mockPartnerDetail.carrierGroups[0].benefits[1],
                          benefitId: 503,
                          benefitName: 'VIP 전용 테스트 혜택',
                          tierBenefits: [
                            {
                              carrier: 'SKT',
                              grade: 'SKT_VIP',
                              context: 'VIP 전용 조건',
                              isAll: false,
                            },
                          ],
                        },
                      ],
                    },
                  ],
          },
        });
        return;
      }
      json(response, 200, { data: mockPartnerDetail });
      return;
    }

    if (url.pathname === '/api/v1/benefits/partners/5') {
      json(response, 200, { data: mockRenamedPartnerDetail });
      return;
    }

    if (url.pathname === '/api/v1/reference-data') {
      const grades = [
        ['SKT', 'SKT_VIP', 'VIP'], ['SKT', 'SKT_GOLD', '골드'], ['SKT', 'SKT_SILVER', '실버'],
        ['KT', 'KT_VIP', 'VIP'], ['KT', 'KT_VVIP', 'VVIP'], ['KT', 'KT_GOLD', '골드'],
        ['KT', 'KT_SILVER', '실버'], ['LGU', 'VIP', 'VIP'], ['LGU', 'VVIP', 'VVIP'], ['LGU', 'BASIC', '일반'],
      ].map(([carrier, code, label], sortOrder) => ({
        carrier, code, label, sortOrder, active: true, profileSelectable: true,
        benefitEnabled: true, allGradeMember: true,
      }));
      json(response, 200, { data: {
        grades,
        programs: [],
        categories: ['생활/편의', '푸드', '쇼핑', '뷰티/건강', '엑티비티', '문화/여가', '여행/교통', '교육']
          .map((code, sortOrder) => ({ code, label: code === '푸드' ? '음식·카페' : code, sortOrder, active: true })),
        gradeMatches: grades.map(({ carrier, code }) => ({ carrier, profileGrade: code, benefitGrade: code })),
      } });
      return;
    }

    const storeId = url.pathname.match(/^\/api\/v1\/maps\/stores\/(\d+)$/)?.[1];
    if (storeId && ['269', '499', '1408'].includes(storeId)) {
      const storeNames = { 269: '굽네치킨 서초1동점', 499: '굽네치킨 논현1동점', 1408: '뚜레쥬르강남대로점' };
      json(response, 200, { data: {
        store: { storeId: Number(storeId), storeName: storeNames[storeId], latitude: 37.5, longitude: 127.03, address: '서울 강남구 테스트로 1', roadAddress: '서울 강남구 테스트로 1' },
        partner: { partnerId: 284, partnerName: '스타벅스', category: '카페' },
      } });
      return;
    }

    if (url.pathname === '/api/v1/maps/nearby/previews/compact/page') {
      json(response, 200, { data: {
        stores: [{ storeId: 269, partnerId: 284, storeName: '굽네치킨 서초1동점', latitude: 37.5, longitude: 127.03, address: '서울 강남구 테스트로 1', roadAddress: '서울 강남구 테스트로 1' }],
        partners: [{ partnerId: 284, partnerName: '스타벅스', category: '카페', tierBenefit: [{ carrier: 'SKT' }] }],
        hasMore: false,
        nextCursor: null,
      } });
      return;
    }

    if (url.pathname.startsWith('/api/v1/benefits/partners/')) {
      json(response, 404, { data: null });
      return;
    }

    json(response, 404, { data: null });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
    requests,
    setListAvailable: (available) => {
      listAvailable = available;
    },
    setUnavailableCarriers: (carriers) => {
      unavailableCarriers.clear();
      carriers.forEach((carrier) => unavailableCarriers.add(carrier));
    },
    setEmptyCarriers: (carriers) => {
      emptyCarriers.clear();
      carriers.forEach((carrier) => emptyCarriers.add(carrier));
    },
  };
};

const getFreePort = async () => {
  const server = createNetServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const { port } = address;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
  return port;
};

const closeServer = (server) => new Promise((resolve) => server.close(() => resolve()));

const countOccurrences = (source, value) => source.split(value).length - 1;

const assertSavedLoginLink = (navigation, label, context) => {
  const savedAnchor = [...navigation.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].find(([, , body]) =>
    plainText(body).includes(label)
  );
  const href = savedAnchor?.[1].match(/\bhref="([^"]+)"/)?.[1];
  assert.ok(href, `${context}의 관심 혜택 링크가 있어야 합니다`);
  const url = new URL(href.replaceAll('&amp;', '&'), 'https://itplace.click');
  assert.equal(url.pathname, '/login', `${context}의 관심 혜택은 로그인으로 이동해야 합니다`);
  assert.equal(url.search, '', `${context}의 관심 혜택 URL은 깨끗해야 합니다`);
};

const assertRedirect = async (origin, path, status, destination) => {
  const response = await fetch(`${origin}${path}`, {
    redirect: 'manual',
    headers: { 'user-agent': 'Googlebot' },
  });
  const responseBody = await response.text();
  const streamedRedirect = responseBody.match(/http-equiv="refresh"[^>]+/i)?.[0] ?? '없음';
  assert.equal(
    response.status,
    status,
    `${path} 응답 상태 (location=${response.headers.get('location')}, meta=${streamedRedirect})`
  );
  assert.equal(new URL(response.headers.get('location'), origin).pathname, destination);
  return new URL(response.headers.get('location'), origin);
};

const withoutScripts = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const mainContent = (html) =>
  withoutScripts(html).match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] ?? '';
const plainText = (html) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const getHomeBenefitsSection = (content) =>
  content.match(/<section(?=[^>]*aria-labelledby="feature-heading")[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';
const homeGrade = { SKT: 'SKT_VIP', KT: 'KT_VIP', LGU: 'VIP' };
const assertHomeSelection = (
  content,
  selectedCarrier,
  selectedGrade = homeGrade[selectedCarrier]
) => {
  const section = getHomeBenefitsSection(content);
  assert.ok(section, '추천 혜택 영역이 SSR에 있어야 합니다');
  assert.match(content, /<h1[^>]*id="home-title"[^>]*>통신사 멤버십 혜택, 어디에서 쓰고 싶으세요\?<\/h1>/);
  assert.equal((content.match(/<h1\b/gi) ?? []).length, 1, '홈에는 H1이 하나만 있어야 합니다');
  assert.match(content, new RegExp(`name="carrier" value="${selectedCarrier}"`));
  assert.match(content, new RegExp(`name="grade" value="${selectedGrade}"`));
  const intro = content.match(/<section(?=[^>]*aria-labelledby="home-title")[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.ok(intro, '홈 소개 영역이 SSR에 있어야 합니다');
  assert.doesNotMatch(plainText(intro), /변경/);
};
const assertHomeListCalls = (
  requests,
  selectedCarrier = 'SKT',
  selectedGrade = homeGrade[selectedCarrier],
  category = null
) => {
  const calls = requests.filter((url) => url.pathname === '/api/v1/benefits/partners');
  assert.equal(calls.length, 3, '홈은 통신사별 목록 API를 3회 호출해야 합니다');
  assert.deepEqual(calls.map((url) => url.searchParams.get('carriers')).sort(), [
    'KT',
    'LGU',
    'SKT',
  ]);
  for (const url of calls) {
    assert.equal(url.searchParams.get('size'), '12');
    assert.equal(url.searchParams.get('sort'), 'POPULARITY');
    const carrier = url.searchParams.get('carriers');
    assert.equal(
      url.searchParams.get('grade'),
      carrier === selectedCarrier ? selectedGrade : homeGrade[carrier]
    );
    assert.equal(url.searchParams.get('category'), category);
    assert.equal(url.searchParams.get('mainCategory'), null);
  }
  assert.equal(
    requests.filter((url) => url.pathname.startsWith('/api/v1/benefits/partners/')).length,
    0,
    '홈 SSR에서는 상세 API를 호출하지 않아야 합니다'
  );
};

const assertAllHomePreviews = (content, selectedCarrier = 'SKT') => {
  assertHomeSelection(content, selectedCarrier);
  const featureSection = getHomeBenefitsSection(content);
  const shelfSection =
    content.match(/<section(?=[^>]*aria-labelledby="shelf-heading")[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';
  const featureCards =
    featureSection.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
  const featureLinks = featureCards.flatMap(
    (card) => card.match(/<a(?=[^>]*href="\/benefits\/partners\/)[^>]*>[\s\S]*?<\/a>/g) ?? []
  );
  const shelfLinks =
    shelfSection.match(/<a(?=[^>]*href="\/benefits\/partners\/)[^>]*>[\s\S]*?<\/a>/g) ?? [];
  const offerBlocks = [...featureCards, ...shelfLinks];
  assert.equal(featureCards.length, 3, `${selectedCarrier} 추천 혜택은 상단 카드 3개여야 합니다`);
  assert.equal(featureLinks.length, 3, `${selectedCarrier} 상단 카드마다 상세 링크가 있어야 합니다`);
  assert.equal(shelfLinks.length, 5, `${selectedCarrier} 다른 혜택은 하단 링크 5개여야 합니다`);
  assert.equal(
    featureLinks.length + shelfLinks.length,
    8,
    `${selectedCarrier} 선택 상태에서는 추천과 하단 영역에 8개 링크가 있어야 합니다`
  );
  let previousIndex = -1;
  for (let rank = 1; rank <= 8; rank += 1) {
    const partnerName = `${selectedCarrier} 인기 ${rank}`;
    assert.ok(
      plainText(offerBlocks[rank - 1]).includes(partnerName),
      `${partnerName} 미리보기가 SSR에 있어야 합니다`
    );
    const currentIndex = content.indexOf(partnerName);
    assert.ok(
      currentIndex > previousIndex,
      `${selectedCarrier} 미리보기는 API 인기순을 유지해야 합니다`
    );
    previousIndex = currentIndex;
    const partnerId = 700 + ['SKT', 'KT', 'LGU'].indexOf(selectedCarrier) * 10 + rank - 1;
    assert.match(
      offerBlocks[rank - 1],
      new RegExp(
        `href="/benefits/partners/${partnerId}/[^\"]+\\?carrier=${selectedCarrier}&amp;grade=${homeGrade[selectedCarrier]}"`
      ),
      `${partnerName} 상세 링크에 선택한 통신사와 등급 query가 있어야 합니다`
    );
  }
  assert.ok(
    content.includes(
      `href="/benefits?carrier=${selectedCarrier}&amp;grade=${homeGrade[selectedCarrier]}"`
    ),
    '선택 멤버십 전체 혜택 링크가 있어야 합니다'
  );
  const categoryNavigation =
    content.match(/<nav(?=[^>]*aria-label="혜택 카테고리")[^>]*>[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.ok(categoryNavigation, '혜택 카테고리 탐색이 SSR에 있어야 합니다');
  const categoryLinks = categoryNavigation.match(/<a(?=[^>]*href="\/benefits\?)[^>]*>/g) ?? [];
  assert.equal(categoryLinks.length, 8, '혜택 카테고리 링크는 전체 8개여야 합니다');
  assert.equal(
    new Set(categoryLinks.map((link) => link.match(/href="([^"]+)/)?.[1])).size,
    8,
    '혜택 카테고리 링크는 서로 다른 8개여야 합니다'
  );
  assert.equal(categoryNavigation.match(/<svg\b/g)?.length ?? 0, 8, '카테고리마다 아이콘이 있어야 합니다');
  assert.ok(
    content.indexOf(categoryNavigation) < content.indexOf(featureSection),
    '카테고리 탐색은 추천 혜택보다 앞에 있어야 합니다'
  );
  for (const id of ['생활/편의', '푸드', '쇼핑', '뷰티/건강', '엑티비티', '문화/여가', '여행/교통', '교육']) {
    assert.ok(
      categoryNavigation.includes(`category=${encodeURIComponent(id)}`),
      `${id} 카테고리 탐색 링크가 있어야 합니다`
    );
  }
  for (const carrier of ['SKT', 'KT', 'LGU'].filter((code) => code !== selectedCarrier)) {
    assert.doesNotMatch(
      content,
      new RegExp(`(?:^|[^A-Z])${carrier} 인기 (?:[1-9]|1[0-2])`),
      `${carrier} 미리보기는 선택 영역에 없어야 합니다`
    );
  }
};

const runChecks = async (origin, mockApi) => {
  const requestsBeforeHome = mockApi.requests.length;
  const rootResponse = await fetch(`${origin}/`);
  const rootHtml = await rootResponse.text();
  assert.equal(rootResponse.status, 200);
  assert.equal(rootResponse.headers.has('x-powered-by'), false);
  assert.match(rootHtml, /<title>통신 3사 멤버십 혜택 비교·검색 \| 잇플레이스<\/title>/);
  assert.equal(
    (withoutScripts(rootHtml).match(/<main\b/gi) ?? []).length,
    1,
    '홈에는 main 랜드마크가 하나만 있어야 합니다'
  );
  const rootContent = mainContent(rootHtml);
  assert.match(rootContent, /통신사 멤버십 혜택, 어디에서 쓰고 싶으세요\?/);
  assert.match(
    rootContent,
    /<form(?=[^>]*\baction="\/benefits")(?=[^>]*\bmethod="get")(?=[^>]*\brole="search")[^>]*>/
  );
  assert.match(rootContent, /<input(?=[^>]*\bname="q")(?=[^>]*\btype="search")[^>]*>/);
  assertHomeListCalls(mockApi.requests.slice(requestsBeforeHome));
  const rootText = plainText(rootContent);
  assert.match(rootContent, /href="\/benefits\?carrier=SKT&amp;grade=SKT_VIP"[^>]*>전체 혜택/);
  assert.match(rootHtml, /<a(?=[^>]*href="\/login")(?=[^>]*aria-label="로그인")[^>]*>/);
  assert.doesNotMatch(rootText, /내 멤버십 기준/);
  assert.match(rootContent, /aria-label="혜택 카테고리"/);
  assertAllHomePreviews(rootContent);
  assert.doesNotMatch(rootHtml, /cafe-scene\.png/, '홈 SSR에서 대표 카페 사진을 사용하지 않아야 합니다');
  assert.match(rootHtml, /<footer\b/);
  assert.match(rootHtml, /name="google-adsense-account"/);
  assert.doesNotMatch(rootHtml, /adsbygoogle\.js/);

  for (const path of [
    '/login',
    '/login?reset=1&returnTo=%2Fmypage%2Ffavorites',
    '/login?notice=login-required&reset=1&returnTo=%2Fmypage%2Ffavorites',
    '/login?returnTo=%2Fmypage%2Ffavorites',
  ]) {
    const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
    assert.equal(response.status, 200, `${path}가 리다이렉트 없이 로그인 응답을 반환해야 합니다`);
    const loginMain = mainContent(await response.text());
    assert.match(loginMain, /<form\b/, `${path}의 초기 HTML에 로그인 폼이 있어야 합니다`);
    assert.match(loginMain, /<input(?=[^>]*type="email")[^>]*>/, `${path}에 이메일 입력이 있어야 합니다`);
    assert.match(loginMain, /<input(?=[^>]*type="password")[^>]*>/, `${path}에 비밀번호 입력이 있어야 합니다`);
    assert.doesNotMatch(loginMain, /페이지를 불러오는 중/, `${path}가 로딩 화면으로 SSR되면 안 됩니다`);
    assert.match(plainText(loginMain), /관심 혜택과 사용 기록을 이어서 확인하세요\./);
  }

  // Every content route shares the same primary navigation, including the home page.
  for (const path of [
    '/',
    '/map',
    '/benefits',
    '/guide',
    '/privacy',
    '/account-deletion',
    '/mypage/info',
    '/mypage/activity',
    '/mypage/favorites',
  ]) {
    const html = path === '/' ? rootHtml : await (await fetch(`${origin}${path}`)).text();
    const navigation =
      withoutScripts(html).match(/<nav(?=[^>]*aria-label="주요 메뉴")[^>]*>[\s\S]*?<\/nav>/g) ?? [];
    assert.equal(navigation.length, 1, `${path}에 공통 주요 메뉴가 하나 있어야 합니다`);
    for (const destination of ['/', '/map', '/benefits']) {
      assert.ok(
        navigation[0].includes(`href="${destination}"`),
        `${path}의 ${destination} 메뉴가 필요합니다`
      );
    }
    assert.match(navigation[0], />홈<\/a>/, `${path}의 홈 메뉴가 있어야 합니다`);
    assert.match(
      navigation[0],
      />전체 혜택<\/a>/,
      `${path}의 전체 혜택 메뉴가 있어야 합니다`
    );
    assert.match(navigation[0], />내 주변 혜택<\/a>/, `${path}의 내 주변 혜택 메뉴가 있어야 합니다`);
    assert.match(
      navigation[0],
      />관심 혜택<\/a>/,
      `${path}의 관심 혜택 메뉴가 있어야 합니다`
    );
    assertSavedLoginLink(navigation[0], '관심 혜택', path);
    assert.doesNotMatch(
      navigation[0],
      /href="\/mypage\/favorites"/,
      `${path}의 로그아웃 관심 혜택 메뉴가 바로 열지 않아야 합니다`
    );
    const mobileNavigation =
      withoutScripts(html).match(/<nav(?=[^>]*aria-label="모바일 주요 탭")[^>]*>[\s\S]*?<\/nav>/)?.[0] ?? '';
    const hasMobileTabs = ['/map', '/benefits'].includes(path) || path === '/' || path.startsWith('/mypage/');
    if (hasMobileTabs) {
      assert.ok(mobileNavigation, `${path}에 모바일 주요 탭이 있어야 합니다`);
      for (const label of ['홈', '지도', '혜택', '관심 혜택', '마이']) {
        assert.ok(
          mobileNavigation.includes(`${label}</span>`),
          `${path}의 모바일 ${label} 탭이 있어야 합니다`
        );
      }
      assert.equal(
        mobileNavigation.match(/<svg\b/g)?.length ?? 0,
        5,
        `${path}의 모바일 탭마다 아이콘이 있어야 합니다`
      );
      assertSavedLoginLink(mobileNavigation, '관심 혜택', `${path} 모바일`);
    } else {
      assert.equal(mobileNavigation, '', `${path}에 모바일 주요 탭이 없어야 합니다`);
    }
    assert.match(
      withoutScripts(html),
      /<a(?=[^>]*href="\/login")(?=[^>]*aria-label="로그인")[^>]*>/
    );
  }

  const carrierHomeRequestsBefore = mockApi.requests.length;
  const carrierHomeResponse = await fetch(`${origin}/?carrier=SKT`);
  assert.equal(carrierHomeResponse.status, 200);
  const carrierHomeContent = mainContent(await carrierHomeResponse.text());
  assertHomeListCalls(mockApi.requests.slice(carrierHomeRequestsBefore), 'SKT');
  assertAllHomePreviews(carrierHomeContent);
  for (const [carrier, expected] of [
    ['KT', 'KT'],
    ['LGU', 'LGU'],
    ['invalid', 'SKT'],
  ]) {
    const requestsBefore = mockApi.requests.length;
    const response = await fetch(`${origin}/?carrier=${carrier}`);
    assert.equal(response.status, 200);
    assertAllHomePreviews(mainContent(await response.text()), expected);
    assertHomeListCalls(mockApi.requests.slice(requestsBefore), expected);
  }
  const filteredHomeRequestsBefore = mockApi.requests.length;
  const filteredHomeResponse = await fetch(
    `${origin}/?carrier=KT&grade=KT_VIP&category=${encodeURIComponent('푸드')}`
  );
  assert.equal(filteredHomeResponse.status, 200);
  const filteredHomeContent = mainContent(await filteredHomeResponse.text());
  assertAllHomePreviews(filteredHomeContent, 'KT');
  assertHomeListCalls(mockApi.requests.slice(filteredHomeRequestsBefore), 'KT', 'KT_VIP', '푸드');
  assert.match(filteredHomeContent, /name="category" value="푸드"/);
  assert.ok(
    filteredHomeContent.includes(
      `href="/benefits?carrier=KT&amp;grade=KT_VIP&amp;category=${encodeURIComponent('푸드')}"`
    )
  );
  const repeatedCarrierRequestsBefore = mockApi.requests.length;
  const repeatedCarrierResponse = await fetch(`${origin}/?carrier=KT&carrier=LGU`);
  assert.equal(repeatedCarrierResponse.status, 200);
  assertHomeListCalls(mockApi.requests.slice(repeatedCarrierRequestsBefore), 'KT');
  assertAllHomePreviews(mainContent(await repeatedCarrierResponse.text()), 'KT');
  const categoryPath = `/benefits?carrier=SKT&category=${encodeURIComponent('푸드')}`;
  const categoryResponse = await fetch(`${origin}${categoryPath}`);
  assert.equal(categoryResponse.status, 200);
  const categoryContent = mainContent(await categoryResponse.text());
  assert.match(categoryContent, /푸드 필터 테스트 제휴처/);
  assert.doesNotMatch(categoryContent, /스타벅스/);
  const categoryFilters =
    categoryContent.match(
      /<section(?=[^>]*aria-label="혜택 필터")[^>]*>[\s\S]*?<\/section>/
    )?.[0] ?? '';
  assert.ok(categoryFilters, '혜택 필터 영역이 있어야 합니다');
  assert.match(
    categoryFilters,
    /<select(?=[^>]*aria-label="혜택 분야 필터")[^>]*>[\s\S]*?<option value="푸드" selected="">음식·카페<\/option>/
  );
  assert.match(
    categoryFilters,
    /<select(?=[^>]*aria-label="통신사 필터")[^>]*>[\s\S]*?<option value="SKT" selected="">SKT<\/option>/
  );
  assert.match(
    categoryContent,
    /href="\/benefits\/partners\/[^\"]+\?carrier=SKT"/,
    '제휴처 상세 링크에도 선택한 통신사가 유지되어야 합니다'
  );

  const guideHtml = mainContent(await (await fetch(`${origin}/guide`)).text());
  assert.match(rootHtml, /href="\/guide"/);
  for (const anchor of ['before-payment', 'discount-vs-points', 'online-offline']) {
    assert.ok(guideHtml.includes(`id="${anchor}"`), `${anchor} 가이드 본문이 필요합니다`);
  }

  // Verify the deployed asset binding too: HTML alone can pass with missing CSS/JS.
  for (const pattern of [
    /<link[^>]+href="([^\"]+\.css(?:\?[^\"]*)?)"/,
    /<script[^>]+src="([^\"]+\.js(?:\?[^\"]*)?)"/,
  ]) {
    const assetPath = rootHtml.match(pattern)?.[1];
    assert.ok(assetPath, '초기 페이지 CSS/JS 경로가 있어야 합니다');
    const assetResponse = await fetch(new URL(assetPath.replaceAll('&amp;', '&'), origin));
    assert.equal(assetResponse.status, 200, assetPath);
    assert.match(assetResponse.headers.get('content-type') ?? '', /css|javascript/);
    assert.match(assetResponse.headers.get('cache-control') ?? '', /immutable/);
    await assetResponse.arrayBuffer();
  }

  const benefitsResponse = await fetch(`${origin}/benefits?q=${encodeURIComponent('스타벅스')}`);
  const benefitsHtml = await benefitsResponse.text();
  assert.equal(benefitsResponse.status, 200);
  assert.match(benefitsHtml, /스타벅스/);
  assert.match(mainContent(benefitsHtml), /스타벅스/);
  assert.match(mainContent(benefitsHtml), /name="q"/);
  assert.match(
    mainContent(benefitsHtml),
    /<form(?=[^>]*action="\/benefits")(?=[^>]*method="get")[^>]*>/i,
    '검색 입력은 혜택 목록 화면에 있어야 합니다'
  );
  assert.match(benefitsHtml, /"@type":"CollectionPage"/);
  assert.match(benefitsHtml, /https:\/\/itplace\.click\/benefits/);

  const gradeRequestsBefore = mockApi.requests.length;
  const gradeResponse = await fetch(`${origin}/benefits?carrier=SKT&grade=SKT_VIP`);
  const gradeHtml = await gradeResponse.text();
  const gradeContent = mainContent(gradeHtml);
  assert.equal(gradeResponse.status, 200);
  assert.match(gradeContent, /SKT VIP 등급 테스트 제휴처/);
  assert.match(
    gradeContent,
    /<select(?=[^>]*aria-label="멤버십 등급 필터")[^>]*>[\s\S]*?<option value="SKT_VIP" selected="">VIP<\/option>/
  );
  assert.match(gradeContent, /VIP 조건의 혜택/);
  assert.match(gradeContent, /aria-label="적용 중인 필터"[^>]*><span>SKT<\/span><span>VIP<\/span>/);
  assert.match(
    gradeContent,
    /href="\/benefits\/partners\/286\/[^\"]+\?carrier=SKT&amp;grade=SKT_VIP"/
  );
  assert.doesNotMatch(gradeContent, /membership=mine/);
  const gradeListRequest = mockApi.requests
    .slice(gradeRequestsBefore)
    .find((url) => url.pathname === '/api/v1/benefits/partners');
  assert.ok(gradeListRequest, '등급 필터 SSR은 공개 혜택 API를 호출해야 합니다');
  assert.equal(gradeListRequest.searchParams.get('carriers'), 'SKT');
  assert.equal(gradeListRequest.searchParams.get('grade'), 'SKT_VIP');
  assert.equal(gradeListRequest.searchParams.has('mainCategory'), false);

  const guestInvalidGradeRequestsBefore = mockApi.requests.length;
  const guestInvalidGradeResponse = await fetch(`${origin}/benefits?carrier=SKT&grade=KT_VIP`);
  const guestInvalidGradeRequests = mockApi.requests
    .slice(guestInvalidGradeRequestsBefore)
    .filter((url) => url.pathname === '/api/v1/benefits/partners');
  assert.equal(guestInvalidGradeResponse.status, 200);
  assert.equal(guestInvalidGradeRequests.length, 0, '잘못된 등급은 공개 혜택 API에 전달하지 않아야 합니다');

  const membershipResponse = await fetch(`${origin}/membership/skt`);
  const membershipHtml = await membershipResponse.text();
  assert.equal(membershipResponse.status, 200);
  assert.match(membershipHtml, /CollectionPage/);

  for (const [storeId, storeName] of [
    ['269', '굽네치킨 서초1동점'],
    ['499', '굽네치킨 논현1동점'],
    ['1408', '뚜레쥬르강남대로점'],
  ]) {
    const response = await fetch(`${origin}/stores/${storeId}/${encodeURIComponent(storeName)}`);
    const html = await response.text();
    assert.equal(response.status, 200, `${storeName} 매장 페이지 SSR`);
    assert.ok(plainText(mainContent(html)).includes(storeName));
    assert.ok(plainText(mainContent(html)).includes('브랜드 혜택'));
    assert.match(plainText(mainContent(html)), /등록 혜택 \d+\s+개/);
  }

  const regionResponse = await fetch(`${origin}/places/gangnam-station`);
  const regionHtml = await regionResponse.text();
  assert.equal(regionResponse.status, 200);
  assert.match(plainText(mainContent(regionHtml)), /직선거리 약 .*km/);
  assert.match(plainText(mainContent(regionHtml)), /도보 이동 거리가 아닙니다/);
  assert.match(plainText(mainContent(regionHtml)), /혜택 정보: SKT/);
  assert.match(plainText(mainContent(regionHtml)), /개별 매장의 혜택 적용 여부나 이용 가능 여부를 보장하지 않으므로/);

  const canonicalPartnerPath = `/benefits/partners/284/${encodeURIComponent('스타벅스')}`;
  const partnerResponse = await fetch(`${origin}${canonicalPartnerPath}`);
  const partnerHtml = await partnerResponse.text();
  assert.equal(partnerResponse.status, 200);
  assert.match(partnerHtml, /월 1회 받을 수 있는 상세 혜택/);
  assert.equal(countOccurrences(partnerHtml, 'id="benefit-502"'), 1);
  assert.equal(partnerHtml.includes('<script type="application/ld+json">'), true);

  const guestGradeDetailResponse = await fetch(
    `${origin}${canonicalPartnerPath}?carrier=SKT&grade=SKT_VIP`
  );
  const guestGradeDetailHtml = await guestGradeDetailResponse.text();
  assert.equal(guestGradeDetailResponse.status, 200);
  assert.ok(plainText(mainContent(guestGradeDetailHtml)).includes('VIP 전용 테스트 혜택'));
  assert.match(
    mainContent(guestGradeDetailHtml),
    /href="\/benefits\?carrier=SKT&amp;grade=SKT_VIP"[^>]*>[\s\S]*?혜택찾기/
  );
  assert.doesNotMatch(mainContent(guestGradeDetailHtml), /href="\/benefits\?[^\"]*membership=mine/);

  const filteredResponse = await fetch(
    `${origin}${canonicalPartnerPath}?carrier=SKT&grade=SKT_VIP&membership=mine`
  );
  const filteredHtml = await filteredResponse.text();
  assert.equal(filteredResponse.status, 200);
  assert.match(filteredResponse.headers.get('cache-control') ?? '', /private|no-store/);
  const filteredContent = mainContent(filteredHtml);
  assert.ok(plainText(filteredContent).includes('VIP 전용 테스트 혜택'));
  assert.match(filteredContent, /<option value="503"[^>]*>VIP 전용 테스트 혜택<\/option>/);
  assert.ok(plainText(filteredContent).includes('내 멤버십 혜택'));
  // SSR combines canonical and filtered offers, but initially selects canonical benefit 502; filtered 503 remains selectable.
  assert.equal(countOccurrences(filteredHtml, 'id="benefit-502"'), 1);
  assert.equal(countOccurrences(filteredHtml, 'id="benefit-503"'), 0);
  const emptyHtml = await (
    await fetch(`${origin}${canonicalPartnerPath}?carrier=SKT&grade=SKT_GOLD`)
  ).text();
  assert.match(emptyHtml, /선택한 등급의 혜택을 찾지 못했어요/);
  const invalidGradeHtml = await (
    await fetch(`${origin}${canonicalPartnerPath}?carrier=SKT&grade=KT_VIP`)
  ).text();
  assert.equal(countOccurrences(invalidGradeHtml, 'id="benefit-502"'), 1);
  const filteredRedirect = await assertRedirect(
    origin,
    '/benefits/partners/0284/wrong?carrier=SKT&grade=SKT_VIP&membership=mine',
    308,
    canonicalPartnerPath
  );
  assert.equal(filteredRedirect.searchParams.get('grade'), 'SKT_VIP');
  assert.equal(filteredRedirect.searchParams.get('membership'), 'mine');
  const guestFilteredRedirect = await assertRedirect(
    origin,
    '/benefits/partners/0284/wrong?carrier=SKT&grade=SKT_VIP',
    308,
    canonicalPartnerPath
  );
  assert.equal(guestFilteredRedirect.searchParams.get('carrier'), 'SKT');
  assert.equal(guestFilteredRedirect.searchParams.get('grade'), 'SKT_VIP');
  assert.equal(guestFilteredRedirect.searchParams.has('membership'), false);
  const personalListHtml = await (await fetch(`${origin}/benefits?membership=mine`)).text();
  assert.doesNotMatch(personalListHtml, /스타벅스/);
  assert.doesNotMatch(rootHtml, /aria-label="질문형 AI 추천 열기"/);

  await assertRedirect(origin, '/benefits/partners/0284/wrong', 308, canonicalPartnerPath);
  await assertRedirect(origin, '/benefits/partners/284/wrong', 308, canonicalPartnerPath);

  const renamedPartnerPath = `/benefits/partners/5/${encodeURIComponent('굽네치킨-리뉴얼')}`;
  const renamedPartnerResponse = await fetch(`${origin}${renamedPartnerPath}`, {
    redirect: 'manual',
  });
  assert.equal(renamedPartnerResponse.status, 200, '현재 API slug가 catalog보다 우선해야 합니다');
  assert.equal(renamedPartnerResponse.headers.get('location'), null);
  await renamedPartnerResponse.arrayBuffer();
  await assertRedirect(
    origin,
    `/benefits/partners/5/${encodeURIComponent('굽네치킨')}`,
    308,
    renamedPartnerPath
  );
  await assertRedirect(origin, '/benefits/partners/5/wrong', 308, renamedPartnerPath);

  const missingPartnerResponse = await fetch(`${origin}/benefits/partners/999/missing`, {
    headers: { 'user-agent': 'Googlebot' },
  });
  assert.equal(missingPartnerResponse.status, 404);
  assert.match(await missingPartnerResponse.text(), /페이지를 찾을 수 없습니다/);

  const missingRouteResponse = await fetch(`${origin}/definitely-missing`);
  assert.equal(missingRouteResponse.status, 404);
  const missingRouteHtml = await missingRouteResponse.text();
  assert.match(missingRouteHtml, /페이지를 찾을 수 없습니다/);
  assert.match(missingRouteHtml, /noindex/);
  assert.doesNotMatch(missingRouteHtml, /rel="canonical"/);

  const missingMembershipResponse = await fetch(`${origin}/membership/unknown`);
  assert.equal(missingMembershipResponse.status, 404);
  assert.match(await missingMembershipResponse.text(), /페이지를 찾을 수 없습니다/);

  await assertRedirect(origin, '/main', 308, '/');
  const overviewResponse = await fetch(`${origin}/mypage`, { redirect: 'manual' });
  const overviewHtml = await overviewResponse.text();
  assert.equal(overviewResponse.status, 200);
  assert.match(overviewHtml, /<title>마이페이지 \| 잇플레이스<\/title>/);
  assert.match(overviewHtml, /content="noindex, follow"/);
  await assertRedirect(origin, '/mypage/history', 307, '/mypage/favorites');
  await assertRedirect(origin, '/index.html', 308, '/');
  await assertRedirect(origin, '/about.html', 308, '/about');

  const robotsResponse = await fetch(`${origin}/robots.txt`);
  assert.equal(robotsResponse.status, 200);
  const robotsText = await robotsResponse.text();
  assert.match(robotsText, /Sitemap: https:\/\/itplace\.click\/sitemap\.xml/);
  assert.doesNotMatch(robotsText, /Disallow: \/(?:login|mypage|oauth)/);
  for (const privatePath of ['/login', '/mypage', '/mypage/info', '/oauth/callback/kakao']) {
    const html = await (await fetch(`${origin}${privatePath}`)).text();
    assert.match(html, /content="noindex, follow"/);
    assert.doesNotMatch(html, /adsbygoogle\.js/);
  }

  const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
  const sitemapXml = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemapXml, /benefits\/partners\/284\//);

  const allFailedRequestsBefore = mockApi.requests.length;
  mockApi.setListAvailable(false);
  try {
    const allFailedContent = mainContent(await (await fetch(`${origin}/`)).text());
    assertHomeListCalls(mockApi.requests.slice(allFailedRequestsBefore));
    assert.match(plainText(allFailedContent), /브랜드별로 둘러보기/);
    assertHomeSelection(allFailedContent, 'SKT');
    assert.doesNotMatch(allFailedContent, /SKT 인기 [123]|KT 인기 [123]|LGU 인기 [123]/);
    assert.match(getHomeBenefitsSection(allFailedContent), /혜택을 불러오지 못했어요\./);
  } finally {
    mockApi.setListAvailable(true);
  }

  const partialFailureRequestsBefore = mockApi.requests.length;
  mockApi.setUnavailableCarriers(['SKT']);
  try {
    const partialFailureContent = mainContent(await (await fetch(`${origin}/`)).text());
    assertHomeListCalls(mockApi.requests.slice(partialFailureRequestsBefore));
    assertHomeSelection(partialFailureContent, 'SKT');
    assert.doesNotMatch(getHomeBenefitsSection(partialFailureContent), /SKT 인기 [123]/);
    assert.match(getHomeBenefitsSection(partialFailureContent), /혜택을 불러오지 못했어요\./);
    assert.doesNotMatch(
      getHomeBenefitsSection(partialFailureContent),
      /(?:^|[^A-Z])(?:KT|LGU) 인기 [123]/
    );
    assert.match(plainText(partialFailureContent), /브랜드별로 둘러보기/);
  } finally {
    mockApi.setUnavailableCarriers([]);
  }

  const emptyRequestsBefore = mockApi.requests.length;
  mockApi.setEmptyCarriers(['LGU']);
  try {
    const emptyContent = mainContent(await (await fetch(`${origin}/?carrier=LGU`)).text());
    assertHomeListCalls(mockApi.requests.slice(emptyRequestsBefore));
    assertHomeSelection(emptyContent, 'LGU');
    assert.doesNotMatch(getHomeBenefitsSection(emptyContent), /LGU 인기 [123]/);
    assert.match(getHomeBenefitsSection(emptyContent), /아직 표시할 혜택이 없어요\./);
    assert.match(plainText(emptyContent), /브랜드별로 둘러보기/);
  } finally {
    mockApi.setEmptyCarriers([]);
  }
};

const waitForServer = async (origin, child, readLogs) => {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`${runtimeName} 서버가 일찍 종료되었습니다.\n${readLogs()}`);
    }
    try {
      const response = await fetch(`${origin}/`, { signal: AbortSignal.timeout(1_000) });
      await response.arrayBuffer();
      if (response.ok) return;
    } catch {
      // 시작 중에는 연결 실패가 정상입니다.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`${runtimeName} 서버 시작 시간이 초과되었습니다.\n${readLogs()}`);
};

const mockApi = await startMockApi();
const { server: mockServer, origin: mockOrigin } = mockApi;
const appPort = await getFreePort();
const appOrigin = `http://127.0.0.1:${appPort}`;
let serverLogs = '';
const nextServer = spawn(
  process.execPath,
  workers
    ? [
        'node_modules/wrangler/bin/wrangler.js',
        'dev',
        '--local',
        '--ip',
        '127.0.0.1',
        '--port',
        String(appPort),
        '--var',
        `USER_API_BASE_URL:${mockOrigin}`,
        '--show-interactive-dev-session=false',
      ]
    : standalone
      ? ['.next/standalone/server.js']
      : [
          'node_modules/next/dist/bin/next',
          'start',
          '--hostname',
          '127.0.0.1',
          '--port',
          String(appPort),
        ],
  {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(appPort),
      HOSTNAME: '127.0.0.1',
      USER_API_BASE_URL: mockOrigin,
      NEXT_PUBLIC_APP_BASE_URL: mockOrigin,
      WRANGLER_SEND_METRICS: 'false',
      CI: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);

const collectLog = (chunk) => {
  serverLogs = `${serverLogs}${chunk}`.slice(-20_000);
};
nextServer.stdout.on('data', collectLog);
nextServer.stderr.on('data', collectLog);

try {
  await waitForServer(appOrigin, nextServer, () => serverLogs);
  await runChecks(appOrigin, mockApi);
  console.log(
    `[${runtimeName}] SSR, CSS/JS, SEO, canonical, 404, redirect, 멤버십 필터 검증을 통과했습니다.`
  );
} catch (error) {
  console.error(serverLogs);
  throw error;
} finally {
  nextServer.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => nextServer.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  await closeServer(mockServer);
}
