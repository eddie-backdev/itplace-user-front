export const getCarrierBenefitDisplayName = (benefit) =>
  benefit.displayName?.trim() || benefit.benefitName;

export const getMembershipOptionLabel = (benefit) => {
  if (benefit.membershipOptionType === 'DISCOUNT') return '할인형';
  if (benefit.membershipOptionType === 'POINT_ACCRUAL') return '적립형';
  return null;
};

export const getSourceOptionLabel = (benefit) => {
  const sourceLabel = benefit.sourceOptionLabel?.trim();
  return sourceLabel && sourceLabel !== getMembershipOptionLabel(benefit) ? sourceLabel : null;
};
