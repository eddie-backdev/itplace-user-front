import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getBenefitDetail } from '../../../api/benefitDetail';
import { Platform } from '../../../types';
import { BenefitDetailResponse } from '../../../types/api';
import StoreDetailHeader from './StoreDetailHeader';
import StoreDetailInfo from './StoreDetailInfo';
import StoreDetailBenefits from './StoreDetailBenefits';
import StoreDetailUsageGuide from './StoreDetailUsageGuide';
import StoreDetailActionButton from './StoreDetailActionButton';
import LoadingSpinner from '../../../../../components/LoadingSpinner';

interface StoreDetailCardProps {
  platform: Platform;
  onClose: () => void;
  onBottomSheetReset?: () => void;
}

const StoreDetailCard: React.FC<StoreDetailCardProps> = ({
  platform,
  onClose,
  onBottomSheetReset,
}) => {
  const [activeTab, setActiveTab] = useState<'default' | 'vipkok'>('default');
  const [detailData, setDetailData] = useState<BenefitDetailResponse | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // platform 참조를 ref로 저장 (의존성 배열 최적화)
  const platformRef = useRef(platform);
  platformRef.current = platform;

  // 초기 로드 상태 관리 (nearby 방식과 완전히 동일)
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isInitialLoadRef = useRef(isInitialLoad);
  isInitialLoadRef.current = isInitialLoad;

  const fetchDetail = useCallback(async () => {
    const category = activeTab === 'vipkok' ? 'VIP_COCK' : 'BASIC_BENEFIT';
    const currentPlatform = platformRef.current;

    // 로딩 시작 (탭 변경 시에만, 초기 로드는 이미 true)
    if (!isInitialLoadRef.current) {
      setIsLoading(true);
    }

    try {
      const res = await getBenefitDetail({
        storeId: currentPlatform.storeId,
        partnerId: currentPlatform.partnerId,
        mainCategory: category,
      });

      // 응답 코드가 BENEFIT_DETAIL_NOT_FOUND면 데이터 없음으로 처리
      if (res?.code === 'BENEFIT_DETAIL_NOT_FOUND') {
        setDetailData(null);
        // 데이터가 없어도 초기 로드는 완료된 것으로 처리
        if (isInitialLoadRef.current) {
          setIsInitialLoad(false);
        }
        // 로딩 완료
        setIsLoading(false);
        return;
      }

      setDetailData(res);

      // API 응답에서 isFavorite 상태 업데이트
      if (res?.data?.isFavorite !== undefined) {
        setIsFavorite(res.data.isFavorite);
      }

      // 데이터 로드 성공 시 초기 로드 완료 처리
      if (isInitialLoadRef.current) {
        setIsInitialLoad(false);
      }

      // 로딩 완료
      setIsLoading(false);
    } catch (e) {
      // 중복 호출 방지 에러는 100ms 후 재시도
      if (e instanceof Error && e.message === 'Duplicate request prevented') {
        setTimeout(() => fetchDetailRef.current(), 100);
        return;
      }
      // API 호출 실패 시 조용히 처리
      setDetailData(null);

      // API 호출 실패해도 초기 로드는 완료된 것으로 처리
      if (isInitialLoadRef.current) {
        setIsInitialLoad(false);
      }

      // 로딩 완료
      setIsLoading(false);
    }
  }, [activeTab]);

  // fetchDetail 참조를 ref로 저장 (의존성 배열 최적화)
  const fetchDetailRef = useRef(fetchDetail);
  fetchDetailRef.current = fetchDetail;

  // platform 변경 시 데이터 로드
  useEffect(() => {
    // platform 변경 시 로딩 상태 초기화
    setIsLoading(true);

    const initializeDetail = () => {
      fetchDetailRef.current();
    };

    initializeDetail();
  }, [platform.storeId, platform.partnerId]); // platform 변경 시에도 재로드

  // 초기 로드 완료는 fetchDetail 함수에서 직접 처리

  // activeTab 변경 시에만 실행 (초기 로드 제외)
  useEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }
    fetchDetailRef.current();
  }, [activeTab]);

  // 즐겨찾기 상태 변경 핸들러
  const handleFavoriteChange = (newIsFavorite: boolean) => {
    setIsFavorite(newIsFavorite);
  };

  return (
    <div className="w-full bg-white rounded-t-[20px] shadow-lg flex flex-col h-full max-md:bg-none max-md:shadow-none max-md:rounded-t-[15px]">
      {/* 고정 영역 */}
      <div className="px-6 pt-6 flex-shrink-0 max-md:px-4 max-md:pt-4 max-md:overflow-y-scroll">
        <StoreDetailHeader platform={platform} onClose={onClose} />
        <StoreDetailInfo
          url={detailData?.data?.url}
          roadAddress={platform.roadAddress}
          address={platform.address}
          postCode={platform.postCode}
        />
        <StoreDetailBenefits
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          detailData={detailData}
          isLoading={isLoading}
        />
      </div>

      {/* 스크롤 영역 - 이용 방법만 또는 로딩 스피너 */}
      <div
        className={`flex-1 overflow-y-auto pb-6 max-md:pb-24 max-md:overflow-y-visible ${detailData?.data?.manual ? 'px-6 max-md:px-4' : ''}`}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner className="h-12 w-12 border-4 border-purple04 border-t-transparent" />
          </div>
        ) : (
          <StoreDetailUsageGuide detailData={detailData} />
        )}
      </div>

      {/* 고정 버튼 */}
      <div className="px-6 pb-2 mt-2 flex-shrink-0 max-md:px-4 max-md:pb-2 max-md:fixed max-md:bottom-0 max-md:w-full max-md:bg-white">
        <StoreDetailActionButton
          benefitId={detailData?.data?.benefitId}
          storeId={platform.storeId}
          isFavorite={isFavorite}
          onFavoriteChange={handleFavoriteChange}
          partnerName={detailData?.data?.benefitName}
          distance={platform.distance}
          onBottomSheetReset={onBottomSheetReset}
        />
      </div>
    </div>
  );
};

export default StoreDetailCard;
