# 검색엔진 등록 가이드

ITPLACE 사용자 서비스(`https://itplace.click`)의 검색 노출을 위해 배포 후 아래 항목을 확인하고 검색엔진에 제출합니다.

## 배포 후 확인 URL

- `https://itplace.click/`
- `https://itplace.click/robots.txt`
- `https://itplace.click/sitemap.xml`

`robots.txt`와 `sitemap.xml`이 HTML이 아니라 각각 텍스트/XML로 응답해야 합니다.

## Google Search Console

1. Google Search Console에 `https://itplace.click` 속성을 추가합니다.
2. 권장 방식은 DNS TXT 레코드 인증입니다.
3. 인증 후 `색인 생성 > Sitemaps`에서 `https://itplace.click/sitemap.xml`을 제출합니다.
4. `URL 검사`에서 루트 URL과 주요 공개 페이지(`/main`, `/benefits`, `/event`)의 색인 생성을 요청합니다.

## 네이버 서치어드바이저

1. 네이버 서치어드바이저에 `https://itplace.click` 사이트를 등록합니다.
2. HTML 파일 업로드 또는 메타 태그 방식으로 소유권을 확인합니다.
3. `요청 > 사이트맵 제출`에서 `https://itplace.click/sitemap.xml`을 제출합니다.
4. `검증 > robots.txt`에서 크롤링 허용 여부를 확인합니다.

## 주요 검색 키워드

- 잇플레이스
- ITPLACE
- LG U+ 멤버십 혜택
- 유플러스 멤버십 혜택
- 멤버십 제휴처 검색
- 주변 혜택 지도
- VIP콕 혜택

## 운영 메모

검색 결과 상단 노출은 보장할 수 없습니다. 다만 sitemap 제출, 색인 요청, 실제 유입 키워드 분석, 콘텐츠 보강을 반복하면 검색엔진이 서비스를 이해하고 노출할 가능성이 높아집니다.
