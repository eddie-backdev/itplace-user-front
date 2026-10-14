# 웹 지도 검색·주변 응답의 공통 혜택 분리 및 지도 페이지 조회

2026-09-11 기준. 모바일 앱은 이번 변경과 검증 대상에서 제외한다.

키워드 검색과 기존 호출자는 아래 compact 경로 및 404/405 호환 동작을 유지한다. 지도 주변·viewport 핀은 전체 결과가 필요한 paged compact API를 사용한다.

| 용도                 | 경로                                                 |
| -------------------- | ---------------------------------------------------- |
| 주변                 | `/api/v1/maps/nearby/previews/compact`               |
| 카테고리 주변        | `/api/v1/maps/nearby/category/previews/compact`      |
| 키워드 검색          | `/api/v1/maps/nearby/search/previews/compact`        |
| 주변 페이지          | `/api/v1/maps/nearby/previews/compact/page`          |
| 카테고리 주변 페이지 | `/api/v1/maps/nearby/category/previews/compact/page` |
| viewport 페이지      | `/api/v1/maps/stores/in-view/previews/compact/page`  |

기존 compact 응답 envelope의 `data`는 `{ stores, partners }`이다. 페이지 응답은 여기에 `hasMore`, `nextCursor`를 더한다. 제휴처 이름·카테고리·이미지·공통 `tierBenefit`은 제휴처별 한 번 전달한다. 매장은 `partnerId`로 연결하고, 기존 지점 정보에 `roadName`, 서버 계산 `distance`가 포함될 수 있다. 매장별 `tierBenefit`이 있으면 제휴처 혜택보다 우선한다. 빈 배열 `[]` 역시 명시적인 매장 override이고, 필드가 없으면 제휴처 혜택을 사용한다.

API 함수 내부에서 공통 변환 함수로 기존 `MapStorePreviewApiResponse`를 복원하므로 hook·카드·상세 진입 계약은 유지한다. 서버가 준 매장 순서(키워드 브랜드 우선순위 포함), ID, 거리 `0`, 매장별 혜택을 보존한다. 기존 viewport compact 경로만 사용자 좌표로 거리를 계산하고 거리순으로 정렬한다. 새 검색 경로에서 거리로 재정렬하지 않는다.

페이지 API는 요청당 `pageSize=300`으로 순차 호출하고 `afterStoreId` 커서를 전달한다. 응답의 `hasMore`와 `nextCursor`를 검증하며, 다음 페이지가 있으면 안전한 정수 커서가 마지막 매장의 ID와 일치하고 이전 커서보다 커야 한다. 마지막 페이지의 커서는 `null`이어야 한다. 잘못된 커서, 형식 오류, 페이지 오류, 취소가 있으면 일부 응답을 반환하지 않는다. 각 페이지의 제휴처 사전으로 해당 페이지 매장을 먼저 확장한 뒤 `storeId`로 중복을 제거한다. 전체 합친 주변·viewport 목록은 거리순으로 정렬한다. 이 요청에는 임의의 전체 페이지/매장 상한이 없다.

일반 지도 이동은 레벨 1~4에서 viewport 상세 페이지를 받고 레벨 5 이상에는 서버 클러스터를 요청한다. 상세 viewport는 실제 화면 bounds 사방에 20% 여유를 붙인다. 완전한 페이지 연쇄가 성공하면 결과가 300개 이상이어도 확장 영역을 최대 30초간 재사용한다. 페이지 중 하나라도 실패하면 coverage를 저장하지 않으며 기존 300개 응답으로 fallback하지 않는다. 카테고리, bounds, zoom 변경과 unmount는 페이지 연쇄 전체를 취소하고, 초기 주변 로드도 오래된 응답이 새 지도 결과를 덮지 않도록 요청 순서를 확인한다.

기존 `getStorePreviewList`, `getStorePreviewListByCategory`, `getCompactStorePreviewsInView` 및 키워드 검색 경로는 다른 호출자 호환용으로 유지한다. 키워드 경로는 서버 순서를 그대로 보존한다.
