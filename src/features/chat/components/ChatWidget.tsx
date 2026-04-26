import { FormEvent, useEffect, useRef, useState } from 'react';
import { TbMessageCircle, TbMinus, TbSend, TbX } from 'react-icons/tb';
import { createGuestChatRoom, fetchChatMessages, fetchGuestChatRoom } from '../api/chatApi';
import { ChatSocketClient } from '../api/chatSocket';
import { ChatConnectionStatus, ChatMessage, ChatRoom } from '../types';
import { getSavedGuestId, saveGuestId } from '../utils/guestSession';

const statusLabel: Record<ChatConnectionStatus, string> = {
  idle: '상담 시작 전',
  connecting: '상담 연결 중',
  connected: '상담 가능',
  disconnected: '연결 끊김',
  error: '연결 오류',
};

const formatTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

const createLocalMessage = (roomId: string, content: string): ChatMessage => {
  const createdAt = new Date().toISOString();

  return {
    id: `local-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    roomId,
    senderType: 'SYSTEM',
    content,
    messageType: 'CHAT',
    createdAt,
  };
};

const ChatWidget = () => {
  const socketRef = useRef<ChatSocketClient | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ChatConnectionStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isChatEnded = room?.status === 'LEFT' || room?.status === 'CLOSED';
  const canTypeMessage = !isChatEnded && !isLoading;
  const canSendMessage =
    Boolean(room?.roomId) && connectionStatus === 'connected' && canTypeMessage;

  const appendMessage = (message: ChatMessage) => {
    setMessages((prevMessages) => {
      if (prevMessages.some((item) => item.id === message.id)) {
        return prevMessages;
      }

      return [...prevMessages, message];
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      socketRef.current?.disconnect();
    };
  }, []);

  const connectRoom = (roomId: string) => {
    setConnectionStatus('connecting');
    unsubscribeRef.current?.();

    const socketClient = new ChatSocketClient();
    socketRef.current?.disconnect();
    socketRef.current = socketClient;

    socketClient.connect({
      onConnect: () => {
        if (socketRef.current !== socketClient) {
          return;
        }

        setConnectionStatus('connected');
        unsubscribeRef.current = socketClient.subscribeRoom(roomId, appendMessage);
      },
      onDisconnect: () => {
        if (socketRef.current !== socketClient) {
          return;
        }

        setConnectionStatus('disconnected');
      },
      onError: () => {
        if (socketRef.current !== socketClient) {
          return;
        }

        setConnectionStatus('error');
        setErrorMessage('상담 서버와 연결하지 못했습니다. 잠시 후 다시 시도해주세요.');
      },
    });
  };

  const loadRoom = async () => {
    if ((room?.roomId && !isChatEnded) || isLoading) {
      return;
    }

    setIsLoading(true);
    setConnectionStatus('connecting');
    setErrorMessage('');

    try {
      let nextRoom: ChatRoom;
      const savedGuestId = getSavedGuestId();

      try {
        nextRoom = savedGuestId
          ? await fetchGuestChatRoom(savedGuestId)
          : await createGuestChatRoom();

        if (nextRoom.status !== 'ACTIVE') {
          nextRoom = await createGuestChatRoom();
        }
      } catch {
        nextRoom = await createGuestChatRoom();
      }

      if (nextRoom.guestSessionId) {
        saveGuestId(nextRoom.guestSessionId);
      }

      setRoom(nextRoom);

      if (nextRoom.roomId) {
        try {
          setMessages(await fetchChatMessages(nextRoom.roomId));
        } catch {
          setMessages([]);
        }

        if (nextRoom.status === 'ACTIVE') {
          connectRoom(nextRoom.roomId);
        }
      }
    } catch {
      setErrorMessage('상담방을 준비하지 못했습니다. 잠시 후 다시 열어주세요.');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    void loadRoom();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = input.trim();

    if (!content || !canTypeMessage) {
      return;
    }

    if (!room?.roomId) {
      setErrorMessage('상담방을 준비하는 중입니다. 잠시 후 다시 전송해주세요.');
      void loadRoom();
      return;
    }

    if (!canSendMessage) {
      setErrorMessage('상담 서버와 연결 중입니다. 잠시 후 다시 전송해주세요.');
      return;
    }

    const createdAt = new Date().toISOString();
    const clientMessageId = `guest-${createdAt}-${Math.random().toString(36).slice(2, 8)}`;
    const published = socketRef.current?.publishMessage({
      roomId: room.roomId,
      senderType: 'GUEST',
      messageType: 'CHAT',
      content,
      clientMessageId,
      createdAt,
    });

    if (!published) {
      setErrorMessage('메시지 전송에 실패했습니다. 연결 상태를 확인해주세요.');
      return;
    }

    setInput('');
  };

  const handleLeave = () => {
    if (!room?.roomId || isChatEnded) {
      return;
    }

    setRoom((prevRoom) => (prevRoom ? { ...prevRoom, status: 'CLOSED' } : prevRoom));
    appendMessage(createLocalMessage(room.roomId, '상담을 종료했습니다.'));
    unsubscribeRef.current?.();
    socketRef.current?.disconnect();
    setConnectionStatus('disconnected');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-md:bottom-4 max-md:right-4">
      {isOpen && (
        <section className="mb-4 flex h-[540px] w-[360px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.2)] max-md:h-[520px] max-md:w-[calc(100vw-32px)]">
          <header className="flex items-center justify-between bg-purple06 px-5 py-4 text-white">
            <div>
              <p className="text-body-2 text-white/80">IT: PLACE</p>
              <h2 className="text-body-0-bold">실시간 채팅 상담</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLeave}
                disabled={!room?.roomId || isChatEnded}
                className="rounded-full bg-white/15 px-3 py-1 text-caption-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                나가기
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"
                aria-label="채팅창 닫기"
              >
                <TbMinus size={18} />
              </button>
            </div>
          </header>

          <div className="flex items-center justify-between border-b border-grey01 px-5 py-3">
            <span className="text-body-3 text-grey05">{statusLabel[connectionStatus]}</span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' : 'bg-grey03'
              }`}
            />
          </div>

          <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto bg-grey01 px-4 py-4">
            {isLoading && (
              <p className="text-center text-body-2 text-grey05">상담방을 준비 중입니다.</p>
            )}
            {!isLoading && messages.length === 0 && (
              <div className="rounded-[18px] bg-white p-4 text-center text-body-2 text-grey05">
                <p>궁금한 내용을 남겨주세요. 관리자가 확인 후 답변드릴게요.</p>
                {!room?.roomId && (
                  <button
                    type="button"
                    onClick={() => void loadRoom()}
                    className="mt-3 rounded-full bg-purple04 px-4 py-2 text-body-3 text-white"
                  >
                    상담 시작하기
                  </button>
                )}
              </div>
            )}
            {messages.map((message) => {
              const isMine = message.senderType === 'GUEST';
              const isSystem = message.senderType === 'SYSTEM' || message.messageType !== 'CHAT';

              if (isSystem) {
                return (
                  <div key={message.id} className="text-center text-caption-1 text-grey05">
                    {message.content}
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[78%] rounded-[18px] px-4 py-2 text-body-2 leading-relaxed ${
                      isMine ? 'bg-purple04 text-white' : 'bg-white text-black'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p
                      className={`mt-1 text-right text-caption-2 ${isMine ? 'text-white/70' : 'text-grey04'}`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {errorMessage && (
            <div className="border-t border-grey01 px-4 py-2">
              <p className="text-caption-1 text-red-500">{errorMessage}</p>
              {!room?.roomId && (
                <button
                  type="button"
                  onClick={() => void loadRoom()}
                  className="mt-2 text-caption-1 text-purple05 underline"
                >
                  상담 다시 시작하기
                </button>
              )}
            </div>
          )}

          {isChatEnded && (
            <div className="border-t border-grey01 px-4 py-3 text-center">
              <p className="mb-2 text-caption-1 text-grey05">종료된 상담입니다.</p>
              <button
                type="button"
                onClick={() => void loadRoom()}
                className="rounded-full bg-purple04 px-4 py-2 text-body-3 text-white"
              >
                새 상담 시작하기
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-grey01 p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={!canTypeMessage}
              placeholder={isChatEnded ? '종료된 상담입니다.' : '메시지를 입력하세요.'}
              className="h-11 flex-1 rounded-full border border-grey02 px-4 text-body-2 outline-none focus:border-purple04 disabled:bg-grey01 disabled:text-grey04"
            />
            <button
              type="submit"
              disabled={!input.trim() || !canTypeMessage}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-purple04 text-white disabled:cursor-not-allowed disabled:bg-grey03"
              aria-label="메시지 전송"
            >
              <TbSend size={20} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-purple05 text-white shadow-[0_12px_35px_rgba(125,86,255,0.45)] transition hover:bg-purple06"
        aria-label={isOpen ? '채팅 상담 접기' : '채팅 상담 열기'}
      >
        {isOpen ? <TbX size={28} /> : <TbMessageCircle size={30} />}
      </button>
    </div>
  );
};

export default ChatWidget;
