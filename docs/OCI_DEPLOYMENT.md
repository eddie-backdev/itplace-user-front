# OCI 배포

GitHub Actions가 Next.js standalone 빌드를 검증하고 ARM64 이미지를 GHCR에 올린 뒤 기존 OCI 서버에 배포한다. Cloudflare Workers 설정은 롤백을 위해 유지한다. 사용자 웹은 `itplace.click`, `www.itplace.click`으로 제공하며 `userapi.itplace.click` 등 API 도메인과 기존 API upstream은 그대로 둔다.

## 서버 준비와 최초 전환

배포 SSH 계정이 Docker를 실행하고 `/home/ubuntu/app` 아래에 쓸 수 있어야 한다. 먼저 `/home/ubuntu/app/env/userfront.env`를 `infra/oci/userfront.env.example`에서 만들고 필요한 런타임 환경값을 설정한다. `app-network`와 `nginx-proxy`는 기존 구성을 사용한다.

최초 배포 전에는 nginx 설정을 변경하지 않는다. GitHub Actions의 수동 실행으로 이미지를 배포하면 스크립트가 `userfront-blue`를 시작하고 검사한 뒤 `/home/ubuntu/app/nginx/conf.d/userfront-upstream.conf`를 생성한다. 기존 nginx 설정이 이 파일을 아직 include하지 않아도 된다. 이 첫 실행은 nginx 설정을 검사하고 reload해도 기존 라우팅을 유지한다.

첫 배포가 성공한 다음 `infra/oci/userfront-site.conf`를 `/home/ubuntu/app/nginx/conf.d/userfront-site.conf`에 한 번 설치한다. 그 다음 nginx `http` 설정에 아래 두 파일을 명시적으로 include하고 `nginx -t` 후 reload한다. 사이트 설정은 초기 구성에서만 설치하며 CI 배포가 덮어쓰지 않는다.

```nginx
include /home/ubuntu/app/nginx/conf.d/userfront-upstream.conf;
include /home/ubuntu/app/nginx/conf.d/userfront-site.conf;
```

이 파일은 기존 TLS 경로(`/etc/ssl/certs/itplace.pem`, `/etc/ssl/private/itplace.key`)를 사용하고 두 웹 호스트를 `userfront_active`에 proxy한다. `X-ITPLACE-Origin: oci` 응답 헤더로 OCI 라우팅을 확인할 수 있다. 기존 API upstream include와 TLS 설정은 유지한다.

Workflow는 `scripts/deploy-userfront.sh`와 upstream 템플릿도 매번 서버에 복사한다. 배포 스크립트는 `/home/ubuntu/app/env/userfront.env`, `/home/ubuntu/app/nginx/conf.d/userfront-upstream.conf`, `/home/ubuntu/app/userfront-static`을 기본 경로로 사용한다.

## GitHub 설정

Actions secrets로 `OCI_HOST`, `OCI_USER`, `OCI_SSH_KEY`, 검증된 known-hosts 항목인 `OCI_KNOWN_HOSTS`를 등록한다. SSH 호스트 키는 신뢰된 경로에서 확인한 값을 사용한다. SSH 사용자는 Docker 실행, `/home/ubuntu/app/scripts`, `/home/ubuntu/app/nginx/conf.d` 쓰기 권한이 필요하다. Workflow는 GITHUB_TOKEN으로 원격 GHCR 로그인을 하며, 토큰은 SSH stdin으로만 보내고 임시 Docker 설정 디렉터리를 종료 시 삭제한다. GHCR 패키지에서 해당 저장소 Workflow의 토큰이 패키지를 읽도록 허용한다.

공개 빌드 변수는 Actions Variables에 설정한다. `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`는 필수다. `NEXT_PUBLIC_APP_BASE_URL` 기본값은 `https://userapi.itplace.click/`, `NEXT_PUBLIC_KAKAO_REDIRECT_URI`는 `https://userapi.itplace.click/oauth2/authorization/kakao`, `NEXT_PUBLIC_CONTACT_EMAIL`은 `noreply.itplace@gmail.com`, `NEXT_PUBLIC_BENEFIT_CHAT_ENABLED`는 `true`다. Kakao 로그인의 기존 Spring Security 시작 경로가 `/oauth2/authorization/kakao`이므로 이 값을 사용한다. 값은 이미지 빌드 시 포함되며 `NEXT_DEPLOYMENT_ID`는 커밋 SHA로 지정한다.

## 배포와 복구

`main` 푸시는 lint, typecheck, 테스트, Next 빌드, standalone production 검증 및 배포 스크립트 mock 테스트를 통과한 뒤 진행된다. 배포 job은 GitHub의 native ARM64 runner에서 이미지를 빌드하고 GitHub Actions 캐시를 사용한다.

배포 스크립트는 직렬화 잠금을 잡고 새 이미지의 정적 청크를 공유 디렉터리에 누적한다. 새 컨테이너에는 이 디렉터리를 `/app/.next/static`으로 읽기 전용 연결해, 배포 전에 열린 페이지가 이전 해시 청크를 계속 받을 수 있게 한다. 새 슬롯은 사설 Docker 네트워크에서 1GiB 메모리 제한으로 구동한다. `/login`, `/`, 정적 asset 응답을 검사한 뒤 upstream을 바꾸고 nginx 설정 검사와 reload를 수행한다. 검사 실패 시 현재 트래픽은 유지된다. nginx 실패 시 upstream을 되돌린다. 성공 뒤 이전 컨테이너는 수동 복구를 위해 남겨 둔다.

복구할 때는 upstream 파일의 `userfront-blue` 또는 `userfront-green`을 이전 슬롯으로 바꾸고 `docker exec nginx-proxy nginx -t`, `docker exec nginx-proxy nginx -s reload`를 실행한다. 기존 Worker의 정적 청크도 첫 전환 전에 공유 디렉터리에 복사하면, 전환 중 열려 있던 Workers 페이지의 청크 요청도 유지할 수 있다.

배포 로직 검사는 `bash scripts/deploy-userfront.test.sh`로 실행한다. mock Docker 명령으로 health check, 이미지 pull, asset copy, nginx validation/reload 실패, 롤백 및 슬롯 보존을 확인하며 OCI/GHCR에는 연결하지 않는다.
