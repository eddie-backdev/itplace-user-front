const AI_RECOMMENDATION_CHAT_OPEN_EVENT = 'itplace-ai-recommendation-chat:open';
const AI_RECOMMENDATION_CHAT_TOGGLE_EVENT = 'itplace-ai-recommendation-chat:toggle';
const AI_RECOMMENDATION_CHAT_STATE_EVENT = 'itplace-ai-recommendation-chat:state';

export const openAiRecommendationChat = () => {
  window.dispatchEvent(new Event(AI_RECOMMENDATION_CHAT_OPEN_EVENT));
};

export const toggleAiRecommendationChat = () => {
  window.dispatchEvent(new Event(AI_RECOMMENDATION_CHAT_TOGGLE_EVENT));
};

export const notifyAiRecommendationChatState = (isOpen: boolean) => {
  window.dispatchEvent(new CustomEvent(AI_RECOMMENDATION_CHAT_STATE_EVENT, { detail: { isOpen } }));
};

export const addAiRecommendationChatOpenListener = (listener: () => void) => {
  window.addEventListener(AI_RECOMMENDATION_CHAT_OPEN_EVENT, listener);

  return () => window.removeEventListener(AI_RECOMMENDATION_CHAT_OPEN_EVENT, listener);
};

export const addAiRecommendationChatToggleListener = (listener: () => void) => {
  window.addEventListener(AI_RECOMMENDATION_CHAT_TOGGLE_EVENT, listener);

  return () => window.removeEventListener(AI_RECOMMENDATION_CHAT_TOGGLE_EVENT, listener);
};

export const addAiRecommendationChatStateListener = (listener: (isOpen: boolean) => void) => {
  const handleStateChange = (event: Event) => {
    if (event instanceof CustomEvent && typeof event.detail?.isOpen === 'boolean') {
      listener(event.detail.isOpen);
    }
  };

  window.addEventListener(AI_RECOMMENDATION_CHAT_STATE_EVENT, handleStateChange);

  return () => window.removeEventListener(AI_RECOMMENDATION_CHAT_STATE_EVENT, handleStateChange);
};
