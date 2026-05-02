// src/features/myPage/components/Favorites/BenefitDetailTabs.tsx
import SafeImage from '../../../../components/SafeImage';
import { useEffect, useState } from 'react';
import { fetchFavoriteDetail } from '../../apis/favorites';
import { FavoriteDetail } from './../../../../types/favorites';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import NoResult from '../../../../components/NoResult';
import {
  getCarrierGradeOrder,
  getMembershipGradeLabel,
  isGradeApplicableToProfile,
} from '../../../../utils/membership';
interface Props {
  benefitId: number;
  image: string;
  name: string;
  userCarrier?: string | null; // 현재 로그인한 유저 통신사
  userGrade?: string | null; // 현재 로그인한 유저 등급
}

export default function BenefitDetailTabs({
  benefitId,
  image,
  name,
  userCarrier,
  userGrade,
}: Props) {
  const [detail, setDetail] = useState<FavoriteDetail | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // 로딩 상태
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true; // 이번 effect에서 발생하는 요청만 반영하겠다는 플래그
    setLoading(true);
    setError(false);
    setDetail(null);

    (async () => {
      try {
        const res = await fetchFavoriteDetail(benefitId);
        // 아래 조건을 추가: 이 effect가 아직 유효할 때만 setState
        if (!isMounted) return;

        setDetail(res.data);
        setError(false);

        const tiers = res.data.tiers;
        const allBenefit = tiers.find((t) => t.isAll);
        const availableGrades = tiers.map((tier) => tier.grade);
        const orderedGrades = getCarrierGradeOrder(userCarrier, availableGrades);

        if (allBenefit) {
          setSelectedGrade(null);
        } else if (userGrade && availableGrades.includes(userGrade)) {
          setSelectedGrade(userGrade);
        } else {
          setSelectedGrade(orderedGrades[0] ?? availableGrades[0] ?? null);
        }
      } catch (e) {
        if (isMounted) {
          console.error('상세 조회 실패', e);
          setError(true);
          setDetail(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    // ✅ cleanup 함수: benefitId가 바뀌거나 컴포넌트가 언마운트될 때 실행
    return () => {
      isMounted = false;
    };
  }, [benefitId, userCarrier, userGrade]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center py-10">
        <NoResult
          variant="error"
          message1="혜택 상세 정보를 불러오지 못했어요"
          message2="잠시 후 다시 열어 확인해 주세요."
          message1FontSize="text-title-6 max-xl:text-title-7"
          message2FontSize="text-body-3 max-xl:text-body-4"
          isLoginRequired={false}
        />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center py-10">
        <NoResult
          message1="혜택 상세 정보가 없어요"
          message2="선택한 혜택의 상세 내용을 확인할 수 없어요."
          message1FontSize="text-title-6 max-xl:text-title-7"
          message2FontSize="text-body-3 max-xl:text-body-4"
          isLoginRequired={false}
        />
      </div>
    );
  }

  const allBenefit = detail.tiers.find((t) => t.isAll);
  const displayImage = detail.partnerImage || image;
  const displayName = detail.partnerName || name;

  const LogoBox = ({ image, alt }: { image: string; alt: string }) => (
    <div className="w-full h-[142px] flex items-center justify-center border border-grey02 rounded-[10px] mb-5 max-xl:h-[112px] max-xl:mb-3">
      <SafeImage
        src={image}
        alt={alt}
        fallbackLabel={alt}
        className="h-[108px] w-[108px] object-contain max-xl:h-[98px] max-xl:w-[98px]"
      />
    </div>
  );

  // 🔹 모든등급
  if (allBenefit) {
    return (
      <div className="w-full flex flex-col max-lg:flex-row max-md:flex-col">
        <div className="max-lg:min-w-[210px] max-md:w-full">
          <LogoBox image={displayImage} alt={displayName} />
          <div className="flex items-center justify-center h-[50px] rounded-[12px] bg-orange04 text-white text-center text-body-0 font-medium w-full mb-4 max-xl:h-[44px] max-xl:text-body-2">
            모든 등급
          </div>
        </div>
        <p className="mt-4 whitespace-pre-line text-body-0 text-grey05 max-xl:text-body-2 max-lg:ml-3 max-lg:mt-0 max-md:ml-0 max-md:mt-4">
          {allBenefit.context}
        </p>
      </div>
    );
  }

  const availableGrades = detail.tiers.map((tier) => tier.grade);
  const gradeTabs = getCarrierGradeOrder(userCarrier, availableGrades);
  const content = detail.tiers.find((b) => b.grade === selectedGrade);
  const isSelectedApplicable = isGradeApplicableToProfile({
    benefitCarrier: content?.carrier,
    benefitGrade: content?.grade,
    userCarrier,
    userGrade,
  });

  return (
    <div className="w-full flex flex-col max-lg:flex-row max-md:flex-col">
      <div className="max-lg:min-w-[210px] max-md:w-full">
        <LogoBox image={displayImage} alt={displayName} />
        <div className="flex w-full mb-4 bg-grey01 rounded-[12px] p-[4px] max-lg:mb-0 max-md:mb-4">
          {gradeTabs.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`h-[42px] flex-1 text-body-0 font-medium transition-colors rounded-[8px] max-xl:h-[38px] max-xl:text-body-2 ${
                selectedGrade === g
                  ? 'bg-white text-orange04 shadow-sm'
                  : 'bg-transparent text-grey03'
              }`}
            >
              {getMembershipGradeLabel(g)}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 whitespace-pre-line text-body-0 text-grey05 max-xl:text-body-2 max-lg:ml-3 max-lg:mt-0 max-md:ml-0 max-md:mt-4">
        {content?.context}
        {!userGrade && (
          <span className="mt-3 block text-body-4 text-grey04">
            회원 정보에서 통신사와 등급을 선택하면 내 등급 혜택을 바로 강조해드려요.
          </span>
        )}
        {userGrade && content && !isSelectedApplicable && (
          <span className="mt-3 block text-body-4 text-grey04">
            선택한 멤버십 프로필과 다른 등급의 혜택입니다.
          </span>
        )}
      </p>
    </div>
  );
}
