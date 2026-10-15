import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useSearchParams } from '@/lib/navigation';
import { useClientReady } from '@/hooks/useClientReady';
import { RootState } from '../../../store';
import { getSafeReturnTo, readLoginReturnTo, readOAuthReturnTo } from '../utils/returnTo.mjs';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const isClientReady = useClientReady();
  const [searchParams] = useSearchParams();
  const wasLoggedInOnEntry = useRef<boolean | null>(null);

  if (isClientReady && isRehydrated && wasLoggedInOnEntry.current === null) {
    wasLoggedInOnEntry.current = isLoggedIn;
  }

  if (isClientReady && isRehydrated && wasLoggedInOnEntry.current) {
    return (
      <Navigate
        to={getSafeReturnTo(
          searchParams.get('returnTo') ?? readOAuthReturnTo(readLoginReturnTo())
        )}
        replace
      />
    );
  }

  // 로그인되지 않은 사용자라면 요청된 컴포넌트 렌더링
  return <>{children}</>;
};

export default PublicRoute;
