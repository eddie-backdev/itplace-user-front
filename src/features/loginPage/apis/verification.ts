import api from '../../../apis/axiosInstance';

export const sendEmailVerificationCode = async ({ email }: { email: string }) => {
  return await api.post('/api/v1/verification/email', {
    email,
  });
};

export const checkEmailVerificationCode = async (email: string, verificationCode: string) => {
  return await api.post('/api/v1/verification/email/confirm', {
    email,
    verificationCode,
  });
};
