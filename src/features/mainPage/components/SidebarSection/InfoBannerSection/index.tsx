import React from 'react';

interface InfoBannerSectionProps {
  message: string;
  variant?: 'primary' | 'secondary';
  highlightText?: string; // 강조할 텍스트
}

const InfoBannerSection: React.FC<InfoBannerSectionProps> = ({
  message,
  variant = 'primary',
  highlightText,
}) => {
  const textColor = variant === 'primary' ? 'text-brandStrong' : 'text-grey05';

  // 강조 텍스트가 있으면 해당 부분을 분리하여 렌더링
  const renderMessage = () => {
    if (!highlightText || !message.includes(highlightText)) {
      return <span className={`${textColor} text-body-2 max-md:text-body-3`}>{message}</span>;
    }

    // 강조할 텍스트를 기준으로 메시지를 분할
    const parts = message.split(highlightText);

    return (
      <span className={`${textColor} text-body-2 max-md:text-body-3`}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="font-bold text-brandStrong">{highlightText}</span>
            )}
          </React.Fragment>
        ))}
      </span>
    );
  };

  return (
    <div className="mt-2 hidden w-full md:block">
      <div className="text-left">{renderMessage()}</div>
    </div>
  );
};

export default InfoBannerSection;
