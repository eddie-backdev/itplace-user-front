import {
  TbSparkles,
  TbMap2,
  TbUser,
  TbLogout,
  TbLogin,
  TbMapPin,
  TbLayoutList,
  TbConfetti,
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

const menus = [
  { id: 'intro', label: '잇플 소개', icon: TbSparkles, path: '/' },
  { id: 'map', label: '잇플 맵', icon: TbMap2, path: '/main' },
  { id: 'benefits', label: '전체 혜택', icon: TbLayoutList, path: '/benefits' },
  { id: 'mypage', label: '마이페이지', icon: TbUser, path: '/mypage/info' },
  { id: 'event', label: '이벤트', icon: TbConfetti, path: '/event' },
];

export default function Header({ variant = 'default' }: { variant?: 'default' | 'glass' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

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
      navigate('/main');
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
        <div className="mb-16 flex flex-col items-center text-white">
          <TbMapPin
            className="text-3xl mb-2 drop-shadow-[0_0_5px_rgba(255,255,255)]"
            strokeWidth={1.3}
          />
          <span className="font-bold text-title-8 drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]">
            IT: PLACE
          </span>
        </div>

        {/* 메뉴들 */}
        <nav className="flex-1 flex flex-col items-center gap-y-6 max-xl:gap-y-3">
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
                className={clsx(
                  'relative flex flex-col items-center justify-center text-white text-title-8 group w-[72px] h-[76px] rounded-xl hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                  isActive && 'drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]'
                )}
              >
                {/* 선택된 메뉴 하이라이트 */}
                {isActive && (
                  <div className="absolute top-1/2 left-1/2 w-[72px] h-[76px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white opacity-25 -z-10 drop-shadow-basic"></div>
                )}
                <Icon className="text-3xl" />
                <span className="mt-1">{m.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 로그인 / 로그아웃 */}
        <div className="mb-1 mt-9">
          {isLoggedIn ? (
            <button
              className="flex flex-col items-center rounded-xl text-white text-sm hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              onClick={handleLogout}
              aria-label="로그아웃"
            >
              <TbLogout className="text-3xl" strokeWidth={1.3} />
              <span className="mt-1 text-title-8">로그아웃</span>
            </button>
          ) : (
            <button
              onClick={() => {
                navigate('/login', {
                  state: { resetToLogin: true },
                  replace: true,
                });
              }}
              className="flex flex-col items-center rounded-xl text-white text-title-8 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <TbLogin className="text-3xl" strokeWidth={1.3} />
              <span className="mt-1">로그인</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
