const MAX_CONTEXT = 12;
const MAX_CANDIDATES = 8;
const MAX_SAVED_MESSAGES = 30;
const MAX_QUESTION = 500;

const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

const normalizeStoredPartner = (value) => {
  if (!isRecord(value) || typeof value.partnerName !== 'string') return null;
  const partner = { partnerName: value.partnerName.slice(0, 200) };
  for (const key of ['partnerId', 'benefitId', 'representativeStoreId', 'storeCount', 'policyId', 'tierBenefitId']) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key])) partner[key] = value[key];
  }
  for (const key of ['benefitName', 'category', 'representativeStoreName', 'benefitText', 'imgUrl', 'candidateKey', 'carrier', 'grade', 'usageType', 'sourceUrl', 'sourceCapturedAt', 'offerResolution', 'normalizationIssues']) {
    if (typeof value[key] === 'string') partner[key] = value[key].slice(0, 2000);
  }
  return partner;
};

export const normalizeStoredChatMessages = (value) => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || (item.sender !== 'user' && item.sender !== 'bot') || typeof item.text !== 'string') return [];
    const message = { sender: item.sender, text: item.text.slice(0, 3000) };
    if (item.includeInHistory === false) message.includeInHistory = false;
    if (Array.isArray(item.partners)) message.partners = item.partners.map(normalizeStoredPartner).filter(Boolean).slice(0, 20);
    if (Array.isArray(item.suggestedQuestions)) message.suggestedQuestions = item.suggestedQuestions.filter((entry) => typeof entry === 'string').slice(0, 8).map((entry) => entry.slice(0, MAX_QUESTION));
    if (isRecord(item.retry) && typeof item.retry.question === 'string' && Array.isArray(item.retry.messages)) {
      const messages = item.retry.messages
        .filter((entry) => isRecord(entry) && (entry.role === 'user' || entry.role === 'assistant') && typeof entry.content === 'string')
        .slice(-MAX_CONTEXT)
        .map((entry) => ({ role: entry.role, content: entry.content.slice(0, 3000) }));
      const previousCandidateKeys = Array.isArray(item.retry.previousCandidateKeys)
        ? item.retry.previousCandidateKeys.filter((entry) => typeof entry === 'string').slice(0, MAX_CANDIDATES)
        : [];
      message.retry = { question: item.retry.question.slice(0, MAX_QUESTION), messages, previousCandidateKeys };
    }
    return [message];
  }).slice(-MAX_SAVED_MESSAGES);
};

export const buildChatHistory = (messages, initialMessage) =>
  messages
    .filter((message) => message.text !== initialMessage && message.includeInHistory !== false && !message.retry)
    .slice(-MAX_CONTEXT)
    .map((message) => ({ role: message.sender === 'user' ? 'user' : 'assistant', content: message.text }));

export const getPreviousCandidateKeys = (messages) => {
  const latestCards = [...messages].reverse().find((message) => message.partners?.length)?.partners ?? [];
  return [...new Set(latestCards.map((partner) => partner.candidateKey).filter(Boolean))].slice(0, MAX_CANDIDATES);
};

export const groupPartnersByBrand = (partners) => {
  const groups = new Map();
  for (const partner of partners) {
    const name = typeof partner.partnerName === 'string' ? partner.partnerName.trim().toLowerCase() : '';
    const key = partner.partnerId != null ? `id:${partner.partnerId}` : `name:${name}`;
    const group = groups.get(key);
    if (group) group.partners.push(partner);
    else groups.set(key, { key, partnerName: partner.partnerName, partners: [partner] });
  }
  return [...groups.values()];
};

const sharedNonemptyValue = (partners, key) => {
  const values = partners.map((partner) => partner[key]);
  return typeof values[0] === 'string' && values[0].trim() && values.every((value) => value === values[0])
    ? values[0]
    : undefined;
};

export const buildBrandCardSummary = (partners) => {
  const first = partners[0] ?? {};
  const benefitNames = [...new Set(partners
    .map((partner) => partner.benefitName)
    .filter((value) => typeof value === 'string' && value.trim()))];
  const carriers = [...new Set(partners
    .map((partner) => partner.carrier)
    .filter((value) => typeof value === 'string' && value.trim()))];
  const carrier = sharedNonemptyValue(partners, 'carrier');
  const grade = carrier ? sharedNonemptyValue(partners, 'grade') : undefined;
  const usageType = sharedNonemptyValue(partners, 'usageType');
  const storeCounts = partners.map((partner) => partner.storeCount);
  const storeCount = typeof storeCounts[0] === 'number' && storeCounts[0] > 0 && storeCounts.every((value) => value === storeCounts[0])
    ? storeCounts[0]
    : undefined;
  const category = sharedNonemptyValue(partners, 'category');

  return {
    benefitName: partners.length > 0 && benefitNames.length === 1 && partners.every((partner) => typeof partner.benefitName === 'string' && partner.benefitName.trim())
      ? benefitNames[0]
      : `${first.partnerName ?? ''} 멤버십 혜택`,
    carriers,
    ...(carrier ? { carrier } : {}),
    ...(grade ? { grade } : {}),
    ...(usageType ? { usageType } : {}),
    needsConfirmation: partners.some((partner) => partner.offerResolution === 'PARTIAL' || partner.offerResolution === 'UNRESOLVED'),
    ...(storeCount ? { storeCount } : {}),
    ...(category ? { category } : {}),
  };
};

export const createRetryContext = (question, messages, previousCandidateKeys) => ({
  question,
  messages: messages.map((message) => ({ ...message })),
  previousCandidateKeys: [...previousCandidateKeys],
});

export const createRequestGeneration = () => {
  let version = 0;
  return {
    begin: () => ++version,
    cancel: () => ++version,
    isCurrent: (candidate) => candidate === version,
  };
};

export const safeHttpUrl = (value) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
};
