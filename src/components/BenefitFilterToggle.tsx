export type FavoriteBenefitFilter = 'all' | 'myMembership';

interface BenefitFilterToggleProps {
  value: FavoriteBenefitFilter;
  onChange: (val: FavoriteBenefitFilter) => void;
  width?: string;
  fontSize?: string;
  className?: string;
  heightClass?: string;
  disabledMyMembership?: boolean;
}

const options: Array<{ value: FavoriteBenefitFilter; label: string }> = [
  { value: 'all', label: '전체 혜택' },
  { value: 'myMembership', label: '내 멤버십' },
];

export default function BenefitFilterToggle({
  value,
  onChange,
  width = 'w-[300px]',
  fontSize = 'text-title-7',
  className = '',
  heightClass = 'h-[50px] max-xl:h-[44px]',
  disabledMyMembership = false,
}: BenefitFilterToggleProps) {
  return (
    <div
      className={`flex ${width} ${heightClass} mb-6 bg-grey01 rounded-[10px] p-[4px] ${className}`}
    >
      {options.map((option) => {
        const disabled = option.value === 'myMembership' && disabledMyMembership;
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (!disabled) onChange(option.value);
            }}
            disabled={disabled}
            className={`flex-1 rounded-[8px] ${fontSize} transition-colors ${
              selected ? 'bg-white text-purple04 shadow-sm' : 'bg-transparent text-grey04'
            } ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:text-purple04'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
