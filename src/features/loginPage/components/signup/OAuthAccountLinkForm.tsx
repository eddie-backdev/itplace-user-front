import { useState } from 'react';
import AuthInput from '../common/AuthInput';
import AuthButton from '../common/AuthButton';

type OAuthAccountLinkFormProps = {
  email: string;
  loading?: boolean;
  onLink: (password: string) => void;
  onBack: () => void;
};

const OAuthAccountLinkForm = ({
  email,
  loading = false,
  onLink,
  onBack,
}: OAuthAccountLinkFormProps) => {
  const [password, setPassword] = useState('');
  const canSubmit = password.trim().length > 0 && !loading;

  return (
    <div className="flex w-full flex-col items-center px-2 py-2">
      <div className="mb-5 w-[320px] text-left max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full">
        <p className="text-body-3 font-semibold text-grey06 max-md:text-body-2">계정 연동 확인</p>
        <p className="mt-2 text-body-5 leading-5 text-grey04">
          이미 동일한 이메일로 가입된 자체 계정이 있습니다. 기존 비밀번호로 본인 확인 후 카카오
          계정과 연동할 수 있어요.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-[14px]">
        <AuthInput
          name="oauthLinkEmail"
          value={email}
          disabled
          bgColor="bg-purple01/35"
          textColor="text-purple05"
        />
        <AuthInput
          name="oauthLinkPassword"
          type="password"
          placeholder="기존 계정 비밀번호"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canSubmit) {
              onLink(password);
            }
          }}
        />
      </div>

      <div className="mt-[26px] flex w-[320px] flex-col gap-3 max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full">
        <AuthButton
          label={loading ? '연동 중...' : '계정 연동하기'}
          onClick={() => onLink(password)}
          variant={canSubmit ? 'default' : 'disabled'}
          className="w-full max-xl:w-full max-lg:w-full"
        />
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="h-[44px] rounded-[16px] border border-grey02 text-body-3-bold text-grey04 transition hover:border-purple02 hover:text-purple04 disabled:opacity-60 max-lg:h-[38px] max-lg:text-body-4"
        >
          다른 이메일로 가입하기
        </button>
      </div>
    </div>
  );
};

export default OAuthAccountLinkForm;
