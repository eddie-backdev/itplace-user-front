import React from 'react';
import ChatRoom from './ChatRoom/ChatRoom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store';
import { RecommendationItem } from '../../../types/api';
import SafeImage from '../../../../../components/SafeImage';
import NoResult from '../../../../../components/NoResult';
import { useAnimatedLoadingText } from '../../../hooks/useAnimatedLoadingText';
import LoadingSpinner from '../../../../../components/LoadingSpinner';
import { useResponsive } from '../../../../../hooks/useResponsive';

interface RecommendStoreListProps {
  stores: RecommendationItem[];
  onItemClick: (store: RecommendationItem) => void;
  isLoading?: boolean;
  error?: string | null;
  onBenefitDetailRequest?: (benefitIds: number[]) => void;
  onSearchPartner?: (partnerName: string) => void;
  onChangeTab?: (tabId: string) => void;
  onBottomSheetReset?: () => void;
  onChatStateChange?: (isOpen: boolean) => void;
}

const RecommendStoreList: React.FC<RecommendStoreListProps> = ({
  stores,
  onItemClick,
  isLoading = false,
  error = null,
  onSearchPartner,
  onChangeTab,
  onBottomSheetReset,
  onChatStateChange,
}) => {
  const isLoggedIn = useSelector((state: RootState) => !!state.auth.user);
  const { isMobile, isTablet } = useResponsive();
  // 채팅방 UI 상태
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  const animatedText = useAnimatedLoadingText({
    messages: [
      '잇콩이가 당신의 취향을 분석 중이에요!\n잠깐만 기다려주세요..',
      '이 순간에도 잇콩이는\n열심히 추천 제휴처를 수집 중이에요..',
      '조금만 기다려 주세요!\n나에게 꼭 맞는 혜택을 찾고 있어요 ..',
      '잇콩이의 안테나가 열일 중...\n고객님의 잇플 픽을 찾는 중이에요!',
      '혜택 가득한 제휴처를 열심히 골라오는 중이에요',
    ],
  });

  // 채팅방 열기/닫기 핸들러
  const handleChatOpen = () => {
    setIsChatOpen(true);
    onChatStateChange?.(true);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
    onChatStateChange?.(false);
  };

  // ...existing code...

  // 에러 메시지에 따른 요약 생성
  const getErrorSummary = (errorMessage: string) => {
    if (
      errorMessage.includes('멤버십 회원이 아닙니다') ||
      errorMessage.includes('RECOMMENDATION_USER_NOT_MEMBERSHIP')
    ) {
      return '멤버십 프로필을 설정하면 이용할 수 있어요!';
    }
    if (
      errorMessage.includes('사용자를 찾을 수 없습니다') ||
      errorMessage.includes('SECURITYCODE_USER_NOT_FOUND')
    ) {
      return '사용자 정보를 찾을 수 없어요!';
    }
    if (
      errorMessage.includes('추천 결과 생성 실패') ||
      errorMessage.includes('RECOMMENDATION_RESULT_FAIL')
    ) {
      return 'AI 추천 생성에 실패했어요!';
    }
    if (errorMessage.includes('INTERNAL_SERVER_ERROR')) {
      return '서버에 문제가 발생했어요!';
    }
    // 기본 에러 메시지
    return 'AI 추천을 불러올 수 없어요!';
  };

  const getBadgeClass = (rank: number) => {
    const base =
      'ml-2 px-6 py-1 rounded-full text-body-4 text-black shimmer-gradient max-md:px-4 max-md:text-body-5 max-sm:px-3 max-sm:text-body-6';
    switch (rank) {
      case 1:
        return `${base} badge-gold`;
      case 2:
        return `${base} badge-silver`;
      case 3:
        return `${base} badge-bronze`;
      default:
        return 'ml-2 px-6 py-1 rounded-full text-body-4 bg-grey02 text-grey05 max-md:px-4 max-md:text-body-5 max-sm:px-3 max-sm:text-body-6';
    }
  };

  return (
    <>
      <style>{`
        /* 공통 shimmer */
        .shimmer-gradient {
          background-size: 200% 200%;
          background-repeat: repeat;
          animation: moveGradient 3s linear infinite;
        }

        @keyframes moveGradient {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 100% 100%;
          }
        }

        /* 금색 */
        .badge-gold {
          background-image: linear-gradient(
            135deg,
            #ffe97a 0%,
            #fff8c3 10%,
            #f0d060 20%,
            #ddb945 25%,
            #f0d060 30%,
            #fff8c3 40%,
            #ffe97a 50%,
            #fff8c3 60%,
            #f0d060 70%,
            #ddb945 75%,
            #f0d060 80%,
            #fff8c3 90%,
            #ffe97a 100%
          );
        }

        /* 은색 */
        .badge-silver {
          background-image: linear-gradient(
            135deg,
            #ffffff 0%,
            #e0eaf0 10%,
            #a8bcc9 20%,
            #7a96ac 25%,
            #a8bcc9 30%,
            #e0eaf0 40%,
            #ffffff 50%,
            #e0eaf0 60%,
            #a8bcc9 70%,
            #7a96ac 75%,
            #a8bcc9 80%,
            #e0eaf0 90%,
            #ffffff 100%
          );
        }

        /* 동색 (브론즈) */
        .badge-bronze {
          background-image: linear-gradient(
            135deg,
            #a7623d 0%,
            #c17a47 10%,
            #eab088 20%,
            #f5c6a0 25%,
            #eab088 30%,
            #c17a47 40%,
            #a7623d 50%,
            #c17a47 60%,
            #eab088 70%,
            #f5c6a0 75%,
            #eab088 80%,
            #c17a47 90%,
            #a7623d 100%
          );
        }

        /* 채팅방이 열려있을 때 body 스크롤 방지 (선택적) */
        .chat-open {
          overflow: hidden;
        }
      `}</style>

      {!isLoggedIn ? (
        <div className="flex-1 flex items-center justify-center min-h-0 max-md:min-h-56 max-md:mt-4">
          <NoResult
            message1="로그인이 필요해요!"
            message2="AI 추천을 받으려면 로그인해 주세요"
            message1FontSize="text-title-6"
            message2FontSize="text-body-3"
            isLoginRequired={true}
            buttonText="로그인하러 가기"
            buttonRoute="/login"
          />
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-0 mt-[-60px] max-md:min-h-56 max-md:mt-4">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <LoadingSpinner />
            </div>
            <div className="text-center min-h-[3rem] flex items-center justify-center">
              <p
                className={`text-body-2 font-bold transition-opacity duration-1000 whitespace-pre-line ${
                  animatedText.isVisible ? 'opacity-100' : 'opacity-0'
                } ${animatedText.textColorClass}`}
              >
                {animatedText.currentMessage}
              </p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center min-h-0 max-md:min-h-56 max-md:mt-4">
          <NoResult
            message1={error}
            message2={getErrorSummary(error)}
            isLoginRequired={false}
            message1FontSize="text-title-6"
            message2FontSize="text-body-3"
          />
        </div>
      ) : !stores || stores.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-0 max-md:min-h-56 max-md:mt-4">
          <NoResult
            message1="추천 결과가 없어요!"
            message2="ItPlace 이용 정보가 부족해요"
            message1FontSize="text-title-6"
            message2FontSize="text-body-3"
            isLoginRequired={false}
          />
        </div>
      ) : (
        <div className="space-y-3 max-md:space-y-3 px-5 max-md:px-4 max-sm:px-3">
          <div>
            {/* 웹에서는 채팅방이 열려있을 때 질문하기 버튼 숨기기 */}
            {!(isChatOpen && !isMobile && !isTablet) && (
              <button
                className="w-[328px] h-[48px] bg-purple04 text-white rounded-[10px] px-4 flex items-center justify-center cursor-pointer font-bold shadow hover:bg-purple03 transition-colors mb-2 max-md:w-full max-md:h-[64px] max-md:px-3 max-sm:h-[35px] max-sm:px-2"
                onClick={handleChatOpen}
              >
                잇플AI에게 질문하기
              </button>
            )}
            {isChatOpen && (
              <ChatRoom
                onClose={handleChatClose}
                onSearchPartner={onSearchPartner}
                onChangeTab={onChangeTab}
                onBottomSheetReset={onBottomSheetReset}
              />
            )}
          </div>
          {!isChatOpen &&
            stores.map((store) => (
              <div key={`${store.partnerName}-${store.rank}`} className="relative">
                <div
                  onClick={() => {
                    onItemClick(store);
                  }}
                  className="w-[330px] h-[60px] bg-grey01 rounded-[10px] px-4 flex items-center cursor-pointer hover:bg-purple01 transition-colors overflow-x-hidden max-md:w-auto max-md:h-[64px] max-md:px-3 max-sm:h-[64px] max-sm:px-2"
                >
                  {/* 왼쪽 이미지 */}
                  <div className="w-[50px] h-[50px] bg-white rounded-[10px] overflow-hidden flex-shrink-0 mr-6 max-md:w-[40px] max-md:h-[40px] max-md:mr-4 max-sm:w-[35px] max-sm:h-[35px] max-sm:mr-3">
                    <SafeImage
                      src={store.imgUrl || 'images/main/RecommendDefault.webp'}
                      alt={`${store.partnerName} 로고`}
                      fallbackLabel={store.partnerName}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* 중앙: 이름 */}
                  <div className="flex-1">
                    <span className="text-body-3-bold text-grey06 max-md:text-body-4-bold">
                      {store.partnerName}
                    </span>
                  </div>

                  {/* 오른쪽: 뱃지 */}
                  <div className={getBadgeClass(store.rank)}>
                    <span>{store.rank}위</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
};

export default RecommendStoreList;
