# OCI 배포

GitHub Actions가 Next.js standalone 빌드를 검증하고 ARM64 이미지를 GHCR에 올린 뒤 기존 OCI 서버에 배포한다. Cloudflare Workers 설정은 롤백을 위해 유지한다. 사용자 웹은 `itplace.click`, `www.itplace.click`으로 제공하며 `userapi.itplace.click` 등 API 도메인과 기존 API upstream은 그대로 둔다.

## 서버 준비와 최초 전환

배포 SSH 계정이 Docker를 실행하고 `/home/ubuntu/app` 아래에 쓸 수 있어야 한다. 먼저 `/home/ubuntu/app/env/userfront.env`를 `infra/oci/userfront.env.example`에서 만들고 필요한 런타임 환경값을 설정한다. `app-network`와 `nginx-proxy`는 기존 구성을 사용한다.

최초 배포 전에는 nginx 설정을 변경하지 않는다. GitHub Actions의 수동 실행으로 이미지를 배포하면 스크립트가 `userfront-blue`를 시작하고 검사한 뒤 `/home/ubuntu/app/nginx/conf.d/userfront-upstream.conf`를 생성한다. 기존 nginx 설정이 이 파일을 아직 include하지 않아도 된다. 이 첫 실행은 nginx 설정을 검사하고 reload해도 기존 라우팅을 유지한다.

첫 배포가 성공한 다음 `infra/oci/userfront-site.conf`를 호스트의 `/home/ubuntu/app/nginx/conf.d/userfront-site.conf`에 설치한다. GitHub Actions workflow는 배포 스크립트와 `userfront-upstream.conf.template`만 서버로 복사하며 `userfront-site.conf`는 자동 배포하거나 갱신하지 않는다. 도메인 라우팅을 바꾸면 운영자가 기존 파일을 먼저 백업한 뒤 같은 경로의 파일을 in-place로 갱신하고 nginx를 검사·reload해야 한다.

Docker nginx 안에서는 아래처럼 컨테이너 경로를 `/etc/nginx/conf.d`로 지정해 `http` 설정에 두 파일을 명시적으로 include한다. nginx의 `/etc/nginx/nginx.conf`는 호스트 `/home/ubuntu/app/nginx/nginx.conf`를 read-only 파일 bind mount한 것이므로 그 파일을 직접 수정한다. 이 파일과 site 설정 파일은 rename하거나 atomic replace하지 않는다.

```nginx
include /etc/nginx/conf.d/userfront-upstream.conf;
include /etc/nginx/conf.d/userfront-site.conf;
```

site 설정 적용 절차는 다음과 같다.

1. 서버의 `/home/ubuntu/app/nginx/conf.d/userfront-site.conf`를 권한과 시간을 보존해 별도 백업 파일로 복사한다.
2. 저장소의 `infra/oci/userfront-site.conf` 내용을 서버의 기존 site 설정 파일에 in-place로 적용한다. 임시 파일을 기존 경로로 rename하지 않는다.
3. `docker exec nginx-proxy nginx -t`가 성공하는지 확인한 다음 `docker exec nginx-proxy nginx -s reload`를 실행한다.
4. HTTP apex와 www, HTTPS www에서 모두 `https://itplace.click`로 path와 query string을 보존해 리디렉션되는지 확인하고, apex HTTPS가 정상적으로 서비스되는지 확인한다.
5. 검사 또는 reload가 실패하면 백업 내용을 기존 파일에 in-place로 복원하고 `nginx -t`와 reload를 다시 확인한다.

이 파일은 기존 TLS 경로(`/etc/ssl/certs/itplace.pem`, `/etc/ssl/private/itplace.key`)를 사용한다. HTTP apex/www는 apex HTTPS로 이동하고, HTTPS www 전용 server도 같은 인증서를 사용해 apex HTTPS로 이동한다. apex HTTPS는 `userfront_active`에 proxy한다. `X-ITPLACE-Origin: oci` 응답 헤더로 OCI 라우팅을 확인할 수 있다. 기존 API upstream include와 TLS 설정은 유지한다.

