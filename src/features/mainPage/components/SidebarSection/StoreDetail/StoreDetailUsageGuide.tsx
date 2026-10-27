import React from 'react';
import { BenefitDetailResponse } from '../../../types/api';

interface StoreDetailUsageGuideProps {
  detailData: BenefitDetailResponse | null;
}

const StoreDetailUsageGuide: React.FC<StoreDetailUsageGuideProps> = ({ detailData }) => {
  if (!detailData?.data?.manual) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-[var(--itplace-color-text)]">이용 방법</h3>
      <ul className="space-y-2 text-sm leading-6 text-[var(--itplace-color-text-secondary)]">
        {detailData.data?.manual
          .split('\n')
          .filter((line) => line.trim() !== '')
          .map((line, idx) => (
            <li key={idx}>
              <span>{line.trim()}</span>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default StoreDetailUsageGuide;
