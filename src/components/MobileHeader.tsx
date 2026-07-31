// src/components/MobileHeader.tsx
import { useEffect, useRef, useState } from 'react';
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
  { label: '잇플 맵', path: '/map' },
  { label: '전체 혜택', path: '/benefits' },
  { label: '마이페이지', path: '/mypage/info', match: '/mypage' },
];

const supportMenus = [
  { label: '통신사 멤버십', path: '/membership' },
  { label: '서비스 소개', path: '/about' },
  { label: '혜택 이용 가이드', path: '/guide' },
  { label: 'FAQ', path: '/faq' },
  { label: '문의', path: '/contact' },
  { label: '이용약관', path: '/terms' },
  { label: '개인정보처리방침', path: '/privacy' },
  { label: '계정 삭제 안내', path: '/account-deletion' },
];

const FOCUSABLE_ELEMENT_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const MobileHeader = ({
  title,
  backgroundColor = 'bg-white',
  onMenuClick,
  rightContent,
  iconColor,
}: MobileHeaderProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
    const previousFocus = document.activeElement as HTMLElement | null;
    const fallbackFocus = menuButtonRef.current;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsSidebarOpen(false);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const sidebar = sidebarRef.current;
      if (!sidebar) {
        return;
      }

      const focusableElements = Array.from(
        sidebar.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR)
      ).filter((element) => !element.hasAttribute('disabled'));

      if (focusableElements.length === 0) {
        event.preventDefault();
        sidebar.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstElement || !sidebar.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      const focusTarget = previousFocus?.isConnected ? previousFocus : fallbackFocus;
      focusTarget?.focus();
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
            ref={menuButtonRef}
            className="w-8 flex items-center justify-center mr-3 h-full flex-shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
            aria-label="메뉴"
            aria-expanded={isSidebarOpen}
            aria-controls="mobile-navigation-drawer"
            onClick={handleMenuClick}
          >
            <TbMenu2 className={`w-5 h-5 ${iconColor ?? 'text-black'}`} />
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
        <div
          aria-hidden="true"
          data-itplace-transient-layer="open"
          className="fixed inset-0 z-[var(--itplace-layer-transient-backdrop)] bg-black bg-opacity-50"
          onClick={closeSidebar}
        />
      )}

      {/* 사이드바 */}
      <div
        ref={sidebarRef}
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal={isSidebarOpen ? true : undefined}
        aria-hidden={!isSidebarOpen}
        aria-label="모바일 메뉴"
        data-itplace-transient-layer={isSidebarOpen ? 'open' : undefined}
        inert={!isSidebarOpen}
        tabIndex={-1}
        className={`fixed left-0 top-0 z-[var(--itplace-layer-transient-surface)] flex h-full w-[280px] flex-col overflow-hidden bg-white transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 사이드바 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-grey01">
          <h2 className="text-body-0-bold items-center text-purple04 mt-1">IT: PLACE</h2>
          <button
            ref={closeButtonRef}
            className="flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
            onClick={closeSidebar}
            aria-label="모바일 메뉴 닫기"
          >
            <TbX className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* 메뉴 항목들 */}
        <nav
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
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
            <li className="border-t border-grey01 pt-5">
              <p className="mb-3 px-3 text-caption font-bold text-grey04">서비스 안내</p>
              <ul className="space-y-2">
                {supportMenus.map((menu) => (
                  <li key={menu.path}>
                    <Link
                      to={menu.path}
                      className="block rounded-[12px] px-3 py-2 text-body-3 text-grey06 transition-colors hover:text-purple04 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
                      onClick={closeSidebar}
                    >
                      {menu.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
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
