import type { PartnerBenefitItem } from '@/features/allBenefitsPage/apis/allBenefitsApi';
import {
  CARRIER_OPTIONS,
  type CarrierCode,
  getMembershipGradeOptions,
  getMembershipGradeLabel,
  isGradeApplicableToProfile,
} from './membership';

export function getPartnerBenefitPreview(
  partner: Pick<PartnerBenefitItem, 'partnerName' | 'previews'>,
  carrier?: CarrierCode,
  grade?: string
) {
  const preview = partner.previews?.find(
    (item) =>
      (!carrier || item.carrier === carrier) &&
      item.tierBenefits.some(
        (tier) =>
          tier.context.trim() &&
          (!grade ||
            (carrier &&
              (tier.isAll ||
                isGradeApplicableToProfile({
                  benefitCarrier: item.carrier,
                  benefitGrade: tier.grade,
                  userCarrier: carrier,
                  userGrade: grade,
                }))))
      )
  );
  if (!preview) return null;

  // Prefer the condition shared by the most grades. For ties, show the lower grade first.
  const gradeOrder = [
    ...new Set([
      ...getMembershipGradeOptions(preview.carrier).map((option) => option.code as string),
      ...preview.tierBenefits.map((tier) => tier.grade),
    ]),
  ];
  const conditions = new Map<string, { grades: Set<string>; isAll: boolean }>();
  [...preview.tierBenefits]
    .filter(
      (tier) =>
        !grade ||
        (carrier &&
          (tier.isAll ||
            isGradeApplicableToProfile({
              benefitCarrier: preview.carrier,
              benefitGrade: tier.grade,
              userCarrier: carrier,
              userGrade: grade,
            })))
    )
    .sort((a, b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade))
    .forEach((tier) => {
      const context = tier.context.trim();
      if (!context) return;
      const condition = conditions.get(context) ?? { grades: new Set<string>(), isAll: false };
      condition.grades.add(tier.grade);
      condition.isAll ||= tier.isAll;
      conditions.set(context, condition);
    });
  const [context, selectedCondition] = [...conditions.entries()].sort(
    (a, b) => b[1].grades.size - a[1].grades.size
  )[0];
  const availableGradeCodes = new Set([
    ...getMembershipGradeOptions(preview.carrier).map(({ code }) => code),
    ...preview.tierBenefits.map((tier) => tier.grade),
  ]);
  const appliesToEveryGrade =
    selectedCondition.isAll ||
    (selectedCondition.grades.size === availableGradeCodes.size &&
      [...availableGradeCodes].every((code) => selectedCondition.grades.has(code)));
  const [headline, ...notes] = context.split('※');
  const title = headline.trim().startsWith(partner.partnerName)
    ? headline.trim().slice(partner.partnerName.length).trim()
    : headline.trim();
  return {
    carrier: preview.carrier,
    title: title || context,
    condition: notes.join(' · ').trim(),
    grades: grade
      ? getMembershipGradeLabel(grade)
      : [...selectedCondition.grades].map(getMembershipGradeLabel).join(' · '),
    appliesToEveryGrade,
    limit:
      preview.benefitLimit?.trim() === '제한없음'
        ? '횟수·제외 조건은 상세 확인'
        : preview.benefitLimit?.trim(),
    usage:
      preview.usageType === 'ONLINE'
        ? '온라인'
        : preview.usageType === 'OFFLINE'
          ? '오프라인'
          : '온라인·오프라인',
  };
}

export function getPartnerBenefitPreviews(
  partner: Pick<PartnerBenefitItem, 'partnerName' | 'carriers' | 'previews'>
) {
  return CARRIER_OPTIONS.filter(({ code }) => partner.carriers.includes(code)).map(({ code }) => {
    const preview = getPartnerBenefitPreview(partner, code);
    if (!preview) {
      return { carrier: code, title: '혜택 조건 확인', condition: '', grades: '' };
    }

    return {
      carrier: code,
      title: preview.title,
      condition: preview.condition,
      grades: preview.appliesToEveryGrade ? '' : preview.grades,
    };
  });
}
