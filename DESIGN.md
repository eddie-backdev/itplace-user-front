# ITPLACE Design

## Source of truth
- Status: Active — Kraken 기반 색상 체계를 ITPLACE 의미 체계로 채택, 화면별 적용은 점진 리팩토링
- Last refreshed: 2026-06-16
- Primary product surfaces:
  - 랜딩/모바일 홈
  - 지도 기반 혜택 탐색
  - 전체 혜택 목록/상세 모달
  - 질문형 AI 추천 채팅
  - 로그인/회원가입/휴대폰 인증
  - 마이페이지/관심 혜택/히스토리
  - 개인정보처리방침/계정 삭제 안내
- Evidence reviewed:
  - `tailwind.config.js` — 기존 색상/타이포그래피/브레이크포인트 토큰
  - `src/index.css` — NanumBarunGothic, datepicker, 전역 CSS
  - `src/components/*` — 공통 버튼, 검색, 모달, 탭, 결과 없음 상태
  - `src/features/allBenefitsPage/*` — 혜택 목록/상세/랭킹 카드
  - `src/features/mainPage/*` — 지도, 추천, 매장 탐색 도메인
  - `src/features/loginPage/*` — 인증/회원가입 전환 흐름
  - `src/features/myPage/*` — 마이페이지 사이드바/카드/히스토리
  - `src/pages/*` — 랜딩, 모바일 홈, 정책 문서, NotFound

## Brand
- Personality:
  - 신뢰감 있는 purple-first 서비스
  - 생활 밀착형 혜택 탐색 도구
  - 빠르고 명확하며 과장 없는 안내자
  - 모바일에서는 앱처럼 직관적이고 친근한 경험
- Trust signals:
  - 통신사 멤버십/제휴처/혜택 조건을 명확하게 보여준다.
  - 현재 위치, 검색, 카테고리, 통신사 필터를 사용자가 예측 가능하게 조작할 수 있다.
  - 인증/회원가입은 진행 상태와 다음 행동을 불안하지 않게 안내한다.
- Avoid:
  - 화면마다 다른 임의의 보라/핑크/오렌지를 추가하지 않는다.
  - 지도와 혜택 정보보다 장식, 일러스트, 모션이 먼저 보이게 하지 않는다.
  - crypto/finance 브랜드처럼 차갑고 무거운 어휘를 쓰지 않는다.
  - `Kraken` 명칭, 전용 폰트명, 외부 브랜드 표현을 코드/문서/UX에 노출하지 않는다.

## Product goals
- Goals:
  - 사용자가 주변 멤버십 혜택을 빠르게 발견하고 비교한다.
  - 통신사, 카테고리, 위치, 검색어 기반으로 혜택 탐색 경로를 단순화한다.
  - 모바일 웹에서도 앱처럼 홈-지도-혜택-저장-마이 흐름을 자연스럽게 제공한다.
  - 회원가입/인증 흐름을 짧고 명확하게 만들어 이탈을 줄인다.
- Non-goals:
  - 커머스 앱처럼 과도한 프로모션 밀도를 만든다.
  - 관리자용 정보 구조나 내부 용어를 사용자 화면에 노출한다.
  - 시각적 참신함을 이유로 기존 컴포넌트/토큰 체계를 우회한다.
- Success signals:
  - 첫 진입 후 지도/혜택 목록까지의 인지 비용이 낮다.
  - 혜택 카드에서 브랜드, 조건, 통신사, 관심 등록 여부가 빠르게 읽힌다.
  - 모바일 주요 액션은 한 손 조작 가능한 위치와 크기를 가진다.
  - 새 UI 작업에서 하드코딩 색상 대신 토큰을 재사용한다.

## Personas and jobs
- Primary personas:
  - 외출 중 주변 멤버십 제휴처를 찾는 사용자
  - 특정 브랜드/카테고리 혜택을 비교하는 사용자
  - 자주 쓰는 혜택을 저장하고 다시 확인하는 사용자
  - 회원가입/인증을 빠르게 끝내고 혜택 탐색으로 넘어가려는 사용자
