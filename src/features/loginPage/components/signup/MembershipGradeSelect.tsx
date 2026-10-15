import type { MembershipGradeOption } from '../../../../utils/membership';
import styles from './MembershipGradeSelect.module.css';

type MembershipGradeSelectProps = {
  id: string;
  labelId: string;
  options: MembershipGradeOption[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
};

export default function MembershipGradeSelect({
  id,
  labelId,
  options,
  value,
  onChange,
  disabled,
}: MembershipGradeSelectProps) {
  return (
    <div className={styles.optionGrid} role="radiogroup" aria-labelledby={labelId}>
      {options.map((option, index) => {
        const inputId = `${id}-option-${index}`;

        return (
          <label className={styles.option} key={option.code} htmlFor={inputId}>
            <input
              id={inputId}
              className={styles.radio}
              type="radio"
              name={id}
              value={option.code}
              checked={option.code === value}
              onChange={() => onChange(option.code)}
              disabled={disabled}
            />
            <span className={styles.label}>{option.label}</span>
            <svg aria-hidden="true" className={styles.check} viewBox="0 0 16 16" fill="none">
              <path
                d="m3.5 8 3 3 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </label>
        );
      })}
    </div>
  );
}
