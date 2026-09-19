# Cloudflare Workers 배포 안내

작성 기준: 2026-09-19. 프로젝트 설정과 로컬 workerd 검증을 완료했으며 Cloudflare 계정에 배포하지 않았다.

## 구성

- 사용자 웹: Next.js 16.3.5 → OpenNext 1.20.6 → Cloudflare Workers + Static Assets
- API: 기존 `https://userapi.itplace.click/`의 Spring 서버
- DB·인증·문자 공급자 연동: 기존 OCI/API 구성 유지
- 빌드 도구: Node.js 24.18.0 (`.nvmrc`), Wrangler 4.135.0, npm lockfile

기존 Next.js 빌드와 App Router를 유지하기 위해 OpenNext를 사용한다. Cloudflare의 vinext 권장 경로는 별도 Vite 기반 구현이므로 이번 설정에 추가하지 않았다.

공개 혜택 데이터는 `no-store`로 매 요청 조회한다. 안내·로그인 등 사전 생성 페이지는 Static Assets 기반 읽기 전용 캐시를 사용한다. 현재 R2·KV·D1·Durable Objects는 필요하지 않다. ISR, `revalidatePath`/`revalidateTag` 또는 쓰기 가능한 데이터 캐시를 도입할 때는 `open-next.config.ts`의 캐시 구성을 함께 변경해야 한다.

OpenNext의 Node.js middleware/proxy 지원이 실험적이므로 기존 `src/proxy.ts`를 `src/middleware.ts`의 Edge middleware로 옮겼다. 최신 API 이름에 따른 canonical 주소, 쿼리 보존, 404 처리는 유지했다. Next.js의 middleware 이름 폐기 예정 경고는 이 호환성 선택에 따른 것으로, 자동 codemod로 다시 proxy로 바꾸지 않는다. 페이지 자체는 Node 호환 런타임을 사용한다.

## 1. Git 배포 브랜치

배포 대상은 기존 GitHub 저장소 `eddie-backdev/itplace-user-front`의 `migration/nextjs-workers` 브랜치다. Next.js 프로젝트를 저장소 루트에 배치했다. `main`은 기존 Vite/Pages 상태를 유지하므로 Worker에는 반드시 Next.js 브랜치를 선택한다.

프로젝트 루트에 `package.json`, `package-lock.json`, `.nvmrc`, `wrangler.jsonc`, `open-next.config.ts`를 포함한다. `.env*` 실값, `.dev.vars`, `.next`, `.open-next`, `.wrangler`, `output`, `node_modules`는 제외한다. 기존 Vite용 Pages 배포 알림 workflow는 이 브랜치에서 제거했다. Workers 자동 배포는 대시보드의 Git 연결로 설정한다.

기존 Pages 프로젝트가 모든 브랜치의 preview build를 실행하도록 설정돼 있다면 이 브랜치를 Pages preview 대상에서 제외한다. 기존 Vite 빌드 설정은 Next.js 브랜치와 맞지 않으며, Workers Builds와 별개다. 운영 전환 후 `main`으로 합칠 때는 Pages의 기존 Git 자동 배포도 함께 정리한다.

## 2. Cloudflare 대시보드 입력값

Workers & Pages에서 **Worker**를 만들고 Git 저장소를 연결한다. Workers Builds 설정은 다음을 사용한다.

| 항목                         | 입력값                                                          |
| ---------------------------- | --------------------------------------------------------------- |
| Worker 이름                  | `itplace-user-front` (`wrangler.jsonc`의 `name`과 일치)         |
| 운영 브랜치                  | `migration/nextjs-workers`                                      |
| Root directory               | `/` (Next.js 프로젝트가 저장소 루트에 위치)                     |
| Build command                | `npm run build:workers`                                         |
| Deploy command               | `npm run deploy:workers`                                        |
| 비운영 브랜치 deploy command | `npm run upload:workers` (미리보기 버전 업로드)                 |
| Node 버전                    | `.nvmrc`로 24.18.0 지정                                         |
| 정적 output directory        | Pages용 `dist`/`out` 입력 불필요. Wrangler가 산출물 경로를 읽음 |

의존성은 lockfile을 함께 올려 설치한다. 로컬이나 CI에서 `npm ci && npm run verify:workers`를 통과한 변경을 배포한다. Workers Builds의 자동 설치 대신 직접 설치하려면 `SKIP_DEPENDENCY_INSTALL=1`과 build command `npm ci && npm run build:workers`를 함께 설정한다.

