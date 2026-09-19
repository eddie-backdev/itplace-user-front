# 검색엔진 운영 가이드

잇플레이스 사용자 서비스(`https://itplace.click`)의 검색 노출 기반과 배포 후 운영 절차를 정리합니다. 검색 결과의 순위는 검색엔진이 결정하므로 상단 노출을 보장할 수는 없지만, 아래 구조와 점검 절차를 유지하면 검색엔진이 브랜드·통신사·제휴처 페이지를 정확히 수집할 수 있습니다.

## 현재 검색 노출 구조

- 브랜드 홈: `/`
- 통신사 멤버십 통합: `/membership`
- 통신사별 랜딩: `/membership/skt`, `/membership/kt`, `/membership/lguplus`
- 전체 제휴처: `/benefits`
- 제휴처 상세: `/benefits/partners/{partnerId}/{partnerSlug}`
- 지도 탐색: `/map`

Next.js 서버는 공개 사용자 API에서 제휴처 목록과 실제 혜택 내용을 조회해 공개 페이지의 초기 HTML을 렌더링합니다. 공개 데이터는 `no-store`로 요청마다 조회하고 같은 서버 렌더링 요청 안에서만 중복 호출을 합칩니다. API가 일시적으로 응답하지 않으면 해당 요청은 오류 상태 UI로 복구됩니다.

- 제휴처 HTML에는 혜택명, 이용 채널, 등급별 조건, 이용 제한, 이용 방법이 포함됩니다.
- 같은 통신사 응답에 동일 `benefitId`가 중복되면 정보가 더 풍부한 항목으로 합칩니다.
- 잘못된 제휴처 slug는 canonical URL로 영구 이동합니다.
- 페이지 컴포넌트는 경로별로 분리해 첫 화면에서 불필요한 지도·혜택·로그인 코드를 받지 않습니다.
- `app/robots.ts`와 `app/sitemap.ts`가 배포 런타임에서 검색엔진용 문서를 생성합니다.

## 로컬 검증

```zsh
npm run verify:workers
```

빌드와 자동 테스트에는 아래 검증이 포함됩니다.

- 브랜드 홈 title, canonical, WebSite 구조화 데이터
- 통신사 랜딩 페이지별 고유 title과 서버 렌더링 본문
- 제휴처별 canonical URL, 실제 혜택 본문과 구조화 데이터
- 동일 `benefitId` 중복 제거
- App Router 엔트리와 Vite/React Router 제거 상태
- robots.txt의 sitemap 선언

새 제휴처나 혜택 변경은 다음 조회의 서버 렌더링 HTML과 sitemap에 반영됩니다. sitemap은 API 장애나 불완전 응답일 때만 저장소의 비상 카탈로그를 사용하며, 갱신 명령은 README를 참고합니다. 데이터 변경만으로 재배포나 캐시 무효화를 수행할 필요는 없습니다.

## 대표 도메인 통일

코드가 생성하는 canonical URL은 모두 `https://itplace.click`입니다. `www.itplace.click`을 apex 도메인으로 보내는 규칙은 최종 배포 플랫폼에서 한 번 설정해야 합니다. 아래는 Cloudflare를 선택할 경우의 예시입니다.

1. Cloudflare에서 **Bulk Redirects → Redirect Lists**로 이동합니다.
2. Source URL을 `https://www.itplace.click/`, Target URL을 `https://itplace.click/`로 입력합니다.
3. 상태 코드는 `301`, **Preserve query string**은 켭니다.
4. **Subpath matching**과 **Preserve path suffix**를 켜서 모든 하위 경로를 같은 경로로 보냅니다.
5. 규칙을 활성화한 뒤 아래 명령으로 확인합니다.

```zsh
curl -I https://www.itplace.click/membership
```

응답의 상태가 `301`이고 `location: https://itplace.click/membership`이면 정상입니다.

## 배포 후 확인 URL

