import type { PartnerBenefitItem, PartnerBenefitPreview } from '@/features/allBenefitsPage/apis/allBenefitsApi';
import {
  CARRIER_OPTIONS,
  type CarrierCode,
  getMembershipGradeLabel,
  isGradeApplicableToProfile,
} from './membership';
import type { ReferenceData } from './referenceData';

const neutralPreview = (carrier: CarrierCode, grade?: string, referenceData?: ReferenceData | null) => ({
  carrier,
  title: '혜택 적용 여부 확인',
  condition: '공식 안내에서 등급과 이용 조건을 확인해 주세요.',
  grades: grade ? getMembershipGradeLabel(grade, referenceData) : '',
  appliesToEveryGrade: false,
  limit: undefined,
  usage: '이용 채널 확인 필요',
});

export function getPartnerBenefitPreview(
  partner: Pick<PartnerBenefitItem, 'partnerName' | 'previews'> & Partial<Pick<PartnerBenefitItem, 'partnerId'>>,
  carrier?: CarrierCode,
  grade?: string,
  referenceData?: ReferenceData | null,
) {
  const preview = partner.previews?.find((item) => !carrier || item.carrier === carrier);
  if (!preview) return null;
  const tierBenefits = preview.tierBenefits ?? [];

  // `undefined` is an older response. `null` means the API explicitly could not
  // resolve one safe offer for this card.
  if (preview.summary === null) return neutralPreview(preview.carrier, grade, referenceData);
  if (preview.summary) {
    const summary = preview.summary;
    const eligible = summary.allGrades || !grade || summary.grades.some((code) => isGradeApplicableToProfile({
      benefitCarrier: preview.carrier, benefitGrade: code, userCarrier: preview.carrier, userGrade: grade, referenceData,
    }));
    if (!eligible) return neutralPreview(preview.carrier, grade, referenceData);
    return {
      carrier: preview.carrier,
      title: summary.title || '혜택 상세 보기',
      condition: summary.condition,
      grades: grade ? getMembershipGradeLabel(grade, referenceData)
        : summary.grades.map((code) => getMembershipGradeLabel(code, referenceData)).join(' · '),
      appliesToEveryGrade: summary.allGrades,
      limit: summary.limit || undefined,
      usage: summary.usage === 'ONLINE' ? '온라인' : summary.usage === 'OFFLINE' ? '오프라인'
        : summary.usage === 'BOTH' ? '온라인 · 오프라인' : '이용 채널 확인 필요',
    };
  }

  // Old payloads have no summary contract. Keep their existing eligibility and
  // copy conservative; never mine tier context for a card headline.
  if (grade && tierBenefits.length && !tierBenefits.some((tier) =>
    tier.isAll || tier.grade === grade
  )) return neutralPreview(preview.carrier, grade, referenceData);
  return {
    carrier: preview.carrier,
    title: '혜택 상세 보기',
    condition: '',
    grades: grade ? getMembershipGradeLabel(grade, referenceData) : '',
    appliesToEveryGrade: tierBenefits.some((tier) => tier.isAll),
    limit: preview.benefitLimit?.trim() || undefined,
    usage: preview.usageType === 'ONLINE' ? '온라인' : preview.usageType === 'OFFLINE' ? '오프라인'
      : preview.usageType === 'BOTH' ? '온라인 · 오프라인' : '이용 방식 확인 필요',
  };
}

export function getPartnerBenefitPreviews(
  partner: Pick<PartnerBenefitItem, 'partnerId' | 'partnerName' | 'carriers' | 'previews'>,
  referenceData?: ReferenceData | null,
) {
  return CARRIER_OPTIONS.filter(({ code }) => partner.carriers.includes(code)).map(({ code }) => {
    const preview = getPartnerBenefitPreview(partner, code, undefined, referenceData);
    return preview
      ? { carrier: code, title: preview.title, condition: preview.condition,
          grades: preview.appliesToEveryGrade ? '' : preview.grades }
      : { carrier: code, title: '혜택 조건 확인', condition: '', grades: '' };
  });
}

export function hasExplicitPreviewSummary(preview: PartnerBenefitPreview) {
  return preview.summary !== undefined;
}

export function isPreviewSummaryEligible(preview: PartnerBenefitPreview, grade: string, referenceData?: ReferenceData | null) {
  return !preview.summary || preview.summary.allGrades || preview.summary.grades.some((code) => isGradeApplicableToProfile({
    benefitCarrier: preview.carrier, benefitGrade: code, userCarrier: preview.carrier, userGrade: grade, referenceData,
  }));
}