- User jobs:
  - 내 주변 혜택 찾기
  - 통신사/카테고리별 혜택 필터링
  - 브랜드/제휴처 검색
  - 혜택 상세 조건 확인
  - 관심 혜택 저장/삭제
  - 상황 기반 질문으로 추천 받기
- Key contexts of use:
  - 매장 근처에서 모바일로 빠르게 확인
  - 집/회사에서 데스크톱으로 혜택 비교
  - 느린 네트워크나 위치 권한 거부 상태에서도 다음 행동 필요

## Information architecture
- Primary navigation:
  - 모바일: 홈, 지도, 혜택, 저장, 마이
  - 데스크톱: 랜딩/지도/전체 혜택/마이페이지 중심
- Core routes/screens:
  - `/` 랜딩 또는 모바일 홈
  - `/map` 지도 기반 탐색
  - `/benefits` 전체 혜택
  - `/login` 로그인/회원가입
  - `/mypage/*` 내 정보, 관심 혜택, 히스토리
  - `/privacy-policy`, `/account-deletion` 정책/계정 안내
- Content hierarchy:
  - 1순위: 현재 위치/검색어/필터 맥락
  - 2순위: 혜택 카드의 브랜드, 통신사, 조건, 액션
  - 3순위: 추천/랭킹/보조 탐색
  - 4순위: 설명 문구, 일러스트, 장식

## Design principles
- Principle 1: 혜택 정보와 지도 탐색이 장식보다 우선한다.
- Principle 2: 색상은 Kraken 팔레트 값을 그대로 쓰되, 이름과 의미는 ITPLACE로 정의한다.
- Principle 3: 새 화면은 기존 토큰/컴포넌트를 먼저 확장하고, 새 하드코딩 색상은 금지한다.
- Principle 4: 모바일은 앱형 조작감, 데스크톱은 탐색/비교 효율을 우선한다.
- Principle 5: 인증/오류/빈 상태는 사용자가 다음 행동을 이해할 수 있게 안내한다.
- Tradeoffs:
  - 정보 밀도보다 빠른 인지와 조작을 우선한다.
  - 친근함은 일러스트/마이크로카피로 보완하고, 핵심 UI 색상은 절제한다.
  - 기존 화면의 급격한 시각 파손을 피하기 위해 토큰값 교체 후 화면별 컴포넌트를 점진 정리한다.

## Visual language
- Color:
  - ITPLACE는 Kraken 참조 팔레트의 색상값을 채택한다.
  - 코드/문서에서는 외부 브랜드명을 쓰지 않고 ITPLACE 역할명으로 부른다.
  - Brand Purple: `#7132F5` — primary CTA, active state, 주요 링크, 브랜드 강조
  - Purple Hover: `#5741D8` — hover/pressed, outlined border
  - Purple Deep: `#5B1ECF` — 강한 강조, 딥 배경, 로고 텍스트 보조
  - Purple Subtle: `rgba(133, 91, 251, 0.16)` 또는 `#EDE7FE` — pill, 선택 배경, 보조 강조
  - Text Primary: `#101114`
  - Text Secondary: `#686B82`
  - Text Muted: `#9497A9`
  - Border: `#DEDEE5`
  - Surface: `#FFFFFF`
  - Surface Subtle: `#F8F8FA`
  - Success: `#149E61`, Success Deep: `#026B3F`
  - Semantic accents paired with Brand Purple:
    - Map/Cool accent: `#2F80ED` → `#14B8A6` — 보라와 인접한 blue/teal 조화로 위치/탐색을 표현한다.
    - Reward accent: `#F6C343` → `#D98E04` — 보라의 complementary yellow/gold 대비로 멤버십/보상을 표현한다.
    - Favorite accent: `#EC4899` → `#BE185D` — purple과 가까운 rose 계열로 관심/저장을 표현한다.
  - Danger는 Kraken 팔레트에 없으므로 오류 의미에만 제한해 `#D7263D`를 사용한다.
  - Legacy Orange/Pink token은 신규 UI에서 직접 쓰지 않는다. 의미가 필요하면 `accentGold`, `accentRose`처럼 역할 기반 token을 사용한다.
