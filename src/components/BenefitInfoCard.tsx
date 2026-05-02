import { ReactNode } from 'react';
import { TbExternalLink } from 'react-icons/tb';
import SafeImage from './SafeImage';

interface Field {
  label: string;
  value: ReactNode;
}

interface BenefitInfoCardProps {
  image: string;
  title: string;
  fields: Field[];
  onLinkClick?: () => void; // 없으면 안 보임
}

export default function BenefitInfoCard({
  image,
  title,
  fields,
  onLinkClick,
}: BenefitInfoCardProps) {
  return (
    <div className="w-full border-b border-b-1 border-grey02 pb-3 bg-white">
      {/* 상단 이미지 + 타이틀 + 링크 버튼 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex min-w-0 items-center gap-2 ml-1">
          <SafeImage
            src={image}
            alt={`${title} 로고`}
            fallbackLabel={title}
            className="h-[46px] w-[46px] flex-shrink-0 object-contain"
          />
          <span className="min-w-0 break-keep text-title-6 text-black line-clamp-2">{title}</span>
        </div>
        {onLinkClick && (
          <button type="button" onClick={onLinkClick} className="text-grey05 hover:text-grey06">
            <TbExternalLink size={20} strokeWidth={1.4} />
          </button>
        )}
      </div>

      {/* 라벨-값 리스트 */}
      <div className="flex flex-col gap-2">
        {fields.map((f, idx) => (
          <div key={idx} className="flex justify-between items-start gap-3">
            <span className="text-grey04 text-body-3 font-light">{f.label}</span>
            <span className="text-grey05 text-body-3 text-right break-keep">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
