import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getBenefitDetail } from '../../../api/benefitDetail';
import { Platform } from '../../../types';
import { BenefitDetailResponse } from '../../../types/api';
import StoreDetailHeader from './StoreDetailHeader';
import StoreDetailInfo from './StoreDetailInfo';
import StoreDetailBenefits from './StoreDetailBenefits';
import StoreDetailUsageGuide from './StoreDetailUsageGuide';
import StoreDetailActionButton from './StoreDetailActionButton';
import LoadingSpinner from '../../../../../components/LoadingSpinner';
import { RootState } from '../../../../../store';
import { CarrierCode, isCarrierCode } from '../../../../../utils/membership';

interface StoreDetailCardProps {
  platform: Platform;
  onClose: () => void;
  onBottomSheetReset?: () => void;
}

type DetailCacheValue = BenefitDetailResponse | null;

const getDetailCacheKey = (storeId: number, partnerId: number, carrier: CarrierCode | null) =>
  `${storeId}:${partnerId}:${carrier ?? 'ALL'}`;

// 상세 패널을 닫았다 다시 열어도 같은 매장/통신사 정보는 세션 안에서 재사용한다.
const benefitDetailCache = new Map<string, DetailCacheValue>();

const StoreDetailCard: React.FC<StoreDetailCardProps> = ({
  platform,
  onClose,
  onBottomSheetReset,
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeCarrier, setActiveCarrier] = useState<CarrierCode | null>(() => {
    if (isCarrierCode(platform.carrier)) return platform.carrier;
    if (isCarrierCode(user?.carrier)) return user.carrier;
    return null;
  });
  const [detailData, setDetailData] = useState<BenefitDetailResponse | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [favoriteByBenefitId, setFavoriteByBenefitId] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetailRefreshing, setIsDetailRefreshing] = useState<boolean>(false);
  const hasLocalBenefitDetails =
    (platform.benefitDetails?.length ?? 0) > 0 || platform.benefits.length > 0;

  // platform 참조를 ref로 저장 (의존성 배열 최적화)
  const platformRef = useRef(platform);
  platformRef.current = platform;
  const detailDataRef = useRef(detailData);
  detailDataRef.current = detailData;
  const detailCacheRef = useRef(benefitDetailCache);
  const latestRequestKeyRef = useRef<string | null>(null);

  // 초기 로드 상태 관리 (nearby 방식과 완전히 동일)
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isInitialLoadRef = useRef(isInitialLoad);
  isInitialLoadRef.current = isInitialLoad;

  const resolveDefaultCarrier = useCallback((): CarrierCode | null => {
    // 사용자가 혜택 카드에서 KT/LGU/SKT 그룹을 직접 눌러 진입한 경우,
    // 선택된 카드의 carrier가 사용자의 기본 통신사보다 우선해야 한다.
    if (isCarrierCode(platformRef.current.carrier)) return platformRef.current.carrier;
    if (isCarrierCode(user?.carrier)) return user.carrier;
    return null;
  }, [user?.carrier]);

  const completeInitialLoad = useCallback(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      setIsInitialLoad(false);
    }
  }, []);

  const applyDetailData = useCallback(
    (data: DetailCacheValue, options?: { syncCarrierFromResponse?: boolean }) => {
      setDetailData(data);

      if (options?.syncCarrierFromResponse && isCarrierCode(data?.data?.carrier)) {
        setActiveCarrier(data.data.carrier);
      }

      if (data?.data?.isFavorite !== undefined) {
        setIsFavorite(data.data.isFavorite);
        if (data.data.benefitId !== undefined && data.data.benefitId !== null) {
          setFavoriteByBenefitId((current) => ({
            ...current,
            [String(data.data.benefitId)]: data.data.isFavorite,
          }));
        }
      } else {
        setIsFavorite(false);
      }
    },
    []
  );

  const fetchDetail = useCallback(
    async (
      carrierOverride?: CarrierCode | null,
      options?: {
        keepPreviousData?: boolean;
        useCache?: boolean;
        retryCount?: number;
      }
    ) => {
      const currentPlatform = platformRef.current;
      const carrierForRequest =
        carrierOverride !== undefined ? carrierOverride : resolveDefaultCarrier();
      const requestKey = getDetailCacheKey(
        currentPlatform.storeId,
        currentPlatform.partnerId,
        carrierForRequest
      );
      const useCache = options?.useCache ?? true;
      const keepPreviousData = options?.keepPreviousData ?? false;

      if (useCache && detailCacheRef.current.has(requestKey)) {
        latestRequestKeyRef.current = requestKey;
        applyDetailData(detailCacheRef.current.get(requestKey) ?? null, {
          syncCarrierFromResponse: carrierOverride === undefined || carrierOverride === null,
        });
        completeInitialLoad();
        setIsLoading(false);
        setIsDetailRefreshing(false);
        return;
      }

      latestRequestKeyRef.current = requestKey;

      if (keepPreviousData && detailDataRef.current) {
        setIsLoading(false);
        setIsDetailRefreshing(true);
      } else {
        setDetailData(null);
        setIsLoading(true);
        setIsDetailRefreshing(false);
      }

      try {
        const res = await getBenefitDetail({
          storeId: currentPlatform.storeId,
          partnerId: currentPlatform.partnerId,
          carrier: carrierForRequest,
        });

        // 응답 코드가 BENEFIT_DETAIL_NOT_FOUND면 데이터 없음으로 처리
        const nextDetailData = res?.code === 'BENEFIT_DETAIL_NOT_FOUND' ? null : res;
        detailCacheRef.current.set(requestKey, nextDetailData);

        if (latestRequestKeyRef.current !== requestKey) {
          return;
        }

        if (res?.code === 'BENEFIT_DETAIL_NOT_FOUND') {
          applyDetailData(null);
          completeInitialLoad();
          setIsLoading(false);
          setIsDetailRefreshing(false);
          return;
        }

        applyDetailData(res, {
          syncCarrierFromResponse: carrierOverride === undefined || carrierOverride === null,
        });
        completeInitialLoad();
        setIsLoading(false);
        setIsDetailRefreshing(false);
      } catch (e) {
        // 중복 호출 방지 에러는 100ms 후 재시도
        if (e instanceof Error && e.message === 'Duplicate request prevented') {
          const nextRetryCount = (options?.retryCount ?? 0) + 1;
          if (nextRetryCount <= 3 && latestRequestKeyRef.current === requestKey) {
            setTimeout(
              () =>
                fetchDetailRef.current(carrierForRequest, {
                  ...options,
                  retryCount: nextRetryCount,
                }),
              100
            );
          } else {
            completeInitialLoad();
            setIsLoading(false);
            setIsDetailRefreshing(false);
          }
          return;
        }

        if (latestRequestKeyRef.current !== requestKey) {
          return;
        }

        // API 호출 실패 시 조용히 처리
        if (!keepPreviousData) {
          applyDetailData(null);
        }
        completeInitialLoad();
        setIsLoading(false);
        setIsDetailRefreshing(false);
      }
    },
    [applyDetailData, completeInitialLoad, resolveDefaultCarrier]
  );

  // fetchDetail 참조를 ref로 저장 (의존성 배열 최적화)
  const fetchDetailRef = useRef(fetchDetail);
  fetchDetailRef.current = fetchDetail;

  // platform 변경 시 데이터 로드
  useEffect(() => {
    // platform 변경 시 로딩 상태 초기화
    isInitialLoadRef.current = true;
    setIsInitialLoad(true);
    setIsLoading(true);
    setIsDetailRefreshing(false);
    const nextCarrier = resolveDefaultCarrier();
    setActiveCarrier(nextCarrier);
    fetchDetailRef.current(nextCarrier, { keepPreviousData: false, useCache: true });
  }, [
    platform.storeId,
    platform.partnerId,
    platform.carrier,
    user?.carrier,
    resolveDefaultCarrier,
  ]); // platform 변경 시에도 재로드

  // 초기 로드 완료는 fetchDetail 함수에서 직접 처리

  const handleCarrierChange = useCallback(
    (carrier: CarrierCode) => {
      if (activeCarrier === carrier) {
        return;
      }

      setActiveCarrier(carrier);
      // 통신사별 혜택 내용은 지도 검색 응답의 platform.benefitDetails에 이미 포함되어 있다.
      // 상세 탭 전환은 API 재요청 없이 로컬 데이터 필터링만 수행한다.
    },
    [activeCarrier]
  );

  const selectedCarrierBenefitId = useMemo(() => {
    const localBenefitId = platform.benefitDetails?.find((benefit) => {
      if (!activeCarrier) return true;
      if (isCarrierCode(benefit.carrier)) return benefit.carrier === activeCarrier;
      return platform.carrier === activeCarrier;
    })?.benefitId;

    if (localBenefitId !== undefined && localBenefitId !== null) {
      return String(localBenefitId);
    }

    const detailCarrier = detailData?.data?.carrier;
    const canUseDetailBenefitId =
      !activeCarrier || !isCarrierCode(detailCarrier) || detailCarrier === activeCarrier;
    return canUseDetailBenefitId && detailData?.data?.benefitId
      ? String(detailData.data.benefitId)
      : undefined;
  }, [
    activeCarrier,
    detailData?.data?.benefitId,
    detailData?.data?.carrier,
    platform.benefitDetails,
    platform.carrier,
  ]);

  const canUseDetailFavoriteState =
    !activeCarrier ||
    !isCarrierCode(detailData?.data?.carrier) ||
    detailData?.data?.carrier === activeCarrier;
  const activeIsFavorite = selectedCarrierBenefitId
    ? (favoriteByBenefitId[selectedCarrierBenefitId] ??
      (canUseDetailFavoriteState ? isFavorite : false))
    : false;

  // 즐겨찾기 상태 변경 핸들러
  const handleFavoriteChange = (newIsFavorite: boolean) => {
    if (selectedCarrierBenefitId) {
      setFavoriteByBenefitId((current) => ({
        ...current,
        [selectedCarrierBenefitId]: newIsFavorite,
      }));
    }

    if (!canUseDetailFavoriteState) {
      return;
    }

    setIsFavorite(newIsFavorite);
    setDetailData((currentData) => {
      if (!currentData) return currentData;

      const nextData = {
        ...currentData,
        data: {
          ...currentData.data,
          isFavorite: newIsFavorite,
        },
      };
      const cacheKey = getDetailCacheKey(platform.storeId, platform.partnerId, activeCarrier);
      detailCacheRef.current.set(cacheKey, nextData);
      return nextData;
    });
  };

  return (
    <div className="w-full bg-white rounded-t-[20px] shadow-lg flex flex-col h-full overflow-hidden max-md:bg-none max-md:shadow-none max-md:rounded-t-[15px]">
      {/* 상세 내용 전체를 하나의 흰색 스크롤 영역으로 묶어 긴 혜택 문구가 푸터/하단 배경을 침범하지 않게 한다. */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-white px-6 pt-6 pb-6 max-md:px-4 max-md:pt-4 max-md:pb-28">
        <StoreDetailHeader
          platform={platform}
          imageUrl={detailData?.data?.image}
          onClose={onClose}
        />
        <StoreDetailInfo
          url={detailData?.data?.url}
          roadAddress={platform.roadAddress}
          address={platform.address}
          postCode={platform.postCode}
        />
        <StoreDetailBenefits
          platform={platform}
          activeCarrier={activeCarrier}
          onCarrierChange={handleCarrierChange}
          detailData={detailData}
          isLoading={isLoading}
        />

        {isLoading && !hasLocalBenefitDetails ? (
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner className="h-12 w-12 border-4 border-purple04 border-t-transparent" />
          </div>
        ) : detailData ? (
          <StoreDetailUsageGuide detailData={detailData} />
        ) : null}
      </div>

      {/* 고정 버튼 */}
      <div className="relative z-10 flex-shrink-0 border-t border-grey02 bg-white px-6 pt-3 pb-2 max-md:fixed max-md:bottom-0 max-md:w-full max-md:px-4 max-md:pb-2">
        <StoreDetailActionButton
          benefitId={selectedCarrierBenefitId}
          storeId={platform.storeId}
          isFavorite={activeIsFavorite}
          onFavoriteChange={handleFavoriteChange}
          partnerName={platform.name}
          distance={platform.distance}
          onBottomSheetReset={onBottomSheetReset}
          isDetailRefreshing={isDetailRefreshing}
        />
      </div>
    </div>
  );
};

export default StoreDetailCard;
