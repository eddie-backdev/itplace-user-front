import { useState } from 'react';

export type AuthFormStep =
  | 'login'
  | 'signUpAccount'
  | 'signUpFinal'
  | 'signUpComplete'
  | 'findPassword'
  | 'findId'
  | 'oauthIntegration'
  | 'oauthLink';

export const AuthTransition = () => {
  const [formStep, setFormStep] = useState<AuthFormStep>('login');

  const goToLogin = () => {
    setFormStep('login');
    if (window.location.search) window.history.replaceState(null, '', `/login${window.location.hash}`);
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
