import { getCarrierGradeOrder, getCarrierLabel, isCarrierCode } from '../../../utils/membership';
import { Platform, PlatformBenefit } from '../types';
import { DetailTierBenefit } from '../types/api';

export type DisplayBenefit = {
  carrier: string | null;
  grades: string[];
  context: string;
};

export type BenefitCarrierGroup = {
  key: string;
  label: string;
  benefits: DisplayBenefit[];
};

type CarrierGradeBenefit = {
  carrier?: string | null;
  grade: string;
  context: string;
};

const CARRIER_GROUP_ORDER = ['SKT', 'KT', 'LGU'];
const MISSING_CARRIER_KEY = 'MISSING_CARRIER';

const LGU_GRADES = ['BASIC', 'VIP', 'VVIP', 'VIP콕'];

const inferCarrierFromGrade = (grade: string) => {
  if (grade.startsWith('SKT_')) return 'SKT';
  if (grade.startsWith('KT_')) return 'KT';
  if (LGU_GRADES.includes(grade)) return 'LGU';

  return null;
};

const getEffectiveCarrier = (
  benefitCarrier: string | null | undefined,
  benefitGrade: string,
  fallbackCarrier: string | null | undefined
) => {
  if (isCarrierCode(benefitCarrier)) return benefitCarrier;

  const inferredCarrier = inferCarrierFromGrade(benefitGrade);
  if (inferredCarrier) return inferredCarrier;

  return isCarrierCode(fallbackCarrier) ? fallbackCarrier : null;
};

const getCarrierGroupKey = (carrier: string | null) => {
  return isCarrierCode(carrier) ? carrier : MISSING_CARRIER_KEY;
};

const getCarrierGroupLabel = (carrier: string | null) => {
  return isCarrierCode(carrier) ? getCarrierLabel(carrier) : '통신사 정보 없음';
};

const getGradeSortIndex = (carrier: string | null, grades: string[]) => {
  const gradeOrder = getCarrierGradeOrder(isCarrierCode(carrier) ? carrier : null, grades);
  const indexes = grades.map((grade) => gradeOrder.indexOf(grade)).filter((index) => index !== -1);

  return indexes.length > 0 ? Math.min(...indexes) : Number.MAX_SAFE_INTEGER;
};

const sortDisplayBenefitsByGradeOrder = (benefits: DisplayBenefit[]) => {
  return [...benefits].sort((a, b) => {
    const aIndex = getGradeSortIndex(a.carrier, a.grades);
    const bIndex = getGradeSortIndex(b.carrier, b.grades);

    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.context.localeCompare(b.context);
  });
};

const parseBenefitText = (
  benefitText: string,
  fallbackCarrier?: string | null
): PlatformBenefit => {
  const [grade, ...contentParts] = benefitText.split(': ');

  return {
    carrier: fallbackCarrier,
    grade,
    context: contentParts.join(': ') || '-',
  };
};

const getPlatformBenefitItems = (platform: Platform) => {
  if (platform.benefitDetails && platform.benefitDetails.length > 0) {
    return platform.benefitDetails;
  }

  return platform.benefits.map((benefitText) => parseBenefitText(benefitText, platform.carrier));
};

const mergeBenefitsByCarrierAndContext = <T extends CarrierGradeBenefit>(
  benefits: T[],
  fallbackCarrier: string | null | undefined
) => {
  const merged = new Map<string, DisplayBenefit>();

  benefits.forEach((benefit) => {
    const carrier = getEffectiveCarrier(benefit.carrier, benefit.grade, fallbackCarrier);
    const key = [carrier ?? '', benefit.context].join('|');
    const existing = merged.get(key);

    if (existing) {
      if (!existing.grades.includes(benefit.grade)) {
        existing.grades.push(benefit.grade);
      }
      return;
    }

    merged.set(key, {
      carrier,
      grades: [benefit.grade],
      context: benefit.context,
    });
  });

  return [...merged.values()];
};

export const groupBenefitsByCarrier = <T extends CarrierGradeBenefit>(
  benefits: T[],
  fallbackCarrier: string | null | undefined
): BenefitCarrierGroup[] => {
  const groups = mergeBenefitsByCarrierAndContext(benefits, fallbackCarrier).reduce<
    Record<string, BenefitCarrierGroup>
  >((acc, benefit) => {
    const key = getCarrierGroupKey(benefit.carrier);

    if (!acc[key]) {
      acc[key] = {
        key,
        label: getCarrierGroupLabel(benefit.carrier),
        benefits: [],
      };
    }

    acc[key].benefits.push(benefit);
    return acc;
  }, {});

  return Object.values(groups)
    .map((group) => ({
      ...group,
      benefits: sortDisplayBenefitsByGradeOrder(group.benefits),
    }))
    .sort((a, b) => {
      const aIndex = CARRIER_GROUP_ORDER.indexOf(a.key);
      const bIndex = CARRIER_GROUP_ORDER.indexOf(b.key);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      if (a.key === MISSING_CARRIER_KEY) return 1;
      if (b.key === MISSING_CARRIER_KEY) return -1;

      return 0;
    });
};

export const groupPlatformBenefitsByCarrier = (platform: Platform) => {
  return groupBenefitsByCarrier(getPlatformBenefitItems(platform), platform.carrier);
};

export const groupDetailBenefitsByCarrier = (
  benefits: DetailTierBenefit[],
  fallbackCarrier: string | null | undefined
) => {
  return groupBenefitsByCarrier(benefits, fallbackCarrier);
};
