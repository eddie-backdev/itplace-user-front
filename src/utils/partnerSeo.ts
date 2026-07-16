export const createPartnerSlug = (partnerName: string) => {
  const slug = partnerName
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('ko-KR')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'partner';
};

export const getPartnerBenefitPath = (partnerId: number, partnerName: string) =>
  `/benefits/partners/${partnerId}/${createPartnerSlug(partnerName)}`;

export const getCarrierMembershipPath = (carrier: string) => {
  if (carrier === 'SKT') return '/membership/skt';
  if (carrier === 'KT') return '/membership/kt';
  return '/membership/lguplus';
};
