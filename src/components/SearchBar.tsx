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
}
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  value,
  onChange,
  onClear,
  className = '',
  backgroundColor,
  onKeyDown,
}) => {
  return (
    <div
      className={`relative rounded-[10px] transition-shadow focus-within:ring-2 focus-within:ring-purple02 ${className}`}
    >
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <TbSearch size={18} className="text-purple04" />
      </div>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        aria-label={placeholder}
        className={`w-full h-full pl-12 pr-10 rounded-[10px] border border-transparent text-black text-base max-xl:text-body-3 max-md:text-body-3 placeholder-grey04 placeholder:text-body-2 max-xl:placeholder:text-body-3 max-md:placeholder:text-body-3 focus:outline-none ${backgroundColor || ''}`}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="검색어 지우기"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 rounded-full p-0.5 text-grey04 transition-colors hover:text-grey05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02"
        >
          <TbX size={24} className="text-grey04" />
        </button>
      )}
    </div>
  );
};
export default SearchBar;
