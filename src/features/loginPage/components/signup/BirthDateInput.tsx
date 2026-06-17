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
};

const START_YEAR = 1900;
const KOREAN_MONTHS = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);

registerLocale('ko', ko);

const DateInputButton = forwardRef<HTMLButtonElement, DateInputButtonProps>(
  ({ value, onClick, placeholder }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`h-[52px] w-[320px] rounded-[18px] border bg-white px-4 text-left text-body-2 font-semibold shadow-[0_8px_20px_rgba(16,17,20,0.04)] transition hover:border-purple02 hover:bg-purple01/20 focus:border-purple04 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple01 max-xl:h-[46px] max-xl:w-[274px] max-xl:text-body-3 max-lg:h-[38px] max-lg:w-[205px] max-lg:rounded-[12px] max-lg:px-3 max-lg:text-body-4 max-md:h-[50px] max-md:w-full max-md:rounded-[16px] max-md:px-4 max-md:text-body-3 max-sm:h-[50px] max-sm:w-full ${
        value ? 'border-grey02 text-grey06' : 'border-grey02 text-grey03'
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
    <DatePicker
      name={name}
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
  );
}
