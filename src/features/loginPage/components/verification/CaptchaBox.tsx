import ReCAPTCHA from 'react-google-recaptcha';
import { useRef, useState } from 'react';
import { verifyRecaptcha } from '../../apis/user';
import { showToast } from '../../../../utils/toast';

type Props = {
  onCaptchaChange?: (isValid: boolean) => void;
};

const CaptchaBox = ({ onCaptchaChange }: Props) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [loading, setLoading] = useState(false);

  const handleCaptchaChange = async (token: string | null) => {
    if (!token) {
      onCaptchaChange?.(false);
      return;
    }

    setLoading(true);
    try {
      await verifyRecaptcha(token);
      onCaptchaChange?.(true);
      showToast('인증이 완료되었습니다.', 'success');
    } catch {
      onCaptchaChange?.(false);
      showToast('인증에 실패했습니다. 다시 시도해주세요.', 'error');
      // reCAPTCHA 리셋
      recaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="relative flex w-full max-w-[320px] justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey="6LcrTo4rAAAAAFQY8LXtuT0vRXs1QJTnbHStuKQC"
          onChange={handleCaptchaChange}
          size="normal"
          theme="light"
          className="transform origin-center scale-100 max-xl:scale-90 max-lg:scale-75 max-md:scale-95 max-sm:scale-95"
        />
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptchaBox;
