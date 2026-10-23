// Keep legacy personalized recommendations separate from the new benefit chat.
export const AI_RECOMMENDATION_ENABLED = false;
export const BENEFIT_CHAT_ENABLED = process.env.NEXT_PUBLIC_BENEFIT_CHAT_ENABLED !== 'false';
