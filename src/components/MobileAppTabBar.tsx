import { NavLink, useLocation } from 'react-router-dom';
import { TbGift, TbHeart, TbHome, TbMap, TbUser } from 'react-icons/tb';

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
    label: '즐겨찾기',
    icon: TbHeart,
    match: (path: string) => path.startsWith('/mypage/favorites'),
  },
  {
    to: '/mypage/info',
    label: '마이',
    icon: TbUser,
    match: (path: string) => path.startsWith('/mypage') && !path.startsWith('/mypage/favorites'),
  },
];

const MobileAppTabBar = () => {
  const location = useLocation();

  return (
    <nav
      aria-label="모바일 주요 탭"
      className="itplace-mobile-app-tab-bar fixed bottom-0 left-0 right-0 z-[var(--itplace-layer-app-tab-bar)] border-t border-warmBorder bg-warmSurface/95 px-3 pt-1 shadow-[0_-6px_18px_rgba(36,35,33,0.06)] backdrop-blur md:hidden"
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
              to={tab.to}
              aria-label={`${tab.label} 탭으로 이동`}
              aria-current={selected ? 'page' : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] px-1 py-1.5 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                selected ? 'text-brandStrong' : 'text-grey04'
              }`}
            >
              <Icon
                className={`h-[22px] w-[22px] transition-transform ${
                  selected ? 'scale-105 stroke-[2.8]' : 'stroke-[1.9]'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-[11px] leading-[14px] ${selected ? 'font-bold' : 'font-semibold'}`}
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
