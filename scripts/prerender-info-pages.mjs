import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SITE_ORIGIN = 'https://itplace.click';
const DIST_DIR = path.resolve('dist');

const publicPages = [
  {
    path: '/about',
    title: '서비스 소개 | ITPLACE',
    description:
      'ITPLACE는 SKT, KT, LG U+ 통신사 멤버십 혜택과 제휴처를 지도 기반으로 찾을 수 있는 혜택 검색 서비스입니다.',
    heading: '서비스 소개',
    paragraphs: [
      'ITPLACE는 흩어져 있는 통신 3사 멤버십 혜택을 사용자가 실제로 찾고 비교할 수 있도록 지도, 목록, 검색, 추천 기능으로 정리하는 서비스입니다.',
      '통신사 멤버십 제휴처를 지도와 목록에서 탐색하고, 온라인과 오프라인 혜택 조건, 이용 채널, 멤버십 등급별 혜택을 구분해 확인할 수 있습니다.',
      '혜택 정보나 제휴처 정보가 실제와 다를 경우 문의 페이지를 통해 제보할 수 있으며, 확인 후 정보를 개선합니다.',
    ],
  },
  {
    path: '/guide',
    title: '통신사 멤버십 혜택 이용 가이드 | ITPLACE',
    description:
      'SKT, KT, LG U+ 멤버십 혜택을 지도에서 찾고 온라인·오프라인 이용 조건을 확인하는 방법을 안내합니다.',
    heading: '통신사 멤버십 혜택 이용 가이드',
    paragraphs: [
      '멤버십 혜택은 통신사, 등급, 제휴처, 이용 채널에 따라 조건이 다릅니다. 내 통신사와 멤버십 등급을 먼저 확인하면 검색 결과를 더 정확히 이해할 수 있습니다.',
      '현재 위치 또는 원하는 지역을 기준으로 주변 음식점, 카페, 문화, 쇼핑 제휴처를 확인하고 지도 이동 후 현 지도에서 다시 검색할 수 있습니다.',
      '같은 브랜드라도 온라인 주문, 앱 결제, 현장 결제, 특정 매장 방문 여부에 따라 혜택이 달라질 수 있으므로 실제 결제 전 최신 조건을 재확인하는 것이 안전합니다.',
    ],
  },
  {
    path: '/faq',
    title: '자주 묻는 질문 | ITPLACE',
    description:
      'ITPLACE 통신사 멤버십 혜택 검색, 온라인·오프라인 혜택 구분, 지도 검색, 문의 방법에 대한 자주 묻는 질문입니다.',
    heading: '자주 묻는 질문',
    paragraphs: [
      'ITPLACE에서는 SKT, KT, LG U+ 통신사 멤버십으로 이용할 수 있는 제휴처 할인, 무료 제공, 등급별 혜택, 온라인·오프라인 이용 조건을 검색할 수 있습니다.',
      '현재 위치 또는 검색 위치를 기준으로 주변 제휴처를 조회하며, 카테고리, 키워드, 통신사 조건을 조합해 원하는 혜택을 좁혀볼 수 있습니다.',
      '잘못된 혜택 정보는 문의 페이지 또는 앱 내 문의 기능으로 제휴처명, 통신사, 잘못된 조건, 확인한 위치를 함께 보내 제보할 수 있습니다.',
    ],
  },
  {
    path: '/contact',
    title: '문의 | ITPLACE',
    description:
      'ITPLACE 서비스 오류, 혜택 정보 수정, 제휴 문의, 개인정보 관련 문의 접수 방법을 안내합니다.',
    heading: '문의',
    paragraphs: [
      'ITPLACE 이용 중 발견한 오류, 혜택 정보 변경 사항, 제휴 제안, 개인정보 관련 요청은 문의 페이지 또는 앱 내 문의 기능으로 접수할 수 있습니다.',
      '문의 시 오류 화면, 제휴처명, 통신사, 혜택 조건을 함께 적어주시면 확인이 빨라집니다.',
      '이메일 문의는 support@itplace.click로 보낼 수 있습니다.',
    ],
  },
  {
    path: '/terms',
    title: '이용약관 | ITPLACE',
    description:
      'ITPLACE 통신사 멤버십 혜택 검색 서비스의 이용 조건, 혜택 정보 안내 기준, 계정 및 문의 절차를 안내합니다.',
    heading: '이용약관',
    paragraphs: [
      '본 약관은 ITPLACE가 제공하는 통신사 멤버십 혜택 검색, 지도 기반 제휴처 탐색, 즐겨찾기, 추천 기능의 이용 조건과 절차를 안내합니다.',
      '사용자는 회원가입 없이도 공개 혜택 정보를 조회할 수 있으며, 즐겨찾기, 맞춤 추천, 마이페이지 등 개인화 기능은 로그인이 필요할 수 있습니다.',
      '혜택 조건과 운영 여부는 통신사 또는 제휴처 정책에 따라 변경될 수 있으므로 실제 이용 전 최신 조건을 확인해 주세요.',
    ],
  },
  {
    path: '/privacy',
    title: '개인정보처리방침 | ITPLACE',
    description:
      'ITPLACE 웹 및 모바일 서비스의 개인정보 수집, 이용 목적, 위치정보 처리, 보관 및 파기, 이용자 권리를 안내합니다.',
    heading: '개인정보처리방침',
    paragraphs: [
      'ITPLACE는 이용자의 개인정보를 중요하게 생각하며 개인정보 보호 관련 법령을 준수하기 위해 개인정보 처리방침을 공개합니다.',
      '회원 식별, 로그인, 계정 관리, 맞춤 혜택 추천, 주변 혜택 조회, 문의 접수, 보안 사고 예방과 서비스 안정성 확보를 위해 필요한 정보를 처리할 수 있습니다.',
      '개인정보 처리와 관련한 문의는 앱 내 문의 기능 또는 support@itplace.click로 접수할 수 있습니다.',
    ],
  },
  {
    path: '/account-deletion',
    title: '계정 및 데이터 삭제 안내 | ITPLACE',
    description:
      'ITPLACE 계정 삭제 요청 방법, 삭제되는 데이터, 보관될 수 있는 데이터와 처리 절차를 안내합니다.',
    heading: '계정 및 데이터 삭제 요청',
    paragraphs: [
      '이 페이지는 ITPLACE 앱 및 웹 서비스 계정과 관련 데이터의 삭제 요청 방법을 안내합니다.',
      '사용자는 앱 안에서 직접 회원 탈퇴를 진행하거나 support@itplace.click 이메일을 통해 계정 삭제를 요청할 수 있습니다.',
      '계정 삭제 요청은 본인 확인 후 처리하며 법령 준수, 보안 사고 대응, 분쟁 해결에 필요한 기록은 관련 기준에 따라 필요한 기간 동안 보관될 수 있습니다.',
    ],
  },
];

