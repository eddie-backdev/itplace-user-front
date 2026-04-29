# It Place: 잇플레이스

> LG U+ 유레카 2기 최종 융합프로젝트 6팀 (2025.06.30 ~ 08.07) </br>
> 사람과 혜택을 잇는 장소 – 통신사 멤버십 혜택을 쉽고 스마트하게 탐색하는 지도 기반 플랫폼

![It Place 타이틀 화면](./demo/Readme-title.png)

</br>

## 🔗 팀 협업 및 배포 링크

> 프로젝트와 관련된 협업 문서, 디자인 시안, 배포된 서비스는 아래 링크를 통해 확인할 수 있습니다.

<p align="left">
  <a href="https://www.notion.so/6-222ca47e589c801c9f3ede0902f3fa36?source=copy_link" target="_blank">
    <img src="https://img.shields.io/badge/팀 Notion-000000?style=for-the-badge&logo=notion&logoColor=white" alt="Team Notion" />
  </a>
  <a href="https://www.figma.com/design/rE9IRJ0U0UsMTxlrCjXSJn/ItPlace?node-id=2152-9464&t=I2va1vEw3L3krkwp-1" target="_blank">
    <img src="https://img.shields.io/badge/팀 Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Team Figma" />
  </a>
  <a href="https://www.itplace.click" target="_blank">
    <img src="https://img.shields.io/badge/메인 서비스 바로가기-14B8A6?style=for-the-badge&logo=vercel&logoColor=white" alt="Main Site" />
  </a>
  <a href="https://admin.itplace.click" target="_blank">
    <img src="https://img.shields.io/badge/관리자 페이지 바로가기-6B7280?style=for-the-badge&logo=windows-terminal&logoColor=white" alt="Admin Site" />
  </a>
</p>

## 개발자 온보딩

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

루트에 `.env` 파일을 만들고 아래 값을 설정합니다. 값은 로컬/배포 환경에 맞게 조정합니다.

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

### 4. 검증 명령

```bash
npx eslint . --config eslint.config.js
npm run build
```

> `npm run lint`는 `--fix`를 포함하므로 읽기 전용 검증이 필요할 때는 위 eslint 명령을 사용합니다.

### 프로젝트 구조

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

### 연관 레포지토리

- User API: `itplace-user-api`
- Admin Front: `itplace-admin-front`
- Admin API: `itplace-admin-api`

- **📒 팀 Notion**: 프로젝트 기획안, 회의, 일정 등 모든 협업 기록 문서가 정리되어 있는 공간입니다.
- **🎨 팀 Figma**: It Place의 와이어프레임, 디자인 시안, 프로토타입이 정리되어 있습니다.
- **🚀 메인 서비스**: 실제 사용자들이 이용할 수 있는 It Place의 배포된 웹사이트입니다.
- **🛠 관리자 페이지**: 제휴처 정보, 사용자 통계 등 관리자 기능을 사용할 수 있는 전용 페이지입니다.

</br>

## 🐰서비스 소개

> **It Place: 잇플레이스**는 LG U+ 멤버십 이용자들이 전국 제휴처를 **지도 기반**으로 탐색하고, 혜택을 **간편하게 확인**하며, **개인 맞춤형 혜택 추천**을 받을 수 있는 지도 기반 혜택 안내 플랫폼입니다. </br>
> 지도, 위치, 혜택, 데이터를 유기적으로 연결하여 "잇다(Connect)"는 가치를 실현합니다.

- **It**: 지금 가장 주목받는, ‘핫한’ 장소
- **Place**: 실제 제휴처 위치
- **잇다 + 플레이스**: 사람과 혜택, 제휴처를 잇는 스마트한 공간

</br>

## 👍🏻기획 배경 & 목적

- **문제**: 많은 사용자가 통신사 멤버십 혜택을 놓치고 있음
- **해결**: 위치 기반 지도 탐색 + AI 추천 시스템으로 혜택 접근성 향상
- **효과**: 사용자는 더 쉽게 혜택을 누리고, 기업은 더 나은 마케팅 지원 가능

</br>

## ⭐주요 기능
> 유플러스 회원정보 연동 기능의 경우, 실제 데이터를 가져올 수는 없어 mockData로 유플러스 회원 DB에 있는 회원만 가능한 기능입니다.

