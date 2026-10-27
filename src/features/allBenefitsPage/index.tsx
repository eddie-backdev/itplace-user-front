'use client';

import { TbBookmark, TbSearch } from 'react-icons/tb';
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from '@/lib/navigation';
import type { RootState } from '@/store';
import { useClientReady } from '@/hooks/useClientReady';
import MobileHeader from '@/components/MobileHeader';
import MembershipSelectionDialog from '@/components/membership/MembershipSelectionDialog';
import BenefitExplorerCard from './components/BenefitExplorerCard';
import BenefitExplorerDetail from './components/BenefitExplorerDetail';
import {
  getPartnerBenefits,
  type PartnerBenefitItem,
  type PartnerBenefitResponse,
} from './apis/allBenefitsApi';
import { addFavorite, removeFavorite } from './apis/allBenefitsApi';
import { getFavoritesList } from '@/features/mainPage/api/favoritesListApi';
import { getLoginHref } from '@/features/loginPage/utils/returnTo.mjs';
import { showToast } from '@/utils/toast';
import {
  CARRIER_OPTIONS,
  getCarrierLabel,
  getMembershipGradeLabel,
  getBenefitMembershipGradeOptions,
  isCarrierCode,
  isValidBenefitCarrierGradePair,
  isValidCarrierGradePair,
} from '@/utils/membership';
import { toCategoryOptions } from '@/utils/referenceData';
import { useReferenceData } from '@/components/ReferenceDataProvider';
import { getPartnerBenefitPath } from '@/utils/partnerSeo';
import { isPreviewSummaryEligible } from '@/utils/benefitPreview';
import styles from './BenefitsExplorer.module.css';

const ITEMS_PER_PAGE = 15;
type AllBenefitsLayoutProps = {
  initialData?: PartnerBenefitResponse | null;
  initialRequestKey?: string;
};
type QueryChanges = Record<string, string | null>;

