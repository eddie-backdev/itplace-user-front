// 지점 목록 API 타입 정의

export interface StoreApiResponse {
  code: string;
  status: string;
  message: string;
  data: StoreData[];
}

export interface MapStorePreviewApiResponse {
  code: string;
  status: string;
  message: string;
  data: MapStorePreviewData[];
}

export interface MapStoreClusterApiResponse {
  code: string;
  status: string;
  message: string;
  data: MapStoreClusterData[];
}

export interface MapStoreClusterData {
  clusterId: string;
  category: string;
  latitude: number;
  longitude: number;
  count: number;
}

export interface MapStorePreviewData {
  storeId: number;
  partnerId: number;
  storeName: string;
  partnerName: string;
  category: string;
  image?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  roadName?: string | null;
  roadAddress?: string | null;
  postCode?: string | null;
  hasCoupon: boolean;
  tierBenefit: TierBenefit[];
  distance: number;
  carrier?: string | null;
}

export interface StoreData {
  carrier?: string | null;
  store: Store;
  partner: Partner;
  tierBenefit: TierBenefit[];
  distance: number;
}

export interface Store {
  storeId: number;
  storeName: string;
  business: string;
  city: string;
  town: string;
  legalDong: string;
  address: string;
  roadName: string;
  roadAddress: string;
  postCode: string;
  latitude: number;
  longitude: number;
  hasCoupon: boolean;
}

export interface Partner {
  partnerId: number;
  partnerName: string;
  image: string;
  category: string;
}

export interface TierBenefit {
  benefitId?: number | string | null;
  carrier?: string | null;
  grade: string;
  context: string;
  onlineContext?: string | null;
  offlineContext?: string | null;
}

// 상세 혜택 API 타입 정의
export interface BenefitDetailRequest {
  storeId: number;
  partnerId: number;
  mainCategory?: 'VIP_COCK' | 'BASIC_BENEFIT' | null;
  carrier?: string | null;
}

export interface BenefitDetailResponse {
  code: string;
  status: string;
  message: string;
  timestamp: string;
  data: BenefitDetailData;
}

export interface BenefitDetailData {
  benefitId: string;
  benefitName: string;
  image?: string | null;
  mainCategory: string;
  manual: string;
  url: string;
  carrier?: string | null;
  tierBenefits: DetailTierBenefit[];
  isFavorite: boolean;
}

export interface DetailTierBenefit {
  carrier?: string | null;
  grade: string;
  context: string;
  onlineContext?: string | null;
  offlineContext?: string | null;
  isAll: boolean;
}

// 좌표→주소 변환 API 타입
export interface ReverseGeocodeApiResponse {
  code: string;
  status: string;
  message: string;
  data: {
    addressName: string;
  };
  timestamp: string;
}

// API 파라미터 타입
export interface StoreListParams {
  lat: number;
  lng: number;
  radiusMeters: number;
}

export interface StoreClusterInViewParams {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  category?: string;
  mapLevel: number;
}

export interface StoreInViewParams {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  category?: string;
  userLat?: number;
  userLng?: number;
  limit?: number;
  includeBenefits?: boolean;
}

// 즐겨찾기 API 타입
export interface FavoriteRequest {
  benefitId: number;
}

export interface FavoriteResponse {
  code: string;
  status: string;
  message: string;
  data: null;
  timestamp: string;
}

// 검색 API 타입
export interface SearchStoresParams {
  lat: number;
  lng: number;
  category?: string;
  keyword: string;
}

// 즐겨찾기 목록 조회 API 타입
export interface FavoritesListRequest {
  category?: string;
}

export interface FavoriteBenefit {
  benefitId: number;
  benefitName: string;
  partnerName: string;
  partnerImage: string;
}

// 맞춤 AI 추천 API 타입
export interface PersonalizedRecommendationResponse {
  data: PersonalizedRecommendationItem[];
}

export interface PersonalizedRecommendationItem {
  rank: number;
  partnerName: string;
  reason: string;
  imgUrl?: string;
  benefitIds?: number[];
}

// 추천 제휴처 매장 조회 응답 타입 (기존 StoreData 타입 재사용)
export interface RecommendationStoreResponse {
  code: string;
  status: string;
  message: string;
  data: StoreData[]; // 기존 StoreData 타입 재사용
  timestamp: string;
}
