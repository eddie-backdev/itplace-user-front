import { useState } from 'react';
import { AxiosError } from 'axios';
import { showToast } from '../../../../utils/toast';
import AuthButton from '../common/AuthButton';
import useValidation from '../../hooks/useValidation';
import { signUpFinal } from '../../apis/user';
import AuthInput from '../common/AuthInput';
import BirthDateInput from './BirthDateInput';
import GenderSelector from './GenderSelector';
import SignupMembershipFields from './SignupMembershipFields';
import styles from './SignupForm.module.css';
import { isValidCarrierGradePair } from '../../../../utils/membership';
import {
  getSignupMembershipPayload,
  isSignupMembershipValid,
} from '../../utils/signupMembership.mjs';
import {
  birthDateInputToApiDate,
  formatBirthDateInput,
  isCompleteBirthDateInput,
} from '../../utils/birthDate';

type SignUpFinalFormProps = {
  onComplete: () => void;
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
  onComplete,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        ...getSignupMembershipPayload(formData.carrier, formData.membershipGradeCode),
      });

      onComplete();
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
    isSignupMembershipValid(
      formData.carrier,
      formData.membershipGradeCode,
      isValidCarrierGradePair
    ) &&
    !errors.birth;

  return (
    <div className={`${styles.signupForm} ${styles.profileForm} flex w-full flex-col`}>
      <div className={styles.fieldStack}>
        <AuthInput
          name="nickname"
          placeholder="닉네임을 입력해 주세요"
          autoComplete="nickname"
          value={formData.nickname}
          onChange={(event) => handleChange('nickname', event.target.value)}
        />

        <BirthDateInput
          value={formData.birthday}
          onChange={(value) => handleChange('birthday', value)}
          error={errors.birth}
        />

        <GenderSelector
          value={formData.gender}
          onChange={(value) => handleChange('gender', value)}
        />

        <SignupMembershipFields
          carrier={formData.carrier}
          membershipGradeCode={formData.membershipGradeCode}
          onCarrierChange={(carrier) => handleChange('carrier', carrier)}
          onGradeChange={(grade) => handleChange('membershipGradeCode', grade)}
        />
      </div>

      <div className="flex justify-center">
        <AuthButton
          label={isSubmitting ? '가입 중...' : '회원가입'}
          onClick={() => void handleNext()}
          variant={isProfileValid && !isSubmitting ? 'default' : 'disabled'}
          className="signupCta mt-7 max-w-none"
        />
      </div>
    </div>
  );
};

export default SignUpFinalForm;
