import clsx from 'clsx';
import { CARRIER_OPTIONS, getMembershipGradeOptions, isCarrierCode } from '../../utils/membership';

type MembershipProfileSelectorProps = {
  carrier: string;
  membershipGradeCode: string;
  onCarrierChange: (carrier: string) => void;
  onGradeChange: (grade: string) => void;
  className?: string;
  selectClassName?: string;
  disabled?: boolean;
  carrierPlaceholder?: string;
  gradePlaceholder?: string;
};

const baseSelectClass =
  'w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full h-[50px] max-xl:h-[43px] max-lg:h-[34px] max-md:h-[48px] max-sm:h-[48px] rounded-[18px] max-xl:rounded-[15px] max-lg:rounded-[12px] max-md:rounded-[16px] max-sm:rounded-[16px] px-[16px] max-xl:px-[14px] max-lg:px-[11px] max-md:px-[16px] max-sm:px-[16px] bg-grey01 text-body-2 max-xl:text-body-3 max-lg:text-body-4 max-md:text-body-3 max-sm:text-body-3 text-grey05 focus:outline focus:outline-[1px] focus:outline-purple04 disabled:bg-grey02 disabled:text-grey04';

const MembershipProfileSelector = ({
  carrier,
  membershipGradeCode,
  onCarrierChange,
  onGradeChange,
  className,
  selectClassName,
  disabled = false,
  carrierPlaceholder = '통신사 선택',
  gradePlaceholder = '멤버십 등급 선택',
}: MembershipProfileSelectorProps) => {
  const gradeOptions = getMembershipGradeOptions(carrier);

  const handleCarrierChange = (nextCarrier: string) => {
    onCarrierChange(nextCarrier);
    onGradeChange('');
  };

  return (
    <div
      className={clsx('flex flex-col gap-[12px] max-md:gap-[10px] w-full items-center', className)}
    >
      <select
        aria-label="통신사 선택"
        value={carrier}
        disabled={disabled}
        onChange={(event) => handleCarrierChange(event.target.value)}
        className={clsx(baseSelectClass, selectClassName)}
      >
        <option value="">{carrierPlaceholder}</option>
        {CARRIER_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        aria-label="멤버십 등급 선택"
        value={membershipGradeCode}
        disabled={disabled || !isCarrierCode(carrier)}
        onChange={(event) => onGradeChange(event.target.value)}
        className={clsx(baseSelectClass, selectClassName)}
      >
        <option value="">{gradePlaceholder}</option>
        {gradeOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MembershipProfileSelector;
