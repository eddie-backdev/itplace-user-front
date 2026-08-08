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
    <div className="flex gap-1 rounded-xl bg-warmCanvas p-1 max-md:mx-4 max-md:w-auto max-md:overflow-visible max-md:p-0.5 max-sm:mx-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => void (tabRefs.current[tab.id] = el)}
          onClick={() => handleTabClick(tab.id)}
          onMouseEnter={() => handleMouseEnter(tab.id)}
          onMouseLeave={() => handleMouseLeave(tab.id)}
          className={`relative h-9 flex-1 rounded-[9px] px-2 text-center text-body-3-bold transition-colors max-md:h-8 max-md:text-body-4-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            activeTab === tab.id
              ? 'bg-warmSurface text-brandStrong shadow-[0_1px_4px_rgba(36,35,33,0.08)]'
              : 'text-grey04 hover:text-grey06'
          }`}
        >
          {tab.label}
          {tab.id === 'ai' && activeTab !== 'ai' && (
            <span className="absolute top-[-4px] right-[-4px] w-[12px] h-[12px] pointer-events-none max-sm:w-[10px] max-sm:h-[10px] max-sm:right-[-2px]">
              <img
                src="/images/main/tab-highlight.webp"
                alt=""
                aria-hidden="true"
                className="h-full w-full scale-[1.05] opacity-70"
              />
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default NavigationTabsSection;
