import { forwardRef, useId } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale/ko';
import 'react-datepicker/dist/react-datepicker.css';
import { formatDateToBirthInput, parseBirthDateInput } from '../../utils/birthDate';
import styles from './SignupForm.module.css';

type BirthDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  error?: string;
};

type DateInputButtonProps = {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
  id?: string;
  ariaDescribedBy?: string;
};

const START_YEAR = 1900;
const KOREAN_MONTHS = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);

registerLocale('ko', ko);

const DateInputButton = forwardRef<HTMLButtonElement, DateInputButtonProps>(
  ({ value, onClick, placeholder, id, ariaDescribedBy }, ref) => (
    <button
      id={id}
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={value ? `생년월일 ${value}` : '생년월일 선택'}
      aria-describedby={ariaDescribedBy}
      className={`${styles.dateButton} ${value ? styles.dateButtonValue : styles.dateButtonPlaceholder}`}
    >
      <span>{value || placeholder}</span>
      <svg
        className={styles.dateIcon}
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="5" width="17" height="16" rx="2" />
        <path d="M7.5 3v4M16.5 3v4M3.5 10h17" />
      </svg>
    </button>
  )
);

DateInputButton.displayName = 'DateInputButton';

const getYesterday = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);
  return yesterday;
};

const getYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - START_YEAR + 1 }, (_, index) => START_YEAR + index);
};

export default function BirthDateInput({
  value,
  onChange,
  name = 'birth',
  error,
}: BirthDateInputProps) {
  const generatedId = useId();
  const inputId = `${name}-${generatedId}`;
  return (
    <div className="w-full min-w-0">
      <label htmlFor={inputId} className={styles.fieldLabel}>
        생년월일
      </label>
      <DatePicker
        id={inputId}
        name={name}
        wrapperClassName="w-full"
        selected={parseBirthDateInput(value)}
        onChange={(date) => {
          if (date) {
            onChange(formatDateToBirthInput(date));
          }
        }}
        customInput={<DateInputButton ariaDescribedBy={error ? `${inputId}-error` : undefined} />}
        dateFormat="yyyy.MM.dd"
        placeholderText="YYYY.MM.DD"
        locale="ko"
        calendarStartDay={0}
        minDate={new Date('1900-01-01T00:00:00')}
        maxDate={getYesterday()}
        popperPlacement="bottom-start"
        showPopperArrow={false}
        calendarClassName="itplace-birth-datepicker"
        shouldCloseOnSelect
        renderCustomHeader={({
          date,
          changeYear,
          changeMonth,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="itplace-birth-datepicker__header-row">
            <select
              aria-label="연도 선택"
              className="itplace-birth-datepicker__select itplace-birth-datepicker__year-select"
              value={date.getFullYear()}
              onChange={(event) => changeYear(Number(event.target.value))}
            >
              {getYears().map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>

            <div className="itplace-birth-datepicker__month-control">
              <button
                type="button"
                aria-label="이전 달"
                className="itplace-birth-datepicker__nav-button"
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
              >
                ‹
              </button>
              <select
                aria-label="월 선택"
                className="itplace-birth-datepicker__select itplace-birth-datepicker__month-select"
                value={date.getMonth()}
                onChange={(event) => changeMonth(Number(event.target.value))}
              >
                {KOREAN_MONTHS.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="다음 달"
                className="itplace-birth-datepicker__nav-button"
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
              >
                ›
              </button>
            </div>
          </div>
        )}
      />
      {error ? (
        <p id={`${inputId}-error`} aria-live="polite" className="mt-1.5 text-sm text-[#B42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
