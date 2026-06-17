import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideMenu from '../features/myPage/components/SideMenu';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import MobileHeader from '../components/MobileHeader';
import NoResult from '../components/NoResult';

export default function MyPageLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // ✅ 모바일 레이아웃을 위한 조건분기
  const isWhiteLayout = pathname.startsWith('/mypage/favorites');

  // ✅ Redux에서 로그인 상태 가져오기
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-grey01">
        <div className="hidden fixed top-0 left-0 w-full z-[9999] max-md:block">
          <MobileHeader title="마이잇플" />
        </div>
        <div className="mx-auto flex min-h-screen max-w-[920px] items-center justify-center px-5 py-16 max-md:pt-[96px]">
          <div className="w-full rounded-[24px] bg-white px-6 py-10 text-center shadow-[0_18px_40px_rgba(16,17,20,0.08)] max-md:rounded-[20px]">
            <NoResult
              variant="blocked"
              isLoginRequired
              message1="로그인 후 마이페이지를 이용할 수 있어요"
              message2="회원 정보와 관심 혜택은 로그인 후 안전하게 확인할 수 있습니다."
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#EDE7FE_0,#F8F8FA_38%,#FFFFFF_100%)]">
      <div className="hidden fixed top-0 left-0 w-full z-[9999] max-md:block">
        <MobileHeader title="마이잇플" />
      </div>

      <div
        className={
          `mx-auto max-w-[1260px] px-[18px] pb-[18px] pt-[52px] flex items-stretch gap-4 max-lg:gap-4 max-md:mx-0 max-md:max-h-none max-md:flex-col max-md:p-0 max-md:pt-[104px]` +
          (isWhiteLayout ? ' max-md:gap-0 max-md:bg-white' : '')
        }
      >
        {/* 좌측 메뉴 */}
        <SideMenu />

        {/* 중앙+우측을 자식 페이지에서 구성 */}
        <div className="flex min-w-0 flex-1 items-stretch gap-4 max-lg:flex-col max-lg:gap-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
