import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ChatRoom from '../../mainPage/components/SidebarSection/RecommendStoreList/ChatRoom/ChatRoom';
import { useResponsive } from '../../../hooks/useResponsive';
import { RootState } from '../../../store';
import {
  addAiRecommendationChatOpenListener,
  addAiRecommendationChatToggleListener,
  notifyAiRecommendationChatState,
} from '../utils/aiRecommendationChatEvents';

const AiRecommendationChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const { isMobile, isTablet } = useResponsive();

  useEffect(() => {
    const removeOpenListener = addAiRecommendationChatOpenListener(() => {
      if (isLoggedIn) {
        setIsOpen(true);
      }
    });
    const removeToggleListener = addAiRecommendationChatToggleListener(() => {
      if (isLoggedIn) {
        setIsOpen((currentIsOpen) => !currentIsOpen);
      }
    });

    return () => {
      removeOpenListener();
      removeToggleListener();
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn && isOpen) {
      setIsOpen(false);
    }
  }, [isLoggedIn, isOpen]);

  useEffect(() => {
    notifyAiRecommendationChatState(isOpen && isLoggedIn);
  }, [isOpen, isLoggedIn]);

  if (!isOpen || !isLoggedIn) {
    return null;
  }

  const content =
    isMobile || isTablet ? (
      <ChatRoom onClose={() => setIsOpen(false)} presentation="modal" />
    ) : (
      <>
        <button
          type="button"
          className="fixed inset-0 z-[9998] cursor-default bg-transparent"
          onClick={() => setIsOpen(false)}
          aria-label="AI 추천 채팅 닫기"
        />
        <aside className="fixed bottom-0 left-[81px] top-0 z-[9999] w-[370px] max-w-[calc(100vw-81px)]">
          <ChatRoom onClose={() => setIsOpen(false)} presentation="drawer" />
        </aside>
      </>
    );

  return createPortal(content, document.body);
};

export default AiRecommendationChatWidget;
