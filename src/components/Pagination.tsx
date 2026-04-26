import React from 'react';
import ReactPagination from 'react-js-pagination';

interface PaginationProps {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (pageNumber: number) => void;
  pageRangeDisplayed?: number;
  width?: number | string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  pageRangeDisplayed = 5,
  width,
}) => {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className="flex w-full items-center justify-center mt-[20px]"
      style={width ? { width } : undefined}
    >
      <ReactPagination
        activePage={currentPage}
        itemsCountPerPage={itemsPerPage}
        totalItemsCount={totalItems}
        pageRangeDisplayed={pageRangeDisplayed}
        onChange={onPageChange}
        innerClass="flex items-center space-x-2"
        itemClass="px-3 py-2 text-body-2 text-grey05 hover:bg-grey02 rounded-lg cursor-pointer transition-colors duration-150 max-xl:text-body-4 max-xl:px-2 max-xl:py-1"
        linkClass="block w-full h-full"
        activeClass="bg-purple04 text-white hover:bg-purple04"
        activeLinkClass="text-white"
        firstPageText="<<"
        lastPageText=">>"
        prevPageText="<"
        nextPageText=">"
        hideFirstLastPages={false}
        hideNavigation={false}
        hideDisabled={false}
        disabledClass="opacity-50 cursor-not-allowed"
      />
    </div>
  );
};

export default Pagination;
