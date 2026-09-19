# ITPLACE User Front Next.js

기존 `itplace-user-front`의 화면과 기능을 Next.js 16 App Router로 이전한 사용자 웹 프론트엔드입니다. 공개 혜택·멤버십·제휴처 상세는 서버에서 초기 HTML을 만들고, 지도·검색·인증·즐겨찾기 같은 상호작용은 React Client Component가 이어받습니다.

## 주요 기능

- Kakao Map 기반 주변 제휴처 탐색과 현재 위치 재검색
- 통신사·카테고리·키워드 기반 전체 혜택 검색과 내 통신사·등급 필터
- 제휴처 상세와 등급별 혜택 비교
- SKT·KT·LG U+ 멤버십 안내
- 이메일·Kakao OAuth 로그인, 회원가입, 계정 관리
- 관심 혜택 관리 (AI 추천·질문형 채팅은 현재 비활성화)
- 데스크톱 내비게이션과 모바일 앱형 탭 레이아웃
- 라우트별 Metadata, JSON-LD, robots.txt, sitemap.xml

## 현재 서비스 동기화 기준

2026-09-18 `itplace-user-front`의 커밋 `ce22c875665d6b3eb06ed4bec191cbc49a29b15d`를 기준으로 맞췄습니다. 원본의 미커밋 화면 변경은 포함하지 않습니다.

- 내 멤버십 목록은 브라우저의 회원 프로필 복원을 기다린 뒤 통신사·등급을 조회합니다. 상세 URL의 `carrier`·`grade`는 서버 렌더링, 새로고침, canonical 리다이렉트에도 유지합니다.
- AI 추천 진입점과 위젯·추천 요청은 `src/config/features.ts`의 공통 `false` 플래그로 차단합니다.
- 휴대폰 인증은 5초 간격, 중복·취소 처리, 비활성 탭 중지, `Retry-After`, 공급자 장애 복구, 인증 만료·재발급을 반영했습니다. 회원가입 폼은 화면 크기에 맞춰 하나만 마운트합니다.
- 비밀번호 변경·회원 탈퇴 중 중복 제출과 모달 닫기를 막고, 실패하면 입력을 보존합니다.
- 지도 compact 응답·viewport 재사용과 공개 안내 콘텐츠·공식 출처·검색 메타데이터를 반영했습니다. 기존 Next.js의 서버 렌더링, OAuth 정보 보호, 지도 SDK·줌 처리, WOFF2 최적화는 유지합니다.

`npm run verify`는 린트·타입 검사·Next.js 및 지도 compact 회귀 테스트·production 빌드·모의 API를 이용한 SSR/필터/SEO 검증을 수행합니다. 실제 문자 수신과 운영 계정·OAuth 인증은 모의 응답 검증과 별도로 확인해야 합니다. Git 배포 기준은 기존 `eddie-backdev/itplace-user-front` 저장소의 `main`입니다. Next.js 변경을 원격 main에 반영한 뒤 Workers 배포 성공과 운영 도메인 연결을 확인합니다.

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

개발 주소는 `http://localhost:5173`입니다. `.env.local`에는 실제 API와 Kakao 키를 설정해야 합니다.

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
- 호환 리다이렉트: `/main` → `/`, `/mypage` → `/mypage/info`, `/mypage/history` → `/mypage/favorites`, 기존 `*.html` 주소 → canonical URL

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
