import React, { useState, useEffect } from 'react';
import { getBenefitDetail } from '../../../../../allBenefitsPage/apis/allBenefitsApi';
import { BenefitDetailResponse } from '../../../../../allBenefitsPage/apis/allBenefitsApi';
import SafeImage from '../../../../../../components/SafeImage';
import { TbX, TbChevronLeft, TbChevronRight } from 'react-icons/tb';

interface BenefitDetailCardProps {
  benefitIds: number[];
  onClose: () => void;
  className?: string;
}

const BenefitDetailCard: React.FC<BenefitDetailCardProps> = ({
  benefitIds,
  onClose,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [benefitDetails, setBenefitDetails] = useState<BenefitDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모든 혜택 상세 정보 로드
  useEffect(() => {
    const loadBenefitDetails = async () => {
      setIsLoading(true);
      setError(null);
      setCurrentIndex(0); // benefitIds 변경 시 페이지를 첫 번째로 리셋

      try {
        const details = await Promise.all(benefitIds.map((id) => getBenefitDetail(id)));
        setBenefitDetails(details);
      } catch (err) {
        setError('혜택 정보를 불러오는데 실패했습니다.');
        console.error('혜택 상세 정보 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (benefitIds.length > 0) {
      loadBenefitDetails();
    } else {
      setBenefitDetails([]);
      setIsLoading(false);
      setError(null);
      setCurrentIndex(0);
    }
  }, [benefitIds]);

  const currentBenefit = benefitDetails[currentIndex];
  const hasMultipleBenefits = benefitIds.length > 1;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : benefitIds.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < benefitIds.length - 1 ? prev + 1 : 0));
  };

  if (isLoading) {
    return (
      <div
        className={`bg-white drop-shadow-basic rounded-[12px] border-2 border-purple01 ${className} min-h-[290px] w-[min(420px,calc(100vw-32px))] max-h-[min(560px,calc(100vh-120px))] flex flex-col`}
      >
        {/* 고정 헤더 - SpeechBubble과 동일한 패딩 */}
        <div className="px-5 pt-4 pb-0 flex-shrink-0 max-md:px-3 max-md:pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-grey01 rounded-lg animate-pulse"></div>
              <div className="w-20 h-4 bg-grey01 rounded animate-pulse"></div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-grey01 rounded-full transition-colors"
            >
              <TbX size={16} className="text-grey03" />
            </button>
          </div>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 - SpeechBubble과 동일한 패딩 */}
        <div className="px-5 pb-4 pt-4 overflow-y-auto flex-1 min-h-0 space-y-3 max-md:px-3 max-md:pb-3">
          <div className="w-full h-6 bg-grey01 rounded animate-pulse"></div>
          <div className="w-3/4 h-4 bg-grey01 rounded animate-pulse"></div>
          <div className="w-full h-20 bg-grey01 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !currentBenefit) {
    const message = error ?? '표시할 혜택 정보가 없습니다.';

    return (
      <div
        className={`bg-white drop-shadow-basic rounded-[12px] border-2 border-purple01 ${className} min-h-[260px] w-[min(420px,calc(100vw-32px))] max-h-[min(560px,calc(100vh-120px))] flex flex-col`}
      >
        {/* 고정 헤더 - SpeechBubble과 동일한 패딩 */}
        <div className="px-5 pt-4 pb-0 flex-shrink-0 max-md:px-3 max-md:pt-3">
          <div className="flex items-center justify-between">
            <div className="text-danger text-body-4">오류 발생</div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-grey01 rounded-full transition-colors"
            >
              <TbX size={16} className="text-grey03" />
            </button>
          </div>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 - SpeechBubble과 동일한 패딩 */}
        <div className="px-5 pb-4 pt-4 overflow-y-auto flex-1 min-h-0 max-md:px-3 max-md:pb-3">
          <p className="text-grey04 text-body-3">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      // 전체 카드 스타일 - 배경색, 테두리, 높이 설정, SpeechBubble과 동일한 고정 너비
      className={`bg-white drop-shadow-basic rounded-[12px] border-2 border-purple01 pb-4 ${className} min-h-[290px] w-[min(420px,calc(100vw-32px))] max-h-[min(560px,calc(100vh-120px))] flex flex-col`}
    >
      {/* 헤더 영역 - 이미지, 파트너명, 페이지네이션, X버튼 위치, SpeechBubble과 동일한 패딩 */}
      <div className="px-5 pt-4 pb-0 flex-shrink-0 max-md:px-3 max-md:pt-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          {/* 왼쪽: 이미지 + 파트너명 */}
          <div className="flex min-w-0 items-center gap-3">
            <SafeImage
              src={currentBenefit.image}
              alt={`${currentBenefit.partnerName} 로고`}
              fallbackLabel={currentBenefit.partnerName || currentBenefit.benefitName}
              className="w-12 h-12 flex-shrink-0 rounded-lg border border-grey02 bg-white object-contain"
            />
            {/* 파트너명 텍스트 스타일 */}
            <h3 className="min-w-0 break-keep text-title-7 font-semibold leading-snug text-black line-clamp-2">
              {currentBenefit.partnerName || currentBenefit.benefitName}
            </h3>
          </div>

          {/* 오른쪽: 페이지네이션 + X버튼 */}
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {hasMultipleBenefits && (
              <>
                {/* 이전 버튼 스타일 */}
                <button
                  onClick={handlePrevious}
                  className="p-1 hover:bg-grey01 rounded-full transition-colors"
                >
                  <TbChevronLeft size={16} className="text-grey04" />
                </button>
                {/* 페이지 번호 텍스트 스타일 */}
                <span className="text-body-4 text-grey04">
                  {currentIndex + 1} / {benefitIds.length}
                </span>
                {/* 다음 버튼 스타일 */}
                <button
                  onClick={handleNext}
                  className="p-1 hover:bg-grey01 rounded-full transition-colors"
                >
                  <TbChevronRight size={16} className="text-grey04" />
                </button>
              </>
            )}
            {/* X버튼 위치 및 스타일 */}
            <button
              onClick={onClose}
              className="p-1 hover:bg-grey01 rounded-full transition-colors ml-2"
            >
              <TbX size={16} className="text-grey03 hover:text-grey04" />
            </button>
          </div>
        </div>
      </div>

      {/* 스크롤 콘텐츠 영역 - SpeechBubble과 동일한 패딩, 스크롤 설정 */}
      <div className="px-5 pb-4 pt-3 overflow-y-auto flex-1 min-h-0 max-md:px-3 max-md:pb-3">
        {/* 혜택 설명 텍스트 */}
        {currentBenefit.description && (
          <div className="mb-4 rounded-xl bg-purple01/60 px-3 py-2.5">
            <p className="break-keep text-body-2 leading-7 text-purple06 max-md:text-body-4 max-md:leading-6">
              {currentBenefit.description}
            </p>
          </div>
        )}

        {/* 등급별 혜택 섹션 */}
        {currentBenefit.tierBenefits && currentBenefit.tierBenefits.length > 0 && (
          <div className="mb-4">
            {/* 섹션 제목 스타일 */}
            <h4 className="text-title-8 text-black mb-2">혜택 내용</h4>
            <div className="space-y-2">
              {currentBenefit.tierBenefits.map((tier, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-grey02 bg-grey01/50 px-3 py-2.5"
                >
                  {/* 등급 뱃지 스타일 */}
                  <span className="mb-1.5 inline-flex max-w-full rounded bg-purple01 px-2 py-1 text-body-5 font-medium text-purple04">
                    {tier.grade}
                  </span>
                  {/* 혜택 내용 텍스트 스타일 */}
                  <p className="whitespace-pre-line break-words text-body-4 leading-6 text-grey05">
                    {tier.context}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이용 한도 섹션 */}
        {currentBenefit.benefitLimit && (
          <div className="mb-4">
            <h4 className="text-title-8 text-black mb-1">이용 한도</h4>
            <p className="whitespace-pre-line break-words text-body-3 leading-6 text-grey04">
              {currentBenefit.benefitLimit}
            </p>
          </div>
        )}

        {/* 이용 방법 섹션 */}
        {currentBenefit.manual && (
          <div className="mb-4">
            <h4 className="text-title-8 text-black mb-1">이용 방법</h4>
            <p className="whitespace-pre-line break-words text-body-3 leading-6 text-grey04">
              {currentBenefit.manual}
            </p>
          </div>
        )}

        {/* 외부 링크 버튼 스타일 */}
        {currentBenefit.url && (
          <div className="pt-4 border-t border-grey01">
            <a
              href={currentBenefit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-body-3 text-purple04 hover:text-purple05 transition-colors"
            >
              자세히 보기
              <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default BenefitDetailCard;
