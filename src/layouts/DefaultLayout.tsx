// src/layouts/DefaultLayout.tsx
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

const DefaultLayout = () => {
  return (
    <div className="flex">
      <div className="max-md:hidden">
        <Header />
      </div>
      <main className="ml-[72px] flex-1 max-md:ml-0">
        {/* 헤더(사이드바) 너비만큼 margin-left, 모바일에서는 0 */}
        <Outlet />
      </main>
    </div>
  );
};

export default DefaultLayout;