- `https://itplace.click/`
- `https://itplace.click/membership`
- `https://itplace.click/membership/skt`
- `https://itplace.click/membership/kt`
- `https://itplace.click/membership/lguplus`
- `https://itplace.click/benefits`
- 대표 제휴처 상세 URL
- `https://itplace.click/robots.txt`
- `https://itplace.click/sitemap.xml`

각 HTML에서 title, description, canonical, H1이 페이지 내용과 일치하는지 확인합니다. `robots.txt`와 `sitemap.xml`은 HTML이 아니라 각각 텍스트와 XML로 응답해야 합니다.

## Google Search Console

1. `https://search.google.com/search-console`에서 `itplace.click` 도메인 속성을 추가합니다.
2. Cloudflare DNS에 Google이 제시한 TXT 값을 등록해 소유권을 확인합니다.
3. **색인 생성 → Sitemaps**에서 `https://itplace.click/sitemap.xml`을 제출합니다.
4. **URL 검사**에서 홈, `/membership`, 통신사별 랜딩, `/benefits`, 대표 제휴처 상세 페이지의 색인 생성을 요청합니다.
5. **실적 → 검색 결과**에서 `잇플레이스`, `ITPLACE`, `잇플`, `통신사 멤버십`, 통신사명과 제휴처명 조합의 노출수·클릭수·CTR·평균 게재순위를 확인합니다.

사이트맵 제출과 URL 검사 요청은 수집을 돕지만 색인 또는 순위를 보장하지 않습니다. 신규 페이지를 대량으로 하나씩 요청하기보다 sitemap을 기본 수집 경로로 사용하고 핵심 페이지 위주로 URL 검사를 사용합니다.

## 네이버 서치어드바이저

1. `https://searchadvisor.naver.com`에서 `https://itplace.click` 사이트를 등록합니다.
2. HTML 파일 업로드 또는 메타 태그 방식으로 소유권을 확인합니다.
3. **요청 → 사이트맵 제출**에서 `https://itplace.click/sitemap.xml`을 제출합니다.
4. **검증 → robots.txt**에서 공개 경로 수집이 허용되는지 확인합니다.
5. **리포트 → 콘텐츠 노출/사이트 진단**에서 수집 실패, 중복 title, 잘못된 canonical 여부를 주기적으로 확인합니다.

## 목표 검색어와 담당 페이지

| 검색 의도   | 대표 검색어                            | 담당 페이지   |
| ----------- | -------------------------------------- | ------------- |
| 브랜드      | 잇플레이스, ITPLACE, 잇플              | `/`           |
| 멤버십 통합 | 멤버십 혜택, 통신사 멤버십             | `/membership` |
| 통신사별    | SKT 멤버십, KT 멤버십, LG U+ 멤버십    | 통신사별 랜딩 |
| 제휴처별    | GS25 멤버십 혜택, 파파존스 통신사 할인 | 제휴처 상세   |
| 지역 탐색   | 주변 멤버십 혜택, 멤버십 혜택 지도     | `/map`        |

검색어를 모든 페이지에 반복하지 않습니다. 검색 의도별로 담당 URL을 분리하고, 페이지 title·H1·본문·내부 링크가 같은 주제를 가리키도록 유지합니다.

## 월간 운영 점검

1. Search Console과 네이버에서 수집 오류와 제외 URL을 확인합니다.
2. 브랜드 검색어의 노출수, 클릭수, CTR, 평균 순위를 지난달과 비교합니다.
3. 노출은 많지만 CTR이 낮은 페이지의 title과 description을 실제 검색 의도에 맞게 개선합니다.
4. 동일 제휴처가 여러 이름으로 분리되지 않았는지 관리자 데이터 품질 화면에서 확인합니다.
5. 신규 제휴처 또는 제휴처명 변경이 5분 재검증 이후 HTML과 sitemap에 반영됐는지 확인합니다.