const appShellPages = [
  {
    path: '/map',
    title: '통신사 멤버십 혜택 지도 | ITPLACE',
    description:
      'SKT, KT, LG U+ 멤버십 제휴처와 주변 혜택을 지도에서 검색하고 온라인·오프라인 이용 조건을 확인하세요.',
    heading: '통신사 멤버십 혜택 지도',
    paragraphs: [
      '현재 위치 또는 선택한 지역 주변의 통신사 멤버십 제휴처를 지도에서 확인할 수 있습니다.',
      '지도 기능은 브라우저에서 JavaScript가 활성화되어야 정상적으로 동작합니다.',
    ],
  },
  {
    path: '/benefits',
    title: '전체 멤버십 혜택 | ITPLACE',
    description:
      'SKT, KT, LG U+ 통신사 멤버십 제휴 혜택을 브랜드, 카테고리, 통신사별로 검색하고 비교하세요.',
    heading: '전체 멤버십 혜택',
    paragraphs: [
      '통신사별 멤버십 제휴 혜택을 브랜드, 카테고리, 이용 조건 기준으로 검색하고 비교할 수 있습니다.',
      '혜택 목록은 서비스 API를 통해 최신 데이터로 불러오며 JavaScript가 활성화되어야 정상적으로 표시됩니다.',
    ],
  },
  {
    path: '/login',
    title: '로그인 | ITPLACE',
    description:
      'ITPLACE 로그인 페이지입니다. 로그인 후 즐겨찾기와 맞춤 추천 기능을 이용할 수 있습니다.',
    heading: '로그인',
    paragraphs: ['로그인 후 즐겨찾기, 마이페이지, 맞춤 추천 기능을 이용할 수 있습니다.'],
    noIndex: true,
  },
  {
    path: '/oauth/callback/kakao',
    title: '카카오 로그인 처리 중 | ITPLACE',
    description: 'ITPLACE 카카오 로그인 콜백 처리 페이지입니다.',
    heading: '카카오 로그인 처리 중',
    paragraphs: ['카카오 로그인 처리를 완료하려면 브라우저에서 JavaScript가 활성화되어야 합니다.'],
    noIndex: true,
  },
  {
    path: '/mypage/info',
    title: '마이페이지 | ITPLACE',
    description: 'ITPLACE 회원 정보와 멤버십 정보를 관리하는 마이페이지입니다.',
    heading: '마이페이지',
    paragraphs: ['회원 정보와 저장한 혜택은 로그인 후 확인할 수 있습니다.'],
    noIndex: true,
  },
  {
    path: '/mypage/favorites',
    title: '저장한 혜택 | ITPLACE',
    description: 'ITPLACE에서 저장한 멤버십 혜택을 확인하는 페이지입니다.',
    heading: '저장한 혜택',
    paragraphs: ['저장한 혜택 목록은 로그인 후 확인할 수 있습니다.'],
    noIndex: true,
  },
  {
    path: '/mypage/history',
    title: '저장한 혜택 | ITPLACE',
    description: 'ITPLACE에서 저장한 멤버십 혜택을 확인하는 페이지입니다.',
    heading: '저장한 혜택',
    paragraphs: ['저장한 혜택 목록은 로그인 후 확인할 수 있습니다.'],
    noIndex: true,
  },
];

