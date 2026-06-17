// src/layouts/MobileLayout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import MobileAppTabBar from '../components/MobileAppTabBar';

const isAppTabPath = (pathname: string) =>
  pathname === '/' ||
  pathname === '/map' ||
  pathname === '/benefits' ||
  pathname.startsWith('/mypage');

const MobileLayout = () => {
  const location = useLocation();
  const showTabBar = isAppTabPath(location.pathname);
  const isFullBleedPage = location.pathname === '/map' || location.pathname === '/benefits';
  const isAuthPage = location.pathname === '/login';

  return (
    <div
      className={`${showTabBar ? 'bg-purple01/60' : 'bg-white'} max-md:block hidden min-h-screen`}
    >
      <main
        className={`${isFullBleedPage || isAuthPage ? '' : 'px-0'} ${showTabBar ? 'pb-[64px]' : ''}`}
      >
        <Outlet />
      </main>
      {showTabBar && <MobileAppTabBar />}
    </div>
  );
};

export default MobileLayout;
