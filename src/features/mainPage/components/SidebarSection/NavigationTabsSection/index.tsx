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
    <div className="flex min-h-11 gap-1 rounded-[10px] bg-[var(--itplace-color-canvas)] p-1 max-md:mx-4 max-md:w-auto max-sm:mx-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          aria-pressed={activeTab === tab.id}
          className={`min-h-11 flex-1 rounded-[7px] px-2 text-center text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--itplace-color-accent)] ${
            activeTab === tab.id
              ? 'bg-warmSurface text-[var(--itplace-color-accent)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
              : 'text-[var(--itplace-color-text-secondary)] hover:text-[var(--itplace-color-text)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default NavigationTabsSection;