const notFoundPage = {
  path: '/404',
  title: '페이지를 찾을 수 없습니다 | ITPLACE',
  description:
    '요청한 ITPLACE 페이지를 찾을 수 없습니다. 주요 페이지에서 혜택을 다시 확인해 주세요.',
  heading: '페이지를 찾을 수 없습니다',
  paragraphs: [
    '입력한 주소가 잘못되었거나 페이지가 이동되었을 수 있습니다.',
    '지도, 전체 혜택, 서비스 소개, 문의 페이지에서 원하는 정보를 다시 찾아보세요.',
  ],
  noIndex: true,
};

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const replaceOrInsertMeta = (html, selectorPattern, tag) => {
  if (selectorPattern.test(html)) {
    return html.replace(selectorPattern, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
};

const stripRobotsMeta = (html) =>
  html.replace(/\s*<meta\s+name="robots"\s+content="[^"]*"\s*\/>/g, '');

const updateHead = (html, page) => {
  const canonicalUrl = `${SITE_ORIGIN}${page.path}`;
  let next = stripRobotsMeta(html)
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(page.title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/s,
      `<meta name="description" content="${escapeHtml(page.description)}" />`
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/s,
      `<link rel="canonical" href="${canonicalUrl}" />`
    );

  next = replaceOrInsertMeta(
    next,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/s,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`
  );
  next = replaceOrInsertMeta(
    next,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/s,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`
  );
  next = replaceOrInsertMeta(
    next,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/s,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );
  next = replaceOrInsertMeta(
    next,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/s,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`
  );
  next = replaceOrInsertMeta(
    next,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/s,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`
  );

  if (page.noIndex) {
    next = replaceOrInsertMeta(
      next,
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/s,
      '<meta name="robots" content="noindex,follow" />'
    );
  }

  return next;
};

const renderFallback = (page) => {
  const links = [
    ['/', '홈'],
    ['/map', '지도에서 혜택 찾기'],
    ['/benefits', '전체 혜택 보기'],
    ['/about', '서비스 소개'],
    ['/guide', '혜택 이용 가이드'],
    ['/faq', '자주 묻는 질문'],
    ['/contact', '문의'],
    ['/terms', '이용약관'],
    ['/privacy', '개인정보처리방침'],
  ];

  return `    <main data-prerender-fallback="true" style="max-width: 840px; margin: 0 auto; padding: 48px 20px; font-family: sans-serif; line-height: 1.7; color: #101114;">\n      <p style="font-weight: 700; color: #7132f5;">IT:PLACE</p>\n      <h1>${escapeHtml(page.heading)}</h1>\n${page.paragraphs
    .map((paragraph) => `      <p>${escapeHtml(paragraph)}</p>`)
    .join(
      '\n'
    )}\n      <nav aria-label="ITPLACE 주요 페이지" style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px;">\n${links
    .map(
      ([href, label]) =>
        `        <a href="${href}" style="color: #7132f5; font-weight: 700;">${escapeHtml(label)}</a>`
    )
    .join(
      '\n'
    )}\n      </nav>\n    </main>\n    <script>document.querySelector('[data-prerender-fallback="true"]')?.remove();</script>`;
};

const injectFallback = (html, page) => {
  const fallback = renderFallback(page);
  return html.replace('    <div id="root"></div>', `    <div id="root"></div>\n${fallback}`);
};

const writeRouteHtml = async (html, page) => {
  const slug = page.path.slice(1);
  const routeDir = path.join(DIST_DIR, slug);
  await mkdir(routeDir, { recursive: true });
  await writeFile(path.join(routeDir, 'index.html'), html, 'utf8');
  await writeFile(path.join(DIST_DIR, `${slug}.html`), html, 'utf8');
};

const template = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8');
const knownRoutes = [...publicPages, ...appShellPages];

for (const page of knownRoutes) {
  const html = injectFallback(updateHead(template, page), page);
  await writeRouteHtml(html, page);
}

const notFoundHtml = injectFallback(updateHead(template, notFoundPage), notFoundPage);
await writeFile(path.join(DIST_DIR, '404.html'), notFoundHtml, 'utf8');

console.log(`prerendered ${knownRoutes.length} known routes and 404 page`);
