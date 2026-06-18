import api from '../../../apis/axiosInstance';

export const signUpFinal = async (payload: {
  nickname: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phoneNumber: string;
  gender: string;
  birthday: string;
  carrier: string;
  membershipGradeCode: string;
}) => {
  return await api.post('/api/v1/auth/signUp', payload);
};

export const sendFindPasswordEmail = async (email: string) => {
  return await api.post('/api/v1/users/findPassword', { email });
};

export const checkResetEmailVerificationCode = async (email: string, verificationCode: string) => {
  return await api.post<{ code: string; message: string; data: { resetPasswordToken: string } }>(
    '/api/v1/users/findPassword/confirm',
    { email, verificationCode }
  );
};

export const resetPassword = async ({
  email,
  resetPasswordToken,
  newPassword,
  newPasswordConfirm,
}: {
  email: string;
  resetPasswordToken: string;
  newPassword: string;
  newPasswordConfirm: string;
}) => {
  return await api.post('/api/v1/users/resetPassword', {
    email,
    resetPasswordToken,
    newPassword,
    newPasswordConfirm,
  });
};

export const oauthSignUp = (data: {
  nickname: string;
  birthday: string;
  gender: string;
  carrier: string;
  membershipGradeCode: string;
}) => {
  return api.post('/api/v1/auth/oauth/signUp', data);
};

export const oauthLink = (data: { email: string; password: string }) => {
  return api.post('/api/v1/auth/oauth/link', data);
};

export const verifyRecaptcha = async (recaptchaToken: string) => {
  return await api.post('/api/v1/auth/recaptcha', {
    recaptchaToken,
  });
};
