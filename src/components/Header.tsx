import { useEffect, useState } from 'react';
import {
  TbMap2,
  TbUser,
  TbLogout,
  TbLogin,
  TbMapPin,
  TbLayoutList,
  TbSparkles,
  TbInfoCircle,
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
import {
  addQuestionRecommendationChatStateListener,
  openQuestionRecommendationChat,
} from '../features/questionRecommendationChat/utils/questionRecommendationChatEvents';

const menus = [
  { id: 'map', label: '잇플 맵', icon: TbMap2, path: '/' },
  { id: 'benefits', label: '전체 혜택', icon: TbLayoutList, path: '/benefits' },
  { id: 'mypage', label: '마이페이지', icon: TbUser, path: '/mypage/info' },
];

const supportPaths = ['/about', '/guide', '/faq', '/contact', '/terms', '/privacy', '/membership'];

const primaryNavItemClass =
  'relative flex h-[60px] w-full flex-col items-center justify-center rounded-xl border border-[#CEC5E2] bg-[#E5DFF2] text-[11px] font-bold leading-tight text-[#514B60] shadow-[0_3px_8px_rgba(62,47,91,0.10),inset_0_1px_0_rgba(255,255,255,0.58)] transition-[background-color,border-color,color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[#BCAAF0] hover:bg-[#DCD3EF] hover:text-purple06 hover:shadow-[0_6px_13px_rgba(62,47,91,0.15),inset_0_1px_0_rgba(255,255,255,0.62)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple03 focus-visible:ring-offset-1 focus-visible:ring-offset-purple01';

const utilityNavItemClass =
  'relative flex h-[52px] w-full flex-col items-center justify-center rounded-xl border border-[#D3CBE3] bg-[#E8E3F2] text-[11px] font-bold leading-tight text-[#5D576A] shadow-[0_2px_7px_rgba(62,47,91,0.09),inset_0_1px_0_rgba(255,255,255,0.54)] transition-[background-color,border-color,color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[#BCAAF0] hover:bg-[#DED5EF] hover:text-purple06 hover:shadow-[0_5px_11px_rgba(62,47,91,0.14),inset_0_1px_0_rgba(255,255,255,0.60)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple03 focus-visible:ring-offset-1 focus-visible:ring-offset-purple01';

const activeNavClass =
  '!border-[#7565E6] !bg-purple05 !text-white !shadow-[0_8px_18px_rgba(48,30,105,0.28),0_2px_5px_rgba(48,30,105,0.18),inset_0_2px_0_rgba(255,255,255,0.28),inset_0_-4px_0_rgba(45,27,113,0.34)] hover:!-translate-y-0.5 hover:!border-[#806EF0] hover:!bg-purple05 hover:!text-white hover:!shadow-[0_10px_20px_rgba(48,30,105,0.30),0_3px_6px_rgba(48,30,105,0.18),inset_0_2px_0_rgba(255,255,255,0.32),inset_0_-4px_0_rgba(45,27,113,0.36)] active:!translate-y-px active:!shadow-[0_4px_10px_rgba(48,30,105,0.24),0_1px_3px_rgba(48,30,105,0.16),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-2px_0_rgba(45,27,113,0.30)]';

export default function Header({ variant = 'default' }: { variant?: 'default' | 'glass' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const [isQuestionRecommendationOpen, setIsQuestionRecommendationOpen] = useState(false);
  const isSupportActive =
    supportPaths.includes(location.pathname) || location.pathname.startsWith('/membership/');

  useEffect(() => {
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
          'fixed left-0 top-0 z-30 flex h-full w-20 flex-col items-center overflow-y-auto rounded-br-2xl rounded-tr-2xl border-r border-purple02 bg-purple01 px-2 py-3 shadow-[4px_0_18px_rgba(91,30,207,0.10)] scrollbar-hide',
          variant === 'glass' && 'header-glass bg-purple01/90'
        )}
      >
        {/* 로고 영역 */}
        <div className="mb-8 flex flex-col items-center text-purple05">
          <span className="mb-1.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-purple02 bg-white shadow-[0_5px_12px_rgba(91,30,207,0.10)]">
            <TbMapPin className="text-[21px]" strokeWidth={1.7} />
          </span>
          <span className="whitespace-nowrap text-[10px] font-extrabold tracking-[-0.02em] text-purple06">
            IT: PLACE
          </span>
        </div>

        {/* 주요 메뉴 */}
        <nav className="flex w-full flex-1 flex-col items-center gap-y-4" aria-label="주요 메뉴">
          {menus.map((m) => {
            const Icon = m.icon;
            const isActive =
              m.id === 'mypage'
                ? location.pathname.startsWith('/mypage')
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
                  className={clsx('text-[20px]', isActive ? 'text-white' : 'text-purple05')}
                  strokeWidth={1.7}
                />
                <span className="mt-1 whitespace-nowrap leading-none">{m.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleQuestionRecommendationClick}
            className={clsx(primaryNavItemClass, isQuestionRecommendationOpen && activeNavClass)}
            aria-pressed={isQuestionRecommendationOpen}
            aria-label="질문형 AI 추천 열기"
          >
            <TbSparkles
              className={clsx(
                'text-[20px]',
                isQuestionRecommendationOpen ? 'text-white' : 'text-purple05'
              )}
              strokeWidth={1.7}
            />
            <span className="mt-1 whitespace-nowrap leading-none">AI 질문</span>
          </button>
        </nav>

        {/* 보조 액션 */}
        <div className="mb-1 mt-4 flex w-full flex-col items-center gap-y-3 border-t border-purple02 pt-3">
          <Link
            to="/about"
            className={clsx(utilityNavItemClass, isSupportActive && activeNavClass)}
            aria-label="서비스 안내 보기"
            aria-current={isSupportActive ? 'page' : undefined}
          >
            <TbInfoCircle
              className={clsx('text-[18px]', isSupportActive ? 'text-white' : 'text-purple05')}
              strokeWidth={1.7}
            />
            <span className="mt-1 whitespace-nowrap leading-none">안내</span>
          </Link>

          {isLoggedIn ? (
            <button className={utilityNavItemClass} onClick={handleLogout} aria-label="로그아웃">
              <TbLogout className="text-[18px] text-purple05" strokeWidth={1.7} />
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
              <TbLogin className="text-[18px] text-purple05" strokeWidth={1.7} />
              <span className="mt-1 whitespace-nowrap leading-none">로그인</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
