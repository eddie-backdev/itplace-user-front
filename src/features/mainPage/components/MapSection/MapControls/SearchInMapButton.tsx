import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { TbSearch } from 'react-icons/tb';

interface SearchInMapButtonProps {
  onClick?: () => void;
}

const SearchInMapButton: React.FC<SearchInMapButtonProps> = ({ onClick }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      // 초기 상태 설정 (작고 투명하게)
      gsap.set(buttonRef.current, {
        scale: 0,
        opacity: 0,
        y: 20,
      });

      // 애니메이션
      gsap.to(buttonRef.current, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
        delay: 0,
      });
    }
  }, []);

  const handleClick = () => {
    if (buttonRef.current) {
      // 클릭시 작은 펄스 애니메이션
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      });
    }
    onClick?.();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className="flex h-12 items-center space-x-2 rounded-xl border border-[#0066cc] bg-[#0066cc] px-4 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(31,38,52,0.12)] transition-colors duration-200 hover:bg-[#005bb5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-md:h-11"
    >
      <TbSearch size={18} />
      <span>현 지도에서 검색</span>
    </button>
  );
};

export default SearchInMapButton;
