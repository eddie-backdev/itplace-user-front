import { useState } from 'react';
import AuthInput from '../common/AuthInput';
import AuthButton from '../common/AuthButton';
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

type OAuthIntegrationFormProps = {
  nickname: string;
  email: string;
  birthday: string;
  gender: string;
  carrier: string;
  membershipGradeCode: string;
  onNext: (data: {
    nickname: string;
    email: string;
    birthday: string;
    gender: string;
    carrier: string | null;
    membershipGradeCode: string | null;
  }) => void;
};

const OAuthIntegrationForm = ({
  nickname,
  email,
  birthday: initialBirthday,
  gender: initialGender,
  carrier: initialCarrier,
  membershipGradeCode: initialMembershipGradeCode,
  onNext,
}: OAuthIntegrationFormProps) => {
  const [nicknameValue, setNicknameValue] = useState(nickname);
  const [birthday, setBirthday] = useState(formatBirthDateInput(initialBirthday));
  const [gender, setGender] = useState(initialGender);
  const [carrier, setCarrier] = useState(initialCarrier);
  const [membershipGradeCode, setMembershipGradeCode] = useState(initialMembershipGradeCode);

  const isValid =
    !!nicknameValue.trim() &&
    !!email &&
    isCompleteBirthDateInput(birthday) &&
    (gender === 'MALE' || gender === 'FEMALE') &&
    isSignupMembershipValid(carrier, membershipGradeCode, isValidCarrierGradePair);

  return (
    <div className={`${styles.signupForm} ${styles.fieldStack}`}>
      <AuthInput
        name="nickname"
        placeholder="닉네임을 입력해 주세요"
        autoComplete="nickname"
        value={nicknameValue}
        onChange={(event) => setNicknameValue(event.target.value)}
      />
      <AuthInput name="oauthEmail" label="카카오 인증 이메일" value={email} disabled />
      <BirthDateInput value={birthday} onChange={setBirthday} />
      <GenderSelector value={gender} onChange={setGender} />

      <SignupMembershipFields
        carrier={carrier}
        membershipGradeCode={membershipGradeCode}
        onCarrierChange={setCarrier}
        onGradeChange={setMembershipGradeCode}
      />

      <AuthButton
        label="가입하기"
        onClick={() =>
          onNext({
            nickname: nicknameValue.trim(),
            email,
            birthday: birthDateInputToApiDate(birthday),
            gender,
            ...getSignupMembershipPayload(carrier, membershipGradeCode),
          })
        }
        variant={isValid ? 'default' : 'disabled'}
        className="signupCta max-w-none"
      />
    </div>
  );
};

export default OAuthIntegrationForm;
