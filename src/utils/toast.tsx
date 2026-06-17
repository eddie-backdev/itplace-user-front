// src/utils/toast.ts
import { toast, ToastOptions, ToastIcon } from 'react-toastify';
import { MdCheckCircle, MdError, MdInfo } from 'react-icons/md';

// ✅ 토스트 중복 방지를 위한 맵 (메시지 -> 마지막 호출 시간)
const lastToastTime = new Map<string, number>();

// ✅ 토스트 중복 방지 시간 (밀리초)
const TOAST_DEBOUNCE_TIME = 3000; // 1초

// ✅ 오래된 기록 정리 (메모리 누수 방지)
const CLEANUP_INTERVAL = 60000; // 1분마다 정리
const MAX_RECORD_AGE = 30000; // 30초 이상 된 기록은 삭제

// 주기적으로 오래된 기록 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of lastToastTime.entries()) {
    if (now - time > MAX_RECORD_AGE) {
      lastToastTime.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

// ✅ 공통 스타일: 작고 세련된 floating pill
const commonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '11px 18px',
  borderRadius: '18px',
  fontSize: '14px',
  fontWeight: 700,
  lineHeight: 1.35,
  whiteSpace: 'normal',
  width: 'fit-content',
  minWidth: '0',
  maxWidth: 'min(420px, calc(100vw - 32px))',
  minHeight: '40px',
  boxShadow: '0 12px 28px rgba(16, 17, 20, 0.18)',
  backdropFilter: 'blur(12px)',
};

// ✅ 타입별 스타일
const toastStyles: Record<'success' | 'error' | 'info', ToastOptions> = {
  success: {
    style: {
      ...commonStyle,
      backgroundColor: 'rgba(20, 158, 97, 0.94)',
      color: '#FFFFFF',
    },
  },
  error: {
    style: {
      ...commonStyle,
      backgroundColor: 'rgba(215, 38, 61, 0.94)',
      color: '#FFFFFF',
    },
  },
  info: {
    style: {
      ...commonStyle,
      backgroundColor: 'rgba(16, 17, 20, 0.9)',
      color: '#FFFFFF',
    },
  },
};

// ✅ 토스트 호출 함수
export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  options?: ToastOptions
) {
  // ✅ 중복 토스트 방지 로직
  const now = Date.now();
  const toastKey = `${message}-${type}`; // 메시지와 타입을 조합한 키
  const lastTime = lastToastTime.get(toastKey);

  // 이전 토스트와 같은 메시지이고, 설정된 시간 내에 호출된 경우 무시
  if (lastTime && now - lastTime < TOAST_DEBOUNCE_TIME) {
    return;
  }

  // 현재 시간을 기록
  lastToastTime.set(toastKey, now);

  let icon: ToastIcon = <MdInfo size={18} color="#FFFFFF" />;

  if (type === 'success') {
    icon = <MdCheckCircle size={18} color="#FFFFFF" />;
  }
  if (type === 'error') {
    icon = <MdError size={18} color="#FFFFFF" />;
  }
  if (type === 'info') {
    icon = <MdInfo size={18} color="#FFFFFF" />;
  }

  // ✅ toast 호출할 때 최종 스타일 병합
  const customStyle: React.CSSProperties = {
    ...toastStyles[type].style, // 기존 색상, 글꼴, 패딩 다 가져오기
    ...options?.style, // 여기에 사용자가 넘긴 width만 덮어쓰기
  };

  toast(message, {
    ...options, // ✅ 먼저 사용자가 전달한 옵션을 펼치기
    position: options?.position || 'top-center',
    icon,
    ...toastStyles[type],
    style: customStyle, // ✅ 맨 마지막에 최종 스타일을 덮어쓰기
    className: 'custom-toast',
  });
}

/*
사용법: 각자 본인이 맡은 페이지 내에서는 토스트가 일관된 너비를 유지하도록
import { showToast } from '../utils/toast';

showToast('성공했습니다!', 'success');
showToast('작업에 실패했습니다.', 'error');
showToast('안내 메시지입니다.', 'info', { position: 'bottom-right' });

👉 width를 지정해서 사용
showToast('삭제가 완료되었습니다.', 'success', {style: { width: '500px' }, });
*/
