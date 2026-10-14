import { useState } from 'react';
import { useNavigate, useSearchParams } from '@/lib/navigation';
import { getSafeReturnTo } from '../utils/returnTo.mjs';

export type AuthFormStep =
  | 'login'
  | 'signUpAccount'
  | 'signUpFinal'
  | 'findPassword'
  | 'findId'
  | 'oauthIntegration'
  | 'oauthLink';

export const AuthTransition = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get('returnTo'));
  const [formStep, setFormStep] = useState<AuthFormStep>('login');

  const goToLogin = () => {
    setFormStep('login');
    navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
  };

  return {
    formStep,
    setFormStep,
    goToLogin,
    goToSignUp: () => setFormStep('signUpAccount'),
    goToSignUpFinal: () => setFormStep('signUpFinal'),
    goToFindPassword: () => setFormStep('findPassword'),
    goToFindId: () => setFormStep('findId'),
  };
};
