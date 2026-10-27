import React from 'react';
import Link from 'next/link';
import { getCarrierLabel, getMembershipGradeLabel, isValidCarrierGradePair } from '../../../../utils/membership';
import { useReferenceData } from '../../../../components/ReferenceDataProvider';

type Props = {
  carrier?: string | null;
  grade?: string | null;
  verified?: boolean;
  saving?: boolean;
  onChangeProfileClick?: () => void;
};

const MembershipInfo: React.FC<Props> = ({
  carrier,
  grade,
  verified,
  saving = false,
  onChangeProfileClick,
}) => {
  const { data } = useReferenceData();
  const hasProfile = Boolean(carrier && grade && isValidCarrierGradePair(carrier, grade, data));
  const isMvno = carrier === 'MVNO';
  const verificationStatus =
    verified === true
      ? '통신사 인증 완료'
      : verified === false
        ? '직접 선택한 정보 · 통신사 인증 전'
        : '통신사 인증 상태를 확인할 수 없어요';

  return (
    <section
      aria-labelledby="membership-profile-heading"
      className="rounded-2xl border border-warmBorder bg-warmSurface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="membership-profile-heading" className="text-lg font-semibold text-ink">
            나의 멤버십
          </h2>
          {isMvno ? (
            <>
              <p className="mt-2 break-words text-xl font-bold text-accentStrong">
                {getCarrierLabel(carrier)}
              </p>
              <p className="mt-1 text-sm leading-6 text-grey05">
                통신 3사 멤버십 혜택을 둘러볼 수 있어요.
              </p>
            </>
          ) : hasProfile ? (
            <>
              <p className="mt-2 break-words text-xl font-bold text-accentStrong">
                {getCarrierLabel(carrier)} · {getMembershipGradeLabel(grade, data)}
              </p>
              <p className="mt-1 text-sm text-grey05">{verificationStatus}</p>
            </>
          ) : (
            <p className="mt-2 text-sm leading-6 text-grey05">
              멤버십 프로필을 등록하면 해당 통신사와 등급의 혜택을 모아볼 수 있어요.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onChangeProfileClick}
          disabled={saving}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? '저장 중…' : hasProfile ? '멤버십 정보 변경' : '멤버십 정보 등록'}
        </button>
      </div>
      {hasProfile ? (
        <Link
          href="/benefits?membership=mine"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-warmBorder px-4 text-sm font-semibold text-accentStrong transition-colors hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          이 조건으로 혜택 보기
        </Link>
      ) : null}
    </section>
  );
};

export default MembershipInfo;
