import axiosInstance from '../../../apis/axiosInstance';
import { CarrierCode } from '../../../utils/membership';

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
  carriers?: string[];
}

export interface PartnerBenefitItem {
  partnerId: number;
  partnerName: string;
  category: string | null;
  image: string | null;
  carriers: CarrierCode[];
}

export interface PartnerBenefitResponse {
  content: PartnerBenefitItem[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

export type PartnerBenefitApiParams = BenefitApiParams;

export interface CarrierBenefitDetail {
  benefitId: number;
  benefitName: string;
  description?: string | null;
  benefitLimit?: string | null;
  manual?: string | null;
  url?: string | null;
  usageType: 'ONLINE' | 'OFFLINE' | 'BOTH';
  tierBenefits: TierBenefit[];
  isFavorite: boolean;
  favoriteCount: number;
}

export interface CarrierBenefitGroup {
  carrier: CarrierCode;
  benefits: CarrierBenefitDetail[];
}

export interface PartnerBenefitDetailResponse {
  partnerId: number;
  partnerName: string;
  category: string | null;
  image: string | null;
  carrierGroups: CarrierBenefitGroup[];
}

const textRichness = (value?: string | null) => value?.trim().length ?? 0;

const getBenefitRichness = (benefit: CarrierBenefitDetail) =>
  textRichness(benefit.description) +
  textRichness(benefit.benefitLimit) * 2 +
  textRichness(benefit.manual) * 3 +
  textRichness(benefit.url) +
  benefit.tierBenefits.length * 20;

const mergeTierBenefits = (
  primary: CarrierBenefitDetail['tierBenefits'],
  secondary: CarrierBenefitDetail['tierBenefits']
) => {
  const uniqueTierBenefits = new Map<string, TierBenefit>();
  [...primary, ...secondary].forEach((tierBenefit) => {
    const key = [
      tierBenefit.carrier ?? '',
      tierBenefit.grade,
      tierBenefit.context,
      tierBenefit.isAll,
    ].join('|');
    uniqueTierBenefits.set(key, tierBenefit);
  });
  return [...uniqueTierBenefits.values()];
};

const mergeDuplicateBenefit = (
  current: CarrierBenefitDetail,
  candidate: CarrierBenefitDetail
): CarrierBenefitDetail => {
  const [primary, secondary] =
    getBenefitRichness(candidate) > getBenefitRichness(current)
      ? [candidate, current]
      : [current, candidate];

  return {
    ...secondary,
    ...primary,
    description: primary.description?.trim() ? primary.description : secondary.description,
    benefitLimit: primary.benefitLimit?.trim() ? primary.benefitLimit : secondary.benefitLimit,
    manual: primary.manual?.trim() ? primary.manual : secondary.manual,
    url: primary.url?.trim() ? primary.url : secondary.url,
    tierBenefits: mergeTierBenefits(primary.tierBenefits, secondary.tierBenefits),
    isFavorite: primary.isFavorite || secondary.isFavorite,
    favoriteCount: Math.max(primary.favoriteCount, secondary.favoriteCount),
  };
};

export const normalizePartnerBenefitDetail = (
  detail: PartnerBenefitDetailResponse
): PartnerBenefitDetailResponse => ({
  ...detail,
  carrierGroups: detail.carrierGroups.map((group) => {
    const benefitsById = new Map<number, CarrierBenefitDetail>();
    group.benefits.forEach((benefit) => {
      const current = benefitsById.get(benefit.benefitId);
      benefitsById.set(
        benefit.benefitId,
        current ? mergeDuplicateBenefit(current, benefit) : benefit
      );
    });
    return { ...group, benefits: [...benefitsById.values()] };
  }),
});

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
    ...(params.carriers && params.carriers.length > 0 && { carriers: params.carriers.join(',') }),
  };

  const response = await axiosInstance.get('/api/v1/benefits', { params: queryParams });
  return response.data.data;
};

export const getPartnerBenefits = async (
  params: PartnerBenefitApiParams
): Promise<PartnerBenefitResponse> => {
  const queryParams = {
    mainCategory: params.mainCategory,
    page: params.page ?? 0,
    size: params.size ?? 15,
    sort: params.sort ?? 'POPULARITY',
    ...(params.category && { category: params.category }),
    ...(params.filter && { filter: params.filter }),
    ...(params.keyword && { keyword: params.keyword }),
    ...(params.carriers && params.carriers.length > 0 && { carriers: params.carriers.join(',') }),
  };

  const response = await axiosInstance.get('/api/v1/benefits/partners', { params: queryParams });
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

export const getPartnerBenefitDetail = async (
  partnerId: number
): Promise<PartnerBenefitDetailResponse> => {
  const response = await axiosInstance.get(`/api/v1/benefits/partners/${partnerId}`, {
    params: { mainCategory: 'BASIC_BENEFIT' },
  });
  return normalizePartnerBenefitDetail(response.data.data);
};
