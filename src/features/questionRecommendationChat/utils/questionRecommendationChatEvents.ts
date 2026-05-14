const QUESTION_RECOMMENDATION_CHAT_OPEN_EVENT = 'itplace-question-recommendation-chat:open';
const QUESTION_RECOMMENDATION_CHAT_TOGGLE_EVENT = 'itplace-question-recommendation-chat:toggle';
const QUESTION_RECOMMENDATION_CHAT_STATE_EVENT = 'itplace-question-recommendation-chat:state';

export const openQuestionRecommendationChat = () => {
  window.dispatchEvent(new Event(QUESTION_RECOMMENDATION_CHAT_OPEN_EVENT));
};

export const toggleQuestionRecommendationChat = () => {
  window.dispatchEvent(new Event(QUESTION_RECOMMENDATION_CHAT_TOGGLE_EVENT));
};

export const notifyQuestionRecommendationChatState = (isOpen: boolean) => {
  window.dispatchEvent(
    new CustomEvent(QUESTION_RECOMMENDATION_CHAT_STATE_EVENT, { detail: { isOpen } })
  );
};

export const addQuestionRecommendationChatOpenListener = (listener: () => void) => {
  window.addEventListener(QUESTION_RECOMMENDATION_CHAT_OPEN_EVENT, listener);

  return () => window.removeEventListener(QUESTION_RECOMMENDATION_CHAT_OPEN_EVENT, listener);
};

export const addQuestionRecommendationChatToggleListener = (listener: () => void) => {
  window.addEventListener(QUESTION_RECOMMENDATION_CHAT_TOGGLE_EVENT, listener);

  return () => window.removeEventListener(QUESTION_RECOMMENDATION_CHAT_TOGGLE_EVENT, listener);
};

export const addQuestionRecommendationChatStateListener = (listener: (isOpen: boolean) => void) => {
  const handleStateChange = (event: Event) => {
    if (event instanceof CustomEvent && typeof event.detail?.isOpen === 'boolean') {
      listener(event.detail.isOpen);
    }
  };

  window.addEventListener(QUESTION_RECOMMENDATION_CHAT_STATE_EVENT, handleStateChange);

  return () =>
    window.removeEventListener(QUESTION_RECOMMENDATION_CHAT_STATE_EVENT, handleStateChange);
};
