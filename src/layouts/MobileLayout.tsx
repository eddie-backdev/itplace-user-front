// src/layouts/MobileLayout.tsx
import { Outlet, useLocation } from 'react-router-dom';

const MobileLayout = () => {
  const location = useLocation();
  const isNoMobileLayoutPage = location.pathname === '/benefits';
  const needsPageOwnedHeaderOffset = location.pathname === '/benefits';

  return (
    <div className="max-md:block hidden bg-white min-h-screen">
      <main
        className={`${isNoMobileLayoutPage ? '' : 'px-5'} ${needsPageOwnedHeaderOffset ? '' : 'mt-[54px]'}`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MobileLayout;
