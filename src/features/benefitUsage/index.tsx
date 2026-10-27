'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { TbChevronLeft, TbChevronRight, TbEdit, TbPlus, TbTrash, TbX } from 'react-icons/tb';
import SafeImage from '@/components/SafeImage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useSearchParams } from '@/lib/navigation';
import { fetchFavoriteDetail, fetchFavorites } from '@/features/myPage/apis/favorites';
import type { FavoriteDetail, FavoriteItem } from '@/types/favorites';
import { getPartnerBenefitPath } from '@/utils/partnerSeo';
import {
  createBenefitUsage,
  deleteBenefitUsage,
  fetchBenefitUsageMonth,
  updateBenefitUsage,
  type BenefitUsageMonth,
  type BenefitUsageRecord,
} from './api';

type BenefitChoice = Pick<FavoriteItem, 'benefitId' | 'benefitName' | 'partnerName'> & {
  partnerImage: string | null;
};

const MAX_SAVED_AMOUNT = 100_000_000;
const MIN_MONTH = '1000-01';
const MIN_USED_AT = '1000-01-01';
const amountFormatter = new Intl.NumberFormat('ko-KR');
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
});

const getTodayKst = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

const shiftMonth = (month: string, difference: number) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + difference, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`;
};

const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split('-');
  return `${year}년 ${Number(monthNumber)}월`;
};

const formatUsedAt = (usedAt: string) => dateFormatter.format(new Date(`${usedAt}T00:00:00+09:00`));

const formatWon = (amount: number) => `${amountFormatter.format(amount)}원`;

const toBenefitChoice = (benefit: FavoriteDetail): BenefitChoice => ({
  benefitId: benefit.benefitId,
  benefitName: benefit.benefitName,
  partnerName: benefit.partnerName,
  partnerImage: benefit.partnerImage,
});

export default function BenefitUsagePage() {
  const todayKst = useMemo(() => getTodayKst(), []);
  const currentMonth = todayKst.slice(0, 7);
  const [searchParams, setSearchParams] = useSearchParams();
  const benefitIdParam = searchParams.get('benefitId');
  const requestedBenefitId =
    benefitIdParam && /^[1-9]\d*$/.test(benefitIdParam) ? Number(benefitIdParam) : null;
  const [month, setMonth] = useState(currentMonth);
  const [monthData, setMonthData] = useState<BenefitUsageMonth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BenefitUsageRecord | null>(null);
  const [benefitChoices, setBenefitChoices] = useState<BenefitChoice[]>([]);
  const [benefitChoicesPage, setBenefitChoicesPage] = useState(0);
  const [benefitChoicesHasNext, setBenefitChoicesHasNext] = useState(false);
  const [benefitChoicesLoading, setBenefitChoicesLoading] = useState(false);
  const [benefitChoicesError, setBenefitChoicesError] = useState(false);
  const benefitChoicesLoadedRef = useRef(false);
  const [directBenefit, setDirectBenefit] = useState<BenefitChoice | null>(null);
  const [directBenefitLoading, setDirectBenefitLoading] = useState(false);
  const [directBenefitError, setDirectBenefitError] = useState(false);
  const [selectedBenefitId, setSelectedBenefitId] = useState('');
  const [usedAt, setUsedAt] = useState(todayKst);
  const [savedAmount, setSavedAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setLoadError(false);

    fetchBenefitUsageMonth(month).then(
      (data) => {
        if (!isCurrent) return;
        setMonthData(data);
        setIsLoading(false);
      },
      () => {
        if (!isCurrent) return;
        setMonthData(null);
        setLoadError(true);
        setIsLoading(false);
      }
    );

    return () => {
      isCurrent = false;
    };
  }, [month, refreshKey]);

  useEffect(() => {
    if (!isFormOpen) return;
    const frame = window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
      formRef.current?.querySelector<HTMLElement>('select, input, textarea')?.focus({
        preventScroll: true,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isFormOpen, editingRecord]);

  const loadBenefitChoices = useCallback(async (page: number) => {
    setBenefitChoicesLoading(true);
    setBenefitChoicesError(false);
    try {
      const response = await fetchFavorites(undefined, page, 100);
      const nextChoices = response.data.content.map((item) => ({
        ...item,
        partnerImage: item.partnerImage,
      }));
      setBenefitChoices((current) => (page === 0 ? nextChoices : [...current, ...nextChoices]));
      setBenefitChoicesPage(page);
      setBenefitChoicesHasNext(response.data.hasNext);
      benefitChoicesLoadedRef.current = true;
    } catch {
      setBenefitChoicesError(true);
    } finally {
      setBenefitChoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!requestedBenefitId) return;
    let isCurrent = true;
    setIsFormOpen(true);
    setEditingRecord(null);
    setSelectedBenefitId(String(requestedBenefitId));
    setUsedAt(todayKst);
    setSavedAmount('');
    setMemo('');
    setFormError('');
    setDirectBenefit(null);
    setDirectBenefitLoading(false);
    setDirectBenefitError(false);
    setDirectBenefitLoading(true);
    void loadBenefitChoices(0);

    fetchFavoriteDetail(requestedBenefitId)
      .then(
        (response) => {
          if (isCurrent) setDirectBenefit(toBenefitChoice(response.data));
        },
        () => {
          if (isCurrent) setDirectBenefitError(true);
        }
      )
      .finally(() => {
        if (isCurrent) setDirectBenefitLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [requestedBenefitId, loadBenefitChoices, todayKst]);

  const clearBenefitQuery = () => {
    if (!searchParams.has('benefitId')) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete('benefitId');
    setSearchParams(next, { replace: true });
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
    setSelectedBenefitId('');
    setUsedAt(month === currentMonth ? todayKst : `${month}-01`);
    setSavedAmount('');
    setMemo('');
    setFormError('');
    setDirectBenefit(null);
    setDirectBenefitLoading(false);
    setDirectBenefitError(false);
    clearBenefitQuery();
  };

  const openCreateForm = () => {
    setNotice('');
    setEditingRecord(null);
    setSelectedBenefitId('');
    setUsedAt(month === currentMonth ? todayKst : `${month}-01`);
    setSavedAmount('');
    setMemo('');
    setFormError('');
    setDirectBenefit(null);
    setDirectBenefitLoading(false);
    setDirectBenefitError(false);
    setIsFormOpen(true);
    clearBenefitQuery();
    if (!benefitChoicesLoadedRef.current) void loadBenefitChoices(0);
  };

  const openEditForm = (record: BenefitUsageRecord) => {
    setNotice('');
    setEditingRecord(record);
    setSelectedBenefitId(String(record.benefitId));
    setUsedAt(record.usedAt);
    setSavedAmount(record.savedAmountKrw === null ? '' : String(record.savedAmountKrw));
    setMemo(record.memo ?? '');
    setFormError('');
    setDirectBenefit(null);
    setDirectBenefitError(false);
    setIsFormOpen(true);
  };

  const benefitOptions = useMemo(() => {
    const options = new Map(benefitChoices.map((item) => [item.benefitId, item]));
    if (directBenefit) options.set(directBenefit.benefitId, directBenefit);
    return [...options.values()];
  }, [benefitChoices, directBenefit]);

  const selectedBenefit = benefitOptions.find(
    (benefit) => String(benefit.benefitId) === selectedBenefitId
  );

  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setFormError('');

    const amount = savedAmount.trim() === '' ? null : Number(savedAmount);
    if (!editingRecord && (!Number.isSafeInteger(Number(selectedBenefitId)) || !selectedBenefit)) {
      setFormError('혜택 정보를 확인한 뒤 기록해 주세요.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(usedAt) || usedAt < MIN_USED_AT || usedAt > todayKst) {
      setFormError('사용 날짜는 1000년 1월 1일부터 오늘까지 선택해 주세요.');
      return;
    }
    if (amount !== null && (!Number.isInteger(amount) || amount < 0 || amount > MAX_SAVED_AMOUNT)) {
      setFormError('절약액은 0원부터 100,000,000원까지 정수로 입력해 주세요.');
      return;
    }
    if (memo.length > 200) {
      setFormError('메모는 200자 이내로 입력해 주세요.');
      return;
    }

    const input = {
      usedAt,
      savedAmountKrw: amount,
      memo: memo.trim() || null,
    };

    setIsSaving(true);
    try {
      if (editingRecord) {
        await updateBenefitUsage(editingRecord.recordId, input);
      } else {
        await createBenefitUsage({ benefitId: Number(selectedBenefitId), ...input });
      }

      const savedMonth = usedAt.slice(0, 7);
      setMonth(savedMonth);
      setNotice(editingRecord ? '사용 기록을 수정했어요.' : '사용 기록을 저장했어요.');
      setRefreshKey((current) => current + 1);
      resetForm();
    } catch {
      setFormError(
        editingRecord
          ? '기록을 수정하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요.'
          : '기록을 저장하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async (recordId: number) => {
    if (deletingRecordId !== null) return;
    setDeletingRecordId(recordId);
    setDeleteError('');
    try {
      await deleteBenefitUsage(recordId);
      setDeleteCandidateId(null);
      setNotice('사용 기록을 삭제했어요.');
      setRefreshKey((current) => current + 1);
    } catch {
      setDeleteError('기록을 삭제하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setDeletingRecordId(null);
    }
  };

  const sortedRecords = useMemo(
    () =>
      [...(monthData?.records ?? [])].sort(
        (first, second) =>
          second.usedAt.localeCompare(first.usedAt) || second.recordId - first.recordId
      ),
    [monthData]
  );

  const changeMonth = (nextMonth: string) => {
    const match = nextMonth.match(/^(\d{4})-(\d{2})$/);
    if (
      match &&
      Number(match[2]) >= 1 &&
      Number(match[2]) <= 12 &&
      nextMonth >= MIN_MONTH &&
      nextMonth <= currentMonth
    ) {
      setNotice('');
      setMonth(nextMonth);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 pb-8 max-md:gap-4 max-md:px-4 max-md:pb-8">
      <header className="flex items-start justify-between gap-4 max-md:flex-col max-md:gap-3">
        <div>
          <h1 className="text-title-4 font-semibold text-ink max-md:text-title-5">
            혜택 사용 기록
          </h1>
          <p className="mt-1.5 text-body-3 leading-6 text-grey05">
            사용한 혜택과 직접 기록한 절약액을 한곳에.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-body-3-bold text-white transition-colors hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 max-md:w-full"
        >
          <TbPlus size={18} aria-hidden="true" />
          사용 기록 추가
        </button>
      </header>

      <div className="flex flex-col gap-5">
        <section className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 rounded-2xl border border-warmBorder bg-warmSurface px-5 py-4 max-md:px-4">
          <div className="min-w-0">
            <p className="text-body-4 font-semibold text-grey05">기록한 절약액</p>
            <p className="mt-1 break-words text-title-2 font-bold tracking-tight text-accentStrong max-md:text-title-3">
              {isLoading
                ? '불러오는 중…'
                : loadError
                  ? '—'
                  : formatWon(monthData?.totalSavedAmountKrw ?? 0)}
            </p>
          </div>
          <div className="border-l border-warmBorder pl-4">
            <p className="text-body-4 font-semibold text-grey05">{formatMonth(month)} 기록</p>
            <p className="mt-1 text-title-5 font-bold text-ink">
              {isLoading || loadError ? '—' : `${monthData?.recordCount ?? 0}건`}
            </p>
            <p className="mt-1 text-caption text-grey04">
              금액 미입력 {isLoading || loadError ? '—' : `${monthData?.unknownAmountCount ?? 0}건`}
            </p>
          </div>
          <p className="col-span-full border-t border-warmBorder pt-2 text-caption leading-5 text-grey04">
            직접 입력한 기록이며 결제 내역과 자동 연동되지 않아요.
          </p>
        </section>

        <section aria-label="월별 사용 기록" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changeMonth(shiftMonth(month, -1))}
                aria-label="이전 달"
                disabled={month <= MIN_MONTH}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-warmBorder bg-warmSurface text-grey05 hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
              >
                <TbChevronLeft size={20} aria-hidden="true" />
              </button>
              <h2 className="min-w-[110px] text-center text-title-6 font-bold text-ink">
                {formatMonth(month)}
              </h2>
              <button
                type="button"
                onClick={() => changeMonth(shiftMonth(month, 1))}
                aria-label="다음 달"
                disabled={month >= currentMonth}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-warmBorder bg-warmSurface text-grey05 hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
              >
                <TbChevronRight size={20} aria-hidden="true" />
              </button>
            </div>
            <label className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-warmBorder bg-warmSurface px-3 text-body-4 font-semibold text-grey05 focus-within:ring-2 focus-within:ring-brand md:w-auto">
              <span className="sr-only">기록을 볼 달 선택</span>
              <input
                type="month"
                value={month}
                min={MIN_MONTH}
                max={currentMonth}
                onChange={(event) => changeMonth(event.target.value)}
                className="min-h-10 min-w-0 flex-1 bg-transparent text-base text-ink focus:outline-none md:flex-none"
              />
            </label>
          </div>

          {notice && (
            <p
              role="status"
              className="rounded-xl bg-brandSoft px-4 py-3 text-body-4 font-semibold text-accentStrong"
            >
              {notice}
            </p>
          )}

          {isFormOpen && (
            <form
              ref={formRef}
              onSubmit={saveRecord}
              className="rounded-2xl border border-warmBorder bg-warmSurface p-5 max-md:p-4 wide:max-w-[1040px]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-title-6 font-bold text-ink">
                    {editingRecord ? '사용 기록 수정' : '사용 기록 추가'}
                  </h2>
                  <p className="mt-1 text-body-4 text-grey05">
                    {editingRecord
                      ? '날짜와 기록한 내용을 수정할 수 있어요.'
                      : '혜택을 사용한 날짜와 직접 확인한 절약액을 남겨 보세요.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  aria-label="기록 입력 취소"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-grey05 hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <TbX size={20} aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label
                    htmlFor="benefit-usage-benefit"
                    className="mb-1.5 block text-body-4-bold text-ink"
                  >
                    사용한 혜택
                  </label>
                  {editingRecord ? (
                    <div className="flex min-h-11 items-center rounded-xl border border-warmBorder bg-warmCanvas px-3 text-body-3 text-ink">
                      {editingRecord.partnerName} · {editingRecord.benefitName}
                    </div>
                  ) : (
                    <select
                      id="benefit-usage-benefit"
                      required
                      value={selectedBenefitId}
                      onChange={(event) => setSelectedBenefitId(event.target.value)}
                      className="min-h-11 w-full rounded-xl border border-warmBorder bg-warmSurface px-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">관심 혜택에서 선택해 주세요</option>
                      {benefitOptions.map((benefit) => (
                        <option key={benefit.benefitId} value={benefit.benefitId}>
                          {benefit.partnerName} · {benefit.benefitName}
                        </option>
                      ))}
                    </select>
                  )}
                  {!editingRecord && benefitChoicesLoading && (
                    <p className="mt-1.5 text-caption text-grey04">관심 혜택을 불러오는 중…</p>
                  )}
                  {!editingRecord && benefitChoicesError && (
                    <div
                      className="mt-2 flex flex-wrap items-center gap-2 text-caption text-danger"
                      role="alert"
                    >
                      <span>관심 혜택을 불러오지 못했어요.</span>
                      <button
                        type="button"
                        onClick={() => void loadBenefitChoices(0)}
                        className="inline-flex min-h-11 items-center rounded-lg px-2 font-bold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        다시 시도
                      </button>
                    </div>
                  )}
                  {!editingRecord &&
                    !benefitChoicesLoading &&
                    !benefitChoicesError &&
                    benefitOptions.length === 0 && (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-warmCanvas px-3 py-2.5 text-body-4 text-grey05">
                        <span>관심 혜택에서 먼저 혜택을 저장하거나 전체 혜택을 둘러보세요.</span>
                        <Link
                          href="/benefits"
                          className="inline-flex min-h-11 shrink-0 items-center font-bold text-accentStrong underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          혜택 둘러보기
                        </Link>
                      </div>
                    )}
                  {benefitChoicesHasNext && !editingRecord && (
                    <button
                      type="button"
                      onClick={() => void loadBenefitChoices(benefitChoicesPage + 1)}
                      disabled={benefitChoicesLoading}
                      className="mt-1 inline-flex min-h-11 items-center rounded-lg px-2 text-body-4 font-semibold text-accentStrong underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                    >
                      {benefitChoicesLoading ? '불러오는 중…' : '관심 혜택 더 불러오기'}
                    </button>
                  )}
                  {directBenefitLoading && requestedBenefitId && (
                    <p className="mt-1.5 text-caption text-grey04">혜택 정보를 확인하는 중…</p>
                  )}
                  {directBenefitError && requestedBenefitId && !directBenefitLoading && (
                    <p className="mt-1.5 text-caption text-danger" role="alert">
                      혜택을 확인하지 못했어요. 혜택 목록에서 다시 선택해 주세요.
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="benefit-usage-date"
                      className="mb-1.5 block text-body-4-bold text-ink"
                    >
                      사용 날짜
                    </label>
                    <input
                      id="benefit-usage-date"
                      type="date"
                      value={usedAt}
                      min={MIN_USED_AT}
                      max={todayKst}
                      required
                      onChange={(event) => setUsedAt(event.target.value)}
                      className="min-h-11 w-full rounded-xl border border-warmBorder bg-warmSurface px-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="benefit-usage-amount"
                      className="mb-1.5 block text-body-4-bold text-ink"
                    >
                      직접 확인한 절약액 <span className="font-normal text-grey04">(선택)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="benefit-usage-amount"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={MAX_SAVED_AMOUNT}
                        step={1}
                        value={savedAmount}
                        onChange={(event) => setSavedAmount(event.target.value)}
                        placeholder="입력하지 않아도 돼요"
                        className="min-h-11 w-full rounded-xl border border-warmBorder bg-warmSurface px-3 pr-10 text-base text-ink placeholder:text-grey04 focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-body-4 text-grey04">
                        원
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="benefit-usage-memo"
                    className="mb-1.5 block text-body-4-bold text-ink"
                  >
                    메모 <span className="font-normal text-grey04">(선택)</span>
                  </label>
                  <textarea
                    id="benefit-usage-memo"
                    rows={3}
                    maxLength={200}
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                    placeholder="사용하면서 기억할 내용을 적어 보세요"
                    className="w-full resize-y rounded-xl border border-warmBorder bg-warmSurface px-3 py-2.5 text-base leading-6 text-ink placeholder:text-grey04 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <p className="mt-1 text-right text-caption text-grey04">{memo.length}/200</p>
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-danger/5 px-3 py-2 text-body-4 text-danger"
                >
                  {formError}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2 max-sm:flex-col-reverse">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-warmBorder bg-warmSurface px-4 text-body-3-bold text-grey05 hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    (!editingRecord && directBenefitLoading && !selectedBenefit) ||
                    (!editingRecord && directBenefitError && !selectedBenefit)
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-body-3-bold text-white hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
                >
                  {isSaving ? (
                    <LoadingSpinner className="h-4 w-4 border-white border-t-transparent" />
                  ) : null}
                  {isSaving ? '저장 중…' : '기록 저장'}
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div
              role="status"
              className="flex min-h-56 flex-col items-center justify-center gap-3 text-body-4 text-grey05"
            >
              <LoadingSpinner />
              <span>{formatMonth(month)} 기록을 불러오는 중…</span>
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-warmBorder bg-warmSurface px-5 text-center"
            >
              <h2 className="text-title-6 font-bold text-ink">기록을 불러오지 못했어요</h2>
              <p className="mt-2 text-body-4 text-grey05">잠시 후 다시 시도해 주세요.</p>
              <button
                type="button"
                onClick={() => setRefreshKey((current) => current + 1)}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 text-body-3-bold text-white hover:bg-brandStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                다시 시도
              </button>
            </div>
          ) : sortedRecords.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-warmBorder bg-warmSurface px-5 text-center">
              <h2 className="text-title-6 font-bold text-ink">아직 사용 기록이 없어요</h2>
              <p className="mt-2 max-w-md text-body-4 leading-6 text-grey05">
                사용한 혜택과 직접 확인한 절약액을 이곳에 남겨 보세요.
              </p>
              <Link
                href="/benefits"
                className="mt-2 inline-flex min-h-11 items-center px-3 text-body-4 font-semibold text-accentStrong underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                전체 혜택 둘러보기
              </Link>
            </div>
          ) : (
            <section
              aria-label={`${formatMonth(month)} 사용 기록`}
              className="divide-y divide-warmBorder overflow-hidden rounded-2xl border border-warmBorder bg-warmSurface px-5 max-md:px-4"
            >
              {sortedRecords.map((record) => {
                const detailHref = `${getPartnerBenefitPath(record.partnerId, record.partnerName)}#benefit-${record.benefitId}`;
                const isDeleting = deletingRecordId === record.recordId;
                const isDeleteConfirmOpen = deleteCandidateId === record.recordId;

                return (
                  <article key={record.recordId} className="py-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <SafeImage
                          src={record.partnerImage}
                          alt={`${record.partnerName} 로고`}
                          fallbackLabel={record.partnerName}
                          className="h-11 w-11 shrink-0 rounded-xl border border-warmBorder bg-white object-contain p-1"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-caption font-medium text-grey04">
                            {formatUsedAt(record.usedAt)}
                          </p>
                          <p className="mt-1 truncate text-body-3-bold text-ink">
                            {record.partnerName}
                          </p>
                          <p className="mt-0.5 text-body-3 leading-5 text-grey06">
                            {record.benefitName}
                          </p>
                          {record.memo ? (
                            <p className="mt-2 whitespace-pre-wrap break-words text-body-4 leading-6 text-grey05">
                              {record.memo}
                            </p>
                          ) : null}
                          <p className="mt-2 flex items-center justify-between gap-3 text-body-4 font-semibold text-accentStrong">
                            <span className="text-caption font-medium text-grey04">
                              기록한 절약액
                            </span>
                            <span>
                              {record.savedAmountKrw === null
                                ? '금액 미입력'
                                : formatWon(record.savedAmountKrw)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 border-t border-warmBorder pt-2">
                        <Link
                          href={detailHref}
                          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 text-body-4 font-semibold text-accentStrong hover:bg-brandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none"
                        >
                          혜택 보기
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditForm(record)}
                          aria-label={`${record.benefitName} 사용 기록 수정`}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg px-3 text-body-4 font-semibold text-grey05 hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:flex-none"
                        >
                          <TbEdit size={16} aria-hidden="true" />
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError('');
                            setDeleteCandidateId(isDeleteConfirmOpen ? null : record.recordId);
                          }}
                          aria-expanded={isDeleteConfirmOpen}
                          aria-label={`${record.benefitName} 사용 기록 삭제`}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg px-3 text-body-4 font-semibold text-grey05 hover:bg-warmCanvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:flex-none"
                        >
                          <TbTrash size={16} aria-hidden="true" />
                          삭제
                        </button>
                      </div>
                    </div>
                    {isDeleteConfirmOpen && (
                      <div
                        role="group"
                        aria-label={`${record.benefitName} 기록 삭제 확인`}
                        className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warmCanvas px-3 py-3"
                      >
                        <div>
                          <p className="text-body-4-bold text-ink">이 사용 기록을 삭제할까요?</p>
                          {deleteError && (
                            <p role="alert" className="mt-1 text-caption text-danger">
                              {deleteError}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDeleteCandidateId(null)}
                            disabled={isDeleting}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warmBorder bg-warmSurface px-3 text-body-4-bold text-grey05 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => void confirmDelete(record.recordId)}
                            disabled={isDeleting}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-danger px-3 text-body-4-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 disabled:opacity-50"
                          >
                            {isDeleting ? '삭제 중…' : '삭제하기'}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}
        </section>
      </div>
    </div>
  );
}
