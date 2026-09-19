import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';

const workers = process.argv.includes('--workers');
const runtimeName = workers ? 'workers' : 'production';

const mockPartner = {
  partnerId: 284,
  partnerName: '스타벅스',
  category: '카페',
  image: null,
  carriers: ['SKT'],
};

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
          tierBenefits: [{ carrier: 'SKT', grade: 'VIP', context: '음료 10% 할인', isAll: false }],
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
          tierBenefits: [{ carrier: 'SKT', grade: 'VIP', context: '음료 10% 할인', isAll: false }],
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
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');

    if (url.pathname === '/api/v1/benefits/partners') {
      const page = Number(url.searchParams.get('page') ?? '0');
      json(response, 200, {
        data: {
          content: page === 0 ? [mockPartner] : [],
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
  return { server, origin: `http://127.0.0.1:${address.port}` };
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

const runChecks = async (origin) => {
  const rootResponse = await fetch(`${origin}/`);
  const rootHtml = await rootResponse.text();
  assert.equal(rootResponse.status, 200);
  assert.equal(rootResponse.headers.has('x-powered-by'), false);
  assert.match(rootHtml, /<title>통신 3사 멤버십 혜택 비교·검색 \| 잇플레이스<\/title>/);
  assert.match(rootHtml, /통신 3사 멤버십 혜택을 한곳에서 찾아보세요/);

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
  assert.match(benefitsHtml, /"@type":"CollectionPage"/);
  assert.match(benefitsHtml, /https:\/\/itplace\.click\/benefits/);

  const membershipResponse = await fetch(`${origin}/membership/skt`);
  const membershipHtml = await membershipResponse.text();
  assert.equal(membershipResponse.status, 200);
  assert.match(membershipHtml, /CollectionPage/);

  const canonicalPartnerPath = `/benefits/partners/284/${encodeURIComponent('스타벅스')}`;
  const partnerResponse = await fetch(`${origin}${canonicalPartnerPath}`);
  const partnerHtml = await partnerResponse.text();
  assert.equal(partnerResponse.status, 200);
  assert.match(partnerHtml, /월 1회 받을 수 있는 상세 혜택/);
  assert.equal(countOccurrences(partnerHtml, 'id="benefit-502"'), 1);
  assert.equal(partnerHtml.includes('<script type="application/ld+json">'), true);

  const filteredResponse = await fetch(
    `${origin}${canonicalPartnerPath}?carrier=SKT&grade=SKT_VIP&membership=mine`
  );
  const filteredHtml = await filteredResponse.text();
  assert.equal(filteredResponse.status, 200);
  assert.match(filteredResponse.headers.get('cache-control') ?? '', /private|no-store/);
  assert.match(filteredHtml, /VIP 전용 테스트 혜택/);
  assert.match(filteredHtml, /혜택만 보고 있어요/);
  assert.equal(countOccurrences(filteredHtml, 'id="benefit-503"'), 1);
  assert.equal(countOccurrences(filteredHtml, 'id="benefit-502"'), 0);
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
  await assertRedirect(origin, '/mypage', 307, '/mypage/info');
  await assertRedirect(origin, '/mypage/history', 307, '/mypage/favorites');
  await assertRedirect(origin, '/index.html', 308, '/');
  await assertRedirect(origin, '/about.html', 308, '/about');

  const robotsResponse = await fetch(`${origin}/robots.txt`);
  assert.equal(robotsResponse.status, 200);
  const robotsText = await robotsResponse.text();
  assert.match(robotsText, /Sitemap: https:\/\/itplace\.click\/sitemap\.xml/);
  assert.doesNotMatch(robotsText, /Disallow: \/(?:login|mypage|oauth)/);
  for (const privatePath of ['/login', '/mypage/info', '/oauth/callback/kakao']) {
    const html = await (await fetch(`${origin}${privatePath}`)).text();
    assert.match(html, /content="noindex, follow"/);
  }

  const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
  const sitemapXml = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemapXml, /benefits\/partners\/284\//);
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

const { server: mockServer, origin: mockOrigin } = await startMockApi();
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
  await runChecks(appOrigin);
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
