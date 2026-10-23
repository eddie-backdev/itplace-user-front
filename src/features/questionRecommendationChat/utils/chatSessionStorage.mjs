const STORAGE_PREFIX = 'questionRecommendationChatMessages:';

export const clearQuestionRecommendationChatStorage = (storage) => {
  try {
    const target = storage ?? globalThis.sessionStorage;
    Object.keys(target)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => target.removeItem(key));
  } catch {
    // Storage can be disabled or unavailable.
  }
};