- Typography:
  - 한국어 가독성을 위해 `NanumBarunGothic`, `Apple SD Gothic Neo`, `Malgun Gothic`, `Helvetica Neue`, `Arial` 순서를 유지한다.
  - 외부 브랜드 전용 폰트는 사용하지 않는다.
  - 제목은 짧고 굵게, 혜택 조건/설명은 줄 간격을 충분히 둔다.
- Spacing/layout rhythm:
  - Tailwind spacing을 우선 사용한다.
  - 카드 내부는 16/20/24px 리듬을 기본으로 하고, 모바일은 터치 여백을 우선한다.
- Shape/radius/elevation:
  - 버튼: 10~12px 또는 기존 랜딩 pill 패턴 유지. 새 기본 버튼은 12px를 우선한다.
  - 카드/모달: 18~28px 범위에서 정보 계층에 맞게 사용한다.
  - shadow는 `rgba(0,0,0,0.03)` 또는 purple-tinted subtle shadow를 우선한다.
- Motion:
  - 목적 없는 장식 모션은 금지한다.
  - 인증/회원가입 전환, 로딩, 탭 이동은 짧고 방향성이 있어야 한다.
  - `prefers-reduced-motion` 대응이 필요한 모션은 별도 open question으로 남긴다.
- Imagery/iconography:
  - 토끼/브랜드 일러스트는 친근함과 빈 상태 안내용으로 사용한다.
  - 혜택 카드에서는 로고/아이콘이 정보 가독성을 방해하지 않게 한다.
  - 아이콘은 stroke weight와 크기를 모바일 탭/버튼별로 일관되게 유지한다.

## Components
- Existing components to reuse:
  - `src/components/SearchBar.tsx`
  - `src/components/ActionButton.tsx`
  - `src/components/Modal.tsx`
  - `src/components/NoResult.tsx`
  - `src/components/MobileAppTabBar.tsx`
  - `src/components/MobileHeader.tsx`
  - `src/components/BenefitFilterToggle.tsx`
  - `src/features/allBenefitsPage/components/BenefitDetailModal.tsx`
  - `src/features/allBenefitsPage/components/SimpleRanking.tsx`
  - `src/features/loginPage/layouts/AuthLayout.tsx`
- New/changed components:
  - 신규 버튼/카드/배지는 먼저 기존 컴포넌트 확장 가능성을 확인한다.
  - 새 색상 token은 `tailwind.config.js`와 이 문서를 함께 갱신할 때만 추가한다.
- Variants and states:
  - default, hover, active, selected, focus-visible
  - loading, empty, error, success, disabled
  - mobile, tablet, desktop
- Token/component ownership:
  - Tailwind token이 색상 source of truth다.
  - CSS-only 영역은 `src/index.css`의 `:root` 디자인 변수와 Tailwind token값을 동기화한다.
  - `orange*`, `pink*` 클래스명은 legacy alias이며 신규 사용 금지.

## Accessibility
- Target standard:
  - WCAG 2.1 AA 지향
- Keyboard/focus behavior:
  - 모든 버튼/링크/탭/모달 닫기는 `focus-visible` 상태를 가져야 한다.
  - 로그인/회원가입 폼은 키보드만으로 진행 가능해야 한다.
- Contrast/readability:
  - 본문은 `grey05` 이상, 핵심 텍스트는 `grey07`/`black`을 사용한다.
  - `purple01` 위 텍스트는 `purple04` 이상 또는 `grey06` 이상을 사용한다.
- Screen-reader semantics:
  - 모바일 탭은 `aria-label`, 현재 탭은 `aria-current`를 유지한다.
  - 폼 오류 문구는 관련 입력과 연결한다.
  - 지도/위치 권한 상태는 시각 정보만으로 전달하지 않는다.
- Reduced motion and sensory considerations:
  - 긴 스크롤/랜딩 모션은 reduced-motion 대응을 검토한다.
  - 자동 재생 영상/커서 장식은 핵심 탐색을 방해하지 않게 한다.

## Responsive behavior
- Supported breakpoints/devices:
  - `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`
  - custom max breakpoints: `max-sm: 500px`, `max-md: 767px`, `max-lg: 1023px`, `max-xlg: 1250px`, `max-xl: 1536px`
