import { useState, useEffect, useRef } from 'react';
import { AxiosError } from 'axios';
import gsap from 'gsap';
import { showToast } from '../../../../utils/toast';
import AuthButton from '../common/AuthButton';
import useValidation from '../../hooks/useValidation';
import { signUpFinal } from '../../apis/user';
import AuthInput from '../common/AuthInput';
import MembershipProfileSelector from '../../../../components/membership/MembershipProfileSelector';
import BirthDateInput from './BirthDateInput';
import {
  birthDateInputToApiDate,
  formatBirthDateInput,
  isCompleteBirthDateInput,
} from '../../utils/birthDate';

type SignUpFinalFormProps = {
  onGoToLogin: () => void;
  onEmailVerificationExpired: () => void;
  onValuesChange: (
    data: Partial<{
      nickname: string;
      birthday: string;
      gender: string;
      carrier: string;
      membershipGradeCode: string;
    }>
  ) => void;
  email: string;
  password: string;
  passwordConfirm: string;
  initialNickname?: string;
  initialBirthday?: string;
  initialGender?: string;
  initialCarrier?: string;
  initialMembershipGradeCode?: string;
};

const SignUpFinalForm = ({
  onGoToLogin,
  onEmailVerificationExpired,
  onValuesChange,
  email,
  password,
  passwordConfirm,
  initialNickname = '',
  initialBirthday = '',
  initialGender = '',
  initialCarrier = '',
  initialMembershipGradeCode = '',
}: SignUpFinalFormProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      wrapperRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  const [formData, setFormData] = useState({
    nickname: initialNickname,
    birthday: formatBirthDateInput(initialBirthday),
    gender: initialGender,
    carrier: initialCarrier,
    membershipGradeCode: initialMembershipGradeCode,
  });

  const { errors, validateField } = useValidation();

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    onValuesChange({ [field]: field === 'birthday' ? birthDateInputToApiDate(value) : value });

    if (field === 'birthday') {
      validateField('birth', value, {
        email,
        password,
        passwordConfirm,
        birth: value,
      });
    }
  };

  const handleNext = async () => {
    if (isSubmitting) return;

    const isBirthValid = validateField('birth', formData.birthday, {
      email,
      password,
      passwordConfirm,
      birth: formData.birthday,
    });

    if (!isProfileValid || !isBirthValid) {
      showToast('입력 정보를 다시 확인해주세요.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await signUpFinal({
        nickname: formData.nickname.trim(),
        email,
        password,
        passwordConfirm,
        gender: formData.gender,
        birthday: birthDateInputToApiDate(formData.birthday),
        carrier: formData.carrier,
        membershipGradeCode: formData.membershipGradeCode,
      });

      showToast(
        '회원가입이 완료되었습니다. 휴대폰 인증은 로그인 후 마이페이지에서 진행할 수 있어요.',
        'success'
      );
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
          case 'EMAIL_VERIFICATION_FAILURE':
            message = '이메일 인증이 만료되었습니다. 다시 인증해주세요.';
            onEmailVerificationExpired();
            break;
          default:
            message = res.message || message;
        }
      }

      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProfileValid =
    email &&
    password &&
    passwordConfirm &&
    formData.nickname.trim() &&
    isCompleteBirthDateInput(formData.birthday) &&
    (formData.gender === 'MALE' || formData.gender === 'FEMALE') &&
    formData.carrier &&
    formData.membershipGradeCode &&
    !errors.birth;

  return (
    <div ref={wrapperRef} className="flex w-full flex-col px-2 py-2">
      <div className="mx-auto mb-5 w-full max-w-[320px] text-left">
        <p className="text-body-3 font-semibold text-grey06 max-md:text-body-2">가입 정보</p>
        <p className="mt-2 text-body-5 text-grey04">혜택 추천에 필요한 정보를 입력해주세요.</p>
      </div>

      <div className="flex w-full flex-col items-center gap-[14px]">
        <AuthInput
          name="nickname"
          placeholder="닉네임"
          value={formData.nickname}
          onChange={(event) => handleChange('nickname', event.target.value)}
        />

        <BirthDateInput
          value={formData.birthday}
          onChange={(value) => handleChange('birthday', value)}
        />

        <div className="flex w-full max-w-[320px] gap-3">
          <button
            type="button"
            aria-pressed={formData.gender === 'MALE'}
            className={`h-12 flex-1 rounded-xl border text-body-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              formData.gender === 'MALE'
                ? 'bg-purple04 text-white border-purple04'
                : 'bg-white text-grey04 border-grey02'
            }`}
            onClick={() => handleChange('gender', 'MALE')}
          >
            남자
          </button>
          <button
            type="button"
            aria-pressed={formData.gender === 'FEMALE'}
            className={`h-12 flex-1 rounded-xl border text-body-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              formData.gender === 'FEMALE'
                ? 'bg-purple04 text-white border-purple04'
                : 'bg-white text-grey04 border-grey02'
            }`}
            onClick={() => handleChange('gender', 'FEMALE')}
          >
            여자
          </button>
        </div>

        <div className="w-full flex flex-col items-center gap-2">
          <MembershipProfileSelector
            carrier={formData.carrier}
            membershipGradeCode={formData.membershipGradeCode}
            onCarrierChange={(carrier) => handleChange('carrier', carrier)}
            onGradeChange={(grade) => handleChange('membershipGradeCode', grade)}
          />
          <p className="w-full max-w-[320px] text-body-3 text-grey05">
            선택한 등급 기준으로 맞춤 혜택을 추천합니다.
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <AuthButton
          label={isSubmitting ? '가입 중...' : '회원가입'}
          onClick={() => void handleNext()}
          variant={isProfileValid && !isSubmitting ? 'default' : 'disabled'}
          className="mt-[32px] max-md:mt-[28px] max-sm:mt-[28px]"
        />
      </div>
    </div>
  );
};

export default SignUpFinalForm;
