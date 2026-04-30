// 즐겨찾기 목록 아이템
export interface FavoriteItem {
  benefitId: number;
  benefitName: string;
  partnerName: string;
  partnerImage: string;
}

// 목록 조회 응답
export interface FavoritesListResponse {
  code: string;
  status: string;
  message: string;
  data: {
    content: FavoriteItem[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
  };
  timestamp: string;
}

// 상세 조회 응답
export interface TierInfo {
  carrier?: string | null;
  grade: string;
  isAll: boolean;
  context: string;
  discountValue: number;
}

export interface FavoriteDetail {
  benefitId: number;
  benefitName: string;
  benefitDescription: string;
  benefitLimit: string;
  partnerName: string;
  partnerImage: string;
  tiers: TierInfo[];
}

export interface FavoriteDetailResponse {
  code: string;
  status: string;
  message: string;
  data: FavoriteDetail;
  timestamp: string;
}

// 검색 응답
export interface FavoriteSearchItem {
  benefitId: number;
  benefitName: string;
  partnerName: string;
  partnerImage: string;
}

export interface FavoriteSearchResponse {
  code: string;
  status: string;
  message: string;
  data: FavoriteSearchItem[];
  timestamp: string;
}
