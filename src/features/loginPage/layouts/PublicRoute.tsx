import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../../../store';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  if (isLoggedIn) {
    // 로그인된 사용자라면 메인 페이지로 리다이렉트
    return <Navigate to="/" replace />;
  }

  // 로그인되지 않은 사용자라면 요청된 컴포넌트 렌더링
  return <>{children}</>;
};

export default PublicRoute;
