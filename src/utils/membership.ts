import { getBenefitGradeOptions, type ReferenceData } from './referenceData';

export type CarrierCode = 'LGU' | 'SKT' | 'KT';

export type MembershipGradeCode = string;

export type MembershipGradeOption = {
  code: MembershipGradeCode;
  label: string;
};

export const CARRIER_OPTIONS: Array<{ code: CarrierCode; label: string }> = [
  { code: 'SKT', label: 'SKT' },
  { code: 'KT', label: 'KT' },
  { code: 'LGU', label: 'LG U+' },
];

const CARRIER_LABELS = CARRIER_OPTIONS.reduce<Record<string, string>>(
  (acc, option) => {
    acc[option.code] = option.label;
    return acc;
  },
  { MVNO: '알뜰폰' }
);


export const isCarrierCode = (value?: string | null): value is CarrierCode =>
  value === 'LGU' || value === 'SKT' || value === 'KT';

export const getCarrierLabel = (carrier?: string | null) => {
  if (!carrier) return '미선택';
  return CARRIER_LABELS[carrier] ?? carrier;
};

export const getMembershipGradeOptions = (carrier?: string | null, referenceData?: ReferenceData | null): MembershipGradeOption[] => {
  if (!isCarrierCode(carrier) || !referenceData) return [];
  return referenceData.grades.filter((grade) => grade.carrier === carrier && grade.active && grade.profileSelectable)
    .sort((a, b) => a.sortOrder - b.sortOrder).map(({ code, label }) => ({ code, label }));
};

export const getBenefitMembershipGradeOptions = (carrier?: string | null, referenceData?: ReferenceData | null): MembershipGradeOption[] =>
  getBenefitGradeOptions(carrier, referenceData);

export const getMembershipGradeLabel = (grade?: string | null, referenceData?: ReferenceData | null) => {
  if (!grade) return '미선택';
  return referenceData?.grades.find((item) => item.code === grade)?.label ?? grade;
};

export const isValidCarrierGradePair = (carrier?: string | null, grade?: string | null, referenceData?: ReferenceData | null) => {
  if (!carrier && !grade) return true;
  if (!isCarrierCode(carrier) || !grade || !referenceData) return false;
  return getMembershipGradeOptions(carrier, referenceData).some((option) => option.code === grade);
};

export const getMembershipFilter = (carrier?: string | null, grade?: string | null, referenceData?: ReferenceData | null) =>
  isCarrierCode(carrier) && (!grade || isValidCarrierGradePair(carrier, grade, referenceData))
    ? { carrier, grade: grade || undefined }
    : undefined;

export const getBenefitMembershipFilter = (carrier?: string | null, grade?: string | null, referenceData?: ReferenceData | null) =>
  isCarrierCode(carrier) && (!grade || getBenefitGradeOptions(carrier, referenceData).some((option) => option.code === grade))
    ? { carrier, grade: grade || undefined }
    : undefined;

export const isValidBenefitCarrierGradePair = (carrier?: string | null, grade?: string | null, referenceData?: ReferenceData | null) =>
  !carrier && !grade ? true : Boolean(grade && getBenefitMembershipFilter(carrier, grade, referenceData));

export const isGradeApplicableToProfile = ({
  benefitCarrier,
  benefitGrade,
  userCarrier,
  userGrade,
  referenceData,
}: {
  benefitCarrier?: string | null;
  benefitGrade?: string | null;
  userCarrier?: string | null;
  userGrade?: string | null;
  referenceData?: ReferenceData | null;
}) => {
  if (!benefitGrade || !userGrade) return false;
  if (benefitCarrier && userCarrier && benefitCarrier !== userCarrier) return false;

  if (benefitGrade === userGrade) return true;

  return referenceData?.gradeMatches.some((match) => match.carrier === userCarrier && match.profileGrade === userGrade && match.benefitGrade === benefitGrade) ?? false;
};

export const getCarrierGradeOrder = (carrier?: string | null, availableGrades: string[] = [], referenceData?: ReferenceData | null) => {
  const baseOrder = referenceData?.grades.filter(({ carrier: gradeCarrier }) => gradeCarrier === carrier).sort((a, b) => a.sortOrder - b.sortOrder).map(({ code }) => code) ?? [];
  const ordered = baseOrder;
  const extras = availableGrades.filter((grade) => !ordered.includes(grade));

  return [...ordered, ...extras];
};