### 1️⃣ 회원가입 & 로그인

- 일반 회원가입 및 소셜 로그인 지원
- LG U+ 멤버십 연동 시 기본 정보 자동 불러오기
- 번호 인증, 이메일 인증, reCAPTCHA를 통한 보안 강화
- 개인정보 수정 및 회원 탈퇴 기능 제공

### 2️⃣ 지도 및 위치 기반 시스템

- Kakao Map API를 활용한 제휴처 마커 표시
- 로드뷰 지원으로 실제 위치 확인 가능
- GPS 기반 현재 위치 탐색 및 반경 내 검색
- 거리순 정렬, 카테고리별 필터링 기능
- 사용자 데이터를 활용한 AI 기반 혜택 추천
- 사용자 지정 위치로 재검색 가능
- 혜택 사용 버튼 및 거리 제한 조건으로 무분별한 사용 방지
- 제휴처 홈페이지 외부 링크 이동 기능 지원

### 3️⃣ 혜택 및 제휴처 정보 제공

- 제휴처 위치 및 혜택에 대한 상세 정보 제공
- 멤버십 등급별 혜택 정보 표시
- 즐겨찾기 기능으로 원하는 혜택 저장
- 사용자 검색 로그 기록 저장
- 혜택 사용 이력 및 누적 혜택 금액 조회 가능
- 제휴처 홈페이지 리다이렉트 기능 제공

### 4️⃣ AI 추천 & 질문 서비스

- 멤버십 혜택 이력 & 사용자 행동 로그를 반영한 개인 맞춤 추천
- 사용자 질문 의도에 맞는 AI 제휴처 정보 제공
- 금칙어 필터링
- 로그를 활용한 추천 콜드 스타트 완화

### 5️⃣ 관리자 대시보드 & 통계 관리

- 직관적인 대시보드로 서비스 현황 Overview 제공
- 제휴처별: 이용 통계, 관심도 통계, 클릭 수 통계, 검색 순위 통계
- 멤버십 등급별 사용자 수 및 혜택 사용률 확인
- 제휴처 정보 조회 및 수정 기능
- 회원 정보 조회 기능 지원

### 6️⃣ 이벤트 페이지 & 프로모션 기능

- 지도 내 이벤트 지점을 통한 혜택 사용 유도
- 스크래치 카드 기반 이벤트 기능 제공
- 로그인 여부 및 보유 쿠폰 수에 따라 긁기 제한 제어

</br>

## 🎥데모 & 미리보기

> 🔽 주요 기능 시연 GIF 및 스크린샷

| 기능                 | 미리보기               |
| -------------------- | ---------------------- |
| 지도기반 제휴처 탐색 | ![](./demo/map.gif)    |
| 혜택상세             | ![](./demo/detail.gif) |
| 마이페이지           | ![](./demo/mypage.gif) |
| 관리자 대시보드      | ![](./demo/admin.gif)  |
| 이벤트 | ![](./demo/event.gif)    |
| 모바일 전용 레이아웃 | ![](./demo/mobile.gif) |

</br>

## 🛠기술 스택

#### 🖥️ 프론트엔드

<p align="left">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Redux-764ABC?style=flat&logo=redux&logoColor=white" />
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white" />
  <img src="https://img.shields.io/badge/Kakao%20Map-FFCD00?style=flat&logo=kakaotalk&logoColor=black" />
  <img src="https://img.shields.io/badge/GSAP-88CE02?style=flat&logo=greensock&logoColor=white" />
  <img src="https://img.shields.io/badge/Lodash-3492FF?style=flat&logo=lodash&logoColor=white" />
</p>

#### 🔧 백엔드

<p align="left">
<img src="https://img.shields.io/badge/Java-007396?style=flat&logo=openjdk&logoColor=white" /> 
<img src="https://img.shields.io/badge/Spring-6DB33F?style=flat&logo=spring&logoColor=white" />
<img src="https://img.shields.io/badge/Spring%20Data-6DB33F?style=flat&logo=spring&logoColor=white" />
<img src="https://img.shields.io/badge/Spring%20Security-6DB33F?style=flat&logo=springsecurity&logoColor=white" />
<img src="https://img.shields.io/badge/Spring%20AI-66CC66?style=flat&logo=spring&logoColor=white" />
<img src="https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white" />
<img src="https://img.shields.io/badge/OAuth-000000?style=flat&logo=oauth&logoColor=white" />
<img src="https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white" />
<img src="https://img.shields.io/badge/Elasticsearch-005571?style=flat&logo=elasticsearch&logoColor=white" />
<img src="https://img.shields.io/badge/Kibana-E8478B?style=flat&logo=kibana&logoColor=white" />
</p>

