export const USER_API_BASE_URL =
  import.meta.env.VITE_APP_BASE_URL?.trim() || 'http://localhost:8080/';

export const USER_CHAT_WS_URL =
  import.meta.env.VITE_CHAT_WS_URL?.trim() || 'http://localhost:8080/ws-chat';
