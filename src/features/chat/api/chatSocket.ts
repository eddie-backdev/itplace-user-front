import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { USER_CHAT_WS_URL } from '../../../apis/apiConfig';
import { ChatMessage, ChatPublishPayload } from '../types';
import { normalizeChatMessage } from './chatApi';

const parseMessageBody = (message: IMessage): ChatMessage => {
  try {
    return normalizeChatMessage(JSON.parse(message.body));
  } catch {
    return normalizeChatMessage({ content: message.body, senderType: 'SYSTEM' });
  }
};

export class ChatSocketClient {
  private client: Client | null = null;
  private subscriptions: StompSubscription[] = [];

  connect(options: { onConnect: () => void; onDisconnect: () => void; onError: () => void }) {
    this.disconnect();

    this.client = new Client({
      webSocketFactory: () => new SockJS(USER_CHAT_WS_URL),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: options.onConnect,
      onDisconnect: options.onDisconnect,
      onWebSocketClose: options.onDisconnect,
      onStompError: options.onError,
      onWebSocketError: options.onError,
    });

    this.client.activate();
  }

  subscribeRoom(sessionUuid: string, onMessage: (message: ChatMessage) => void) {
    const subscription = this.client?.subscribe(`/topic/chat/${sessionUuid}`, (message) => {
      onMessage(parseMessageBody(message));
    });

    if (!subscription) {
      return () => undefined;
    }

    this.subscriptions.push(subscription);
    return () => {
      subscription.unsubscribe();
      this.subscriptions = this.subscriptions.filter((item) => item.id !== subscription.id);
    };
  }

  publishMessage(payload: ChatPublishPayload) {
    if (!this.client?.connected) {
      return false;
    }

    this.client.publish({
      destination: `/app/chat/${payload.roomId}/send`,
      body: JSON.stringify({ content: payload.content }),
    });

    return true;
  }

  disconnect() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}
