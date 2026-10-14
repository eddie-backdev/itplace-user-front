import { forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale/ko';
import 'react-datepicker/dist/react-datepicker.css';
import { formatDateToBirthInput, parseBirthDateInput } from '../../utils/birthDate';

type BirthDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
};

type DateInputButtonProps = {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
  id?: string;
};

const START_YEAR = 1900;
const KOREAN_MONTHS = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);

registerLocale('ko', ko);

const DateInputButton = forwardRef<HTMLButtonElement, DateInputButtonProps>(
  ({ value, onClick, placeholder, id }, ref) => (
    <button
      id={id}
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={value ? `생년월일 ${value}` : '생년월일 선택'}
      className={`h-12 w-full rounded-xl border bg-white px-4 text-left text-body-2 font-semibold transition hover:border-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 ${
        value ? 'border-grey02 text-grey06' : 'border-grey02 text-grey05'
      }`}
    >
      {value || placeholder}
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

export default function BirthDateInput({ value, onChange, name = 'birth' }: BirthDateInputProps) {
  return (
    <div className="w-full max-w-[320px]">
      <label htmlFor={name} className="mb-1.5 block text-body-3 font-semibold text-grey06">
        생년월일
      </label>
      <DatePicker
        id={name}
        name={name}
        wrapperClassName="w-full"
        selected={parseBirthDateInput(value)}
        onChange={(date) => {
          if (date) {
            onChange(formatDateToBirthInput(date));
          }
        }}
        customInput={<DateInputButton />}
        dateFormat="yyyy.MM.dd"
        placeholderText="생년월일"
        locale="ko"
        calendarStartDay={0}
        minDate={new Date('1900-01-01T00:00:00')}
        maxDate={getYesterday()}
        popperPlacement="bottom-start"
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
    </div>
  );
}
