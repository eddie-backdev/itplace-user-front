import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { TbCheck, TbChevronDown } from 'react-icons/tb';
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
  gradeMenuPlacement?: 'top' | 'bottom';
};

type DropdownOption = {
  code: string;
  label: string;
};

type ProfileDropdownProps = {
  label: string;
  placeholder: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  menuPlacement?: 'top' | 'bottom';
};

const triggerClass =
  'relative flex h-[50px] w-[320px] items-center justify-between gap-3 rounded-[18px] border border-grey02 bg-white px-[16px] text-left text-body-2 font-semibold text-grey06 shadow-[0_10px_24px_rgba(16,17,20,0.05)] transition hover:border-purple02 hover:bg-purple01/20 focus:border-purple04 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple01 disabled:cursor-not-allowed disabled:border-grey02 disabled:bg-grey01 disabled:text-grey03 disabled:shadow-none max-xl:h-[43px] max-xl:w-[274px] max-xl:rounded-[15px] max-xl:px-[14px] max-xl:text-body-3 max-lg:h-[34px] max-lg:w-[205px] max-lg:rounded-[12px] max-lg:px-[11px] max-lg:text-body-4 max-md:h-[48px] max-md:w-full max-md:rounded-[16px] max-md:px-[16px] max-md:text-body-3 max-sm:h-[48px] max-sm:w-full max-sm:rounded-[16px]';

const ProfileDropdown = ({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
  className,
  menuPlacement = 'bottom',
}: ProfileDropdownProps) => {
  const dropdownId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.code === value);
  const displayOptions = [{ code: '', label: placeholder }, ...options];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className="relative w-[320px] max-xl:w-[274px] max-lg:w-[205px] max-md:w-full max-sm:w-full"
    >
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={dropdownId}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(triggerClass, !selectedOption && 'text-grey03', className)}
      >
        <span className="min-w-0 truncate">{selectedOption?.label ?? placeholder}</span>
        <span
          className={clsx(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple01 text-purple05 transition max-lg:h-5 max-lg:w-5',
            isOpen && 'rotate-180 bg-purple02'
          )}
        >
          <TbChevronDown className="h-4 w-4 max-lg:h-3 max-lg:w-3" aria-hidden />
        </span>
      </button>

      {isOpen && !disabled && (
        <div
          id={dropdownId}
          role="listbox"
          aria-label={label}
          className={clsx(
            'absolute left-0 z-[1200] max-h-[236px] w-full overflow-y-auto rounded-[18px] border border-grey02 bg-white p-2 shadow-[0_18px_46px_rgba(16,17,20,0.16)] max-lg:max-h-[198px] max-lg:rounded-[14px] max-lg:p-1.5',
            menuPlacement === 'top' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
          )}
        >
          {displayOptions.map((option) => {
            const isSelected = option.code === value;

            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.code)}
                className={clsx(
                  'flex w-full items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 text-left text-body-3 font-semibold text-grey05 transition hover:bg-purple01/45 hover:text-purple05 max-lg:rounded-[10px] max-lg:px-2.5 max-lg:py-2 max-lg:text-body-4',
                  isSelected && 'bg-purple01 text-purple05'
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <TbCheck className="h-4 w-4 shrink-0" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

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
  gradeMenuPlacement = 'bottom',
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
      <ProfileDropdown
        label="통신사 선택"
        placeholder={carrierPlaceholder}
        value={carrier}
        options={CARRIER_OPTIONS}
        onChange={handleCarrierChange}
        disabled={disabled}
        className={selectClassName}
      />

      <ProfileDropdown
        label="멤버십 등급 선택"
        placeholder={gradePlaceholder}
        value={membershipGradeCode}
        options={gradeOptions}
        onChange={onGradeChange}
        disabled={disabled || !isCarrierCode(carrier)}
        className={selectClassName}
        menuPlacement={gradeMenuPlacement}
      />
    </div>
  );
};

export default MembershipProfileSelector;
