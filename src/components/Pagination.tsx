import React from 'react';

interface PaginationProps {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (pageNumber: number) => void;
  pageRangeDisplayed?: number;
  width?: number | string;
  compact?: boolean;
}

const itemClass =
  'px-3 py-2 text-body-2 text-grey05 hover:bg-grey02 rounded-lg cursor-pointer transition-colors duration-150 max-xl:text-body-4 max-xl:px-2 max-xl:py-1';
const compactItemClass =
  'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-body-4 font-medium text-grey05 hover:bg-grey02 cursor-pointer transition-colors duration-150';
const activeClass = 'bg-purple04 text-white hover:bg-purple04';
const disabledClass = 'opacity-50 cursor-not-allowed';

function getVisiblePages(currentPage: number, totalPages: number, pageRangeDisplayed: number) {
  const range = Math.max(1, Math.min(pageRangeDisplayed, totalPages));
  const half = Math.floor(range / 2);
  const start = Math.max(1, Math.min(currentPage - half, totalPages - range + 1));
  return Array.from({ length: range }, (_, index) => start + index);
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  pageRangeDisplayed = 5,
  width,
  compact = false,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages, pageRangeDisplayed);
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const renderButton = (
    label: string,
    page: number,
    options: { active?: boolean; disabled?: boolean } = {}
  ) => (
    <button
      type="button"
      className={`${compact ? compactItemClass : itemClass} ${options.active ? activeClass : ''} ${options.disabled ? disabledClass : ''}`}
      disabled={options.disabled}
      onClick={() => goToPage(page)}
    >
      {label}
    </button>
  );

  return (
    <div
      className={`flex w-full items-center justify-center ${compact ? '' : 'mt-[20px]'}`}
      style={width ? { width } : undefined}
    >
      <nav
        className={`flex items-center ${compact ? 'gap-1' : 'space-x-2'}`}
        aria-label="페이지네이션"
      >
        {renderButton('<<', 1, { disabled: currentPage === 1 })}
        {renderButton('<', currentPage - 1, { disabled: currentPage === 1 })}
        {pages.map((page) => (
          <React.Fragment key={page}>
            {renderButton(String(page), page, { active: page === currentPage })}
          </React.Fragment>
        ))}
        {renderButton('>', currentPage + 1, { disabled: currentPage === totalPages })}
        {renderButton('>>', totalPages, { disabled: currentPage === totalPages })}
      </nav>
    </div>
  );
};

export default Pagination;
