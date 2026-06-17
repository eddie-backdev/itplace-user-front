import { NavLink, useLocation } from 'react-router-dom';
import { TbGift, TbHeart, TbHome, TbMap2, TbUserCircle } from 'react-icons/tb';

const tabs = [
  { to: '/', label: '홈', icon: TbHome, match: (path: string) => path === '/' },
  { to: '/map', label: '지도', icon: TbMap2, match: (path: string) => path === '/map' },
  { to: '/benefits', label: '혜택', icon: TbGift, match: (path: string) => path === '/benefits' },
  {
    to: '/mypage/favorites',
    label: '저장',
    icon: TbHeart,
    match: (path: string) => path.startsWith('/mypage/favorites'),
  },
  {
    to: '/mypage/info',
    label: '마이',
    icon: TbUserCircle,
    match: (path: string) => path.startsWith('/mypage') && !path.startsWith('/mypage/favorites'),
  },
];

const MobileAppTabBar = () => {
  const location = useLocation();

  return (
    <nav
      aria-label="모바일 주요 탭"
      className="fixed bottom-0 left-0 right-0 z-[20000] h-[64px] border-t border-black/5 bg-white/95 px-3 pt-1.5 shadow-[0_-8px_24px_rgba(16,17,20,0.08)] backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] px-1 py-1.5 transition active:scale-[0.98] ${
                selected ? 'text-purple05' : 'text-grey04'
              }`}
            >
              <Icon
                className={`h-[22px] w-[22px] ${selected ? 'stroke-[2.5]' : 'stroke-[2.1]'}`}
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
