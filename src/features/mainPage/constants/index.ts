export const DEFAULT_RADIUS = 1000; // 기본 반경 1km

// 카테고리 정의
export const CATEGORIES = [
  { id: '전체', name: '전체' },
  { id: '엑티비티', name: '여가/체험' },
  { id: '뷰티/건강', name: '뷰티·건강' },
  { id: '쇼핑', name: '쇼핑' },
  { id: '생활/편의', name: '생활·편의' },
  { id: '푸드', name: '음식·카페' },
  { id: '문화/여가', name: '문화·여가' },
  { id: '교육', name: '교육' },
  { id: '여행/교통', name: '여행·교통' },
];

// 즐겨찾기 API 설정
export const FAVORITES_PAGE_SIZE = 150;
export const FAVORITES_DEFAULT_PAGE = 0;

// 레이아웃 크기 상수
export const LAYOUT = {
  SIDEBAR_WIDTH: 370,
  SIDEBAR_MIN_WIDTH: 300,
  MAP_MIN_WIDTH: 800,
  CATEGORY_TAB_HEIGHT: 48, // 기본 높이
  CATEGORY_TAB_HEIGHT_COMPACT: 40, // 사이드바용 높이
} as const;
