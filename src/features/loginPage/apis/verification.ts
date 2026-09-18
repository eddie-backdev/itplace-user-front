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

export type SmsVerificationIssueResponse = {
  phoneNumber: string;
  verificationText: string;
  receiverPhoneNumber: string;
  expiresInSeconds: number;
};

export const issueSmsVerificationCode = async (phoneNumber: string, signal?: AbortSignal) => {
  const response = await api.post(
    '/api/v1/verification/sms',
    { phoneNumber },
    { signal, timeout: 10000 }
  );

  return response.data.data as SmsVerificationIssueResponse;
};

export const confirmSmsVerificationCode = async (phoneNumber: string, signal?: AbortSignal) => {
  return await api.post(
    '/api/v1/verification/sms/confirm',
    { phoneNumber },
    { signal, timeout: 10000 }
  );
};
