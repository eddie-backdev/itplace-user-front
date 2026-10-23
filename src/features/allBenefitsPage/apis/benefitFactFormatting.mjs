const formatValue = (value) => Number(value).toLocaleString('ko-KR');

export function formatOfferFact(fact) {
  if (!fact?.value && fact?.value !== 0) return fact?.sourceText || '';
  const value = formatValue(fact.value);
  const prefix = fact.qualifier === 'MAX' ? '최대 ' : fact.qualifier === 'MIN' ? '최소 ' : '';
  const sharedPrefix = fact.sharedLimitGroup?.includes('VVIP_CHOICE') ? 'VVIP 초이스 통합 '
    : fact.sharedLimitGroup?.includes('VIP_CHOICE') ? 'VIP 초이스 통합 '
      : fact.sharedLimitGroup ? '공통 한도 통합 ' : '';
  const basisUnit = fact.basisUnit === 'KRW' ? '원' : fact.basisUnit === 'PERCENT' ? '%'
    : fact.basisUnit === 'POINT' ? '포인트' : fact.basisUnit || '원';
  switch (fact.type) {
    case 'DISCOUNT_AMOUNT': return `${prefix}${value}원 할인${fact.basisAmount ? ` (${formatValue(fact.basisAmount)}${basisUnit}당)` : ''}`;
    case 'DISCOUNT_RATE': return `${prefix}${value}% 할인`;
    case 'REWARD_RATE': return `${prefix}${value}% 적립`;
    case 'REWARD_POINTS': return `${prefix}${value}포인트 적립`;
    case 'USAGE_LIMIT': return `${sharedPrefix}${prefix}${value}회${fact.period === 'MONTH' ? '/월' : fact.period === 'YEAR' ? '/년' : fact.period === 'DAY' ? '/일' : fact.period === 'TRANSACTION' ? '/회당' : ''}`;
    case 'SPEND_CAP': return `${prefix}${value}원 결제 한도`;
    case 'DISCOUNT_CAP': return `${prefix}${value}원 할인 한도`;
    case 'MIN_SPEND': return `${prefix}${value}원 이상 결제`;
    default: return fact.sourceText || '';
  }
}

export function formatOfferFacts(facts) {
  return [...new Set((facts ?? []).map(formatOfferFact).filter(Boolean))];
}

export function formatOfferRewardFacts(facts) {
  return formatOfferFacts((facts ?? []).filter((fact) =>
    ['DISCOUNT_AMOUNT', 'DISCOUNT_RATE', 'REWARD_RATE', 'REWARD_POINTS'].includes(fact?.type)
  ));
}