- Layout adaptations:
  - 모바일: 하단 탭, 바텀시트, 카드형 정보, 한 손 조작
  - 태블릿: 지도/목록 전환과 사이드 정보 밀도 균형
  - 데스크톱: 넓은 지도, 검색/필터, 비교 가능한 카드 그리드
- Touch/hover differences:
  - 모바일은 hover에 의존하지 않는다.
  - 터치 타겟은 최소 40px 이상을 지향한다.

## Interaction states
- Loading:
  - 지도/혜택/추천 데이터는 spinner 또는 skeleton과 짧은 상태 문구를 제공한다.
- Empty:
  - `NoResult`와 토끼 일러스트를 활용하되, 다음 행동 CTA를 함께 제공한다.
- Error:
  - 원인보다 복구 행동을 먼저 알려준다.
  - danger 색상은 오류와 파괴적 행동에만 사용한다.
- Success:
  - 저장/삭제/인증 완료는 toast 또는 명확한 상태 변화로 피드백한다.
- Disabled:
  - 비활성 CTA는 이유를 가까운 위치에 제공한다.
- Offline/slow network:
  - 추천/지도 API 실패 시 재시도 또는 대체 탐색 경로를 제공한다.

## Content voice
- Tone:
  - 친근하지만 과장하지 않는다.
  - 혜택 조건은 광고 문구보다 정보 정확성을 우선한다.
- Terminology:
  - `혜택`, `제휴처`, `멤버십`, `통신사`, `주변 혜택`, `관심 혜택`, `인증`
- Microcopy rules:
  - 버튼은 사용자의 행동을 직접 말한다. 예: `혜택 보러가기`, `인증번호 확인`, `관심 혜택 추가`
  - 오류 문구는 사용자가 고칠 수 있는 다음 행동을 포함한다.
  - 빈 상태는 감정적으로 부드럽게, CTA는 명확하게 작성한다.

## Implementation constraints
- Framework/styling system:
  - React 19, TypeScript, Vite, Tailwind CSS
  - `npm run lint`는 `--fix`를 실행하므로 검증에는 `npx eslint . --config eslint.config.js`를 사용한다.
- Design-token constraints:
  - 신규 UI에서 hex/rgb 하드코딩 금지. Tailwind token 또는 `src/index.css` 변수 사용.
  - Kraken 값은 Tailwind token에만 직접 선언한다.
  - legacy `orange*`, `pink*` token은 기존 컴파일 호환용이며 신규 사용 금지.
- Performance constraints:
  - Kakao Maps SDK, 대형 이미지, 랜딩 비디오, 대형 JS chunk가 초기 로딩에 영향을 줄 수 있다.
  - 모바일 진입 화면은 지도/혜택 탐색에 필요한 정보만 먼저 보여준다.
- Compatibility constraints:
  - 모바일 safe-area, 주소창 높이 변화, 터치 스크롤 잠금을 고려한다.
  - 정책 문서와 계정 삭제 페이지는 외부 심사/스토어 요구사항에 맞게 안정적인 정적 레이아웃을 유지한다.
- Test/screenshot expectations:
  - 색상 token 변경 후 `npx eslint . --config eslint.config.js`와 `npm run build`를 실행한다.
  - 주요 화면은 가능하면 모바일/데스크톱 screenshot으로 시각 회귀를 확인한다.

## Open questions
- [ ] `orange*`, `pink*` legacy token 이름을 언제 의미 기반 이름으로 제거할지 결정 필요 / owner: frontend / impact: class rename 규모
- [ ] 랜딩의 full-black section과 purple-first 시스템의 균형을 어디까지 유지할지 결정 필요 / owner: product-design / impact: 브랜드 첫인상
- [ ] 지도 marker/cluster 색상이 새 palette와 충돌하는지 실제 지도 화면에서 확인 필요 / owner: frontend / impact: 지도 탐색 가독성
- [ ] reduced-motion 대응 범위를 랜딩 전체로 확대할지 결정 필요 / owner: frontend / impact: 접근성
