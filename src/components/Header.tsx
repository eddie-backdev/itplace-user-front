import { useEffect, useState } from 'react';
import {
  TbMap2,
  TbUser,
  TbLogout,
  TbLogin,
  TbMapPin,
  TbLayoutList,
  TbSparkles,
  TbMail,
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
  addAiRecommendationChatStateListener,
  openAiRecommendationChat,
} from '../features/aiRecommendationChat/utils/aiRecommendationChatEvents';

const menus = [
  { id: 'map', label: '잇플 맵', icon: TbMap2, path: '/' },
  { id: 'benefits', label: '전체 혜택', icon: TbLayoutList, path: '/benefits' },
  { id: 'mypage', label: '마이페이지', icon: TbUser, path: '/mypage/info' },
];

const primaryNavItemClass =
  'relative flex h-[74px] w-[72px] flex-col items-center justify-center rounded-2xl text-white text-title-8 transition hover:bg-white/15 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

const utilityNavItemClass =
  'flex h-[64px] w-[72px] flex-col items-center justify-center rounded-2xl text-white text-title-8 transition hover:bg-white/15 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70';

const activeNavClass = 'bg-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]';

export default function Header({ variant = 'default' }: { variant?: 'default' | 'glass' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const [isAiRecommendationOpen, setIsAiRecommendationOpen] = useState(false);

  useEffect(() => {
    return addAiRecommendationChatStateListener(setIsAiRecommendationOpen);
  }, []);

  const handleContact = () => {
    const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim() || 'support@itplace.click';
    const subject = encodeURIComponent('[IT: PLACE] 문의하기');
    const body = encodeURIComponent(
      [
        '문의 유형: 오류 신고 / 혜택 정보 수정 / 제휴 문의 / 기타',
        '',
        '문의 내용:',
        '',
        '연락받을 이메일:',
      ].join('\n')
    );

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
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
          'fixed z-30 left-0 top-0 h-full overflow-y-auto scrollbar-hide w-[81px] flex flex-col items-center py-4 rounded-tr-xl rounded-br-xl',
          variant === 'glass' ? 'header-glass bg-[rgba(255,255,255,0.05)]' : 'bg-gradient-header'
        )}
      >
        {/* 로고 영역 */}
        <div className="mb-12 flex flex-col items-center text-white">
          <TbMapPin
            className="text-3xl mb-2 drop-shadow-[0_0_5px_rgba(255,255,255)]"
            strokeWidth={1.3}
          />
          <span className="font-bold text-title-8 drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]">
            IT: PLACE
          </span>
        </div>

        {/* 주요 메뉴 */}
        <nav className="flex-1 flex flex-col items-center gap-y-3">
          {menus.map((m) => {
            const Icon = m.icon;
            const isActive =
              m.id === 'mypage'
                ? location.pathname.startsWith('/mypage')
                : location.pathname === m.path;
            return (
              <Link
                to={m.path}
                key={m.id}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(primaryNavItemClass, isActive && activeNavClass)}
              >
                <Icon className="text-[28px]" strokeWidth={1.35} />
                <span className="mt-1 leading-none">{m.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={openAiRecommendationChat}
            className={clsx(primaryNavItemClass, isAiRecommendationOpen && activeNavClass)}
            aria-pressed={isAiRecommendationOpen}
            aria-label="AI 추천 채팅 열기"
          >
            <TbSparkles className="text-[28px]" strokeWidth={1.35} />
            <span className="mt-1 leading-none">AI 추천</span>
          </button>
        </nav>

        {/* 보조 액션 */}
        <div className="mb-1 mt-6 flex flex-col items-center gap-y-2 border-t border-white/15 pt-3">
          <button
            type="button"
            onClick={handleContact}
            className={utilityNavItemClass}
            aria-label="문의하기"
          >
            <TbMail className="text-[27px]" strokeWidth={1.35} />
            <span className="mt-1 leading-none">문의</span>
          </button>

          {isLoggedIn ? (
            <button className={utilityNavItemClass} onClick={handleLogout} aria-label="로그아웃">
              <TbLogout className="text-[27px]" strokeWidth={1.35} />
              <span className="mt-1 leading-none">로그아웃</span>
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
              <TbLogin className="text-[27px]" strokeWidth={1.35} />
              <span className="mt-1 leading-none">로그인</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
