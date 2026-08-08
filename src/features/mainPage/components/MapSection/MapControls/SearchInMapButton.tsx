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
      className="flex items-center space-x-2 rounded-full bg-brand px-5 py-2.5 text-white shadow-[0_5px_16px_rgba(17,92,58,0.24)] transition-colors duration-200 hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 max-md:px-4 max-md:py-2 max-md:text-sm"
    >
      <TbSearch size={20} className="max-md:w-4 max-md:h-4" />
      <span className="max-md:text-xs">현 지도에서 검색</span>
    </button>
  );
};

export default SearchInMapButton;
