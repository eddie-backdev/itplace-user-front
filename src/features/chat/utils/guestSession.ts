const GUEST_CHAT_ID_KEY = 'itplace_guest_chat_guest_id';
const LEGACY_GUEST_CHAT_SESSION_KEY = 'itplace_guest_chat_session_id';

export const getSavedGuestId = () =>
  localStorage.getItem(GUEST_CHAT_ID_KEY) || localStorage.getItem(LEGACY_GUEST_CHAT_SESSION_KEY);

export const saveGuestId = (guestId: string) => {
  localStorage.setItem(GUEST_CHAT_ID_KEY, guestId);
  localStorage.removeItem(LEGACY_GUEST_CHAT_SESSION_KEY);
};
