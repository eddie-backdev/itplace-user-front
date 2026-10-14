import React from 'react';

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
  return (
    <div className="flex min-h-11 gap-1 rounded-[10px] bg-[#f7f8fa] p-1 max-md:mx-4 max-md:w-auto max-sm:mx-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          aria-pressed={activeTab === tab.id}
          className={`min-h-11 flex-1 rounded-[7px] px-2 text-center text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9] ${
            activeTab === tab.id
              ? 'bg-white text-[#6154d9] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
              : 'text-[#686b73] hover:text-[#202124]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default NavigationTabsSection;
