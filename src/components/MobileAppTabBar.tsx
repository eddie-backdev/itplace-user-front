'use client';

import { useSelector } from 'react-redux';
import { NavLink, useLocation } from '@/lib/navigation';
import { TbBookmark, TbGift, TbHome, TbMap, TbUser } from 'react-icons/tb';
import type { RootState } from '@/store';
import { getLoginHref } from '@/features/loginPage/utils/returnTo.mjs';

const tabs = [
  { to: '/', label: '홈', icon: TbHome, match: (path: string) => path === '/' },
  { to: '/map', label: '지도', icon: TbMap, match: (path: string) => path === '/map' },
  {
    to: '/benefits',
    label: '혜택',
    icon: TbGift,
    match: (path: string) => path.startsWith('/benefits'),
  },
  {
    to: '/mypage/favorites',
    label: '관심 혜택',
    icon: TbBookmark,
    match: (path: string) => path.startsWith('/mypage/favorites'),
  },
  {
    to: '/mypage',
    label: '마이',
    icon: TbUser,
    match: (path: string) => path.startsWith('/mypage') && !path.startsWith('/mypage/favorites'),
  },
];

const MobileAppTabBar = () => {
  const location = useLocation();
  const isAuthenticated = useSelector(
    (state: RootState) => state._persist.rehydrated && state.auth.isLoggedIn
  );

  return (
    <nav
      aria-label="모바일 주요 탭"
      className="itplace-mobile-app-tab-bar fixed bottom-0 left-0 right-0 z-[var(--itplace-layer-app-tab-bar)] border-t border-warmBorder bg-warmNav px-3 pt-1 md:hidden"
      style={{
        height: 'var(--itplace-mobile-tab-bar-offset, 64px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="mx-auto flex h-full max-w-[520px] items-center justify-between gap-1">
        {tabs.map((tab) => {
          const selected = tab.match(location.pathname);
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.to}
              to={
                tab.to === '/mypage/favorites' && !isAuthenticated
                  ? `${getLoginHref(tab.to)}&notice=login-required`
                  : tab.to
              }
              prefetch={tab.to === '/mypage/favorites' && !isAuthenticated ? true : undefined}
              aria-label={`${tab.label} 탭으로 이동`}
              aria-current={selected ? 'page' : undefined}
              className={`relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                selected ? 'bg-softMint text-brandStrong' : 'text-warmMuted'
              }`}
            >
              <Icon
                className={`h-[21px] w-[21px] ${selected ? 'stroke-[2.2]' : 'stroke-[1.8]'}`}
                aria-hidden="true"
              />
              <span
                className={`text-[12px] leading-[15px] ${selected ? 'font-semibold' : 'font-medium'}`}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileAppTabBar;
