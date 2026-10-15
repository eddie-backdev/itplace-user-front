'use client';

import { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '@/apis/axiosInstance';
import { clearCsrfToken } from '@/apis/csrf';
import { persistor } from '@/store';
import { logout } from '@/store/authSlice';
import { showToast } from '@/utils/toast';
import { useNavigate } from '@/lib/navigation';

export function useLogout(onSuccess?: () => void) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const requestInProgress = useRef(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    if (requestInProgress.current) return;

    requestInProgress.current = true;
    setIsLoggingOut(true);
    try {
      await api.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      showToast('로그아웃에 실패했습니다. 다시 시도해주세요.', 'error');
      requestInProgress.current = false;
      setIsLoggingOut(false);
      return;
    }

    clearCsrfToken();
    dispatch(logout());
    await persistor.purge().catch(() => undefined);
    try {
      sessionStorage.removeItem('chatMessages');
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
    showToast('로그아웃 되었습니다.', 'success');
    onSuccess?.();
    navigate('/', { replace: true });
    requestInProgress.current = false;
    setIsLoggingOut(false);
  }, [dispatch, navigate, onSuccess]);

  return { handleLogout, isLoggingOut };
}