`deploy:workers`와 `upload:workers`는 앞서 생성한 `.open-next`를 사용한다. 단독 실행 전 빌드가 필요하다. 이 두 명령은 실제 Cloudflare 변경을 수행하므로 로컬 검증 명령과 구분한다. Workers Builds의 Git 연동은 Cloudflare가 제공하는 배포 인증을 사용하며, 프런트 환경 변수에 API 토큰을 넣지 않는다.

## 3. 환경 변수

**Build variables**에 다음을 등록한다. `NEXT_PUBLIC_*`는 빌드 시 브라우저 코드에 포함되므로 변경 후 재빌드해야 한다. Runtime 변수만 수정해서는 적용되지 않는다.

| 이름                               | 운영 값                                     | 용도                                   |
| ---------------------------------- | ------------------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_APP_BASE_URL`         | `https://userapi.itplace.click/`            | 브라우저 API 요청                      |
| `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` | 현재 서비스의 Kakao JavaScript 키           | 지도 SDK (공개 키, REST/비밀 키 아님)  |
| `NEXT_PUBLIC_KAKAO_REDIRECT_URI`   | `https://userapi.itplace.click/oauth/kakao` | 기존 API의 Kakao 로그인 시작 주소      |
| `NEXT_PUBLIC_CONTACT_EMAIL`        | `noreply.itplace@gmail.com`                 | 공개 문의 이메일                       |
| `USER_API_BASE_URL`                | `https://userapi.itplace.click/`            | 빌드 중 공개 API 조회가 필요할 때 사용 |

**Runtime**의 `USER_API_BASE_URL`은 이미 `wrangler.jsonc`의 `vars`에 운영 API 주소로 선언했다. 이 주소는 비밀값이 아니다. 변경할 때는 설정 파일을 수정하고 재배포한다. 대시보드에서만 값을 바꾸면 다음 코드 배포와 불일치할 수 있다. 현재 프런트 Worker에 JWT 비밀 키·문자 공급자 키·DB 비밀번호는 필요하지 않다.

## 4. 로컬 확인

```bash
npm ci
npm run verify:workers
npm run preview:workers
```

`verify:workers`는 린트, 타입 검사, Next.js 및 기존 지도 compact 회귀 테스트, 실제 Next/OpenNext 빌드, workerd에서 SSR·멤버십 필터·canonical·404·메타데이터·사이트맵·CSS/JS 제공을 확인한다. 서버 API는 테스트가 띄우는 모의 서버로 대체한다. 기존 Node.js 런타임은 `npm run verify`로 검증한다.

브라우저 확인 주소는 `http://127.0.0.1:8787`이며 cmux 안에서 열어도 된다. 기본 SSR API 주소는 운영 API다. 로컬 API를 사용하려면 `.dev.vars.example`을 `.dev.vars`로 복사한다. 브라우저 API까지 로컬로 바꿀 때는 `.env.local`의 `NEXT_PUBLIC_APP_BASE_URL`도 설정한 뒤 다시 빌드한다.

업로드 없이 배포 번들을 검사하려면 다음 명령을 사용한다.

```bash
npx wrangler deploy --dry-run --outdir output/workers-dry-run
```

2026-09-19 로컬 검증 결과: gzip 약 1,484 KiB. Workers 로컬 SSR 검사, 기존 Node SSR 검사, 15개 테스트, cmux 화면 확인을 통과했다. 모의 응답을 이용한 브라우저 검증은 멤버십·계정 처리·모바일 화면·AI 비활성화 6개와 문자 인증 8개 시나리오를 통과했다. 실제 배포의 CPU 제한·지연, 운영 로그인/OAuth, 실제 문자 수신 성공을 입증하는 결과는 아니다.

## 5. 도메인 전환

처음에는 Workers 미리보기에서 화면·공개 데이터·정적 파일을 확인한다. 인증 검증에 사용할 도메인은 User API의 credential CORS 허용 목록과 Kakao 웹 도메인 설정을 확인해야 한다. `workers.dev` 미리보기는 현재 운영 도메인과 달라 쿠키 정책·OAuth 복귀 주소가 동일하게 동작한다고 볼 수 없다.

`itplace.click`을 유지하면 최종 브라우저 origin과 기존 API 주소를 유지할 수 있다. 동작 확인 뒤 기존 Pages의 도메인 연결을 해제하고 Worker의 Custom Domain으로 연결한다. 이 전환은 별도 운영 작업이며 이번 준비 작업에서 수행하지 않았다. 전환 전 Pages 연결과 마지막 정상 배포를 기록해두면 문제가 있을 때 원래 연결로 복구할 수 있다.

## 참고

- [Cloudflare Workers Builds 설정](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [OpenNext 시작 안내](https://opennext.js.org/cloudflare/get-started)
- [OpenNext 캐시 구성](https://opennext.js.org/cloudflare/caching)
- [Cloudflare Next.js 안내](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
