import React, { useLayoutEffect, useRef } from 'react';
import { actionAnimations } from '../../../../../utils/Animation';
import { useTabClickAnimation } from '../../../hooks/useTabClickAnimation';

interface Tab {
  id: string;
  label: string;
}

interface NavigationTabsSectionProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const NavigationTabsSection: React.FC<NavigationTabsSectionProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const animationRef = useRef<gsap.core.Tween | null>(null);

  const { handleTabClick } = useTabClickAnimation({
    tabRefs,
    onTabChange,
  });

  useLayoutEffect(() => {
    const aiTabElement = tabRefs.current['ai'];

    if (aiTabElement) {
      actionAnimations.killAnimation(animationRef.current);
      animationRef.current = null;
      actionAnimations.resetPosition(aiTabElement);

      if (activeTab !== 'ai') {
        animationRef.current = actionAnimations.bounceAnimation(aiTabElement);
      }
    }

    return () => {
      actionAnimations.killAnimation(animationRef.current);
      animationRef.current = null;
    };
  }, [activeTab]);

  // 호버 시 애니메이션 정지
  const handleMouseEnter = (tabId: string) => {
    if (tabId === 'ai' && activeTab !== 'ai' && animationRef.current) {
      animationRef.current.pause();
      // 호버 시 원위치로 돌아가기
      const aiTabElement = tabRefs.current['ai'];
      if (aiTabElement) {
        actionAnimations.returnToPosition(aiTabElement);
      }
    }
  };

  // 호버 해제 시 애니메이션 다시 실행
  const handleMouseLeave = (tabId: string) => {
    if (tabId === 'ai' && activeTab !== 'ai' && animationRef.current) {
      animationRef.current.play();
    }
  };

  return (
    <div className="flex gap-2 max-md:w-auto max-md:overflow-visible max-md:px-4 max-sm:px-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => void (tabRefs.current[tab.id] = el)}
          onClick={() => handleTabClick(tab.id)}
          onMouseEnter={() => handleMouseEnter(tab.id)}
          onMouseLeave={() => handleMouseLeave(tab.id)}
          className={`relative text-title-7 text-center h-9 pt-1 w-[105px] rounded-[10px] mt-5 max-md:text-body-2 max-md:h-10 max-md:flex-1 max-md:mt-3 max-sm:text-body-3 max-sm:h-8 max-sm:mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple02 ${
            activeTab === tab.id
              ? 'bg-purple04 text-white'
              : 'bg-grey01 text-grey05 hover:bg-grey02'
          }`}
        >
          {tab.label}
          {tab.id === 'ai' && activeTab !== 'ai' && (
            <span className="absolute top-[-4px] right-[-4px] w-[12px] h-[12px] pointer-events-none max-sm:w-[10px] max-sm:h-[10px] max-sm:right-[-2px]">
              <img
                src="/images/main/tab-highlight.webp"
                alt="ai탭 강조 이미지"
                className="w-full h-full transform scale-[1.15] filter drop-shadow-[0_0_6px_#7638FA]"
              />
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default NavigationTabsSection;
