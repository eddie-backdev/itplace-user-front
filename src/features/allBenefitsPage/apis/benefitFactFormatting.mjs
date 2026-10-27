const formatValue = (value) => Number(value).toLocaleString('ko-KR');

function cardContextForFact(fact) {
  const pattern = {
    DISCOUNT_AMOUNT: /(?:^|[^\d,.])([\d][\d,]*(?:\.\d+)?)\s*원\s*할인/g,
    DISCOUNT_RATE: /(?:^|[^\d,.])([\d][\d,]*(?:\.\d+)?)\s*%\s*할인/g,
    REWARD_RATE: /(?:^|[^\d,.])([\d][\d,]*(?:\.\d+)?)\s*%\s*적립/g,
    REWARD_POINTS: /(?:^|[^\d,.])([\d][\d,]*(?:\.\d+)?)\s*(?:P|점|포인트)\s*적립/gi,
  }[fact.type];
  if (!pattern) return '';

  const sourceText = fact.sourceText ?? '';
  const amount = Number(fact.value);
  for (const match of sourceText.matchAll(pattern)) {
    if (Number(match[1].replaceAll(',', '')) !== amount) continue;
    const annotation = /^\s*\(([^)]*)\)/.exec(sourceText.slice(match.index + match[0].length));
    if (!annotation) continue;
    const mobile = /모바일\s*카드/i.test(annotation[1]);
    const plastic = /플라스틱\s*카드/i.test(annotation[1]);
    if (mobile && plastic) return '모바일카드/플라스틱카드';
    if (mobile) return '모바일카드';
    if (plastic) return '플라스틱카드';
  }
  return '';
}

export function formatOfferFact(fact) {
  if (!fact?.value && fact?.value !== 0) return fact?.sourceText || '';
  const value = formatValue(fact.value);
  const prefix = fact.qualifier === 'MAX' ? '최대 ' : fact.qualifier === 'MIN' ? '최소 ' : '';
  const sharedPrefix = fact.sharedLimitGroup?.includes('VVIP_CHOICE') ? 'VVIP 초이스 통합 '
    : fact.sharedLimitGroup?.includes('VIP_CHOICE') ? 'VIP 초이스 통합 '
      : fact.sharedLimitGroup ? '공통 한도 통합 ' : '';
  const basisUnit = fact.basisUnit === 'KRW' ? '원' : fact.basisUnit === 'PERCENT' ? '%'
    : fact.basisUnit === 'POINT' ? '포인트' : fact.basisUnit || '원';
  const basis = fact.basisAmount ? ` (${formatValue(fact.basisAmount)}${basisUnit}당)` : '';
  let label;
  switch (fact.type) {
    case 'DISCOUNT_AMOUNT': label = `${prefix}${value}원 할인${basis}`; break;
    case 'DISCOUNT_RATE': label = `${prefix}${value}% 할인`; break;
    case 'REWARD_RATE': label = `${prefix}${value}% 적립`; break;
    case 'REWARD_POINTS': label = `${prefix}${value}포인트 적립${basis}`; break;
    case 'USAGE_LIMIT': label = `${sharedPrefix}${prefix}${value}회${fact.period === 'MONTH' ? '/월' : fact.period === 'YEAR' ? '/년' : fact.period === 'DAY' ? '/일' : fact.period === 'TRANSACTION' ? '/회당' : ''}`; break;
    case 'SPEND_CAP': label = `${prefix}${value}원 결제 한도`; break;
    case 'DISCOUNT_CAP': label = `${prefix}${value}원 할인 한도`; break;
    case 'MIN_SPEND': label = `${prefix}${value}원 이상 결제`; break;
    default: return fact.sourceText || '';
  }
  const cardContext = cardContextForFact(fact);
  return cardContext ? `${label} · ${cardContext}` : label;
}

export function formatOfferFacts(facts) {
  return [...new Set((facts ?? []).map(formatOfferFact).filter(Boolean))];
}

export function formatOfferRewardFacts(facts) {
  return formatOfferFacts((facts ?? []).filter((fact) =>
    ['DISCOUNT_AMOUNT', 'DISCOUNT_RATE', 'REWARD_RATE', 'REWARD_POINTS'].includes(fact?.type)
  ));
}
