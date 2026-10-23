import { useId } from 'react';
import {
  CARRIER_OPTIONS,
  getMembershipGradeOptions,
  isCarrierCode,
} from '../../../../utils/membership';
import { OPTIONAL_SIGNUP_CARRIER } from '../../utils/signupMembership.mjs';
import styles from './SignupForm.module.css';
import MembershipGradeSelect from './MembershipGradeSelect';
import { useReferenceData } from '../../../../components/ReferenceDataProvider';

const SIGNUP_CARRIER_OPTIONS = [
  ...CARRIER_OPTIONS,
  { code: 'MVNO', label: '알뜰폰' },
  { code: OPTIONAL_SIGNUP_CARRIER, label: '선택 안 함' },
];

type SignupMembershipFieldsProps = {
  carrier: string;
  membershipGradeCode: string;
  onCarrierChange: (carrier: string) => void;
  onGradeChange: (grade: string) => void;
};

export default function SignupMembershipFields({
  carrier,
  membershipGradeCode,
  onCarrierChange,
  onGradeChange,
}: SignupMembershipFieldsProps) {
  const carrierGroupName = `signup-carrier-${useId()}`;
  const gradeFieldId = `${carrierGroupName}-grade`;
  const { data } = useReferenceData();
  const gradeOptions = getMembershipGradeOptions(carrier, data);
  const carrierSkipped = carrier === OPTIONAL_SIGNUP_CARRIER;

  const changeCarrier = (nextCarrier: string) => {
    onCarrierChange(nextCarrier);
    onGradeChange('');
  };

  return (
    <div className={styles.fieldStack}>
      <fieldset>
        <legend className={styles.fieldLabel}>통신사</legend>
        <div className={`${styles.segmentGroup} ${styles.carrierOptions}`}>
          {SIGNUP_CARRIER_OPTIONS.map(({ code, label }) => (
            <label
              className={`${styles.segment} ${styles.carrierSegment}`}
              data-carrier={isCarrierCode(code) ? code : undefined}
              key={code}
            >
              <input
                className={styles.radioInput}
                type="radio"
                name={carrierGroupName}
                value={code}
                checked={carrier === code}
                onChange={() => changeCarrier(code)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {isCarrierCode(carrier) ? (
        <div>
          <span className={styles.fieldLabel} id={`${gradeFieldId}-label`}>
            멤버십 등급
          </span>
          <MembershipGradeSelect
            key={carrier}
            id={gradeFieldId}
            labelId={`${gradeFieldId}-label`}
            options={gradeOptions}
            value={membershipGradeCode}
            onChange={onGradeChange}
            disabled={gradeOptions.length === 0}
          />
        </div>
      ) : null}
      {carrierSkipped ? (
        <p className={`${styles.membershipNote} text-sm leading-5 text-[#686B73]`}>
          멤버십 정보는 가입 후 마이페이지에서 추가할 수 있어요.
        </p>
      ) : null}
      {carrier === 'MVNO' ? (
        <p className={`${styles.membershipNote} text-sm leading-5 text-[#686B73]`}>
          혜택은 SKT·KT·LG U+ 멤버십 기준으로 제공돼요.
        </p>
      ) : null}
    </div>
  );
}
