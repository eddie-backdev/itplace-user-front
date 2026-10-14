# ITPLACE User Front Next.js

기존 `itplace-user-front`의 화면과 기능을 Next.js 16 App Router로 이전한 사용자 웹 프론트엔드입니다. 공개 혜택·멤버십·제휴처 상세는 서버에서 초기 HTML을 만들고, 지도·검색·인증·즐겨찾기 같은 상호작용은 React Client Component가 이어받습니다.

## 주요 기능

- Kakao Map 기반 주변 제휴처 탐색과 현재 위치 재검색
- 통신사·카테고리·키워드 기반 전체 혜택 검색과 내 통신사·등급 필터
- 제휴처 상세와 등급별 혜택 비교
- SKT·KT·LG U+ 멤버십 안내
- 이메일·Kakao OAuth 로그인, 회원가입, 계정 관리
- 관심 혜택 관리 (AI 추천·질문형 채팅은 현재 비활성화)
- 계정별 혜택 사용 기록과 월별 수동 입력 절약액 집계
- 데스크톱 내비게이션과 모바일 앱형 탭 레이아웃
- 라우트별 Metadata, JSON-LD, robots.txt, sitemap.xml

## 화면 디자인 기준

2026-10-05 [Nexus SaaS 대시보드](https://dribbble.com/shots/23038744-Nexus-Saas-Marketing-Dashboard)를 기준으로 공통 화면을 가볍게 다듬었습니다. 데스크톱은 224px 텍스트 메뉴, 태블릿은 80px 메뉴를 사용하며 모바일은 상단 메뉴와 하단 탭을 유지합니다. 공통 캔버스는 `#F6F7FA`, 메뉴와 카드는 흰색, 구분선은 `#E7EAF0`이며 브랜드 초록을 기본 액션에 유지하고 라벤더·민트·피치 색은 보조 강조에만 씁니다. `.workspace-container`는 2160px까지 확장하고 화면 폭에 따라 좌우 패딩을 키워 1920·2560 CSS px에서도 공간을 씁니다. 지도는 글로벌 왼쪽 메뉴, 유연한 지도 캔버스, 356/380/400px 오른쪽 검색 패널로 구성하고 혜택 상세는 패널 안에서 표시합니다. 패널을 접어도 콘텐츠를 마운트한 채 키보드 접근을 차단하며 모바일은 기존 하단 시트를 유지합니다.

홈은 인기 혜택과 이용 노트를 중심으로 구성하며 전체 혜택 검색과 역할을 구분합니다. 큰 할인 예시 대신 통신사별 실제 혜택을 먼저 표시하고 멤버십 설정·사용 기록으로 연결합니다. 320·375·768·1024·1440·1920·2560 CSS px 화면에서 홈의 통신사별 3개 영역, 혜택 목록의 4~5열, 즐겨찾기의 페이지당 4·8·10개 배치를 확인했습니다. 통신사 전환, 검색, 등급 선택, 모바일 메뉴 닫기와 로그인 복귀 주소도 브라우저에서 확인했습니다. 세부 토큰은 `AGENTS.md`의 디자인 예외를 따릅니다.

## 현재 서비스 동기화 기준

2026-09-18 `itplace-user-front`의 커밋 `ce22c875665d6b3eb06ed4bec191cbc49a29b15d`를 기준으로 맞췄습니다. 원본의 미커밋 화면 변경은 포함하지 않습니다.

- 내 멤버십 목록은 브라우저의 회원 프로필 복원을 기다린 뒤 통신사·등급을 조회합니다. 상세 URL의 `carrier`·`grade`는 서버 렌더링, 새로고침, canonical 리다이렉트에도 유지합니다.
- AI 추천 진입점과 위젯·추천 요청은 `src/config/features.ts`의 공통 `false` 플래그로 차단합니다.
- 휴대폰 인증은 5초 간격, 중복·취소 처리, 비활성 탭 중지, `Retry-After`, 공급자 장애 복구, 인증 만료·재발급을 반영했습니다. 회원가입 폼은 화면 크기에 맞춰 하나만 마운트합니다.
- 비밀번호 변경·회원 탈퇴 중 중복 제출과 모달 닫기를 막고, 실패하면 입력을 보존합니다.
- 지도 compact 응답·viewport 재사용과 공개 안내 콘텐츠·공식 출처·검색 메타데이터를 반영했습니다. 기존 Next.js의 서버 렌더링, OAuth 정보 보호, 지도 SDK·줌 처리, WOFF2 최적화는 유지합니다.

`npm run verify`는 린트·타입 검사·Next.js 및 지도 compact 회귀 테스트·production 빌드·모의 API를 이용한 SSR/필터/SEO 검증을 수행합니다. 실제 문자 수신과 운영 계정·OAuth 인증은 모의 응답 검증과 별도로 확인해야 합니다. Git 배포 기준은 기존 `eddie-backdev/itplace-user-front` 저장소의 `main`입니다. Next.js 변경을 원격 main에 반영한 뒤 Workers 배포 성공과 운영 도메인 연결을 확인합니다.

## 혜택 사용 기록

`/mypage/activity`에서 로그인한 사용자가 혜택 사용일과 메모, 직접 확인한 절약액을 기록·수정·삭제할 수 있습니다. 기록한 절약액 합계는 수동 입력값이며 결제·쿠폰 사용 내역과 자동 연동되지 않습니다. 금액 `null`은 미입력, `0`은 입력한 0원으로 구분합니다.

User API 계약은 `GET /api/v1/benefit-usages?month=YYYY-MM`, `POST /api/v1/benefit-usages`, `PUT /api/v1/benefit-usages/{recordId}`, `DELETE /api/v1/benefit-usages/{recordId}`이며 계정 인증이 필요합니다. `V20261004_0001__create_benefit_usage_records.sql` 마이그레이션이 개발 DB에 적용됐습니다.

로그인하지 않은 사용자도 통신사·등급 혜택을 검색하고 지도로 주변 제휴처를 찾을 수 있습니다. 로컬 개발환경에서 Kakao Maps SDK, 지도 타일, 마커, 마커에서 여는 매장 상세를 확인했습니다. 로컬 REST 주소 검색도 확인했습니다. 지도 UI에서는 GS25 검색 후 매장 상세를 열고 돌아왔을 때 검색어와 목록 스크롤이 유지되는 동작, 패널을 접었을 때 콘텐츠가 키보드 포커스에서 제외되는 동작도 확인했습니다. OAuth와 SMS 실연동은 아직 검증하지 않았습니다.

2026-10-04 개발환경에서 `npm run verify` 전체 단계(린트·타입 검사·27개 테스트·프로덕션 빌드·SSR)를 통과했습니다. User API의 `./gradlew test build`도 통과했습니다(432개 실행, Docker 기반 통합 테스트 46개 건너뜀). 새 마이그레이션 적용과 API 재기동, 미인증 요청의 JSON 401 응답을 실제 개발 서버에서 확인했습니다.

브라우저에서는 공개 API를 이용한 비로그인 등급 검색·상세 이동과 URL 조건 복원을 확인했습니다. 임시 개발 계정 두 개로 실제 로그인 후 선택한 혜택으로 복귀, 사용 기록 추가·수정·새로고침 후 유지·삭제를 확인했습니다. 금액 미입력과 0원을 구분하며 다른 계정은 기록을 조회하지 못하고, 타인 기록 수정·삭제 요청은 404를 반환합니다. 확인에 사용한 계정·인증 정보·기록·임시 자격 증명 파일은 정확한 생성 ID 기준으로 정리했습니다.

즐겨찾기는 통신사가 같은 경우에만 모든 등급 조건을 개인 멤버십에 적용합니다. 상세 API의 `partnerId`와 `carrierPolicies`로 선택한 통신사의 설명·한도와 전체 상세 링크를 표시합니다. 여러 통신사가 섞인 모의 응답으로 통신사 전환, 개인 멤버십 필터, 모든 등급·특정 등급 조건의 동시 표시를 확인했습니다. 멤버십 변경·즐겨찾기 검색과 320·375·1440px 계정 화면의 가로 넘침은 모의 API로 확인했습니다. 실제 OAuth·문자 인증은 별도 설정과 확인이 필요합니다.

## 기술 스택

- Next.js 16 App Router
- React 19 / TypeScript
- Tailwind CSS
- Redux Toolkit / React Redux / Redux Persist
- Axios
- Kakao Map API / GSAP

## 시작하기

Node.js 22 이상에서 실행합니다. 검증·Workers 빌드 기준은 `.nvmrc`의 Node.js 24.18.0입니다.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

개발 주소는 `http://localhost:5173`입니다. 환경별 설정에 Kakao JavaScript 키를 지정하고 Kakao Maps API를 켠 뒤, `localhost:5173`을 허용 도메인에 등록해야 합니다. 환경변수를 추가하거나 바꾼 다음 Next.js 개발 서버를 재시작하세요. 아래 env 블록의 `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=`는 새 환경에서 설정할 자리의 빈 예시입니다.

로컬 User API는 작업 공간 루트의 `userapi-local.env`로 실행합니다. JDK 17이 필요하며, 작업 공간 루트에서는 `python3 scripts/local-user-api.py`, 이 프론트엔드 디렉터리에서는 `python3 ../scripts/local-user-api.py`를 실행하세요. 런처는 API 저장소의 기존 `.env`를 바꾸지 않고 Kakao REST 주소 조회를 `https://dapi.kakao.com`에 연결합니다. 지도 SDK에는 이와 별도로 JavaScript 키와 `http://localhost:5173` 도메인 등록이 필요합니다.

```env
NEXT_PUBLIC_APP_BASE_URL=http://localhost:8080/
USER_API_BASE_URL=http://localhost:8080/
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=
NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:8080/oauth/kakao
NEXT_PUBLIC_CONTACT_EMAIL=noreply.itplace@gmail.com
```

- `NEXT_PUBLIC_*` 값은 브라우저 번들에 포함될 수 있으므로 비밀값을 넣지 않습니다.
- 프로젝트 환경 변수는 위 예시의 다섯 항목입니다. 별도 채팅 WebSocket URL은 사용하지 않으며, Kakao REST API 키는 백엔드에서 관리합니다.
- `USER_API_BASE_URL`은 서버의 공개 API 주소를 별도로 지정할 때만 필요하며, 없으면 `NEXT_PUBLIC_APP_BASE_URL`을 사용합니다. 두 주소가 같으면 로컬 환경 파일과 Cloudflare Build variables에서 중복 지정할 필요가 없습니다. Workers 런타임의 운영 주소는 `wrangler.jsonc`에 선언돼 있습니다.
- 공개 혜택 데이터는 기존 Vite 앱과 동일하게 요청 시점의 최신 값을 조회하며, Server Component 안의 중복 호출만 React 요청 캐시로 합칩니다.
- 운영 환경의 실제 비밀값과 배포 설정은 저장소에 커밋하지 않습니다.

## 콘텐츠와 광고 운영

홈은 데스크톱·모바일에서 검색, 통신사 필터, 실제 혜택과 적용 등급을 서버 렌더링하고, 지도는 `/map`에서 이용합니다. 통신사 선택은 검색·카테고리·상세 이동에도 유지됩니다. 제휴처별 해설은 `src/content/partner-notes.json`에서 관리하며, 실제 요율·제한 조건은 공식 출처와 확인일을 함께 검토합니다. 이용 가이드의 계산 예시는 실제 혜택과 구분해 가정임을 표시합니다.

데스크톱의 모든 서비스 페이지는 `SiteShell`의 공통 좌측 내비게이션과 일치하는 본문 여백을 사용합니다. 페이지마다 별도의 상단 전역 메뉴를 만들지 않습니다. 모바일의 홈·지도·혜택·마이페이지는 공통 메뉴와 하단 탭을 사용합니다. 배경·테두리·폰트·선택 상태는 공통 디자인 토큰으로 관리합니다.

승인 대기 중에는 계정 인증용 `google-adsense-account` 메타태그와 `public/ads.txt`만 유지합니다. Google은 [메타태그를 통한 사이트 연결](https://support.google.com/adsense/answer/7584263?hl=ko)을 지원합니다. 지도·로그인·계정·오류 화면까지 영향을 주던 전역 광고 스크립트는 제거했습니다.

승인 후 광고를 연결할 때는 콘텐츠가 충분한 페이지부터 게재 위치를 정합니다. 자동 광고를 사용할 경우에는 [애드센스 콘솔의 페이지 제외](https://support.google.com/adsense/answer/9262311?hl=ko)에서 지도, 로그인, 마이페이지, OAuth 콜백, 계정 삭제·정책·오류 화면 등을 제외해야 합니다. SPA에서 스크립트가 로드된 후 다른 화면으로 이동하는 경우도 확인합니다. 콘텐츠 보강은 승인 보장이 아니며, 재심사 전에 실제 반려 사유와 운영 페이지를 확인합니다.

## 검증

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

한 번에 실행하려면 `npm run verify`를 사용합니다. `lint`는 파일을 수정하지 않는 읽기 전용 검사입니다.

### 사이트맵 비상 카탈로그 갱신

사이트맵은 User API 전체 페이지를 우선 조회하고, API 장애나 불완전 응답일 때만 `src/data/partner-catalog.json`을 사용합니다. 운영 데이터 변경 후 아래 명령으로 비상 카탈로그를 갱신합니다.

```bash
USER_API_BASE_URL=https://userapi.itplace.click npm run update:partner-catalog
```

스크립트는 전체 페이지를 모두 받은 경우에만 파일을 교체하므로 부분 응답으로 정상 카탈로그를 덮어쓰지 않습니다.

## 렌더링 구조

- 서버 초기 렌더링: `/`, `/benefits`, `/benefits/partners/[partnerId]/[partnerSlug]`, `/membership`, `/membership/[carrierSlug]`, 안내·정책 페이지
- 클라이언트 상호작용: 지도, 로그인, 마이페이지, 검색·필터·페이지네이션·즐겨찾기
- 호환 리다이렉트: `/main` → `/`, `/mypage` → `/mypage/activity`, `/mypage/history` → `/mypage/favorites`, 기존 `*.html` 주소 → canonical URL

## 프로젝트 구조

```text
src/
  app/          App Router 라우트, 레이아웃, metadata route
  server/       서버 전용 공개 API 조회
  screens/      라우트 화면 컴포넌트
  features/     도메인별 UI·상태·API 모듈
  components/   공통 UI 컴포넌트
  layouts/      인증·마이페이지 등 공통 레이아웃
  store/        Redux 상태와 브라우저 저장소
  utils/        경로, 멤버십, 토스트 등 유틸리티
```

한글 웹폰트는 배포 용량과 전송량을 줄인 WOFF2 세 가지 굵기만 포함합니다.

## 배포

Cloudflare Workers용 OpenNext 설정을 추가했습니다. 기존 `next dev` / `next build` / `next start`도 사용할 수 있으며, API와 DB는 OCI 구성을 유지합니다.

```bash
npm run verify:workers   # 린트·타입·테스트·Workers 빌드·로컬 workerd 검증
npm run preview:workers  # 빌드된 Worker를 http://127.0.0.1:8787 에서 확인
```

Next.js 코드는 저장소 루트에 있으므로 Workers Builds에서 저장소 `eddie-backdev/itplace-user-front`, 브랜치 `main`, Root directory `/`를 선택합니다. 최초 main 푸시 전에는 기존 Pages 프로젝트의 Git 자동 배포를 중지하고, Workers 배포 성공 후 운영 도메인을 전환합니다. 대시보드 입력값과 환경 변수는 [Workers 배포 안내](docs/WORKERS_DEPLOYMENT.md)를 참고하세요.

## 연관 저장소

- 기존 Vite 프론트: 같은 저장소의 이전 커밋 `ce22c875665d6b3eb06ed4bec191cbc49a29b15d`
- User API: `itplace-user-api`
- Admin Front: `itplace-admin-front`
- Admin API: `itplace-admin-api`
