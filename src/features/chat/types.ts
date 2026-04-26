export type ChatSenderType = 'GUEST' | 'ADMIN' | 'SYSTEM';
export type ChatMessageType = 'CHAT' | 'JOIN' | 'LEAVE' | 'CLOSE';
export type ChatRoomStatus = 'ACTIVE' | 'LEFT' | 'CLOSED';
export type ChatConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderType: ChatSenderType;
  content: string;
  messageType: ChatMessageType;
  createdAt: string;
}

export interface ChatRoom {
  roomId: string;
  guestSessionId?: string;
  status: ChatRoomStatus;
  lastMessage?: string;
  unreadCount?: number;
  updatedAt?: string;
}

export interface ChatPublishPayload {
  roomId: string;
  guestSessionId?: string;
  senderType: ChatSenderType;
  messageType: ChatMessageType;
  content: string;
  clientMessageId?: string;
  createdAt: string;
}
