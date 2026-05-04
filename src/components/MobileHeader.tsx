// src/components/MobileHeader.tsx
import { useEffect, useState } from 'react';
import { TbMenu2, TbX } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { showToast } from '../utils/toast';
import { persistor } from '../store';
import { RootState } from '../store';
import { useLocation } from 'react-router-dom';
import { logout } from '../store/authSlice';
import api from '../apis/axiosInstance';
interface MobileHeaderProps {
  title?: string;
  backgroundColor?: string; // Tailwind 클래스명 등
  onMenuClick?: () => void;
  rightContent?: React.ReactNode;
  iconColor?: string;
}

const menus = [
  { label: '잇플 맵', path: '/' },
  { label: '전체 혜택', path: '/benefits' },
  { label: '마이페이지', path: '/mypage/info', match: '/mypage' },
];

const MobileHeader = ({
  title,
  backgroundColor = 'bg-white',
  onMenuClick,
  rightContent,
  iconColor,
}: MobileHeaderProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isMain = pathname === '/';

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
      setIsSidebarOpen(false);
      sessionStorage.removeItem('chatMessages');
      // 페이지 이동
      navigate('/');
    } catch (err) {
      console.error('로그아웃 실패:', err);
      // 실패 토스트 표시
      showToast('로그아웃에 실패했습니다.', 'error');
    }
  };

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
    onMenuClick?.();
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (!isSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]);

  return (
    <>
      <header
        className={
          `w-full h-[54px] fixed top-0 left-0 flex items-center px-4 z-[9999] border-grey01 max-md:flex ${backgroundColor} ` +
          (isMain ? 'border-b-none' : 'border-b')
        }
      >
        <div className="flex flex-row items-center h-full w-full">
          <button
            className="w-8 flex items-center justify-center mr-3 h-full flex-shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
            aria-label="메뉴"
            aria-expanded={isSidebarOpen}
            aria-controls="mobile-navigation-drawer"
            onClick={handleMenuClick}
          >
            <TbMenu2 className={`w-5 h-5 ${iconColor ?? 'text-[#000000]'}`} />
          </button>
          {title && (
            <span className="text-body-2 text-black leading-none flex items-center h-full mt-[5px]">
              {title}
            </span>
          )}
          {rightContent && <div className="flex-1">{rightContent}</div>}
        </div>
      </header>

      {/* 오버레이 */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000]" onClick={closeSidebar} />
      )}

      {/* 사이드바 */}
      <div
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="모바일 메뉴"
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[10001] transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 사이드바 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-grey01">
          <h2 className="text-body-0-bold items-center text-purple04 mt-1">IT: PLACE</h2>
          <button
            className="w-6 h-6 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
            onClick={closeSidebar}
            aria-label="닫기"
          >
            <TbX className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* 메뉴 항목들 */}
        <nav className="p-4">
          <ul className="space-y-6">
            {menus.map((menu) => {
              const isActive =
                menu.path === '/' ? pathname === '/' : pathname.startsWith(menu.match ?? menu.path);

              return (
                <li key={menu.path}>
                  <Link
                    to={menu.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block rounded-[12px] px-3 py-2 text-body-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 ${
                      isActive
                        ? 'bg-purple01 text-purple04 font-semibold'
                        : 'text-black hover:text-purple04'
                    }`}
                    onClick={closeSidebar}
                  >
                    {menu.label}
                  </Link>
                </li>
              );
            })}
            <li>
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="w-full rounded-[12px] px-3 py-2 text-body-0 text-black hover:text-purple04 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
                >
                  로그아웃
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate('/login', {
                      state: { resetToLogin: true },
                      replace: true,
                    });
                    closeSidebar();
                  }}
                  className="w-full rounded-[12px] px-3 py-2 text-body-0 text-purple04 hover:text-purple05 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
                >
                  로그인
                </button>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MobileHeader;
