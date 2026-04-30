import axiosInstance from '../../../apis/axiosInstance';

// API 응답 타입 정의
export interface TierBenefit {
  carrier?: string | null;
  grade: string;
  context: string;
  isAll: boolean;
}

export interface BenefitItem {
  benefitId: number;
  benefitName: string;
  mainCategory: 'VIP_COCK' | 'BASIC_BENEFIT';
  usageType: 'ONLINE' | 'OFFLINE';
  category: string;
  image: string;
  carrier?: string | null;
  tierBenefits: TierBenefit[];
  isFavorite: boolean;
  favoriteCount: number;
}

export interface BenefitResponse {
  content: BenefitItem[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

export interface BenefitApiParams {
  mainCategory: 'VIP_COCK' | 'BASIC_BENEFIT';
  page?: number;
  size?: number;
  keyword?: string;
  category?: string;
  filter?: 'ONLINE' | 'OFFLINE';
  sort?: string;
  carrier?: string;
}

// 즐겨찾기 요청 타입
export interface FavoriteRequest {
  benefitId: number;
}

// 즐겨찾기 삭제 요청 타입 (새로운 API 스펙)
export interface RemoveFavoritesRequest {
  benefitId: number;
}

// 혜택 상세 정보 타입
export interface BenefitDetailResponse {
  benefitId: number;
  benefitName: string;
  description: string;
  benefitLimit: string;
  manual: string;
  url: string;
  partnerName: string;
  carrier?: string | null;
  image: string;
  tierBenefits: TierBenefit[];
}

// 제휴처 검색 순위 관련 타입
export interface PartnerSearchRankingItem {
  partnerName: string;
  searchCount: number;
  rank: number;
  previousRank: number;
  rankChange: number;
  changeDerection: 'UP' | 'DOWN' | 'SAME' | 'NEW';
}

export interface PartnerSearchRankingResponse {
  data: PartnerSearchRankingItem[];
}

// API 응답 타입
export interface ApiResponse<T = unknown> {
  code: string;
  status: string;
  message: string;
  data: T;
  timestamp: string;
}

// 혜택 목록 조회 API
export const getBenefits = async (params: BenefitApiParams): Promise<BenefitResponse> => {
  // 기본값 설정
  const queryParams = {
    mainCategory: params.mainCategory,
    page: params.page ?? 0,
    size: params.size ?? 12,
    sort: params.sort ?? 'POPULARITY',
    ...(params.category && { category: params.category }),
    ...(params.filter && { filter: params.filter }),
    ...(params.keyword && { keyword: params.keyword }),
    ...(params.carrier && { carrier: params.carrier }),
  };

  const response = await axiosInstance.get('/api/v1/benefits', { params: queryParams });
  return response.data.data;
};

// 즐겨찾기 추가 API
export const addFavorite = async (benefitId: number): Promise<void> => {
  const requestBody: FavoriteRequest = { benefitId };
  await axiosInstance.post('/api/v1/favorites', requestBody);
};

// 즐겨찾기 삭제 API
export const removeFavorite = async (benefitId: number): Promise<void> => {
  const requestBody = { benefitIds: [benefitId] };
  await axiosInstance.delete('/api/v1/favorites', {
    data: requestBody,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// 혜택 상세 조회 API
export const getBenefitDetail = async (benefitId: number): Promise<BenefitDetailResponse> => {
  const response = await axiosInstance.get(`/api/v1/benefits/${benefitId}`);
  return response.data.data;
};

// 제휴처 검색 순위 조회 API
export const getPartnersSearchRanking = async (
  recentDay: number = 2,
  prevDay: number = 3
): Promise<ApiResponse<PartnerSearchRankingItem[]>> => {
  const params = new URLSearchParams({
    recentDay: recentDay.toString(),
    prevDay: prevDay.toString(),
  });

  const response = await axiosInstance.get(`/api/v1/partners/search-ranking?${params}`);
  return response.data;
};
