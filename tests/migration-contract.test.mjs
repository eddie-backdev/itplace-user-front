import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { test } from 'node:test';

const requiredRoutes = [
  'src/app/(site)/page.tsx',
  'src/app/(site)/map/page.tsx',
  'src/app/(site)/benefits/page.tsx',
  'src/app/(site)/benefits/partners/[partnerId]/[partnerSlug]/page.tsx',
  'src/app/(site)/login/page.tsx',
  'src/app/(site)/membership/page.tsx',
  'src/app/(site)/membership/[carrierSlug]/page.tsx',
  'src/app/(site)/mypage/info/page.tsx',
  'src/app/(site)/mypage/favorites/page.tsx',
  'src/app/(site)/about/page.tsx',
  'src/app/(site)/guide/page.tsx',
  'src/app/(site)/faq/page.tsx',
  'src/app/(site)/contact/page.tsx',
  'src/app/(site)/terms/page.tsx',
  'src/app/(site)/privacy/page.tsx',
  'src/app/(site)/account-deletion/page.tsx',
  'src/app/oauth/callback/kakao/page.tsx',
  'src/app/not-found.tsx',
];

const removedViteFiles = [
  'index.html',
  'vite.config.ts',
  'src/main.tsx',
  'src/App.tsx',
  'src/routes/index.tsx',
  'src/vite-env.d.ts',
];

const removedLegacyFiles = [
  'src/screens/LandingPage.tsx',
  'src/features/landingPage',
  'src/assets/landingPage',
  'src/layouts/ResponsiveLayout.tsx',
  'src/layouts/MobileLayout.tsx',
  'src/layouts/DefaultLayout.tsx',
  'src/screens/ScrollToTopHandler.tsx',
  'public/videos/hero-video.mp4',
  'public/videos/hero-rabbit.mp4',
];

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
};

test('기존 사용자 기능의 App Router 엔트리가 모두 존재한다', async () => {
  const missing = [];
  for (const route of requiredRoutes) {
    if (!(await exists(route))) missing.push(route);
  }
  assert.deepEqual(missing, []);
});

test('Vite와 React Router 엔트리가 제거되어 있다', async () => {
  const remaining = [];
  for (const path of removedViteFiles) {
    if (await exists(path)) remaining.push(path);
  }
  assert.deepEqual(remaining, []);

  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  assert.equal(packageJson.dependencies?.['react-router-dom'], undefined);
  assert.equal(packageJson.devDependencies?.vite, undefined);
  assert.equal(packageJson.dependencies?.['@gsap/react'], undefined);
  assert.match(packageJson.scripts?.build ?? '', /^next build$/);
  assert.match(packageJson.scripts?.typecheck ?? '', /^next typegen && tsc --noEmit$/);
  assert.match(packageJson.scripts?.verify ?? '', /npm run test:production/);
});

