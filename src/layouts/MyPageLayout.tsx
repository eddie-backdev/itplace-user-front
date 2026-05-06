import { Outlet } from 'react-router-dom';
import SideMenu from '../features/myPage/components/SideMenu';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import MobileHeader from '../components/MobileHeader';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import NoResult from '../components/NoResult';

export default function MyPageLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { isMobile } = useResponsive();
  const isHistory = pathname.startsWith('/mypage/history');

  // ✅ 모바일 레이아웃을 위한 조건분기
  const isWhiteLayout =
    pathname.startsWith('/mypage/favorites') || pathname.startsWith('/mypage/history');

  // ✅ Redux에서 로그인 상태 가져오기
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  // ✅ Redux에서 이번 달 혜택 금액 상태 가져오기
  const totalAmount = useSelector((state: RootState) => state.history.totalAmount);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-grey01">
        <div className="hidden fixed top-0 left-0 w-full z-[9999] max-md:block">
          <MobileHeader title="마이잇플" />
        </div>
        <div className="mx-auto flex min-h-screen max-w-[920px] items-center justify-center px-5 py-16 max-md:pt-[96px]">
          <div className="w-full rounded-[24px] bg-white px-6 py-10 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)] max-md:rounded-[20px]">
            <NoResult
              variant="blocked"
              isLoginRequired
              message1="로그인 후 마이페이지를 이용할 수 있어요"
              message2="회원 정보, 관심 혜택, 사용 이력은 로그인 후 안전하게 확인할 수 있습니다."
              buttonText="로그인하기"
              onButtonClick={() =>
                navigate('/login', {
                  state: { resetToLogin: true },
                  replace: true,
                })
              }
              secondaryButtonText="메인으로 가기"
              onSecondaryButtonClick={() => navigate('/')}
              message1FontSize="text-title-4 max-md:text-title-6"
              message2FontSize="text-body-1 max-md:text-body-3"
            />
          </div>
        </div>
      </div>
    );
  }

  // ✅ 로그인된 경우에는 마이페이지 레이아웃 정상 렌더
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#F1E9FF_0,#F5F5F5_34%,#F8F8FA_100%)]">
      <div className="hidden fixed top-0 left-0 w-full z-[9999] max-md:block">
        <MobileHeader title="마이잇플" />
      </div>

      <div
        className={
          `min-h-screen mx-auto max-w-[1480px] p-[24px] flex gap-[20px] max-lg:gap-[16px] max-md:-mx-5 max-md:max-h-none max-md:flex-col max-md:p-0 max-md:pt-[48px]` +
          (isWhiteLayout ? ' max-md:gap-0 max-md:bg-white' : '')
        }
      >
        {/* 좌측 메뉴 */}
        <SideMenu />

        {/* ✅ 모바일 전용 배너 */}
        {isMobile && isHistory && (
          <div className="w-full bg-orange-50 px-4 py-4 flex items-center justify-center gap-1">
            <img
              src="/images/myPage/icon-money.webp"
              alt="이번 달 혜택"
              className="w-11 h-8 animate-floating"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.onerror = null;
                t.src = '/images/myPage/icon-money.png';
              }}
            />
            <p className="text-title-7 font-medium text-black animate-floating">
              이번 달 총{' '}
              <span className="text-orange04 font-bold">{totalAmount.toLocaleString()}</span>원 혜택
              받았어요!
            </p>
          </div>
        )}

        {/* 중앙+우측을 자식 페이지에서 구성 */}
        <div className="flex min-w-0 flex-1 gap-[20px] max-lg:flex-col max-lg:gap-[16px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
