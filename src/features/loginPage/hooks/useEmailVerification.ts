import { checkResetEmailVerificationCode } from './../apis/user';
import { useState } from 'react';
import axios from 'axios';
import { sendEmailVerificationCode, checkEmailVerificationCode } from '../apis/verification';
import { sendFindPasswordEmail } from '../apis/user';
import { showToast } from '../../../utils/toast';

type Mode = 'signup' | 'reset';

type UseEmailVerificationProps = {
  email: string;
  onVerifiedChange?: (verified: boolean) => void;
  mode?: Mode;
  onResetTokenChange?: (token: string) => void;
  onDuplicateEmail?: (email: string) => void;
};

const useEmailVerification = ({
  email,
  onVerifiedChange,
  mode = 'signup',
  onResetTokenChange, // ← 이 부분 추가!
  onDuplicateEmail,
}: UseEmailVerificationProps) => {
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // 인증번호 전송 요청
  const sendCode = async () => {
    if (!email) return;

    try {
      setLoading(true);
      if (mode === 'signup') {
        await sendEmailVerificationCode({ email });
      } else {
        await sendFindPasswordEmail(email);
      }

      setEmailSent(true);
      setErrorMessage('');
      showToast('입력하신 이메일로 인증 번호가 전송되었습니다!', 'success');
    } catch (err: unknown) {
      let msg = '인증번호 요청에 실패했습니다.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
      setEmailSent(false);
    } finally {
      setLoading(false);
    }
  };

  // 인증번호 확인 (signup만 해당)
  const verifyCode = async (code: string) => {
    if (!code.trim()) {
      const msg = '인증번호를 입력해주세요.';
      setErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    try {
      if (mode === 'signup') {
        await checkEmailVerificationCode(email, code);
      } else {
        const res = await checkResetEmailVerificationCode(email, code);
        setResetToken(res.data.data.resetPasswordToken); // 비밀번호 재설정 토큰 설정

        // 부모로 전달하는 부분
        if (onResetTokenChange) {
          onResetTokenChange(res.data.data.resetPasswordToken); // 부모에게 토큰 전달
        } else {
          showToast('비밀번호 변경 실패', 'error');
        }
      }

      setEmailVerified(true);
      setErrorMessage('');
      showToast('이메일 인증 성공!', 'success');
      onVerifiedChange?.(true);
    } catch (err: unknown) {
      let msg = '인증에 실패했습니다.';
      if (axios.isAxiosError(err)) {
        const errorCode = err.response?.data?.code;
        if (errorCode === 'DUPLICATE_EMAIL' && mode === 'signup') {
          msg = '이미 동일한 이메일로 가입된 자체 계정이 있습니다.';
          onDuplicateEmail?.(email);
        } else if (errorCode === 'EMAIL_CODE_MISMATCH') {
          msg = '인증번호가 일치하지 않습니다.';
        } else if (errorCode === 'EMAIL_CODE_EXPIRED') {
          msg = '인증번호가 만료되었습니다.';
        } else {
          msg = err.response?.data?.message || msg;
        }
      }

      setErrorMessage(msg);
      showToast(msg, 'error');
      setEmailVerified(false);
      onVerifiedChange?.(false);
    }
  };

  return {
    emailSent,
    emailVerified,
    errorMessage,
    sendCode,
    verifyCode,
    loading,
    resetToken,
  };
};

export default useEmailVerification;
