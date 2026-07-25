import React, { useState, useCallback, useEffect, useRef } from 'react';
import SearchBar from '../../../../../components/SearchBar';
import { useDebounce } from '../../../hooks/useDebounce';

interface SearchSectionProps {
  onSearchChange?: (query: string) => void;
  onKeywordSearch?: (keyword: string) => void;
  defaultValue?: string;
}

const SearchSection: React.FC<SearchSectionProps> = React.memo(
  ({ onSearchChange, onKeywordSearch, defaultValue }) => {
    const [searchQuery, setSearchQuery] = useState(defaultValue || '');
    const isComposingRef = useRef(false);

    // 1초 디바운스 적용
    const debouncedSearchQuery = useDebounce(searchQuery, 1000);

    // defaultValue 변경 감지하여 검색어 업데이트
    useEffect(() => {
      setSearchQuery(defaultValue || '');
    }, [defaultValue]);

    // 마지막으로 검색한 검색어 기억 (중복 검색 방지용)
    const lastSearchedQuery = useRef<string>('');

    // onKeywordSearch 함수 참조를 ref로 저장 (ESLint 경고 방지)
    const onKeywordSearchRef = useRef(onKeywordSearch);
    onKeywordSearchRef.current = onKeywordSearch;

    // 디바운스된 검색어로 자동 검색 (중복 방지)
    useEffect(() => {
      if (debouncedSearchQuery.trim() && debouncedSearchQuery !== lastSearchedQuery.current) {
        lastSearchedQuery.current = debouncedSearchQuery.trim();
        onKeywordSearchRef.current?.(debouncedSearchQuery.trim());
      }
    }, [debouncedSearchQuery]);

    // 검색어 초기화 시에만 전체 목록 로드 (사용자가 직접 지웠을 때)
    const prevSearchQuery = useRef(searchQuery);
    useEffect(() => {
      if (prevSearchQuery.current.trim() && !searchQuery.trim()) {
        onKeywordSearchRef.current?.('');
      }
      prevSearchQuery.current = searchQuery;
    }, [searchQuery]);

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearchChange?.(query);
      },
      [onSearchChange]
    );

    const handleSearchClear = useCallback(() => {
      setSearchQuery('');
      lastSearchedQuery.current = ''; // 검색 기록도 초기화
      onSearchChange?.('');
    }, [onSearchChange]);

    const handleSearchSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        if (isComposingRef.current) {
          return;
        }

        if (searchQuery.trim() && searchQuery.trim() !== lastSearchedQuery.current) {
          lastSearchedQuery.current = searchQuery.trim();
          onKeywordSearchRef.current?.(searchQuery.trim());
        }
      },
      [searchQuery]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (
          e.key !== 'Enter' ||
          e.nativeEvent.isComposing ||
          e.keyCode === 229 ||
          isComposingRef.current
        ) {
          return;
        }

        e.preventDefault();
        e.currentTarget.blur();

        if (searchQuery.trim() && searchQuery.trim() !== lastSearchedQuery.current) {
          lastSearchedQuery.current = searchQuery.trim();
          onKeywordSearchRef.current?.(searchQuery.trim());
        }
      },
      [searchQuery]
    );

    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(
      (e: React.CompositionEvent<HTMLInputElement>) => {
        isComposingRef.current = false;
        const query = e.currentTarget.value;
        setSearchQuery(query);
        onSearchChange?.(query);
      },
      [onSearchChange]
    );

    return (
      <div className="mb-4 w-[330px] max-md:w-full max-md:mb-0 max-md:flex max-md:items-center">
        <form onSubmit={handleSearchSubmit} className="w-full">
          <SearchBar
            placeholder="장소 검색"
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            backgroundColor="bg-grey01"
            className="w-full h-[50px] max-md:h-[40px] max-md:ml-1"
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
          />
        </form>
      </div>
    );
  }
);

export default SearchSection;
