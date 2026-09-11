# 웹 지도 검색·주변 응답의 공통 혜택 분리

2026-09-11 기준. 모바일 앱은 이번 변경과 검증 대상에서 제외한다.

웹의 `getStorePreviewList`, `getStorePreviewListByCategory`, `searchStorePreviews`가 아래 compact 경로를 사용한다. 기존 쿼리 파라미터와 `AbortSignal`을 유지한다.

| 용도 | 경로 |
| --- | --- |
| 주변 | `/api/v1/maps/nearby/previews/compact` |
| 카테고리 주변 | `/api/v1/maps/nearby/category/previews/compact` |
| 키워드 검색 | `/api/v1/maps/nearby/search/previews/compact` |

응답 envelope는 동일하며 `data`는 `{ stores, partners }`이다. 제휴처 이름·카테고리·이미지·공통 `tierBenefit`은 제휴처별 한 번 전달한다. 매장은 `partnerId`로 연결하고, 기존 지점 정보에 `roadName`, 서버 계산 `distance`가 포함될 수 있다. 매장별 `tierBenefit`이 있으면 제휴처 혜택보다 우선한다. 빈 배열 `[]` 역시 명시적인 매장 override이고, 필드가 없으면 제휴처 혜택을 사용한다.

API 함수 내부에서 공통 변환 함수로 기존 `MapStorePreviewApiResponse`를 복원하므로 hook·카드·상세 진입 계약은 유지한다. 서버가 준 매장 순서(키워드 브랜드 우선순위 포함), ID, 거리 `0`, 매장별 혜택을 보존한다. 기존 viewport compact 경로만 사용자 좌표로 거리를 계산하고 거리순으로 정렬한다. 새 검색 경로에서 거리로 재정렬하지 않는다.

서버와 프론트의 배포 순서가 다를 수 있으므로 compact 경로가 HTTP 404 또는 405일 때만 기존 경로를 요청한다. 500·인증 오류·네트워크 실패·취소는 재시도하지 않는다. 기존 API 경로는 백엔드 호환 용도로 유지한다.

일반 지도 이동은 `useStoreData.ts`에서 레벨 1~4에 viewport 상세 최대 300개를 요청하고, 레벨 5 이상에는 서버 클러스터를 요청한다. 따라서 화면의 상세 마커 최대 300개와 DB 반경 검색 후보가 300개 이하라는 주장은 다르다. 주변 조회는 초기 로드·명시적 주변 검색·viewport 요청 실패 시 fallback 등에 여전히 쓰인다. 이번 변경은 주변 표본 추출 정책이나 검색 우선순위를 바꾸지 않는다.

상세 viewport는 실제 화면 bounds의 사방에 20% 여유를 붙여 요청한다. 응답이 요청 `limit` 미만이면 기존처럼 이 확장 영역을 최대 30초간 재사용한다. 응답이 `limit`에 도달하면 전체 결과인지 판단할 수 없으므로 coverage를 저장하지 않고, 다음 viewport 조회 때 다시 요청한다. 300개 응답이 반드시 잘렸다는 뜻은 아니다. 정확히 300개인 경우도 보수적으로 재조회하며, 첫 응답에서 생길 수 있는 결과 제한 자체를 제거하는 변경은 아니다. 이 판단은 서버가 최종 매장 적격 조건을 적용한 뒤 LIMIT을 적용하는 현재 계약을 전제로 한다. 레벨별 limit과 API 경로는 유지한다.

검증: `node --test scripts/map-preview-compact.test.mjs`로 실제 TypeScript 변환과 API 함수를 실행한다. 순서·ID·거리 0·roadName·빈 override·중복 제휴처·빈 응답·viewport 정렬 유지, 세 경로의 파라미터와 signal, 404/405 한정 fallback을 확인한다. 저장소 검증은 `npx eslint . --config eslint.config.js` 및 `npm run build`이다. 응답 바이트·서버 성능의 개선율은 백엔드에서 동일 입력의 구·신 응답을 별도로 측정한다.

같은 검증에서 실제 `useStoreData` hook의 연속 viewport 콜백을 실행해 0/299개 응답은 내부 영역 확대 시 재사용하고, 300개 응답은 재조회하는지 확인한다. React의 렌더 수명주기는 작은 stub으로 대체하고 mount effect를 생략하므로 이 회귀 검증은 브라우저 지도 SDK 검증과 별개다.

실제 React 페이지의 초기 주변 조회와 키워드 검색을 Playwright에서 검증용 API 응답으로 확인했다. 공통/개별 혜택, 빈 override의 `혜택 확인하기`, 서버 거리 `0m`, 먼 브랜드 우선 매장이 가까운 매장보다 먼저 표시되는 순서가 유지됐다. 스크린샷은 `output/playwright/compact-nearby-fixture.png`, `compact-keyword-fixture.png`이며 검증용 응답임을 표시했다. 이 확인은 실제 API 성능 검증이 아니며, 브라우저에서 Kakao 지도 타일이 로드되지 않아 SDK/마커의 실환경 검증은 포함하지 않는다.