test('SSR, SEO, 클라이언트 공급자 경계가 구성되어 있다', async () => {
  for (const path of [
    'src/server/userApi.ts',
    'src/app/AppProviders.tsx',
    'src/app/robots.ts',
    'src/app/sitemap.ts',
    'src/middleware.ts',
  ]) {
    assert.equal(await exists(path), true, `${path} 파일이 필요합니다`);
  }

  const serverApi = await readFile('src/server/userApi.ts', 'utf8');
  assert.match(serverApi, /import 'server-only'/);
  assert.match(serverApi, /cache: 'no-store'/);
  assert.doesNotMatch(serverApi, /revalidate:/);

  const nextConfig = await readFile('next.config.ts', 'utf8');
  assert.match(nextConfig, /source: '\/main'.+destination: '\/'/s);
  assert.match(nextConfig, /source: '\/mypage\/history'.+destination: '\/mypage\/favorites'/s);

  const proxy = await readFile('src/middleware.ts', 'utf8');
  assert.match(proxy, /NextResponse\.redirect\(destination, 308\)/);
  assert.match(proxy, /NextResponse\.rewrite\(destination, \{ status: 404 \}\)/);
  assert.match(proxy, /'\/membership\/:path\*'/);

  const jsonLd = await readFile('src/components/JsonLd.tsx', 'utf8');
  assert.match(jsonLd, /replace\(\/<\/g, ['"]\\\\u003c['"]\)/);
});

test('공개 환경 변수 이름은 NEXT_PUBLIC 접두사를 사용한다', async () => {
  const example = await readFile('.env.example', 'utf8');
  assert.doesNotMatch(example, /(^|\n)VITE_/);
  assert.match(example, /NEXT_PUBLIC_APP_BASE_URL=/);
  assert.match(example, /USER_API_BASE_URL=/);
});

test('App Router 전환 후 사용되지 않는 레거시 화면과 대용량 자산이 남지 않는다', async () => {
  const remaining = [];
  for (const path of removedLegacyFiles) {
    if (await exists(path)) remaining.push(path);
  }
  assert.deepEqual(remaining, []);

  for (const font of [
    'public/font/nanum-barun-gothic/NanumBarunGothicLight.woff2',
    'public/font/nanum-barun-gothic/NanumBarunGothic.woff2',
    'public/font/nanum-barun-gothic/NanumBarunGothicBold.woff2',
  ]) {
    assert.equal(await exists(font), true, `${font} 파일이 필요합니다`);
  }
});

test('인증과 외부 SDK의 클라이언트 초기화 경계가 보호되어 있다', async () => {
  const providers = await readFile('src/app/AppProviders.tsx', 'utf8');
  assert.ok(
    providers.indexOf('setupInterceptors();') < providers.indexOf('function AuthSessionValidator'),
    '하위 컴포넌트 렌더 전에 interceptor를 구성해야 합니다'
  );
  assert.match(providers, /state\._persist\.rehydrated/);
  assert.match(providers, /QuestionRecommendationLoader/);

  const oauthHandler = await readFile(
    'src/features/loginPage/layouts/OAuthRedirectHandler.tsx',
    'utf8'
  );
  assert.match(oauthHandler, /handledCallbackRef/);
  assert.match(oauthHandler, /storeOAuthPreAuth/);
  assert.doesNotMatch(oauthHandler, /params\.set\(['"](?:email|nickname|birthday|gender)/);

  const kakaoScript = await readFile('src/app/KakaoMapScript.tsx', 'utf8');
  assert.match(kakaoScript, /KAKAO_MAP_LOAD_TIMEOUT_MS/);
  assert.match(kakaoScript, /KAKAO_MAP_ERROR_EVENT/);

  const kakaoMap = await readFile(
    'src/features/mainPage/components/MapSection/KakaoMap/index.tsx',
    'utf8'
  );
  assert.match(kakaoMap, /DEFAULT_MAP_LOCATION/);
  assert.match(kakaoMap, /useRef<MapLocation>\(/);
});

test('지도 줌 중에는 이전 서버 클러스터를 즉시 숨기고 최신 스냅샷만 표시한다', async () => {
  const kakaoMap = await readFile(
    'src/features/mainPage/components/MapSection/KakaoMap/index.tsx',
    'utf8'
  );
  const mainLayout = await readFile('src/features/mainPage/components/Layout/index.tsx', 'utf8');
  const storeDataHook = await readFile('src/features/mainPage/hooks/useStoreData.ts', 'utf8');
  const kakaoTypes = await readFile('src/features/mainPage/types/kakao.ts', 'utf8');
  const zoomStartHandler = kakaoMap.slice(
    kakaoMap.indexOf("addMapEventListener(map, 'zoom_start'"),
    kakaoMap.indexOf("addMapEventListener(map, 'zoom_changed'")
  );
  const idleHandler = kakaoMap.slice(
    kakaoMap.indexOf("addMapEventListener(map, 'idle'"),
    kakaoMap.indexOf("addMapEventListener(map, 'dragstart'")
  );

  assert.match(zoomStartHandler, /setCustomMarkersVisibility\('hidden'\)/);
  assert.match(zoomStartHandler, /onZoomStartRef\.current\?\.\(\)/);
  assert.match(zoomStartHandler, /clearServerClusterRegistry\(\)/);
  assert.match(zoomStartHandler, /clearTimeout\(markerRevealTimerRef\.current\)/);
  assert.match(zoomStartHandler, /clearTimeout\(zoomSettledTimerRef\.current\)/);
  assert.match(kakaoMap, /overlay\.setVisible\(isVisible\)/);
  assert.match(
    kakaoMap,
    /isZoomingRef\.current \|\| hasPendingZoomViewportChangeRef\.current \? 'hidden' : 'visible'/
  );
  assert.match(kakaoMap, /hasPendingZoomViewportChangeRef\.current = true/);
  assert.match(idleHandler, /if \(!hasPendingZoomViewportChangeRef\.current\)/);
  assert.doesNotMatch(idleHandler, /if \(!isZoomingRef\.current\)/);
  assert.match(
    kakaoMap,
    /setTimeout\(\(\) => \{[\s\S]*?hasPendingZoomViewportChangeRef\.current = false;[\s\S]*?notifyViewportChange\(\);[\s\S]*?\}, 300\)/
  );
  assert.match(mainLayout, /onZoomStart=\{handleMapZoomStart\}/);
  assert.match(mainLayout, /cancelMapViewportRequest\(\)/);
  assert.match(storeDataHook, /cancelMapViewportRequest: cancelViewportRequest/);
  assert.match(kakaoTypes, /setVisible\(visible: boolean\): void/);
});

test('SEO fallback 카탈로그는 전체 페이지 검증과 갱신 경로를 가진다', async () => {
  const sitemap = await readFile('src/app/sitemap.ts', 'utf8');
  assert.match(sitemap, /if \(page < totalPages\)/);
  assert.match(sitemap, /partnerCatalog\.partners/);
  assert.equal(await exists('scripts/update-partner-catalog.mjs'), true);

  const readme = await readFile('README.md', 'utf8');
  assert.match(readme, /npm run update:partner-catalog/);
});
