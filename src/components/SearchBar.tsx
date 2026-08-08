import React from 'react';
import { TbSearch, TbX } from 'react-icons/tb';
interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  className?: string;
  backgroundColor?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCompositionStart?: React.CompositionEventHandler<HTMLInputElement>;
  onCompositionEnd?: React.CompositionEventHandler<HTMLInputElement>;
}
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  value,
  onChange,
  onClear,
  className = '',
  backgroundColor,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
}) => {
  return (
    <div
      className={`relative rounded-xl transition-shadow focus-within:ring-2 focus-within:ring-brand/30 ${className}`}
    >
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <TbSearch size={19} className="text-grey05" strokeWidth={1.8} />
      </div>
      <input
        type="text"
        role="searchbox"
        enterKeyHint="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        aria-label={placeholder}
        className={`h-full w-full rounded-xl border border-warmBorder pl-12 pr-10 text-base text-ink shadow-[0_1px_2px_rgba(36,35,33,0.03)] placeholder:text-body-3 placeholder:text-grey04 focus:border-brand/40 focus:outline-none max-xl:text-body-3 max-xl:placeholder:text-body-3 max-md:text-body-3 max-md:placeholder:text-body-3 ${backgroundColor || ''}`}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="검색어 지우기"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-grey04 transition-colors hover:text-grey05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <TbX size={24} className="text-grey04" />
        </button>
      )}
    </div>
  );
};
export default SearchBar;
