'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/apis/axiosInstance';
import { fetchFavorites } from '@/features/myPage/apis/favorites';
import { fetchBenefitUsageMonth } from '@/features/benefitUsage/api';
import { getCarrierLabel, getMembershipGradeLabel } from '@/utils/membership';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserSummary {
  nickname: string;
  email: string | null;
  carrier: string | null;
  membershipGrade: string | null;
  membershipGradeCode: string | null;
}

const currentMonth = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
const number = new Intl.NumberFormat('ko-KR');

export default function MyPageOverview() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [favoriteCount, setFavoriteCount] = useState<number | null>(null);
  const [activity, setActivity] = useState<{
    recordCount: number;
    totalSavedAmountKrw: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const month = currentMonth();
    setLoading(true);
    setFavoritesLoading(true);
    setFavoritesError(false);
    setActivityLoading(true);
    setActivityError(false);
    void Promise.allSettled([
      api.get<{ data: UserSummary }>('api/v1/users'),
      fetchFavorites(undefined, 0, 1),
      fetchBenefitUsageMonth(month),
    ]).then(([userResult, favoriteResult, activityResult]) => {
      if (!active) return;
      if (userResult.status === 'fulfilled') setUser(userResult.value.data.data);
      else setUser(null);
      if (favoriteResult.status === 'fulfilled') {
        setFavoriteCount(favoriteResult.value.data.totalElements);
      } else {
        setFavoriteCount(null);
        setFavoritesError(true);
      }
      if (activityResult.status === 'fulfilled') {
        setActivity({
          recordCount: activityResult.value.recordCount,
          totalSavedAmountKrw: activityResult.value.totalSavedAmountKrw,
        });
      } else {
        setActivity(null);
        setActivityError(true);
      }
      setLoading(false);
      setFavoritesLoading(false);
      setActivityLoading(false);
    });
    return () => {
      active = false;
    };
  }, [retryCount]);

  const grade = user?.membershipGradeCode ?? user?.membershipGrade;
  const hasMembership = Boolean(user?.carrier && grade);

  return (
    <div className="flex min-w-0 flex-col gap-6 pb-8 max-md:gap-4">
      <header className="flex items-start justify-between gap-4 border-b border-[#e8e9ee] pb-5 max-md:flex-col">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-[-0.035em] text-[#202124] max-md:text-2xl">
            마이페이지
          </h1>
          {loading ? (
            <div role="status" className="mt-4">
              <LoadingSpinner />
            </div>
          ) : user ? (
            <div className="mt-4 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0edfc] text-lg font-bold text-[#6154d9]"
              >
                {user.nickname.slice(0, 1) || '나'}
              </span>
              <div>
                <p className="text-base font-bold text-[#202124]">{user.nickname}</p>
                <p className="mt-1 text-sm text-[#686b73]">{user.email ?? '이메일 정보 없음'}</p>
              </div>
            </div>
          ) : (
            <p role="status" className="mt-3 text-sm text-[#686b73]">
              회원 정보를 불러오지 못했어요.
            </p>
          )}
        </div>
        <Link
          href="/mypage/info"
          className="inline-flex min-h-11 items-center font-semibold text-[#6154d9] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
        >
          프로필 수정 →
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-2 max-md:gap-4">
        <section
          aria-labelledby="overview-membership"
          className="rounded-2xl border border-[#e8e9ee] bg-white p-6 max-md:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="overview-membership" className="text-xl font-bold text-[#202124]">
                내 멤버십
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#686b73]">
                {loading
                  ? '불러오는 중…'
                  : hasMembership
                    ? `${getCarrierLabel(user?.carrier)} ${getMembershipGradeLabel(grade)}`
                    : '등록된 멤버십 프로필이 없어요.'}
              </p>
            </div>
            <Link
              href="/mypage/membership"
              className="min-h-11 shrink-0 px-2 py-2 text-sm font-semibold text-[#6154d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
            >
              {hasMembership ? '변경' : '등록'}
            </Link>
          </div>
          <p className="mt-4 text-sm text-[#686b73]">통신사와 등급에 맞는 혜택을 확인해 보세요.</p>
        </section>
        <section
          aria-labelledby="overview-favorites"
          className="rounded-2xl border border-[#e8e9ee] bg-white p-6 max-md:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="overview-favorites" className="text-xl font-bold text-[#202124]">
                관심 혜택
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#686b73]">
                {favoritesLoading
                  ? '불러오는 중…'
                  : favoritesError
                    ? '저장한 혜택 수를 확인하지 못했어요.'
                    : `${number.format(favoriteCount ?? 0)}개 혜택`}
              </p>
            </div>
            <Link
              href="/mypage/favorites"
              className="min-h-11 shrink-0 px-2 py-2 text-sm font-semibold text-[#6154d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
            >
              목록 보기
            </Link>
          </div>
          <p className="mt-4 text-sm text-[#686b73]">저장한 혜택을 빠르게 다시 확인하세요.</p>
          {favoritesError ? (
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#6154d9] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
            >
              다시 시도
            </button>
          ) : null}
        </section>
      </div>

      <section
        aria-labelledby="overview-activity"
        className="rounded-2xl border border-[#e8e9ee] bg-white p-6 max-md:p-5"
      >
        <div className="flex items-start justify-between gap-4 max-sm:flex-col">
          <div>
            <h2 id="overview-activity" className="text-xl font-bold text-[#202124]">
              이번 달 사용 기록
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#686b73]">
              직접 기록한 혜택 이용 내역이에요. 실제 결제 내역과 연결되지 않습니다.
            </p>
          </div>
          <Link
            href="/mypage/activity"
            className="min-h-11 shrink-0 py-2 text-sm font-semibold text-[#6154d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
          >
            기록 보기 →
          </Link>
        </div>
        <p className="mt-5 text-sm text-[#686b73]">
          {activityLoading
            ? '불러오는 중…'
            : activityError
              ? '사용 기록을 불러오지 못했어요.'
              : `${activity?.recordCount ?? 0}건 · 절약액 ${number.format(activity?.totalSavedAmountKrw ?? 0)}원`}
        </p>
        {activityError ? (
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#6154d9] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
          >
            다시 시도
          </button>
        ) : null}
      </section>

      <nav
        aria-label="도움말"
        className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#6154d9]"
      >
        <Link
          href="/faq"
          className="min-h-11 py-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
        >
          자주 묻는 질문 →
        </Link>
        <Link
          href="/guide"
          className="min-h-11 py-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6154d9]"
        >
          혜택 이용 가이드 →
        </Link>
      </nav>
    </div>
  );
}
