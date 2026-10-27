'use client';

import { useEffect, useRef, useState } from 'react';
import { TbMenu2, TbX } from 'react-icons/tb';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from '@/lib/navigation';
import { RootState } from '../store';
import { useClientReady } from '../hooks/useClientReady';
import { useLocation } from '@/lib/navigation';
import { getLoginHref } from '../features/loginPage/utils/returnTo.mjs';
import { useLogout } from '../hooks/useLogout';
interface MobileHeaderProps {
  title?: string;
  backgroundColor?: string; // Tailwind 클래스명 등
  onMenuClick?: () => void;
  rightContent?: React.ReactNode;
  iconColor?: string;
}

const menus = [
  { label: '홈', path: '/' },
  { label: '주변 매장', path: '/map' },
  { label: '전체 혜택', path: '/benefits' },
  { label: '관심 혜택', path: '/mypage/favorites' },
  { label: '마이', path: '/mypage', match: '/mypage' },
  { label: '회원 정보', path: '/mypage/info', match: '/mypage/info' },
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
  backgroundColor = 'bg-warmSurface',
  onMenuClick,
  rightContent,
  iconColor,
}: MobileHeaderProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isAuthRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const isClientReady = useClientReady();
  const isAuthReady = isClientReady && isAuthRehydrated;
  const isMain = pathname === '/';
  const currentPath = `${pathname}${search}${hash}`;
  const { handleLogout, isLoggingOut } = useLogout(() => setIsSidebarOpen(false));

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
          `w-full h-[54px] fixed top-0 left-0 flex items-center px-4 z-[9999] border-warmBorder max-md:flex ${backgroundColor} ` +
          (isMain ? 'border-b-none' : 'border-b')
        }
      >
        <div className="flex flex-row items-center h-full w-full">
          <button
            ref={menuButtonRef}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="메뉴"
            aria-expanded={isSidebarOpen}
            aria-controls="mobile-navigation-drawer"
            onClick={handleMenuClick}
          >
            <TbMenu2 className={`h-5 w-5 ${iconColor ?? 'text-ink'}`} />
          </button>
          {title && title !== '잇플레이스' && (
            <span className="flex h-full items-center text-sm font-medium leading-none text-ink">
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
          className="fixed inset-0 z-[var(--itplace-layer-transient-backdrop)] bg-ink/25"
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
        className={`fixed left-0 top-0 z-[var(--itplace-layer-transient-surface)] flex h-full w-[min(320px,88vw)] flex-col overflow-hidden border-r border-warmBorder bg-warmNav ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 사이드바 헤더 */}
        <div className="flex items-center justify-between border-b border-warmBorder px-4 py-2">
          <h2 className="flex min-h-11 items-center text-[15px] font-semibold tracking-[-0.02em] text-ink">
            잇플레이스
          </h2>
          <button
            ref={closeButtonRef}
            className="flex h-11 w-11 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            onClick={closeSidebar}
            aria-label="모바일 메뉴 닫기"
          >
            <TbX className="h-5 w-5 text-ink" />
          </button>
        </div>

        {/* 메뉴 항목들 */}
        <nav
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <ul className="space-y-5">
            {menus.map((menu) => {
              const isActive =
                menu.path === '/'
                  ? pathname === '/'
                  : menu.match === '/mypage'
                    ? pathname.startsWith('/mypage') &&
                      !pathname.startsWith('/mypage/favorites') &&
                      !pathname.startsWith('/mypage/info')
                    : pathname.startsWith(menu.match ?? menu.path);

              return (
                <li key={menu.path}>
                  <Link
                    to={menu.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      isActive
                        ? 'bg-brandSoft text-accentStrong'
                        : 'text-ink hover:bg-warmCanvas hover:text-accentStrong'
                    }`}
                    onClick={closeSidebar}
                  >
                    {menu.label}
                  </Link>
                </li>
              );
            })}
            <li className="border-t border-warmBorder pt-4">
              <p className="mb-2 px-3 text-xs font-medium text-warmMuted">도움말</p>
              <ul className="space-y-1">
                {supportMenus.map((menu) => (
                  <li key={menu.path}>
                    <Link
                      to={menu.path}
                      className="flex min-h-11 items-center rounded-xl px-3 text-sm text-warmMuted hover:bg-warmCanvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      onClick={closeSidebar}
                    >
                      {menu.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              {!isAuthReady ? (
                <div
                  className="min-h-11 w-full rounded-xl px-3 text-left text-sm text-warmMuted"
                  aria-live="polite"
                >
                  로그인 상태 확인 중
                </div>
              ) : isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  aria-busy={isLoggingOut}
                  className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-medium text-ink hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {isLoggingOut ? '로그아웃 중…' : '로그아웃'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate(getLoginHref(currentPath), { replace: true });
                    closeSidebar();
                  }}
                  className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-medium text-accentStrong hover:bg-brandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
