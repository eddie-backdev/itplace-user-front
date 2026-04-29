# ITPLACE User Front

ITPLACE 사용자를 위한 웹 프론트엔드입니다.
LG U+ 멤버십 혜택을 지도에서 탐색하고, 전체 혜택 목록·개인 맞춤 추천·관심 혜택·이벤트를 사용할 수 있는 사용자 서비스를 제공합니다.

## 주요 기능

- 랜딩 페이지와 서비스 진입 CTA
- Kakao Map 기반 주변 제휴처 탐색
- 현재 위치 / 지도 이동 기준 제휴처 재검색
- 카테고리·키워드 기반 혜택 검색
- 제휴처 상세 정보와 등급별 혜택 확인
- 회원가입 / 로그인 / Kakao OAuth 로그인
- 마이페이지 회원 정보, 관심 혜택, 사용 이력 조회
- 잇플AI 추천 및 채팅 상담 위젯
- 스크래치 쿠폰 이벤트 페이지
- 모바일/데스크톱 반응형 사용자 레이아웃

## 기술 스택

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Redux Toolkit / React Redux / Redux Persist
- React Router
- Axios
- React Hook Form
- Kakao Map API
- GSAP
- SockJS / STOMP

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

루트에 `.env` 파일을 만들고 아래 값을 설정합니다.

```env
VITE_APP_BASE_URL=http://localhost:8080/
VITE_CHAT_WS_URL=http://localhost:8080/ws-chat
VITE_KAKAO_REST_API_KEY=
VITE_KAKAO_JDK_API_KEY=
VITE_KAKAO_REDIRECT_URI=http://localhost:8080/oauth/kakao
VITE_KAKAO_CLIENT_ID=
```

### 3. 개발 서버 실행

```bash
npm run dev
```

기본 개발 서버 포트는 `5173`입니다.

## 스크립트

```bash
npm run dev
npm run build
npm run lint
npm run format
npm run preview
```

> `npm run lint`는 `--fix`를 포함합니다. 읽기 전용 검증은 `npx eslint . --config eslint.config.js`를 사용합니다.

## 프로젝트 구조

```text
src/
  apis/               API 클라이언트 및 인터셉터
  components/         공통 UI 컴포넌트
  features/           도메인별 화면/상태/API 모듈
  hooks/              반응형 등 공통 훅
  layouts/            데스크톱/모바일 레이아웃
  pages/              라우트 엔트리 페이지
  routes/             React Router 설정
  store/              Redux 상태 관리
  utils/              애니메이션, 토스트, 스크롤 유틸
```

## 배포

프로덕션 배포는 Cloudflare Pages의 Git 연동으로 진행합니다.
GitHub Actions 워크플로우는 배포가 아니라 `npm run build` 검증만 수행합니다.

Cloudflare Pages 권장 설정:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root
- Production branch: `main`

## 연관 레포지토리

- User API: `itplace-user-api`
- Admin Front: `itplace-admin-front`
- Admin API: `itplace-admin-api`
