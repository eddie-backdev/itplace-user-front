import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { TbMessageCircle } from 'react-icons/tb';
import Modal from '../../../components/Modal';
import { getLoginHref } from '../../loginPage/utils/returnTo.mjs';
import { useNavigate, useLocation } from '../../../lib/navigation';
import { useResponsive } from '../../../hooks/useResponsive';
import { RootState } from '../../../store';
import { clearQuestionRecommendationChatStorage } from '../utils/chatSessionStorage.mjs';
import {
  addQuestionRecommendationChatOpenListener,
  addQuestionRecommendationChatToggleListener,
  notifyQuestionRecommendationChatState,
} from '../utils/questionRecommendationChatEvents';
import styles from './QuestionRecommendationChat.module.css';

const QuestionRecommendationChatRoom = dynamic(() => import('./QuestionRecommendationChatRoom'), {
  ssr: false,
  loading: () => <div className={styles.loading}>상담을 준비하고 있어요.</div>,
});

const QuestionRecommendationChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const { isLoggedIn, user } = useSelector((state: RootState) => state.auth);
  const accountKey = JSON.stringify(user ?? {});
  const previousUserRef = useRef(user);
  const wasOpenRef = useRef(false);
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();

  const closeChat = () => setIsOpen(false);
  const closeLoginPrompt = () => {
    setIsLoginPromptOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  };
  const openGuestPrompt = () => setIsLoginPromptOpen(true);

  useEffect(() => {
    if (previousUserRef.current !== user) {
      clearQuestionRecommendationChatStorage();
      previousUserRef.current = user;
    }
    if (!isLoggedIn) clearQuestionRecommendationChatStorage();
  }, [accountKey, isLoggedIn, user]);

  useEffect(() => {
    const removeOpenListener = addQuestionRecommendationChatOpenListener(() => {
      if (isLoggedIn) setIsOpen(true);
      else openGuestPrompt();
    });
    const removeToggleListener = addQuestionRecommendationChatToggleListener(() => {
      if (isLoggedIn) setIsOpen((current) => !current);
      else openGuestPrompt();
    });
    return () => { removeOpenListener(); removeToggleListener(); };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn && isOpen) setIsOpen(false);
  }, [isLoggedIn, isOpen]);

  useEffect(() => {
    if (isLoggedIn && isLoginPromptOpen) setIsLoginPromptOpen(false);
  }, [isLoggedIn, isLoginPromptOpen]);

  useEffect(() => {
    notifyQuestionRecommendationChatState(isOpen && isLoggedIn);
  }, [isOpen, isLoggedIn]);

  useEffect(() => {
    if (!isOpen || !isMobile || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const update = () => {
      document.documentElement.style.setProperty('--chat-vv-height', `${viewport.height}px`);
      document.documentElement.style.setProperty('--chat-vv-offset', `${viewport.offsetTop}px`);
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--chat-vv-height');
      document.documentElement.style.removeProperty('--chat-vv-offset');
    };
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (isOpen) wasOpenRef.current = true;
    else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      if (isLoggedIn) requestAnimationFrame(() => launcherRef.current?.focus());
    }
  }, [isOpen, isLoggedIn]);

  return createPortal(
    <>
      {isLoggedIn && isOpen && <div className={styles.layer}>
        <button type="button" className={styles.backdrop} aria-hidden="true" tabIndex={-1} onClick={closeChat} />
        <section className={`${styles.panel} ${isMobile ? styles.mobilePanel : ''}`}>
          <QuestionRecommendationChatRoom key={accountKey} accountKey={accountKey} onClose={closeChat} presentation="floating" />
        </section>
      </div>}
      {(!isLoggedIn || !isOpen) && <button type="button" onClick={() => isLoggedIn ? setIsOpen(true) : openGuestPrompt()} ref={launcherRef} className={`${styles.launcher} ${isMobile ? styles.mobileLauncher : ''}`} aria-label="AI 혜택 도우미 열기">
        <TbMessageCircle size={20} aria-hidden="true" /><span>AI 혜택 도우미</span>
      </button>}
      <Modal
        isOpen={!isLoggedIn && isLoginPromptOpen}
        widthClass={styles.loginPrompt}
        title="로그인 후 이용해 주세요"
        message="AI 혜택 도우미는 로그인 후 이용할 수 있어요."
        onClose={closeLoginPrompt}
        buttons={[
          { label: '닫기', type: 'secondary', onClick: closeLoginPrompt },
          {
            label: '로그인',
            type: 'primary',
            onClick: () => {
              const returnTo = `${location.pathname}${location.search}${location.hash}`;
              setIsLoginPromptOpen(false);
              navigate(getLoginHref(returnTo));
            },
          },
        ]}
      />
    </>,
    document.body
  );
};

export default QuestionRecommendationChatWidget;
