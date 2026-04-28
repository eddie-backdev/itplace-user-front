import { useState, useEffect, useRef } from 'react';
import { AxiosError } from 'axios';
import gsap from 'gsap';
import Modal from '../../../../components/Modal';
import { showToast } from '../../../../utils/toast';
import AuthButton from '../common/AuthButton';
import EmailVerificationBox from '../verification/EmailVerificationBox';
import AuthFooter from '../common/AuthFooter';
import useValidation from '../../hooks/useValidation';
import { signUpFinal } from '../../apis/user';
import PasswordInputForm from '../common/PasswordInputForm';

type SignUpFinalFormProps = {
  onGoToLogin: () => void;
  name: string;
  birthday: string;
  gender: string;
  membershipId: string;
};

const SignUpFinalForm = ({
  onGoToLogin,
  name,
  birthday,
  gender,
  membershipId,
}: SignUpFinalFormProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      wrapperRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const [emailVerified, setEmailVerified] = useState(false);
  const [modal, setModal] = useState({ open: false, title: '', loading: false });

  const { errors, validateAll, validateField } = useValidation();

  const handleChange = (field: 'email' | 'password' | 'passwordConfirm', value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    validateField(field, value, updated);
  };

  const handleNext = async () => {
    const valid = validateAll(formData);
    if (!valid || !emailVerified) {
      return;
    }

    try {
      await signUpFinal({
        name,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        gender,
        birthday,
        membershipId,
      });

      showToast('회원가입이 완료되었습니다. 로그인 해주세요.', 'success');
      setTimeout(() => onGoToLogin(), 0);
    } catch (error) {
      const axiosError = error as AxiosError<{ code: string; message: string }>;
      const res = axiosError.response?.data;
      let message = '회원가입에 실패했습니다. 다시 시도해주세요.';

      if (res) {
        switch (res.code) {
          case 'PASSWORD_MISMATCH':
            message = '비밀번호가 일치하지 않습니다.';
            break;
          case 'DUPLICATE_EMAIL':
            message = '이미 사용 중인 이메일입니다.';
            break;
          default:
            message = res.message || message;
        }
      }

      showToast(message, 'error');
    }
  };

  const isValid =
    formData.email &&
    formData.password &&
    formData.passwordConfirm &&
    formData.password === formData.passwordConfirm &&
    !errors.email &&
    !errors.password &&
    !errors.passwordConfirm &&
    emailVerified;

  return (
    <div ref={wrapperRef} className="w-full flex flex-col">
      <div className="w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full text-left mx-auto">
        <p className="text-title-4 max-xl:text-title-5 max-lg:text-title-6 max-md:text-title-5 max-sm:text-title-5">
          계정 정보를 입력해주세요
        </p>
      </div>

      <div className="w-full mt-[51px] max-xl:mt-[44px] max-lg:mt-[34px] max-md:mt-[40px] max-sm:mt-[40px] flex justify-center">
        <EmailVerificationBox
          email={formData.email}
          onChangeEmail={(val) => handleChange('email', val)}
          onVerifiedChange={setEmailVerified}
          mode="signup"
        />
      </div>

      <div className="mt-[15px] max-xl:mt-[13px] max-lg:mt-[10px] max-md:mt-[14px] max-sm:mt-[14px] w-full">
        <PasswordInputForm
          password={formData.password}
          passwordConfirm={formData.passwordConfirm}
          onChangePassword={(val) => handleChange('password', val)}
          onChangeConfirm={(val) => handleChange('passwordConfirm', val)}
          passwordError={errors.password}
          passwordConfirmError={errors.passwordConfirm}
        />
      </div>

      <div className="flex justify-center">
        <AuthButton
          label="회원가입"
          onClick={handleNext}
          variant={isValid ? 'default' : 'disabled'}
          className="mt-[100px] max-md:mt-[80px] max-sm:mt-[80px]"
        />
      </div>

      <div className="flex justify-center">
        <AuthFooter
          leftText="이미 회원이신가요?"
          rightText="로그인 하러 가기"
          onRightClick={onGoToLogin}
        />
      </div>

      <Modal
        isOpen={modal.open}
        title={modal.title}
        onClose={() => setModal({ open: false, title: '', loading: false })}
      >
        {modal.loading && (
          <div className="w-full flex justify-center mt-[16px]">
            <div className="w-[32px] h-[32px] border-4 border-purple04 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SignUpFinalForm;
