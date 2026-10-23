import { useId } from 'react';
import clsx from 'clsx';
import { CARRIER_OPTIONS, getMembershipGradeOptions, isCarrierCode } from '../../utils/membership';
import { useReferenceData } from '../ReferenceDataProvider';

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
  variant?: 'select' | 'cards';
  compact?: boolean;
};

const selectClass =
  'block min-h-12 w-full rounded-xl border border-warmBorder bg-white px-4 text-base text-ink focus:border-brandStrong focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-warmCanvas disabled:text-grey04';

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
  variant = 'select',
  compact = false,
}: MembershipProfileSelectorProps) => {
  const carrierId = useId();
  const gradeId = useId();
  const { data } = useReferenceData();
  const gradeOptions = getMembershipGradeOptions(carrier, data);

  const handleCarrierChange = (nextCarrier: string) => {
    onCarrierChange(nextCarrier);
    onGradeChange('');
  };

  if (variant === 'cards') {
    return (
      <div className={clsx('flex w-full min-w-0 flex-col', compact ? 'gap-4' : 'gap-6', className)}>
        <fieldset>
          <legend
            className={clsx(
              'font-semibold text-[#34343b]',
              compact ? 'mb-2 text-[13px]' : 'mb-3 text-sm'
            )}
          >
            통신사
          </legend>
          <div className={clsx('grid', compact ? 'grid-cols-3 gap-2' : 'gap-3 sm:grid-cols-3')}>
            {CARRIER_OPTIONS.map((option) => {
              const selected = carrier === option.code;
              return (
                <label
                  key={option.code}
                  className={`flex cursor-pointer items-center rounded-xl border transition-colors focus-within:ring-2 focus-within:ring-[#6154d9] focus-within:ring-offset-2 ${compact ? 'min-h-[54px] min-w-0 justify-center gap-1.5 px-2 py-2' : 'min-h-[64px] gap-3 px-4 py-3'} ${
                    selected
                      ? 'border-[#6154d9] bg-[#f7f5ff]'
                      : 'border-[#e8e9ee] bg-white hover:border-[#c9c4f0]'
                  } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name={`carrier-${carrierId}`}
                    value={option.code}
                    checked={selected}
                    disabled={disabled}
                    onChange={() => handleCarrierChange(option.code)}
                  />
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      selected ? 'border-[#6154d9]' : 'border-[#9b9da5]'
                    }`}
                  >
                    {selected ? <span className="h-2 w-2 rounded-full bg-[#6154d9]" /> : null}
                  </span>
                  <span className={compact ? 'min-w-0 text-center' : ''}>
                    <span
                      className={clsx(
                        'block font-bold text-[#202124]',
                        compact ? 'whitespace-nowrap text-[13px]' : 'text-sm'
                      )}
                    >
                      {option.label}
                    </span>
                    <span
                      className={clsx('mt-0.5 block text-xs text-[#686b73]', compact && 'hidden')}
                    >
                      {selected ? '현재 선택' : '통신사'}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend
            className={clsx(
              'font-semibold text-[#34343b]',
              compact ? 'mb-2 text-[13px]' : 'mb-3 text-sm'
            )}
          >
            멤버십 등급
          </legend>
          <div className={clsx(compact ? 'grid grid-cols-3 gap-1.5' : 'flex flex-wrap gap-3')}>
            {gradeOptions.map((option) => {
              const selected = membershipGradeCode === option.code;
              return (
                <label
                  key={option.code}
                  className={`flex cursor-pointer items-center rounded-xl border transition-colors focus-within:ring-2 focus-within:ring-[#6154d9] focus-within:ring-offset-2 ${compact ? 'min-h-[44px] min-w-0 justify-center gap-1.5 px-2 py-2' : 'min-h-[56px] min-w-[116px] gap-3 px-4 py-3'} ${
                    selected
                      ? 'border-[#6154d9] bg-[#f7f5ff]'
                      : 'border-[#e8e9ee] bg-white hover:border-[#c9c4f0]'
                  } ${disabled || !carrier ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name={`grade-${gradeId}`}
                    value={option.code}
                    checked={selected}
                    disabled={disabled || !carrier}
                    onChange={() => onGradeChange(option.code)}
                  />
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      selected ? 'border-[#6154d9]' : 'border-[#9b9da5]'
                    }`}
                  >
                    {selected ? <span className="h-2 w-2 rounded-full bg-[#6154d9]" /> : null}
                  </span>
                  <span
                    className={clsx(
                      'font-bold text-[#202124]',
                      compact ? 'whitespace-nowrap text-[13px]' : 'text-sm'
                    )}
                  >
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
          {gradeOptions.length === 0 ? (
            <p className="mt-2 text-sm text-[#686b73]">통신사를 먼저 선택해 주세요.</p>
          ) : null}
        </fieldset>
      </div>
    );
  }

  return (
    <div className={clsx('flex w-full min-w-0 flex-col', 'gap-3', className)}>
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
          className={clsx(selectClass, 'font-medium', selectClassName)}
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
          className={clsx(selectClass, 'font-medium', selectClassName)}
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
