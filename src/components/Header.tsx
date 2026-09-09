import { useEffect, useState } from 'react';
import {
  TbMap,
  TbUser,
  TbLogout,
  TbLogin,
  TbTicket,
  TbSparkles,
  TbInfoCircle,
  TbBookmark,
} from 'react-icons/tb';
import clsx from 'clsx';
import { useLocation, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import api from '../apis/axiosInstance';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import { persistor } from '../store';
import { showToast } from '../utils/toast';
import { AI_RECOMMENDATION_ENABLED } from '../config/features';
import {
  addQuestionRecommendationChatStateListener,
  openQuestionRecommendationChat,
} from '../features/questionRecommendationChat/utils/questionRecommendationChatEvents';

const menus = [
  { id: 'map', label: '지도', icon: TbMap, path: '/map' },
  { id: 'benefits', label: '혜택', icon: TbTicket, path: '/benefits' },
  { id: 'favorites', label: '즐겨찾기', icon: TbBookmark, path: '/mypage/favorites' },
  { id: 'mypage', label: '마이', icon: TbUser, path: '/mypage/info' },
];

const supportPaths = ['/about', '/guide', '/faq', '/contact', '/terms', '/privacy', '/membership'];

const primaryNavItemClass =
  'group relative flex h-[58px] w-full flex-col items-center justify-center rounded-2xl text-[11px] font-bold leading-tight text-grey05 transition-[color,transform] hover:text-grey06 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-warmNav';

const utilityNavItemClass =
  'group relative flex h-[48px] w-full flex-col items-center justify-center rounded-2xl text-[10px] font-bold leading-tight text-grey05 transition-[color,transform] hover:text-grey06 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-warmNav';

const activeNavClass = '!text-grey07';

export default function Header({ variant = 'default' }: { variant?: 'default' | 'glass' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const [isQuestionRecommendationOpen, setIsQuestionRecommendationOpen] = useState(false);
  const isSupportActive =
    supportPaths.includes(location.pathname) || location.pathname.startsWith('/membership/');

  useEffect(() => {
    if (!AI_RECOMMENDATION_ENABLED) return;
    return addQuestionRecommendationChatStateListener(setIsQuestionRecommendationOpen);
  }, []);

  const handleQuestionRecommendationClick = () => {
    if (!isLoggedIn) {
      showToast('질문형 AI 추천은 로그인 후 사용할 수 있습니다.', 'info');
      return;
    }

    openQuestionRecommendationChat();
  };

  const handleLogout = async () => {
    try {
      // 로그아웃 API 호출
      await api.post('api/v1/auth/logout');
      // 상태 초기화
      dispatch(logout());
      // redux-persist 초기화
      persistor.purge();
      // 성공 토스트 표시
      showToast('로그아웃 되었습니다.', 'success');
      sessionStorage.removeItem('questionRecommendationChatMessages');
      sessionStorage.removeItem('chatMessages');
      // 페이지 이동
      navigate('/');
    } catch (err) {
      console.error('로그아웃 실패:', err);
      // 실패 토스트 표시
      showToast('로그아웃에 실패했습니다.', 'error');
    }
  };

  return (
    <>
      <aside
        className={clsx(
          'fixed left-0 top-0 z-30 flex h-full w-[88px] flex-col items-center overflow-y-auto border-r border-warmBorder bg-warmNav px-2.5 py-4 scrollbar-hide',
          variant === 'glass' && 'header-glass bg-warmNav/90'
        )}
      >
        {/* 로고 영역 */}
        <Link
          to="/map"
          className="mb-8 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] transition-transform hover:scale-[1.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-warmNav"
          aria-label="ITPLACE 지도 홈"
        >
          <img src="/brand/itplace-mark-b-rail.svg" alt="" className="h-9 w-9" />
        </Link>

        {/* 주요 메뉴 */}
        <nav className="flex w-full flex-1 flex-col items-center gap-y-2" aria-label="주요 메뉴">
          {menus.map((m) => {
            const Icon = m.icon;
            const isActive =
              m.id === 'map'
                ? location.pathname === '/' || location.pathname === '/map'
                : m.id === 'favorites'
                  ? location.pathname.startsWith('/mypage/favorites')
                  : m.id === 'mypage'
                    ? location.pathname.startsWith('/mypage') &&
                      !location.pathname.startsWith('/mypage/favorites')
                    : m.id === 'benefits'
                      ? location.pathname.startsWith('/benefits')
                      : location.pathname === m.path;
            return (
              <Link
                to={m.path}
                key={m.id}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(primaryNavItemClass, isActive && activeNavClass)}
              >
                <Icon
                  className={clsx(
                    'text-[21px] transition-[color,transform]',
                    isActive ? 'scale-110 text-brandStrong' : 'text-grey05 group-hover:text-grey06'
                  )}
                  strokeWidth={isActive ? 2.8 : 1.7}
                />
                <span className="mt-1 whitespace-nowrap leading-none">{m.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 보조 액션 */}
        <div className="mb-1 mt-4 flex w-full flex-col items-center gap-y-1 border-t border-warmBorder pt-3">
          {AI_RECOMMENDATION_ENABLED && (
            <button
              type="button"
              onClick={handleQuestionRecommendationClick}
              className={clsx(utilityNavItemClass, isQuestionRecommendationOpen && activeNavClass)}
              aria-pressed={isQuestionRecommendationOpen}
              aria-label="질문형 AI 추천 열기"
            >
              <TbSparkles
                className={clsx(
                  'text-[18px]',
                  isQuestionRecommendationOpen
                    ? 'scale-110 text-brandStrong'
                    : 'text-grey05 group-hover:text-grey06'
                )}
                strokeWidth={isQuestionRecommendationOpen ? 2.8 : 1.7}
              />
              <span className="mt-1 whitespace-nowrap leading-none">AI 추천</span>
            </button>
          )}

          <Link
            to="/about"
            className={clsx(utilityNavItemClass, isSupportActive && activeNavClass)}
            aria-label="서비스 안내 보기"
            aria-current={isSupportActive ? 'page' : undefined}
          >
            <TbInfoCircle
              className={clsx(
                'text-[18px]',
                isSupportActive
                  ? 'scale-110 text-brandStrong'
                  : 'text-grey05 group-hover:text-grey06'
              )}
              strokeWidth={isSupportActive ? 2.8 : 1.7}
            />
            <span className="mt-1 whitespace-nowrap leading-none">안내</span>
          </Link>

          {isLoggedIn ? (
            <button className={utilityNavItemClass} onClick={handleLogout} aria-label="로그아웃">
              <TbLogout className="text-[18px]" strokeWidth={1.8} />
              <span className="mt-1 whitespace-nowrap leading-none">로그아웃</span>
            </button>
          ) : (
            <button
              onClick={() => {
                navigate('/login', {
                  state: { resetToLogin: true },
                  replace: true,
                });
              }}
              className={utilityNavItemClass}
            >
              <TbLogin className="text-[18px]" strokeWidth={1.8} />
              <span className="mt-1 whitespace-nowrap leading-none">로그인</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
