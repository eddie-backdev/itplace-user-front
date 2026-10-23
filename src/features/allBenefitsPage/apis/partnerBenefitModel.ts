import benefitDisplay from '../../../content/benefit-display.json';
import { isGradeApplicableToProfile, type CarrierCode } from '../../../utils/membership';
import type { ReferenceData } from '../../../utils/referenceData';
import type { BenefitConditions, BenefitOffer } from './benefitConditions.mjs';
import { getApplicableTierBenefits } from './tierBenefitResolver.mjs';
import {
  getCarrierBenefitDisplayName,
  getMembershipOptionLabel,
  getSourceOptionLabel,
} from './benefitDisplay.mjs';

export { getCarrierBenefitDisplayName, getMembershipOptionLabel, getSourceOptionLabel };

export interface TierBenefit {
  carrier?: string | null;
  grade: string;
  context: string;
  isAll: boolean;
}

export { getApplicableTierBenefits };

export const hasStructuredOffers = (value?: { offers?: BenefitOffer[]; offerResolution?: string | null } | null) =>
  value?.offers !== undefined || value?.offerResolution != null;

export const hasEligibleStructuredOffer = (
  value: { offers?: BenefitOffer[]; offerResolution?: string | null } | null | undefined,
  carrier: CarrierCode,
  grade?: string | null,
  referenceData?: ReferenceData | null
) => {
  if (!value || value.offerResolution === 'UNRESOLVED') return false;
  return (value.offers ?? []).some((offer) =>
    offer.allGrades === true || Boolean(grade && offer.gradeCodes.some((benefitGrade) =>
      isGradeApplicableToProfile({
        benefitCarrier: carrier,
        benefitGrade,
        userCarrier: carrier,
        userGrade: grade,
        referenceData,
      })
    ))
  );
};

export interface CarrierBenefitDetail {
  benefitId: number;
  benefitName: string;
  displayName?: string;
  membershipOptionType?: 'DISCOUNT' | 'POINT_ACCRUAL' | 'NOT_APPLICABLE' | 'UNKNOWN';
  sourceOptionLabel?: string | null;
  sourceBenefitName?: string;
  description?: string | null;
  benefitLimit?: string | null;
  manual?: string | null;
  url?: string | null;
  sourceUrl?: string | null;
  sourceCapturedAt?: string | null;
  conditions?: BenefitConditions | null;
  usageType: 'ONLINE' | 'OFFLINE' | 'BOTH' | 'UNKNOWN';
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
  hasStores: boolean;
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
  const currentCapturedAt = Date.parse(current.sourceCapturedAt ?? '');
  const candidateCapturedAt = Date.parse(candidate.sourceCapturedAt ?? '');
  const currentHasCapture = Number.isFinite(currentCapturedAt);
  const candidateHasCapture = Number.isFinite(candidateCapturedAt);
  const currentHasStructuredOffers = hasStructuredOffers(current.conditions);
  const candidateHasStructuredOffers = hasStructuredOffers(candidate.conditions);
  const [primary, secondary] =
    currentHasCapture !== candidateHasCapture
      ? currentHasCapture
        ? [current, candidate]
        : [candidate, current]
      : currentHasCapture && candidateCapturedAt !== currentCapturedAt
        ? candidateCapturedAt > currentCapturedAt
          ? [candidate, current]
          : [current, candidate]
        : currentHasStructuredOffers !== candidateHasStructuredOffers
          ? currentHasStructuredOffers
            ? [current, candidate]
            : [candidate, current]
          : getBenefitRichness(candidate) > getBenefitRichness(current)
            ? [candidate, current]
            : [current, candidate];
  const hasAnyStructuredOffers = currentHasStructuredOffers || candidateHasStructuredOffers;
  if (hasAnyStructuredOffers) {
    // Source-derived facts form one snapshot. Never fill its gaps from a duplicate
    // with another capture date (or from an undated legacy response).
    return {
      ...secondary,
      ...primary,
      description: primary.description,
      benefitLimit: primary.benefitLimit,
      manual: primary.manual,
      url: primary.url,
      sourceUrl: primary.sourceUrl,
      sourceCapturedAt: primary.sourceCapturedAt,
      conditions: primary.conditions ?? null,
      tierBenefits: primary.tierBenefits,
      isFavorite: primary.isFavorite || secondary.isFavorite,
      favoriteCount: Math.max(primary.favoriteCount, secondary.favoriteCount),
    };
  }
  const conditions: BenefitConditions = {
    ...secondary.conditions,
    ...primary.conditions,
  };
  (['products', 'availability', 'limits', 'usage', 'exclusions'] as const).forEach((field) => {
    if (!primary.conditions?.[field]?.length && secondary.conditions?.[field]?.length) {
      conditions[field] = secondary.conditions[field];
    }
  });


  return {
    ...secondary,
    ...primary,
    description: primary.description?.trim() ? primary.description : secondary.description,
    benefitLimit: primary.benefitLimit?.trim() ? primary.benefitLimit : secondary.benefitLimit,
    manual: primary.manual?.trim() ? primary.manual : secondary.manual,
    url: primary.url?.trim() ? primary.url : secondary.url,
    sourceUrl: primary.sourceUrl?.trim() ? primary.sourceUrl : secondary.sourceUrl,
    sourceCapturedAt: primary.sourceCapturedAt?.trim()
      ? primary.sourceCapturedAt
      : secondary.sourceCapturedAt,
    conditions: Object.keys(conditions).length ? conditions : null,
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

export const mergePartnerBenefitDetails = (
  canonicalDetail: PartnerBenefitDetailResponse | null | undefined,
  selectedDetail?: PartnerBenefitDetailResponse | null
): PartnerBenefitDetailResponse | null => {
  if (!canonicalDetail) return selectedDetail ?? null;
  if (!selectedDetail) return canonicalDetail;

  const groups = new Map(
    canonicalDetail.carrierGroups.map((group) => [group.carrier, group] as const)
  );
  selectedDetail.carrierGroups.forEach((group) => {
    const existing = groups.get(group.carrier);
    groups.set(
      group.carrier,
      existing ? { ...existing, benefits: [...existing.benefits, ...group.benefits] } : group
    );
  });

  return normalizePartnerBenefitDetail({
    ...canonicalDetail,
    ...selectedDetail,
    carrierGroups: [...groups.values()],
  });
};