export default function AllBenefitsLayout({
  initialData = null,
  initialRequestKey,
}: AllBenefitsLayoutProps) {
  const { data: referenceData } = useReferenceData();
  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get('q')?.trim().slice(0, 100) ?? '';
  const carrierValue = searchParams.get('carrier')?.trim();
  const selectedCarrier = isCarrierCode(carrierValue) ? carrierValue : undefined;
  const gradeValue = searchParams.get('grade')?.trim();
  const selectedGrade = isValidBenefitCarrierGradePair(selectedCarrier, gradeValue, referenceData)
    ? gradeValue
    : undefined;
  const partnerValue = Number(searchParams.get('partner'));
  const requestedPartnerId =
    Number.isSafeInteger(partnerValue) && partnerValue > 0 ? partnerValue : null;
  const categoryValue = searchParams.get('category')?.trim();
  const selectedCategory =
    toCategoryOptions(referenceData).find((category) => category.id === categoryValue)?.id ?? '전체';
  const pageValue = Number(searchParams.get('page') ?? 1);
  const currentPage = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const membershipRequested = searchParams.get('membership') === 'mine';

  const { isLoggedIn: storedIsLoggedIn, user } = useSelector((state: RootState) => state.auth);
  const isAuthRehydrated = useSelector((state: RootState) => state._persist.rehydrated);
  const isClientReady = useClientReady();
  const isAuthReady = isClientReady && isAuthRehydrated;
  const isLoggedIn = isAuthReady && storedIsLoggedIn;
  const profileCarrier = isLoggedIn && isCarrierCode(user?.carrier) ? user.carrier : undefined;
  const profileGrade = user?.membershipGradeCode || user?.membershipGrade || '';
  const hasMembershipProfile = Boolean(
    profileCarrier && profileGrade && isValidCarrierGradePair(profileCarrier, profileGrade, referenceData)
  );
  const membershipOnly = membershipRequested && isLoggedIn && hasMembershipProfile;
  const waitingForMembership = membershipRequested && !isAuthReady;
  const effectiveCarrier = membershipOnly ? profileCarrier : selectedCarrier;
  const effectiveGrade = membershipOnly ? profileGrade : selectedGrade;
  const dialogCarrier = effectiveCarrier ?? (isCarrierCode(user?.carrier) ? user.carrier : 'SKT');
  const dialogGrade =
    effectiveGrade ??
    (profileCarrier === dialogCarrier && isValidCarrierGradePair(dialogCarrier, profileGrade, referenceData)
      ? profileGrade
      : (getBenefitMembershipGradeOptions(dialogCarrier, referenceData)[0]?.code ?? ''));
  const requestKey = [
    keyword,
    effectiveCarrier,
    selectedCategory,
    currentPage,
    effectiveGrade,
  ].join('|');
  const hasMatchingInitialData = Boolean(initialData && initialRequestKey === requestKey);

  const [result, setResult] = useState<{
    data: PartnerBenefitResponse | null;
    status: 'loading' | 'ready' | 'error';
  }>({
    data: hasMatchingInitialData ? initialData : null,
    status: hasMatchingInitialData ? 'ready' : 'loading',
  });
  const [retry, setRetry] = useState(0);
  const lastLoadedKeyRef = useRef(hasMatchingInitialData ? requestKey : null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => new Set());
  const [favoriteStatus, setFavoriteStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(null);
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);
  const [previewPartner, setPreviewPartner] = useState<PartnerBenefitItem | null>(null);
  const previewDialogRef = useRef<HTMLDialogElement>(null);
  const openedQueryPartnerRef = useRef<number | null>(null);

  useEffect(() => {
    const dialog = previewDialogRef.current;
    if (!dialog) return;
    if (previewPartner && !dialog.open) dialog.showModal();
    else if (!previewPartner && dialog.open) dialog.close();
  }, [previewPartner]);

  useEffect(() => {
    if (!requestedPartnerId) {
      openedQueryPartnerRef.current = null;
      if (previewPartner) setPreviewPartner(null);
      return;
    }
    if (openedQueryPartnerRef.current === requestedPartnerId) return;
    const partner = result.data?.content.find(({ partnerId }) => partnerId === requestedPartnerId);
    if (partner) {
      openedQueryPartnerRef.current = requestedPartnerId;
      setPreviewPartner(partner);
    }
  }, [previewPartner, requestedPartnerId, result.data]);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      setFavoriteIds(new Set());
      setFavoriteStatus('ready');
      return;
    }
    let cancelled = false;
    setFavoriteStatus('loading');
    void getFavoritesList({}).then(
      (favorites) => {
        if (cancelled) return;
        setFavoriteIds(new Set(favorites.map(({ benefitId }) => benefitId)));
        setFavoriteStatus('ready');
      },
      () => {
        if (!cancelled) setFavoriteStatus('error');
      }
    );
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, isLoggedIn]);

  const setFavoriteState = (benefitId: number, isFavorite: boolean) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (isFavorite) next.add(benefitId);
      else next.delete(benefitId);
      return next;
    });
  };

  const toggleFavorite = async (benefitId: number) => {
    if (pendingFavoriteId !== null) return;
    if (!isAuthReady || !isLoggedIn) {
      navigate(getLoginHref(`${window.location.pathname}${window.location.search}`));
      return;
    }
    if (favoriteStatus !== 'ready') {
      showToast('관심 혜택 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.', 'info');
      return;
    }
    const wasFavorite = favoriteIds.has(benefitId);
    setPendingFavoriteId(benefitId);
    try {
      if (wasFavorite) await removeFavorite(benefitId);
      else await addFavorite(benefitId);
      setFavoriteState(benefitId, !wasFavorite);
    } catch {
      showToast('관심 혜택을 변경하지 못했어요. 잠시 후 다시 시도해 주세요.', 'error');
    } finally {
      setPendingFavoriteId(null);
    }
  };

  useEffect(() => {
    if (waitingForMembership) return;
    if (lastLoadedKeyRef.current === requestKey && retry === 0) return;
    document.getElementById('benefit-card-scroll')?.scrollTo({ top: 0 });
    let cancelled = false;
    lastLoadedKeyRef.current = null;
    setResult({ data: null, status: 'loading' });

    void getPartnerBenefits({
      mainCategory: effectiveGrade ? undefined : 'BASIC_BENEFIT',
      page: currentPage - 1,
      size: ITEMS_PER_PAGE,
      keyword: keyword || undefined,
      category: selectedCategory !== '전체' ? selectedCategory : undefined,
      carriers: effectiveCarrier ? [effectiveCarrier] : undefined,
      grade: effectiveGrade,
    }).then(
      (data) => {
        if (cancelled) return;
        lastLoadedKeyRef.current = requestKey;
        setResult({ data, status: 'ready' });
      },
      () => {
        if (!cancelled) setResult({ data: null, status: 'error' });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [
    requestKey,
    keyword,
    selectedCategory,
    currentPage,
    effectiveCarrier,
    effectiveGrade,
    membershipOnly,
    waitingForMembership,
    retry,
  ]);

  const hrefFor = (changes: QueryChanges) => {
    const next = new URLSearchParams(searchParams.toString());
    if (Object.keys(changes).some((key) => key !== 'partner')) next.delete('partner');
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value);
      else next.delete(name);
    }
    const query = next.toString();
    return query ? `/benefits?${query}` : '/benefits';
  };

  const updateQuery = (changes: QueryChanges) => {
    const href = hrefFor(changes);
    if (`${window.location.pathname}${window.location.search}` === href) return;
    window.history.pushState(null, '', href);
  };

  const openPreview = (partner: PartnerBenefitItem) => {
    openedQueryPartnerRef.current = partner.partnerId;
    window.history.pushState(null, '', hrefFor({ partner: String(partner.partnerId) }));
    setPreviewPartner(partner);
  };

  const closePreview = () => {
    setPreviewPartner(null);
    const next = new URLSearchParams(window.location.search);
    if (next.has('partner')) {
      next.delete('partner');
      const query = next.toString();
      window.history.replaceState(
        null,
        '',
        query ? `${window.location.pathname}?${query}` : window.location.pathname
      );
    }
  };

  const followFilter = (
    event: MouseEvent<HTMLAnchorElement>,
    changes: QueryChanges,
    scrollToResults = false
  ) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    updateQuery(changes);
    if (scrollToResults && window.matchMedia('(max-width: 767px)').matches) {
      document
        .getElementById('benefit-results-title')
        ?.closest('section')
        ?.scrollIntoView({ block: 'start' });
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitted = new FormData(event.currentTarget).get('q');
    updateQuery({
      q: typeof submitted === 'string' ? submitted.trim().slice(0, 100) : null,
      page: null,
    });
  };

  const resetChanges = {
    q: null,
    carrier: null,
    grade: null,
    category: null,
    membership: null,
    page: null,
  };
  const partners = result.data?.content ?? [];
  const totalElements = result.data?.totalElements ?? 0;
  const totalPages = result.data?.totalPages ?? Math.ceil(totalElements / ITEMS_PER_PAGE);
  const isLoading = waitingForMembership || result.status === 'loading';
  const pageGroupStart =
    Math.floor((Math.min(currentPage, Math.max(totalPages, 1)) - 1) / 5) * 5 + 1;
  const visiblePages = Array.from(
    { length: Math.max(0, Math.min(5, totalPages - pageGroupStart + 1)) },
    (_, index) => pageGroupStart + index
  );
  const hasFilters = Boolean(
    keyword ||
      selectedCarrier ||
      selectedGrade ||
      selectedCategory !== '전체' ||
      membershipRequested
  );
  const numberFormatter = new Intl.NumberFormat('ko-KR');
  const profileDescription = !isAuthReady
    ? '멤버십 확인 중…'
    : hasMembershipProfile
      ? `${getCarrierLabel(profileCarrier)} · ${getMembershipGradeLabel(profileGrade, referenceData)}`
      : isLoggedIn
        ? '통신사와 등급을 설정하면 내 조건으로 볼 수 있어요.'
        : '통신사와 등급을 선택해 혜택을 살펴보세요.';

  const pageLink = (page: number, label: string, disabled = false) =>
    disabled ? (
      <span aria-disabled="true" className={styles.pageNumber}>
        {label}
      </span>
    ) : (
      <Link
        to={hrefFor({ page: page > 1 ? String(page) : null })}
        prefetch={false}
        onClick={(event) => followFilter(event, { page: page > 1 ? String(page) : null }, true)}
        aria-label={label === String(page) ? `${page}페이지` : `${label} 페이지`}
        aria-current={currentPage === page ? 'page' : undefined}
        className={`${styles.pageNumber} ${currentPage === page ? styles.pageNumberSelected : ''}`}
      >
        {label}
      </Link>
    );

  const detailQuery = new URLSearchParams();
  if (effectiveCarrier) detailQuery.set('carrier', effectiveCarrier);
  if (effectiveGrade) {
    detailQuery.set('grade', effectiveGrade);
    if (membershipOnly) detailQuery.set('membership', 'mine');
  }
  const detailHrefFor = (partnerId: number, partnerName: string) => {
    const path = getPartnerBenefitPath(partnerId, partnerName);
    return `${path}${detailQuery.size ? `?${detailQuery}` : ''}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.mobileHeader}>
        <MobileHeader title="혜택찾기" />
      </div>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>혜택찾기</h1>
            <p className={styles.pageDescription}>
              통신사와 등급, 필요한 조건으로 혜택을 찾아보세요.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.membershipButton}
              onClick={() => setIsMembershipDialogOpen(true)}
            >
              {effectiveCarrier && effectiveGrade
                ? `${getCarrierLabel(effectiveCarrier)} · ${getMembershipGradeLabel(effectiveGrade, referenceData)}`
                : '멤버십 선택'}
            </button>
            <details
              className={styles.additionalFilters}
              onKeyDown={(event) => {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                event.currentTarget.open = false;
                event.currentTarget.querySelector('summary')?.focus();
              }}
            >
              <summary>
                <TbBookmark aria-hidden="true" size={15} />
                {membershipOnly ? '내 멤버십 적용 중' : '내 멤버십'}
              </summary>
              <div className={styles.advancedPanel}>
                <h2>내 멤버십으로 보기</h2>
                <div className={styles.membershipBody}>
                  {isLoggedIn ? (
                    <>
                      <label className={styles.membershipToggle}>
                        <input
                          type="checkbox"
                          checked={membershipOnly}
                          disabled={!hasMembershipProfile}
                          onChange={(event) =>
                            updateQuery({
                              membership: event.target.checked ? 'mine' : null,
                              page: null,
                            })
                          }
                          aria-describedby="membership-filter-description"
                        />
                        내 멤버십 혜택만 보기
                      </label>
                      <p id="membership-filter-description">{profileDescription}</p>
                      {isAuthReady && !hasMembershipProfile ? (
                        <Link to="/mypage/info" className={styles.inlineLink}>
                          멤버십 설정
                        </Link>
                      ) : null}
                    </>
                  ) : (
                    <p>{profileDescription}</p>
                  )}
                  <p className={styles.membershipNote}>
                    횟수·기간·매장 조건은 상세에서 확인하세요.
                  </p>
                </div>
              </div>
            </details>
            {hasFilters ? (
              <Link
                to={hrefFor(resetChanges)}
                prefetch={false}
                onClick={(event) => followFilter(event, resetChanges)}
                className={styles.resetLink}
              >
                초기화
              </Link>
            ) : null}
          </div>
        </header>

        <section aria-label="혜택 필터" className={styles.filters}>
          <div className={styles.filterToolbar}>
            <div className={styles.selectFilters}>
              <label className={styles.selectFilter}>
                <span className={styles.selectLabel}>통신사</span>
                <select
                  value={effectiveCarrier ?? ''}
                  aria-label="통신사 필터"
                  onChange={(event) =>
                    updateQuery({
                      carrier: event.target.value || null,
                      grade: null,
                      membership: null,
                      page: null,
                    })
                  }
                >
                  <option value="">전체 통신사</option>
                  {CARRIER_OPTIONS.map((carrier) => (
                    <option key={carrier.code} value={carrier.code}>
                      {carrier.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.selectFilter}>
                <span className={styles.selectLabel}>등급</span>
                <select
                  value={effectiveGrade ?? ''}
                  disabled={!effectiveCarrier}
                  aria-label="멤버십 등급 필터"
                  onChange={(event) =>
                    updateQuery({ grade: event.target.value || null, membership: null, page: null })
                  }
                >
                  <option value="">모든 등급</option>
                  {effectiveCarrier
                    ? getBenefitMembershipGradeOptions(effectiveCarrier, referenceData).map((grade) => (
                        <option key={grade.code} value={grade.code}>
                          {grade.label}
                        </option>
                      ))
                    : null}
                </select>
              </label>
              <label className={styles.selectFilter}>
                <span className={styles.selectLabel}>분야</span>
                <select
                  value={selectedCategory === '전체' ? '' : selectedCategory}
                  aria-label="혜택 분야 필터"
                  onChange={(event) =>
                    updateQuery({ category: event.target.value || null, page: null })
                  }
                >
                  <option value="">모든 분야</option>
                  {toCategoryOptions(referenceData).filter((category) => category.id !== '전체').map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <form
              action="/benefits"
              method="get"
              role="search"
              onSubmit={submitSearch}
              className={styles.searchForm}
            >
              <label htmlFor="benefits-search" className="sr-only">
                혜택 검색
              </label>
              {selectedCarrier ? (
                <input type="hidden" name="carrier" value={selectedCarrier} />
              ) : null}
              {selectedCategory !== '전체' ? (
                <input type="hidden" name="category" value={selectedCategory} />
              ) : null}
              {!membershipOnly && selectedGrade ? (
                <input type="hidden" name="grade" value={selectedGrade} />
              ) : null}
              {membershipOnly ? <input type="hidden" name="membership" value="mine" /> : null}
              <TbSearch size={18} aria-hidden="true" className={styles.searchIcon} />
              <input
                key={keyword}
                id="benefits-search"
                type="search"
                name="q"
                defaultValue={keyword}
                maxLength={100}
                autoComplete="off"
                placeholder="혜택 검색"
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                검색
              </button>
            </form>
          </div>
        </section>

        <section aria-labelledby="benefit-results-title" className={styles.resultsSection}>
          <div className={styles.resultsHeading}>
            <h2 id="benefit-results-title" className="sr-only">
              {membershipOnly
                ? '내 조건에 맞는 혜택'
                : effectiveGrade
                  ? `${getMembershipGradeLabel(effectiveGrade, referenceData)} 조건의 혜택`
                  : keyword
                    ? `“${keyword}” 검색 결과`
                    : '혜택 제휴처'}
            </h2>
            <div className={styles.resultSummary}>
              <p role="status" aria-live="polite">
                {waitingForMembership
                  ? '내 멤버십 확인 중…'
                  : isLoading
                    ? '혜택 불러오는 중…'
                    : result.status === 'error'
                      ? '목록을 불러오지 못했어요.'
                      : `${numberFormatter.format(totalElements)}개 브랜드 · 현재 ${partners.length}개 제휴처`}
              </p>
              <div className={styles.activeFilters} role="group" aria-label="적용 중인 필터">
                {effectiveCarrier ? <span>{getCarrierLabel(effectiveCarrier)}</span> : null}
                {effectiveGrade ? <span>{getMembershipGradeLabel(effectiveGrade, referenceData)}</span> : null}
                {selectedCategory !== '전체' ? (
                  <span>{toCategoryOptions(referenceData).find(({ id }) => id === selectedCategory)?.name}</span>
                ) : null}
                {membershipOnly ? <span>내 멤버십</span> : null}
              </div>
            </div>
          </div>
          {favoriteStatus === 'error' ? (
            <p role="status" className={styles.favoriteStatusMessage}>
              관심 혜택 정보를 불러오지 못해 추가 기능을 잠시 사용할 수 없어요. 페이지를 새로고침해
              주세요.
            </p>
          ) : null}
          <div className={styles.explorer}>
            <div className={styles.listColumn}>
              {isLoading ? (
                <div
                  aria-busy="true"
                  aria-label="혜택 목록 불러오는 중"
                  id="benefit-card-scroll"
                  className={styles.cardGrid}
                >
                  {Array.from({ length: 6 }, (_, index) => (
                    <div key={index} aria-hidden="true" className={styles.skeletonCard} />
                  ))}
                </div>
              ) : result.status === 'error' ? (
                <div className={styles.emptyState}>
                  <h3>혜택을 불러오지 못했어요</h3>
                  <p>연결 상태를 확인하고 다시 시도해 주세요.</p>
                  <button type="button" onClick={() => setRetry((value) => value + 1)}>
                    다시 시도
                  </button>
                </div>
              ) : partners.length > 0 ? (
                <div id="benefit-card-scroll" className={styles.cardGrid}>
                  {partners.map((partner) => {
                    const href = detailHrefFor(partner.partnerId, partner.partnerName);
                    const previews = partner.previews ?? [];
                    const candidates = effectiveCarrier
                      ? previews.filter((preview) => preview.carrier === effectiveCarrier)
                      : previews;
                    const gradeCandidates = effectiveGrade
                      ? candidates.filter((preview) =>
                          preview.summary !== undefined
                            ? preview.summary === null || isPreviewSummaryEligible(preview, effectiveGrade, referenceData)
                            : preview.offers !== undefined || preview.offerResolution !== undefined
                            ? (preview.offers?.length ?? 0) > 0
                            : preview.tierBenefits.some((tier) => tier.isAll || tier.grade === effectiveGrade)
                        )
                      : candidates;
                    const favoriteBenefitId =
                      gradeCandidates[0]?.benefitId ??
                      candidates[0]?.benefitId ??
                      previews[0]?.benefitId;
                    return (
                      <BenefitExplorerCard
                        key={partner.partnerId}
                        partner={partner}
                        href={href}
                        carrier={effectiveCarrier}
                        grade={effectiveGrade}
                        isFavorite={favoriteBenefitId ? favoriteIds.has(favoriteBenefitId) : false}
                        favoriteBusy={
                          favoriteStatus !== 'ready' ||
                          (favoriteBenefitId !== undefined &&
                            pendingFavoriteId === favoriteBenefitId)
                        }
                        onToggleFavorite={
                          favoriteBenefitId
                            ? (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                void toggleFavorite(favoriteBenefitId);
                              }
                            : undefined
                        }
                        onPreview={(event) => {
                          if (
                            event.button !== 0 ||
                            event.metaKey ||
                            event.ctrlKey ||
                            event.shiftKey ||
                            event.altKey
                          )
                            return;
                          event.preventDefault();
                          openPreview(partner);
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <h3>
                    {currentPage > 1 && totalElements > 0
                      ? '이 페이지에는 표시할 혜택이 없어요'
                      : membershipOnly
                        ? '내 조건에 맞는 혜택이 없어요'
                        : '일치하는 혜택을 찾지 못했어요'}
                  </h3>
                  <p>검색어나 통신사, 카테고리를 바꿔서 확인해 보세요.</p>
                  <Link
                    to={hrefFor(resetChanges)}
                    prefetch={false}
                    onClick={(event) => followFilter(event, resetChanges)}
                  >
                    전체 혜택 보기
                  </Link>
                </div>
              )}
              {!isLoading && result.status === 'ready' && totalPages > 1 ? (
                <nav aria-label="혜택 목록 페이지" className={styles.pagination}>
                  {pageLink(currentPage - 1, '이전', currentPage <= 1)}
                  {visiblePages.map((page) => (
                    <span key={page}>{pageLink(page, String(page))}</span>
                  ))}
                  {pageLink(currentPage + 1, '다음', currentPage >= totalPages)}
                </nav>
              ) : null}
            </div>
          </div>
        </section>
      </div>
      <MembershipSelectionDialog
        isOpen={isMembershipDialogOpen}
        carrier={dialogCarrier}
        grade={dialogGrade}
        onClose={() => setIsMembershipDialogOpen(false)}
        onApply={(carrier, grade) => updateQuery({ carrier, grade, membership: null, page: null })}
      />
      <dialog
        ref={previewDialogRef}
        className={styles.previewDialog}
        aria-label={previewPartner ? `${previewPartner.partnerName} 혜택 미리보기` : undefined}
        onCancel={(event) => {
          event.preventDefault();
          closePreview();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePreview();
        }}
      >
        {previewPartner ? (
          <>
            <BenefitExplorerDetail
              key={`${previewPartner.partnerId}|${effectiveCarrier ?? ''}|${effectiveGrade ?? ''}`}
              partner={previewPartner}
              carrier={effectiveCarrier}
              grade={effectiveGrade}
              onFavoriteChange={setFavoriteState}
              onClose={closePreview}
              detailHref={detailHrefFor(previewPartner.partnerId, previewPartner.partnerName)}
            />
          </>
        ) : null}
      </dialog>
    </div>
  );
}
