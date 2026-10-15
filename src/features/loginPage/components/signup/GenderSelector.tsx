import { useId } from 'react';
import styles from './SignupForm.module.css';

export default function GenderSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <fieldset className="w-full">
      <legend className={styles.fieldLabel}>성별</legend>
      <div className={styles.segmentGroup}>
        {[
          ['MALE', '남자'],
          ['FEMALE', '여자'],
        ].map(([gender, label]) => {
          const selected = value === gender;
          return (
            <label key={gender} className={styles.segment}>
              <input
                className={styles.radioInput}
                type="radio"
                name={`gender-${id}`}
                value={gender}
                checked={selected}
                onChange={() => onChange(gender)}
              />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
