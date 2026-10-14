import React, { useMemo, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { FreeMode } from 'swiper/modules';
import { Category } from '../../../types';
import {
  TbHeart,
  TbShoppingBag,
  TbHome,
  TbToolsKitchen2,
  TbMovie,
  TbBook,
  TbPlane,
  TbBuildingCarousel,
  TbChevronLeft,
  TbChevronRight,
} from 'react-icons/tb';
import 'swiper/swiper-bundle.css';

type CategoryTabsMode = 'map' | 'sidebar';

interface CategoryTabsSectionProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  mode?: CategoryTabsMode;
  showNavigationButtons?: boolean;
}

const getCategoryIcon = (
  categoryId: string,
  isSelected: boolean
): React.ReactElement | undefined => {
  const iconColor = isSelected ? 'text-[#202120]' : 'text-[#69717e]';
  const iconSize = 18;

  const iconMap: Record<string, React.ReactElement> = {
    엑티비티: <TbBuildingCarousel size={iconSize} className={iconColor} />,
    '뷰티/건강': <TbHeart size={iconSize} className={iconColor} />,
    쇼핑: <TbShoppingBag size={iconSize} className={iconColor} />,
    '생활/편의': <TbHome size={iconSize} className={iconColor} />,
    푸드: <TbToolsKitchen2 size={iconSize} className={iconColor} />,
    '문화/여가': <TbMovie size={iconSize} className={iconColor} />,
    교육: <TbBook size={iconSize} className={iconColor} />,
    '여행/교통': <TbPlane size={iconSize} className={iconColor} />,
  };
  return iconMap[categoryId];
};

const CategoryTabsSection: React.FC<CategoryTabsSectionProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  mode = 'map',
  showNavigationButtons = false,
}) => {
  const swiperRef = useRef<SwiperType | null>(null);
  // 모드별 스타일 메모이제이션
  const styles = useMemo(() => {
    const isMapMode = mode === 'map';
    const isSidebarMode = mode === 'sidebar';

    return {
      button: `select-none flex-shrink-0 flex items-center justify-center gap-1.5 border font-semibold transition-colors duration-200 ${
        isSidebarMode
          ? `h-9 rounded-full px-3 text-body-3 max-md:min-h-11 max-sm:px-3 max-sm:text-body-4`
          : `h-11 rounded-[10px] px-3 text-body-3 max-sm:px-3 max-sm:text-body-4`
      }`,
      showIcon: isMapMode, // 맵 모드에서만 아이콘 표시
    };
  }, [mode]);

  const handlePrevSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const handleNextSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  // 모든 모드에서 스와이퍼 사용
  return (
    <div className="relative">
      <div
        className={
          mode === 'map'
            ? 'h-11 w-max min-w-0 max-w-full px-0 py-0'
            : 'h-12 px-0 max-md:mx-4 max-md:h-11 max-md:w-auto max-md:overflow-visible max-sm:mx-3'
        }
      >
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          modules={[FreeMode]}
          spaceBetween={8}
          slidesPerView="auto"
          freeMode={true}
          grabCursor={true}
          className={`category-tabs-swiper min-w-0 ${mode === 'map' ? 'h-11 w-max max-w-full' : 'h-11 max-md:h-11'}`}
        >
          {categories.map((category) => (
            <SwiperSlide key={category.id} style={{ width: 'auto' }}>
              <button
                type="button"
                onClick={() => onCategorySelect(category.id)}
                aria-pressed={selectedCategory === category.id}
                className={`${styles.button} ${
                  selectedCategory === category.id
                    ? mode === 'map'
                      ? 'border-[#e6e6e3] bg-[#f1f1ee] text-[#202120]'
                      : 'border-brand bg-brand text-white'
                    : mode === 'map'
                      ? 'border-transparent bg-white text-[#69717e] hover:bg-[#f6f7fa] hover:text-[#202120]'
                      : 'border-warmBorder bg-warmSurface text-grey06 hover:border-brand/30 hover:bg-brandSoft'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]`}
              >
                {styles.showIcon && category.id !== '전체' && (
                  <span className="flex-shrink-0 [&_svg]:h-[18px] [&_svg]:w-[18px]">
                    {getCategoryIcon(category.id, selectedCategory === category.id)}
                  </span>
                )}
                <span className="whitespace-nowrap">{category.name}</span>
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* 네비게이션 버튼 (관심혜택 모드에서만 표시) */}
      {showNavigationButtons && (
        <div className="flex justify-end items-center gap-1 -mt-2 px-2 max-md:px-4 max-sm:px-3">
          <button
            type="button"
            onClick={handlePrevSlide}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-brandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="이전 카테고리"
          >
            <TbChevronLeft className="h-5 w-5 text-brand hover:text-brandStrong max-md:h-4 max-md:w-4 max-sm:h-3 max-sm:w-3" />
          </button>

          <button
            type="button"
            onClick={handleNextSlide}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-brandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="다음 카테고리"
          >
            <TbChevronRight className="h-5 w-5 text-brand hover:text-brandStrong max-md:h-4 max-md:w-4 max-sm:h-3 max-sm:w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryTabsSection;
