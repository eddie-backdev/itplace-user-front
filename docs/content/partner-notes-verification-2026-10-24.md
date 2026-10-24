# 제휴 해설 출처 확인 기록

2026-10-24에 기록된 공식 URL을 HTTP GET으로 다시 읽고 공개 HTML의 혜택 문구를 확인했습니다. 아래 7개 숨김 항목은 URL이 열렸고, 해설의 핵심 요율·한도·이용 조건이 공식 페이지 본문에서 확인되어 게시 검토 대상으로 전달합니다. 이는 출처 페이지를 확인한 날짜이며, 이후에도 정책은 바뀔 수 있습니다.

같은 날짜에 현재 사용자 API `https://userapi.itplace.click/api/v1/benefits/partners/{id}`의 각 ID도 조회해 `carrierGroups`를 대조했습니다. 아래에 적은 통신사가 각 ID의 실제 통신사 그룹에 포함되어 있습니다.

| ID | 현재 서비스 API carrierGroup | 공개 확인한 핵심 조건 | 공식 출처 |
| --- | --- | --- | --- |
| 287 공차·KT | KT 일치 (`/api/v1/benefits/partners/287`) | 제조 음료 10% 현장 할인, 일 1회·최대 2만 원, 멤버십 스탬프 제외·메뉴 교환권 중복 불가 | [공차 KT 멤버십](https://www.gong-cha.co.kr/brand/store/kt_membership?scroll=y) |
| 93 파리바게뜨·SKT | SKT 일치 (`/api/v1/benefits/partners/93`) | VIP·Gold 모바일 카드 천 원당 100원, 플라스틱 카드 천 원당 50원, 일 1회·카드별 할인 한도 및 일부 매장 제외 | [SKT 혜택](https://sktmembership.tworld.co.kr/mps/pc-bff/benefitbrand/detail.do?brandId=1053), [파리바게뜨 FAQ](https://www.paris.co.kr/cs/faq/page/2/) |
| 17 뚜레쥬르·SKT | SKT 일치 (`/api/v1/benefits/partners/17`) | VIP·Gold 천 원당 150원 할인 또는 150P 적립, 일 1회·최소 1천 원, 온라인 쇼핑몰 제외, 적립분은 다음 날 사용 가능 | [SKT 혜택](https://sktmembership.tworld.co.kr/mps/pc-bff/benefitbrand/detail.do?brandId=1084) |
| 291 CU·SKT | SKT 일치 (`/api/v1/benefits/partners/291`) | VIP·Gold 천 원당 100원 할인 또는 100P 적립, 행사 상품·주류·담배와 배달·픽업·예약 구매 제외, 일 최대 한도 | [SKT 혜택](https://sktmembership.tworld.co.kr/mps/pc-bff/benefitbrand/detail.do?brandId=146) |
| 108 CGV·SKT | SKT 일치 (`/api/v1/benefits/partners/108`) | VIP PICK 연 3회 무료·연 9회 1+1, 2D 일반 영화와 T 멤버십 앱 예매 조건, 월별 타 VIP PICK과 공유, 일반 관람권 할인도 별도 안내 | [SKT 혜택](https://sktmembership.tworld.co.kr/mps/pc-bff/benefitbrand/detail.do?brandId=973) |
| 30 배스킨라빈스·SKT | SKT 일치 (`/api/v1/benefits/partners/30`) | 싱글레귤러 한 개, VIP 50%·최대 2,150원 / Gold·Silver 30%·최대 1,290원, 월 1회, 현장·키오스크 이용 | [SKT 혜택](https://sktmembership.tworld.co.kr/mps/pc-bff/benefitbrand/detail.do?brandId=998) |
| 21 롯데시네마·KT | KT 일치 (`/api/v1/benefits/partners/21`) | 예매일 기준으로 혜택 월 결정, VVIP/VIP 초이스 통합 월 1회, KT 웹·앱 예매와 별도 취소 마감 | [KT 영화예매](https://showmovie.mobile.kt.com/default.aspx) |

공차는 서비스 API에서 KT가 `10% 현장 할인`으로, SKT는 별도의 할인형·적립형으로 제공되는 것을 확인해 KT 해설에서 적립 표현을 제거했습니다. 배스킨라빈스는 SKT 그룹에 `DISCOUNT`와 `POINT_ACCRUAL` 혜택이 각각 있고, 공식 페이지에도 둘 다 표시됩니다. 예시는 공식 페이지의 VIP 최대 할인액 2,150원에 맞췄습니다. 파리바게뜨 가이드 사례는 공식 요율에 지정된 VIP·Gold 모바일 카드와 정확히 10,000원 단위를 사용해 잔돈 처리 규칙을 가정하지 않도록 고쳤습니다. 모든 `checkedAt` 변경은 해당 공식 HTML을 다시 확인한 기록입니다.

## 반영과 검증 범위

- 위 7개 해설을 공개 목록에 추가했습니다. 기존 FLO·아웃백·GS25를 포함해 10개 해설이 해당 통신사를 선택했을 때 표시됩니다.
- 실제 운영 공개 API를 연결한 로컬 Workers 환경에서 지역 2곳의 연결 매장 40개, 해설 10개, 스몹 통신사·등급 조합 5개, 가이드 계산 예시 3개를 확인했습니다.
- 같은 환경에서 사이트맵의 혜택 상세 369개 모두 HTTP 200과 페이지 제목 영역 렌더링을 확인했습니다. 이는 페이지 접근·렌더링 검사이며 전체 혜택의 사실 검증을 의미하지 않습니다.
- 단위 테스트 110개, ESLint, 타입 검사, Next.js/OpenNext 빌드, production·Workers SSR 검증을 통과했습니다. SSR 검증에는 매장 상세 3개와 지역 페이지 회귀 검사가 포함됩니다.
- 화면은 데스크톱과 모바일에서 확인했습니다. 로컬 미리보기 주소에 대한 운영 API의 CORS 차단은 운영 도메인 배포 후 별도로 확인해야 합니다.

이 변경은 발견한 페이지 오류와 정보 전달 문제를 개선한 것입니다. Google이 과거 반려 원인으로 해당 문제를 지목한 것은 아니며, 승인 여부는 별도 심사 결과로 확인해야 합니다.
