import benefitDisplay from '../../../content/benefit-display.json';
import type { CarrierCode } from '../../../utils/membership';

export interface TierBenefit {
  carrier?: string | null;
  grade: string;
  context: string;
  isAll: boolean;
}

export interface CarrierBenefitDetail {
  benefitId: number;
  benefitName: string;
  description?: string | null;
  benefitLimit?: string | null;
  manual?: string | null;
  url?: string | null;
  sourceUrl?: string | null;
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
    sourceUrl: primary.sourceUrl?.trim() ? primary.sourceUrl : secondary.sourceUrl,
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
    return {
      ...group,
      benefits: [...benefitsById.values()].map((benefit) => ({
        ...benefit,
        benefitLimit:
          benefit.benefitLimit === '제한없음'
            ? benefitDisplay.limitLabels['제한없음']
            : benefit.benefitLimit,
      })),
    };
  }),
});
