// src/components/ScrollToTop.tsx
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // 메인 페이지는 자체 레이아웃에서 처리하므로 제외
    if (pathname === '/') return;

    // 일반 페이지들은 단순 스크롤 초기화
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
