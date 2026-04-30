export type CarrierCode = 'LGU' | 'SKT' | 'KT';

export type MembershipGradeCode =
  | 'BASIC'
  | 'VIP'
  | 'VVIP'
  | 'VIP콕'
  | 'SKT_SILVER'
  | 'SKT_GOLD'
  | 'SKT_VIP'
  | 'KT_GENERAL'
  | 'KT_WHITE'
  | 'KT_SILVER'
  | 'KT_GOLD'
  | 'KT_VIP'
  | 'KT_VVIP';

export type MembershipGradeOption = {
  code: MembershipGradeCode;
  label: string;
};

export const CARRIER_OPTIONS: Array<{ code: CarrierCode; label: string }> = [
  { code: 'LGU', label: 'LG U+' },
  { code: 'SKT', label: 'SKT' },
  { code: 'KT', label: 'KT' },
];

export const MEMBERSHIP_GRADE_OPTIONS_BY_CARRIER: Record<CarrierCode, MembershipGradeOption[]> = {
  LGU: [
    { code: 'BASIC', label: '우수' },
    { code: 'VIP', label: 'VIP' },
    { code: 'VVIP', label: 'VVIP' },
  ],
  SKT: [
    { code: 'SKT_SILVER', label: 'Silver' },
    { code: 'SKT_GOLD', label: 'Gold' },
    { code: 'SKT_VIP', label: 'VIP' },
  ],
  KT: [
    { code: 'KT_GENERAL', label: '일반' },
    { code: 'KT_WHITE', label: 'White' },
    { code: 'KT_SILVER', label: 'Silver' },
    { code: 'KT_GOLD', label: 'Gold' },
    { code: 'KT_VIP', label: 'VIP' },
    { code: 'KT_VVIP', label: 'VVIP' },
  ],
};

const CARRIER_LABELS = CARRIER_OPTIONS.reduce<Record<string, string>>((acc, option) => {
  acc[option.code] = option.label;
  return acc;
}, {});

const GRADE_LABELS = Object.values(MEMBERSHIP_GRADE_OPTIONS_BY_CARRIER)
  .flat()
  .reduce<Record<string, string>>(
    (acc, option) => {
      acc[option.code] = option.label;
      return acc;
    },
    { VIP콕: 'VIP콕' }
  );

export const isCarrierCode = (value?: string | null): value is CarrierCode =>
  value === 'LGU' || value === 'SKT' || value === 'KT';

export const getCarrierLabel = (carrier?: string | null) => {
  if (!carrier) return '미선택';
  return CARRIER_LABELS[carrier] ?? carrier;
};

export const getMembershipGradeOptions = (carrier?: string | null): MembershipGradeOption[] => {
  if (!isCarrierCode(carrier)) return [];
  return MEMBERSHIP_GRADE_OPTIONS_BY_CARRIER[carrier];
};

export const getMembershipGradeLabel = (grade?: string | null) => {
  if (!grade) return '미선택';
  return GRADE_LABELS[grade] ?? grade;
};

export const isValidCarrierGradePair = (carrier?: string | null, grade?: string | null) => {
  if (!carrier && !grade) return true;
  if (!isCarrierCode(carrier) || !grade) return false;
  return MEMBERSHIP_GRADE_OPTIONS_BY_CARRIER[carrier].some((option) => option.code === grade);
};

export const isGradeApplicableToProfile = ({
  benefitCarrier,
  benefitGrade,
  userCarrier,
  userGrade,
}: {
  benefitCarrier?: string | null;
  benefitGrade?: string | null;
  userCarrier?: string | null;
  userGrade?: string | null;
}) => {
  if (!benefitGrade || !userGrade) return false;
  if (benefitCarrier && userCarrier && benefitCarrier !== userCarrier) return false;

  if (benefitGrade === userGrade) return true;

  return (
    userCarrier === 'LGU' &&
    benefitGrade === 'VIP콕' &&
    (userGrade === 'VIP' || userGrade === 'VVIP')
  );
};

export const getCarrierGradeOrder = (carrier?: string | null, availableGrades: string[] = []) => {
  const baseOrder = getMembershipGradeOptions(carrier).map((option) => option.code as string);
  const lguVipKok = carrier === 'LGU' && availableGrades.includes('VIP콕') ? ['VIP콕'] : [];
  const ordered = [...lguVipKok, ...baseOrder];
  const extras = availableGrades.filter((grade) => !ordered.includes(grade));

  return [...ordered, ...extras];
};
