import api from '../../../apis/axiosInstance';
import { ChatMessage, ChatMessageType, ChatRoom, ChatRoomStatus, ChatSenderType } from '../types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const unwrapData = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  return 'data' in value ? value.data : value;
};

const readString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const readNumber = (value: unknown, fallback = 0) => (typeof value === 'number' ? value : fallback);

const readRoomStatus = (value: unknown): ChatRoomStatus => {
  if (value === 'LEFT' || value === 'CLOSED') {
    return value;
  }

  return 'ACTIVE';
};

const readSenderType = (value: unknown): ChatSenderType => {
  if (value === 'ADMIN') {
    return 'ADMIN';
  }

  if (value === 'SYSTEM') {
    return 'SYSTEM';
  }

  return 'GUEST';
};

const readMessageType = (value: unknown): ChatMessageType => {
  if (value === 'JOIN' || value === 'LEAVE' || value === 'CLOSE') {
    return value;
  }

  return 'CHAT';
};

export const normalizeChatRoom = (value: unknown, fallbackGuestId?: string): ChatRoom => {
  const data = unwrapData(value);

  if (!isRecord(data)) {
    return {
      roomId: '',
      guestSessionId: fallbackGuestId,
      status: 'ACTIVE',
    };
  }

  const sessionUuid = readString(data.sessionUuid);
  const roomId =
    readString(data.roomId) || readString(data.id) || readString(data.chatRoomId) || sessionUuid;
  const guestId = readString(data.guestId) || readString(data.guestSessionId, fallbackGuestId);

  return {
    roomId,
    guestSessionId: guestId,
    status: readRoomStatus(data.status),
    lastMessage: readString(data.lastMessage) || readString(data.lastMessageContent) || undefined,
    unreadCount: readNumber(data.unreadCount, 0),
    updatedAt:
      readString(data.updatedAt) ||
      readString(data.lastMessageAt) ||
      readString(data.closedAt) ||
      readString(data.createdAt) ||
      undefined,
  };
};

export const normalizeChatMessage = (value: unknown): ChatMessage => {
  const data = unwrapData(value);
  const record = isRecord(data) ? data : {};
  const createdAt = readString(record.createdAt) || new Date().toISOString();
  const id =
    readString(record.id) ||
    readString(record.messageId) ||
    readString(record.clientMessageId) ||
    `${createdAt}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    roomId:
      readString(record.roomId) || readString(record.chatRoomId) || readString(record.sessionUuid),
    senderType: readSenderType(record.senderType),
    content: readString(record.content) || readString(record.message),
    messageType: readMessageType(record.messageType),
    createdAt,
  };
};

export const createGuestChatRoom = async () => {
  const response = await api.post('/api/v1/chat/rooms/guest');
  return normalizeChatRoom(response.data);
};

export const fetchGuestChatRoom = async (guestId: string) => {
  const response = await api.get(`/api/v1/chat/rooms/guest/${guestId}`);
  return normalizeChatRoom(response.data, guestId);
};

export const fetchChatMessages = async (sessionUuid: string) => {
  const response = await api.get(`/api/v1/chat/sessions/${sessionUuid}/messages`);
  const data = unwrapData(response.data);
  const messages = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.messages)
      ? data.messages
      : [];

  return messages.map(normalizeChatMessage);
};