#### ⚙️ 인프라
<p align="left">
<img src="https://img.shields.io/badge/Route53-FF9900?style=flat&logo=amazon-aws&logoColor=white" />
<img src="https://img.shields.io/badge/CloudFront-232F3E?style=flat&logo=amazon-aws&logoColor=white" />
<img src="https://img.shields.io/badge/Elastic%20Load%20Balancing-FF9900?style=flat&logo=amazon-aws&logoColor=white" />
<img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat&logo=githubactions&logoColor=white" />
<img src="https://img.shields.io/badge/CodeDeploy-6DB33F?style=flat&logo=aws-code-deploy&logoColor=white" />
<img src="https://img.shields.io/badge/Elastic%20Container%20Registry-FF9900?style=flat&logo=amazon-ecs&logoColor=white" />
<img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" />
<img src="https://img.shields.io/badge/EC2-FF9900?style=flat&logo=amazon-ec2&logoColor=white" />
<img src="https://img.shields.io/badge/App%20Auto%20Scaling-FF9900?style=flat&logo=amazon-aws&logoColor=white" />
<img src="https://img.shields.io/badge/RDS-527FFF?style=flat&logo=amazonrds&logoColor=white" />
<img src="https://img.shields.io/badge/S3-569A31?style=flat&logo=amazon-s3&logoColor=white" />
</p>

#### 💬 커뮤니케이션 & 협업

<p align="left">
  <img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white" />
  <img src="https://img.shields.io/badge/Notion-000000?style=flat&logo=notion&logoColor=white" />
  <img src="https://img.shields.io/badge/Slack-4A154B?style=flat&logo=slack&logoColor=white" />
  <img src="https://img.shields.io/badge/Discord-5865F2?style=flat&logo=discord&logoColor=white" />
  <img src="https://img.shields.io/badge/Figma-F24E1E?style=flat&logo=figma&logoColor=white" />
</p>

</br>

## 🧑‍🤝‍🧑멤버

| 이름      | 담당 역할                       | GitHub                                                                                                                                          |
| --------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 👨‍💻 최영준(프론트) | 디자인 설계, 전체 혜택 페이지, 관리자 페이지 | [![GitHub](https://img.shields.io/badge/udwns310-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/udwns310)            |
| 👨‍💻 박용규(프론트) | 디자인 설계, 로그인 페이지, 메인 페이지 | [![GitHub](https://img.shields.io/badge/yonggyu99-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/yonggyu99)          |
| 👨‍💻 백세진(프론트) | 디자인 설계, 랜딩 페이지, 이벤트 컴포넌트 | [![GitHub](https://img.shields.io/badge/sejinbaek-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/sejinbaek)          |
| 👨‍💻 염승아(프론트) | 디자인 설계, 마이 페이지, 이벤트 페이지 | [![GitHub](https://img.shields.io/badge/yeom--kenco-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/yeom-kenco)       |
| 👨‍💻 이희용(백엔드) | 인증&인가, 인프라, 지도 구축 | [![GitHub](https://img.shields.io/badge/eddie--backdev-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/eddie-backdev) |
| 👩‍💻 정현경(백엔드) | 제휴처 시스템, 이벤트 기능, 관리자 페이지 | [![GitHub](https://img.shields.io/badge/hyunnk-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/hyunnk)                |
| 👩‍💻 하령경(백엔드) | 로그 저장, 관리자 대시보드, 지도 서비스 | [![GitHub](https://img.shields.io/badge/rxgx424-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/rxgx424)              |
| 👨‍💻 허승현(백엔드) | AI 추천 시스템, 즐겨찾기, 벡터DB 관리 | [![GitHub](https://img.shields.io/badge/HSH--11-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/HSH-11)               |