## Cloudflare 전환과 롤백

OCI 웹 라우팅과 TLS를 먼저 확인하고, Cloudflare SSL/TLS 모드를 **Full (strict)**로 설정한다. 전환 시 기존 Workers의 `itplace.click` 및 `www.itplace.click` custom domain binding을 제거한 다음 두 호스트의 proxied A 레코드를 `134.185.107.168`로 지정한다. `userapi.itplace.click`, `adminapi.itplace.click` 및 다른 API 레코드는 변경하지 않는다. 기존 Worker와 설정은 삭제하지 않고 빌드만 비활성화해 둔다.

OCI에 문제가 생기면 apex/www A 레코드를 제거하고 기존 Workers의 두 custom domain binding을 복구한다. 기존 Worker를 유지했으므로 롤백 시 새 Worker를 만들 필요가 없다. API 레코드는 계속 그대로 유지한다.

## 운영 전환 기록 (2026-10-25 KST)

전환은 [GitHub Actions run 40112216562](https://github.com/eddie-backdev/itplace-user-front/actions/runs/40112216562)에서 빌드와 배포가 성공한 뒤 완료했다. 전환 당시 OCI `userfront-blue`가 GHCR의 전체 SHA 태그 `ghcr.io/eddie-backdev/itplace-user-front:1c665e6ff9e696389feee6b09187754e16f4eb97`으로 실행 중이었고 health check는 정상이었다. 이 초기 배포 기록은 전체 SHA를 그대로 둔다. 후속 배포부터 GHCR에서 7자리 SHA를 pull한 뒤 로컬 이미지 이름 `itplace-user-front:<7자리 SHA>`로 실행한다. Cloudflare proxied apex/www A 레코드는 `134.185.107.168`을 가리키고 기존 Worker custom domain binding은 제거했으며 Worker 자체는 롤백용으로 보존했다. 기존 `userapi` 및 `adminapi` 백엔드 호스트와 프런트엔드 API 연결은 유지했다.

검증에서 origin 및 Cloudflare edge를 통해 10개 경로(9개 200, 임의 경로 404), `www` 응답, 정적 asset 39개(이전 배포 asset 34개 포함)를 확인했다. 지도에서 400개 매장과 검색·상세 화면도 확인했고 브라우저 오류는 없었다. Kakao 버튼이 `accounts.kakao.com` 로그인 화면까지 이동하는 것은 확인했지만, 계정 자격 증명을 입력하거나 실제 로그인 완료 흐름은 검증하지 않았다.

Workflow는 `scripts/deploy-userfront.sh`와 upstream 템플릿도 매번 서버에 복사한다. 배포 스크립트는 `/home/ubuntu/app/env/userfront.env`, `/home/ubuntu/app/nginx/conf.d/userfront-upstream.conf`, `/home/ubuntu/app/userfront-static`을 기본 경로로 사용한다.

## GitHub 설정

Actions secrets로 `OCI_HOST`, `OCI_USER`, `OCI_SSH_KEY`, 검증된 known-hosts 항목인 `OCI_KNOWN_HOSTS`를 등록한다. SSH 호스트 키는 신뢰된 경로에서 확인한 값을 사용한다. SSH 사용자는 Docker 실행, `/home/ubuntu/app/scripts`, `/home/ubuntu/app/nginx/conf.d` 쓰기 권한이 필요하다. Workflow는 GITHUB_TOKEN으로 원격 GHCR 로그인을 하며, 토큰은 SSH stdin으로만 보내고 임시 Docker 설정 디렉터리를 종료 시 삭제한다. GHCR 패키지에서 해당 저장소 Workflow의 토큰이 패키지를 읽도록 허용한다.

공개 빌드 변수는 Actions Variables에 설정한다. `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`는 필수다. `NEXT_PUBLIC_APP_BASE_URL` 기본값은 `https://userapi.itplace.click/`, `NEXT_PUBLIC_KAKAO_REDIRECT_URI`는 `https://userapi.itplace.click/oauth2/authorization/kakao`, `NEXT_PUBLIC_CONTACT_EMAIL`은 `noreply.itplace@gmail.com`, `NEXT_PUBLIC_BENEFIT_CHAT_ENABLED`는 `true`다. Kakao 로그인의 기존 Spring Security 시작 경로가 `/oauth2/authorization/kakao`이므로 이 값을 사용한다. GA4를 사용할 때는 Actions Variables에 `NEXT_PUBLIC_GA_MEASUREMENT_ID`를 `G-...` 형식의 measurement ID로 설정한다. 이 ID는 브라우저에 공개되는 설정값이며 비밀키로 취급하지 않는다. GA4는 운영 호스트에서만 수집하고, ID가 비어 있으면 로컬 개발 및 분석 없는 빌드가 유효하다. 값은 이미지 빌드 시 포함되므로 변경 후 재빌드·재배포해야 하며, `NEXT_DEPLOYMENT_ID`는 커밋 SHA로 지정한다.

GA4 스크립트는 production root layout에서 한 번만 연결한다. 페이지뷰는 앱의 pathname 변경을 직접 보내며 query string과 hash는 경로에 포함하지 않는다. GA4 Enhanced measurement의 page-history 변경 추적은 꺼서 수동 페이지뷰와 중복 집계되지 않게 한다. Google signals와 광고 개인화도 사용하지 않는다.

## 배포와 복구

`main` 푸시는 lint, typecheck, 테스트, Next 빌드, standalone production 검증 및 배포 스크립트 mock 테스트를 통과한 뒤 진행된다. 배포 job은 GitHub의 native ARM64 runner에서 이미지를 빌드하고 GitHub Actions 캐시를 사용한다.

배포 job은 커밋의 앞 7자리 SHA를 GHCR 이미지 태그로 사용한다. 서버는 `ghcr.io/eddie-backdev/itplace-user-front:<7자리 SHA>`를 pull하고 로컬 이름 `itplace-user-front:<7자리 SHA>`로 tag한 뒤, 정적 asset 추출과 실행 모두 로컬 이름을 사용한다. `NEXT_DEPLOYMENT_ID`에는 전체 SHA를 계속 사용한다. 배포 스크립트는 직렬화 잠금을 잡고 새 이미지의 정적 청크를 공유 디렉터리에 누적한다. 새 컨테이너에는 이 디렉터리를 `/app/.next/static`으로 읽기 전용 연결해, 배포 전에 열린 페이지가 이전 해시 청크를 계속 받을 수 있게 한다. 새 슬롯은 사설 Docker 네트워크에서 1GiB 메모리 제한으로 구동한다. `/login`, `/`, 정적 asset 응답을 검사한 뒤 upstream을 바꾸고 nginx 설정 검사와 reload를 수행한다. 검사 실패 시 현재 트래픽과 기존 컨테이너는 유지된다. nginx 실패 시 upstream을 되돌린다. 전환이 성공하면 이전 런타임 컨테이너를 삭제해 서비스 컨테이너 하나만 남긴다. 로컬과 GHCR 이미지는 유지해 이전 버전 재배포에 사용한다.

컨테이너는 성공 배포 뒤 삭제되므로 upstream을 이전 슬롯으로 직접 바꾸지 않는다. 복구할 버전의 7자리 SHA를 지정해 동일한 GHCR 인증 절차로 `scripts/deploy-userfront.sh <short-sha> <ghcr-username>`을 다시 실행한다. 일반 CI 배포와 같이 GHCR 토큰은 SSH stdin으로 전달한다. 이전 이미지가 새 슬롯에 기동되고 health check를 통과하면 upstream이 전환된다. 기존 Worker의 정적 청크도 첫 전환 전에 공유 디렉터리에 복사하면, 전환 중 열려 있던 Workers 페이지의 청크 요청도 유지할 수 있다.

배포 로직 검사는 `bash scripts/deploy-userfront.test.sh`로 실행한다. mock Docker 명령으로 health check, 이미지 pull, asset copy, nginx validation/reload 실패, 롤백 및 슬롯 보존을 확인하며 OCI/GHCR에는 연결하지 않는다.
