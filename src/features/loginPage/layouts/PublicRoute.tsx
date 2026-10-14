import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useSearchParams } from '@/lib/navigation';
import { RootState } from '../../../store';
import { getSafeReturnTo } from '../utils/returnTo.mjs';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const [searchParams] = useSearchParams();

  if (isLoggedIn) {
    return <Navigate to={getSafeReturnTo(searchParams.get('returnTo'))} replace />;
  }

  // 로그인되지 않은 사용자라면 요청된 컴포넌트 렌더링
  return <>{children}</>;
};

export default PublicRoute;
