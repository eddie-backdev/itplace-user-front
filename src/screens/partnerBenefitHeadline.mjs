import { formatOfferRewardFacts } from '../features/allBenefitsPage/apis/benefitFactFormatting.mjs';

const GENERIC_OFFER_TITLES = new Set(['할인형', '적립형', '혜택 내용', '혜택', '기타']);

const getUsefulTitle = (title) => {
  const normalized = title?.trim() ?? '';
  return GENERIC_OFFER_TITLES.has(normalized) ? '' : normalized;
};

export const getScopedBenefitHeadline = ({
  offers = [],
  offerResolution,
  eligibleTierContexts = [],
}) => {
  const summaries = offers.map((offer) => {
    const rewards = formatOfferRewardFacts(offer.facts);
    const title = getUsefulTitle(offer.title);
    return [...rewards, ...(title ? [title] : [])].join(' · ');
  });

  if (offers.length === 1) {
    const rewards = formatOfferRewardFacts(offers[0].facts);
    if (rewards.length) return summaries[0];
    if (offerResolution !== 'UNRESOLVED' && eligibleTierContexts.length) {
      return eligibleTierContexts.join(' · ');
    }
  }

  const knownSummaries = summaries.filter(Boolean);

  if (knownSummaries.length) {
    return [
      ...knownSummaries,
      ...(knownSummaries.length < offers.length ? ['일부 혜택 내용은 확인되지 않았어요'] : []),
    ].join(' · ');
  }
  return '선택 등급의 적용 혜택을 확인해 주세요';
};
