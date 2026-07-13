import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import QuestionRecommendationChatRoom from './QuestionRecommendationChatRoom';
import { useResponsive } from '../../../hooks/useResponsive';
import { RootState } from '../../../store';
import {
  addQuestionRecommendationChatOpenListener,
  addQuestionRecommendationChatToggleListener,
  notifyQuestionRecommendationChatState,
} from '../utils/questionRecommendationChatEvents';

const QuestionRecommendationChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const { isMobile, isTablet } = useResponsive();

  useEffect(() => {
    const removeOpenListener = addQuestionRecommendationChatOpenListener(() => {
      if (isLoggedIn) {
        setIsOpen(true);
      }
    });
    const removeToggleListener = addQuestionRecommendationChatToggleListener(() => {
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
    notifyQuestionRecommendationChatState(isOpen && isLoggedIn);
  }, [isOpen, isLoggedIn]);

  if (!isOpen || !isLoggedIn) {
    return null;
  }

  const content =
    isMobile || isTablet ? (
      <QuestionRecommendationChatRoom onClose={() => setIsOpen(false)} presentation="modal" />
    ) : (
      <>
        <button
          type="button"
          className="fixed inset-0 z-[9998] cursor-default bg-transparent"
          onClick={() => setIsOpen(false)}
          aria-label="질문형 AI 추천 닫기"
        />
        <aside className="fixed bottom-0 left-20 top-0 z-[9999] w-[370px] max-w-[calc(100vw-80px)]">
          <QuestionRecommendationChatRoom onClose={() => setIsOpen(false)} presentation="drawer" />
        </aside>
      </>
    );

  return createPortal(content, document.body);
};

export default QuestionRecommendationChatWidget;
