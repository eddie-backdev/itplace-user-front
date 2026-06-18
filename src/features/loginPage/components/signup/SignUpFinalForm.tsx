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
  phoneNumber: string;
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
  phoneNumber,
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
      await signUpFinal({
        nickname: formData.nickname.trim(),
        email,
        password,
        passwordConfirm,
        phoneNumber,
        gender: formData.gender,
        birthday: birthDateInputToApiDate(formData.birthday),
        carrier: formData.carrier,
        membershipGradeCode: formData.membershipGradeCode,
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
          case 'DUPLICATE_PHONE_NUMBER':
            message = '이미 가입된 휴대폰 번호입니다.';
            break;
          case 'SMS_VERIFICATION_FAILURE':
            message = '휴대폰 인증이 만료되었습니다. 다시 인증해주세요.';
            break;
          default:
            message = res.message || message;
        }
      }

      showToast(message, 'error');
    }
  };

  const isProfileValid =
    phoneNumber &&
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
      <div className="mx-auto mb-5 w-[320px] text-left max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full">
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

        <div className="w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full flex gap-[14px]">
          <button
            type="button"
            className={`flex-1 h-[46px] max-lg:h-[34px] max-md:h-[46px] rounded-[16px] max-lg:rounded-[12px] border text-body-3 max-lg:text-body-4 transition ${
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
            className={`flex-1 h-[46px] max-lg:h-[34px] max-md:h-[46px] rounded-[16px] max-lg:rounded-[12px] border text-body-3 max-lg:text-body-4 transition ${
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
            gradeMenuPlacement="top"
          />
          <p className="w-[320px] text-body-5 text-grey04 max-xl:w-[274px] max-lg:w-[205px] max-md:w-full">
            선택한 등급 기준으로 맞춤 혜택을 추천합니다.
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <AuthButton
          label="회원가입"
          onClick={() => void handleNext()}
          variant={isProfileValid ? 'default' : 'disabled'}
          className="mt-[32px] max-md:mt-[28px] max-sm:mt-[28px]"
        />
      </div>
    </div>
  );
};

export default SignUpFinalForm;
