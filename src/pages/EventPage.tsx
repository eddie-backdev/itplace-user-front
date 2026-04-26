import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import ScratchCouponCanvas from '../features/eventPage/components/ScratchCouponCanvas';
import OwnedCouponCountInfo from '../features/eventPage/components/OwnedCouponCountInfo';
import GiftListInfo from '../features/eventPage/components/GiftListInfo';
import CouponUsageList from '../features/eventPage/components/CouponUsageList';
import WinModal from '../features/eventPage/components/Modal/WinModal';
import FailModal from '../features/eventPage/components/Modal/FailModal';
import NoCouponModal from '../features/eventPage/components/Modal/NoCouponModal';
import MobileHeader from '../components/MobileHeader';
import TipBanner from '../features/eventPage/components/TipBanner';
import {
  fetchCouponCount,
  fetchCouponHistory,
  postScratchCoupon,
} from './../features/eventPage/api/eventApi';
import { showToast } from '../utils/toast';
import { AxiosError } from 'axios';
import { CouponHistory } from '../types/event';
import NoResult from '../components/NoResult';
import { useResponsive } from '../hooks/useResponsive';

export default function EventPage() {
  const [isLoading, setIsLoading] = useState(false);
  const username = useSelector((state: RootState) => state.auth.user?.name || '');
  const isLoggedIn = useSelector((state: RootState) => !!state.auth.user);
  const [couponCount, setCouponCount] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    isWin: boolean;
    giftName?: string;
    giftImageUrl?: string;
  } | null>(null);
  const [historyList, setHistoryList] = useState<CouponHistory[]>([]);
  const [onlySuccess, setOnlySuccess] = useState(false);
  const [showNoCouponModal, setShowNoCouponModal] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const { isMobile } = useResponsive();

  const getCouponCount = useCallback(async () => {
    try {
      const count = await fetchCouponCount();
      setCouponCount(count);
    } catch {
      setCouponCount(null);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      setHistoryError(false);
      const data = await fetchCouponHistory(onlySuccess ? 'SUCCESS' : undefined);
      setHistoryList(data);
    } catch (err) {
      console.error('사용 내역 조회 실패:', err);
      setHistoryError(true);
    } finally {
      setIsLoading(false);
    }
  }, [onlySuccess]);

  const handleScratchComplete = async () => {
    if (!isLoggedIn) {
      showToast('로그인 후 이용해주세요!', 'error');
      return;
    }

    if (!couponCount || couponCount <= 0) {
      setShowNoCouponModal(true);
      return;
    }

    try {
      const result = await postScratchCoupon();
      if (result.success) {
        setModalInfo({
          isWin: true,
          giftName: result.gift.giftName,
          giftImageUrl: result.gift.imgUrl,
        });
      } else {
        setModalInfo({ isWin: false });
      }
      setShowResult(true);
      await getCouponCount();
      await loadHistory();
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const message = axiosError?.response?.data?.message ?? '쿠폰 긁기에 실패했습니다.';
      showToast(message, 'error');
    }
  };

  // ✅ 전체 사용내역 불러오기
  useEffect(() => {
    if (isLoggedIn) {
      getCouponCount();
      loadHistory();
    } else {
      setHistoryError(false);
      setHistoryList([]);
    }
  }, [getCouponCount, isLoggedIn, loadHistory]);

  return (
    <>
      {isMobile && (
        <>
          <div className="fixed top-0 left-0 w-full z-[9999] max-md:block">
            <MobileHeader title="이벤트" />
          </div>
          <TipBanner />
        </>
      )}
      <main className="flex justify-center items-center min-h-screen bg-white px-[28px] py-7 max-md:px-5">
        <div className="w-full max-w-[1783px] flex flex-col justify-center h-full">
          {!isMobile && <TipBanner />}

          <section className="mb-8 rounded-[22px] border border-grey01 bg-white px-6 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] max-md:mb-6 max-md:px-5 max-md:py-4">
            <p className="text-body-4 font-medium text-purple04">행운 스크래치</p>
            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-title-4 text-black max-md:text-title-6">
                  혜택 기록 후 쿠폰을 모아 스크래치를 열어보세요.
                </h1>
                <p className="mt-2 text-body-3 text-grey05 max-md:text-body-4">
                  쿠폰 수량을 확인하고, 당첨 내역만 따로 모아보며 이벤트 참여 흐름을 한 번에 관리할
                  수 있어요.
                </p>
              </div>
              <div className="rounded-full bg-purple01 px-4 py-2 text-body-4 text-purple04">
                보유 쿠폰 {couponCount ?? 0}장
              </div>
            </div>
          </section>

          <div className="flex gap-11 max-xl:gap-6 max-xlg:flex-col max-md:gap-8">
            <div className="flex-1 flex flex-col gap-8 max-xl:gap-6 max-w-[1080px]">
              <section
                className="bg-[#ECFBE6] rounded-[18px] px-7 py-6 max-xl:py-4 max-md:mb-7"
                style={{ boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.1)' }}
              >
                <picture className="max-md:mx-auto">
                  <source srcSet="/images/event/coupon-title.webp" type="image/webp" />
                  <img src="/images/event/coupon-title.png" alt="쿠폰 타이틀" loading="lazy" />
                </picture>
                <ScratchCouponCanvas
                  onComplete={handleScratchComplete}
                  isLoggedIn={isLoggedIn}
                  couponCount={couponCount}
                  showNoCoupon={() => setShowNoCouponModal(true)}
                />
              </section>
              <section className="grid grid-cols-2 max-md:grid-cols-1 gap-7 max-xl:gap-6 flex-1 max-md:gap-7">
                <OwnedCouponCountInfo couponCount={couponCount} />
                <GiftListInfo />
              </section>
            </div>

            <aside className="max-w-[666px] max-h-[779px] max-xlg:max-w-none max-xl:max-h-[580px] w-full shrink-0 max-md:w-full flex flex-col">
              <section
                className="bg-white rounded-[18px] p-7 flex-1 flex flex-col h-full"
                style={{ boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.1)' }}
              >
                <h3 className="text-title-3 text-grey05 font-semibold text-center mt-5 mb-2 max-xl:text-title-5 max-md:text-title-4 max-sm:text-title-7">
                  나의 쿠폰 사용 내역
                </h3>
                <div className="flex justify-end mt-8">
                  <label className="text-body-1 text-grey05 max-sm:text-body-3">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={onlySuccess}
                      onChange={(e) => setOnlySuccess(e.target.checked)}
                    />
                    당첨 내역만 모아보기
                  </label>
                </div>
                <div className="flex-1 mt-12 overflow-hidden">
                  {!isLoggedIn ? (
                    <NoResult
                      variant="blocked"
                      message1="로그인 후 확인할 수 있어요!"
                      message2="로그인하고 행운의 스크래치 쿠폰을 긁어보세요."
                      message1FontSize="max-xl:text-title-6"
                      message2FontSize="max-xl:text-body-3"
                      buttonText="로그인하기"
                      buttonRoute="/login"
                      isLoginRequired
                    />
                  ) : historyError ? (
                    <NoResult
                      variant="error"
                      message1="쿠폰 사용 내역을 불러오지 못했어요"
                      message2="잠시 후 다시 시도하거나 필터를 바꿔서 확인해 주세요."
                      message1FontSize="max-xl:text-title-6"
                      message2FontSize="max-xl:text-body-3"
                      buttonText="다시 시도"
                      onButtonClick={loadHistory}
                    />
                  ) : historyList.length === 0 ? (
                    <NoResult
                      message1="앗! 내역을 찾을 수 없어요!"
                      message2="지도에서 별을 찾아 행운 쿠폰을 긁어보세요."
                      message1FontSize="max-xl:text-title-6"
                      message2FontSize="max-xl:text-body-3"
                    />
                  ) : (
                    <CouponUsageList usageHistory={historyList} isLoading={isLoading} />
                  )}
                </div>
              </section>
            </aside>
          </div>
        </div>

        {showResult &&
          modalInfo &&
          (modalInfo.isWin ? (
            <WinModal
              isOpen={showResult}
              onClose={() => setShowResult(false)}
              username={username}
              giftName={modalInfo.giftName!}
              productImageUrl={modalInfo.giftImageUrl!}
            />
          ) : (
            <FailModal isOpen={showResult} onClose={() => setShowResult(false)} />
          ))}

        {showNoCouponModal && (
          <NoCouponModal isOpen={showNoCouponModal} onClose={() => setShowNoCouponModal(false)} />
        )}
      </main>
    </>
  );
}
