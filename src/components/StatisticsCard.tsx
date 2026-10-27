import React from 'react';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  borderColor: string;
  valueColor: string;
  subtitleColor?: string;
  width?: number;
  height?: number;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  subtitle,
  borderColor,
  valueColor,
  subtitleColor,
  width = 344,
  height = 87,
}) => {
  return (
    <div style={{ width, height }}>
      <div className="rounded-[10px] overflow-hidden  h-full">
        <div className={`bg-warmSurface p-6 flex items-center h-full border-l-[10px] ${borderColor}`}>
          <div>
            <div className="text-body-2 text-ink mb-1">{title}</div>
            <div className="text-title-3 ">
              <span className={valueColor}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {subtitle && <span className={subtitleColor || 'text-ink'}> {subtitle}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsCard;
