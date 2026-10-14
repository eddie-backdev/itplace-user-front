import { useId } from 'react';
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

const selectClass =
  'block min-h-12 w-full rounded-xl border border-warmBorder bg-white px-4 text-base font-medium text-ink focus:border-brandStrong focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-warmCanvas disabled:text-grey04';

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
  const carrierId = useId();
  const gradeId = useId();
  const gradeOptions = getMembershipGradeOptions(carrier);

  const handleCarrierChange = (nextCarrier: string) => {
    onCarrierChange(nextCarrier);
    onGradeChange('');
  };

  return (
    <div className={clsx('flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="min-w-0">
        <label
          htmlFor={carrierId}
          className="mb-1.5 block text-base font-semibold leading-6 text-ink"
        >
          통신사
        </label>
        <select
          id={carrierId}
          value={carrier}
          disabled={disabled}
          onChange={(event) => handleCarrierChange(event.currentTarget.value)}
          className={clsx(selectClass, selectClassName)}
        >
          <option value="">{carrierPlaceholder}</option>
          {CARRIER_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0">
        <label
          htmlFor={gradeId}
          className="mb-1.5 block text-base font-semibold leading-6 text-ink"
        >
          멤버십 등급
        </label>
        <select
          id={gradeId}
          value={membershipGradeCode}
          disabled={disabled || !isCarrierCode(carrier)}
          onChange={(event) => onGradeChange(event.currentTarget.value)}
          className={clsx(selectClass, selectClassName)}
        >
          <option value="">{gradePlaceholder}</option>
          {gradeOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MembershipProfileSelector;
