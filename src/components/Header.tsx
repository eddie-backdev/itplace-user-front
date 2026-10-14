import { useEffect, useState } from 'react';
import {
  TbBook2,
  TbBookmark,
  TbCalendarEvent,
  TbGift,
  TbHelpCircle,
  TbHome,
  TbInfoCircle,
  TbChevronLeft,
  TbLogin,
  TbLogout,
  TbMap,
  TbSparkles,
  TbUser,
} from 'react-icons/tb';
import clsx from 'clsx';
import { useLocation, Link, useNavigate } from '@/lib/navigation';
import api from '../apis/axiosInstance';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { useClientReady } from '../hooks/useClientReady';
import { getLoginHref } from '../features/loginPage/utils/returnTo.mjs';
import { logout } from '../store/authSlice';
import { persistor } from '../store';
import { showToast } from '../utils/toast';
import { AI_RECOMMENDATION_ENABLED } from '../config/features';
import {
  addQuestionRecommendationChatStateListener,
  openQuestionRecommendationChat,
} from '../features/questionRecommendationChat/utils/questionRecommendationChatEvents';
import styles from './Header.module.css';

const exploreMenus = [
  { id: 'home', label: '홈', icon: TbHome, path: '/' },
  { id: 'map', label: '주변 매장', icon: TbMap, path: '/map' },
  { id: 'benefits', label: '전체 혜택', icon: TbGift, path: '/benefits' },
];

const accountMenus = [
  { id: 'favorites', label: '관심 혜택', icon: TbBookmark, path: '/mypage/favorites' },
  { id: 'activity', label: '사용 기록', icon: TbCalendarEvent, path: '/mypage/activity' },
  { id: 'profile', label: '회원 정보', icon: TbUser, path: '/mypage/info' },
];

const helpMenus = [
  { id: 'guide', label: '이용 가이드', icon: TbBook2, path: '/guide' },
  { id: 'faq', label: '자주 묻는 질문', icon: TbHelpCircle, path: '/faq' },
  { id: 'about', label: '서비스 안내', icon: TbInfoCircle, path: '/about' },
];

const itemClass = styles.menuItem;
const activeClass = styles.active;

function MenuGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: Array<{ id: string; label: string; icon: typeof TbHome; path: string }>;
  pathname: string;
}) {
  return (
    <div className={styles.menuGroup}>
      <h2 className={styles.groupTitle}>{title}</h2>
      <ul className={styles.menuList}>
        {items.map(({ id, label, icon: Icon, path }) => {
          const active =
            id === 'home'
              ? pathname === '/'
              : id === 'map'
                ? pathname === '/map'
                : id === 'benefits'
                  ? pathname.startsWith('/benefits')
                  : pathname.startsWith(path);
          return (
            <li key={id}>
              <Link
                to={path}
                aria-label={label}
                title={label}
                aria-current={active ? 'page' : undefined}
                className={clsx(itemClass, active && activeClass)}
              >
                <Icon className={styles.icon} strokeWidth={active ? 2 : 1.8} aria-hidden="true" />
                <span className={styles.menuLabel}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Header({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isAuthRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const isClientReady = useClientReady();
  const isAuthReady = isClientReady && isAuthRehydrated;
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const [isQuestionRecommendationOpen, setIsQuestionRecommendationOpen] = useState(false);

  useEffect(() => {
    if (!AI_RECOMMENDATION_ENABLED) return;
    return addQuestionRecommendationChatStateListener(setIsQuestionRecommendationOpen);
  }, []);

  const handleQuestionRecommendationClick = () => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      showToast('질문형 AI 추천은 로그인 후 사용할 수 있습니다.', 'info');
      return;
    }
    openQuestionRecommendationChat();
  };

  const handleLogout = async () => {
    try {
      await api.post('api/v1/auth/logout');
      dispatch(logout());
      persistor.purge();
      showToast('로그아웃 되었습니다.', 'success');
      sessionStorage.removeItem('questionRecommendationChatMessages');
      sessionStorage.removeItem('chatMessages');
      navigate('/');
    } catch (err) {
      console.error('로그아웃 실패:', err);
      showToast('로그아웃에 실패했습니다.', 'error');
    }
  };

  const renderAuthAction = () => {
    if (!isAuthReady) {
      return <span className={styles.authLoading} aria-label="로그인 상태 확인 중" />;
    }
    if (isLoggedIn) {
      return (
        <button type="button" onClick={handleLogout} className={itemClass} aria-label="로그아웃" title="로그아웃">
          <TbLogout className={styles.icon} aria-hidden="true" />
          <span className={styles.menuLabel}>로그아웃</span>
        </button>
      );
    }
    return (
      <Link
        to={getLoginHref(currentPath)}
        replace
        className={itemClass}
        aria-label="로그인"
        title="로그인"
      >
        <TbLogin className={styles.icon} aria-hidden="true" />
        <span className={styles.menuLabel}>로그인</span>
      </Link>
    );
  };

  return (
    <aside className={styles.panel} aria-label="사이트 내비게이션" data-collapsed={isCollapsed}>
      <button
        type="button"
        onClick={onToggle}
        className={styles.collapseButton}
        aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
        aria-expanded={!isCollapsed}
        aria-controls="site-primary-navigation"
        title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
      >
        <TbChevronLeft className={styles.collapseIcon} aria-hidden="true" />
      </button>
      <div className={styles.panelContent}>
        <div className={styles.brandHeader}>
          <Link
            to="/"
            aria-label="잇플레이스 홈"
            aria-current={location.pathname === '/' ? 'page' : undefined}
            className={styles.brandLink}
          >
            <img
              src="/brand/itplace-mark-b-rail.svg"
              alt=""
              width="28"
              height="28"
              className={styles.brandMark}
            />
            <span className={styles.brandName}>잇플레이스</span>
          </Link>
        </div>

        <nav id="site-primary-navigation" aria-label="주요 메뉴" className={styles.navigation}>
          <MenuGroup title="둘러보기" items={exploreMenus} pathname={location.pathname} />
          <MenuGroup title="내 정보" items={accountMenus} pathname={location.pathname} />
          <MenuGroup title="도움말" items={helpMenus} pathname={location.pathname} />
        </nav>

        <div className={styles.footer}>
          {AI_RECOMMENDATION_ENABLED && (
            <button
              type="button"
              onClick={handleQuestionRecommendationClick}
              className={clsx(itemClass, isQuestionRecommendationOpen && activeClass)}
              aria-pressed={isQuestionRecommendationOpen}
              aria-label="질문형 AI 추천 열기"
              title="AI 추천"
            >
              <TbSparkles className={styles.icon} aria-hidden="true" />
              <span className={styles.menuLabel}>AI 추천</span>
            </button>
          )}
          <div className={styles.footerDivider} />
          {renderAuthAction()}
        </div>
      </div>
    </aside>
  );
}
