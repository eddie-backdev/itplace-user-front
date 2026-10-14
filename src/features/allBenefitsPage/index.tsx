'use client';

import {
  TbBook,
  TbBuildingCarousel,
  TbHeart,
  TbHome,
  TbLayoutGrid,
  TbMovie,
  TbPlane,
  TbSearch,
  TbShoppingBag,
  TbToolsKitchen2,
} from 'react-icons/tb';
import type { IconType } from 'react-icons';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type MouseEvent,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Link } from '@/lib/navigation';
import type { RootState } from '@/store';
import { useClientReady } from '@/hooks/useClientReady';
import MobileHeader from '@/components/MobileHeader';
import BenefitExplorerCard from './components/BenefitExplorerCard';
import BenefitExplorerDetail from './components/BenefitExplorerDetail';
import { getPartnerBenefits, type PartnerBenefitResponse } from './apis/allBenefitsApi';
import {
  CARRIER_OPTIONS,
  getCarrierLabel,
  getMembershipGradeLabel,
  getMembershipGradeOptions,
  isCarrierCode,
  isValidCarrierGradePair,
} from '@/utils/membership';
import { CATEGORIES } from '@/features/mainPage/constants';
import { getPartnerBenefitPath } from '@/utils/partnerSeo';
import styles from './BenefitsExplorer.module.css';

const ITEMS_PER_PAGE = 15;
const CATEGORY_ICONS: Record<string, IconType> = {
  전체: TbLayoutGrid,
  엑티비티: TbBuildingCarousel,
  '뷰티/건강': TbHeart,
  쇼핑: TbShoppingBag,
  '생활/편의': TbHome,
  푸드: TbToolsKitchen2,
  '문화/여가': TbMovie,
  교육: TbBook,
  '여행/교통': TbPlane,
};
const DETAIL_BREAKPOINT = '(min-width: 1280px)';
const subscribeToDetailBreakpoint = (callback: () => void) => {
  const query = window.matchMedia(DETAIL_BREAKPOINT);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
};
const getDetailBreakpointSnapshot = () => window.matchMedia(DETAIL_BREAKPOINT).matches;
const getDetailBreakpointServerSnapshot = () => false;

type AllBenefitsLayoutProps = {
  initialData?: PartnerBenefitResponse | null;
  initialRequestKey?: string;
};
type QueryChanges = Record<string, string | null>;

export default function AllBenefitsLayout({
  initialData = null,
  initialRequestKey,
}: AllBenefitsLayoutProps) {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('q')?.trim().slice(0, 100) ?? '';
  const carrierValue = searchParams.get('carrier')?.trim();
  const selectedCarrier = isCarrierCode(carrierValue) ? carrierValue : undefined;
  const gradeValue = searchParams.get('grade')?.trim();
  const selectedGrade = isValidCarrierGradePair(selectedCarrier, gradeValue)
    ? gradeValue
    : undefined;
  const partnerValue = Number(searchParams.get('partner'));
  const requestedPartnerId =
    Number.isSafeInteger(partnerValue) && partnerValue > 0 ? partnerValue : null;
  const categoryValue = searchParams.get('category')?.trim();
  const selectedCategory =
    CATEGORIES.find((category) => category.id === categoryValue)?.id ?? '전체';
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
    profileCarrier && profileGrade && isValidCarrierGradePair(profileCarrier, profileGrade)
  );
  const membershipOnly = membershipRequested && isLoggedIn && hasMembershipProfile;
  const waitingForMembership = membershipRequested && !isAuthReady;
  const effectiveCarrier = membershipOnly ? profileCarrier : selectedCarrier;
  const effectiveGrade = membershipOnly ? profileGrade : selectedGrade;
  const requestKey = [
    keyword,
    effectiveCarrier,
    selectedCategory,
    currentPage,
    effectiveGrade,
  ].join('|');
  const hasMatchingInitialData = Boolean(initialData && initialRequestKey === requestKey);
  const hasDesktopDetail = useSyncExternalStore(
    subscribeToDetailBreakpoint,
    getDetailBreakpointSnapshot,
    getDetailBreakpointServerSnapshot
  );

  const [result, setResult] = useState<{
    data: PartnerBenefitResponse | null;
    status: 'loading' | 'ready' | 'error';
  }>({
    data: hasMatchingInitialData ? initialData : null,
    status: hasMatchingInitialData ? 'ready' : 'loading',
  });
  const [retry, setRetry] = useState(0);
  const lastLoadedKeyRef = useRef(hasMatchingInitialData ? requestKey : null);

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
      document.getElementById('benefit-results-title')?.closest('section')?.scrollIntoView({ block: 'start' });
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
      ? `${getCarrierLabel(profileCarrier)} · ${getMembershipGradeLabel(profileGrade)}`
      : isLoggedIn
        ? '통신사와 등급을 설정하면 내 조건으로 볼 수 있어요.'
        : '통신사와 등급을 선택해 혜택을 살펴보세요.';
  const selectedPartner =
    partners.find((partner) => partner.partnerId === requestedPartnerId) ?? partners[0] ?? null;

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
        <MobileHeader title="전체 혜택" />
      </div>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>전체 혜택</h1>
            <p role="status" aria-live="polite" className={styles.resultCount}>
              {waitingForMembership
                ? '내 멤버십 확인 중…'
                : isLoading
                  ? '혜택 불러오는 중…'
                  : result.status === 'error'
                    ? '목록을 불러오지 못했어요.'
                    : `총 ${numberFormatter.format(totalElements)}개${totalPages > 1 ? ` · ${currentPage} / ${totalPages}페이지` : ''}`}
            </p>
          </div>
          <div className={styles.headerActions}>
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
                추가 필터
                {effectiveGrade ? ` · ${getMembershipGradeLabel(effectiveGrade)}` : ''}
                {membershipOnly ? ' · 내 멤버십 적용 중' : ''}
              </summary>
              <div className={styles.advancedPanel}>
                <h2>등급과 내 멤버십</h2>
                {effectiveCarrier ? (
                  <form
                    action="/benefits"
                    method="get"
                    className={styles.gradeControl}
                    aria-label={`${getCarrierLabel(effectiveCarrier)} 멤버십 등급 필터`}
                    onSubmit={(event) => {
                      event.preventDefault();
                      const submittedGrade = new FormData(event.currentTarget).get('grade');
                      updateQuery({
                        carrier: effectiveCarrier,
                        grade: typeof submittedGrade === 'string' ? submittedGrade || null : null,
                        membership: null,
                        page: null,
                      });
                    }}
                  >
                    <input type="hidden" name="carrier" value={effectiveCarrier} />
                    {keyword ? <input type="hidden" name="q" value={keyword} /> : null}
                    {selectedCategory !== '전체' ? (
                      <input type="hidden" name="category" value={selectedCategory} />
                    ) : null}
                    <label htmlFor="benefits-grade">등급</label>
                    <select
                      key={`${effectiveCarrier}:${effectiveGrade ?? ''}`}
                      id="benefits-grade"
                      name="grade"
                      defaultValue={effectiveGrade ?? ''}
                      onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    >
                      <option value="">모든 등급</option>
                      {getMembershipGradeOptions(effectiveCarrier).map((grade) => (
                        <option key={grade.code} value={grade.code}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </form>
                ) : (
                  <p className={styles.filterHint}>통신사를 선택하면 등급별 혜택을 볼 수 있어요.</p>
                )}
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
                  {effectiveGrade ? (
                    <p className={styles.membershipNote}>
                      선택 등급의 혜택입니다. 횟수·기간·매장 조건은 상세에서 확인하세요.
                    </p>
                  ) : null}
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
            <nav aria-label="통신사 필터" className={styles.carrierTabs}>
              {[{ code: undefined, label: '전체' }, ...CARRIER_OPTIONS].map((carrier) => {
                const selected = effectiveCarrier === carrier.code;
                const changes = {
                  carrier: carrier.code ?? null,
                  grade: null,
                  membership: null,
                  page: null,
                };
                return (
                  <Link
                    key={carrier.code ?? 'all'}
                    to={hrefFor(changes)}
                    prefetch={false}
                    onClick={(event) => followFilter(event, changes)}
                    aria-current={selected ? 'true' : undefined}
                    aria-label={carrier.code ? `${carrier.label} 통신사` : '모든 통신사'}
                    className={`${styles.carrierTab} ${!carrier.code ? styles.allFilterTab : ''} ${selected ? styles.carrierTabSelected : ''}`}
                  >
                    {carrier.code ? carrier.label : '모든 통신사'}
                  </Link>
                );
              })}
            </nav>
            <nav aria-label="카테고리 필터" className={styles.categoryTabs}>
              {CATEGORIES.map((category) => {
                const selected = selectedCategory === category.id;
                const CategoryIcon = CATEGORY_ICONS[category.id] ?? TbLayoutGrid;
                const isAll = category.id === '전체';
                const changes = {
                  category: category.id === '전체' ? null : category.id,
                  page: null,
                };
                return (
                  <Link
                    key={category.id}
                    to={hrefFor(changes)}
                    prefetch={false}
                    onClick={(event) => followFilter(event, changes)}
                    aria-current={selected ? 'true' : undefined}
                    aria-label={isAll ? '모든 카테고리' : undefined}
                    className={`${styles.categoryTab} ${isAll ? styles.allFilterTab : ''} ${selected ? styles.categoryTabSelected : ''}`}
                  >
                    {isAll ? (
                      <span>모든 카테고리</span>
                    ) : (
                      <>
                        <CategoryIcon size={16} aria-hidden="true" />
                        <span>{category.name}</span>
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>
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
          {hasDesktopDetail && selectedPartner ? (
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {selectedPartner.partnerName} 혜택을 선택했습니다.
            </p>
          ) : null}
          <div className={styles.resultsHeading}>
            <h2 id="benefit-results-title" className="sr-only">
              {membershipOnly
                ? '내 조건에 맞는 혜택'
                : effectiveGrade
                  ? `${getMembershipGradeLabel(effectiveGrade)} 조건의 혜택`
                  : keyword
                    ? `“${keyword}” 검색 결과`
                    : '혜택 제휴처'}
            </h2>
          </div>
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
                    return (
                      <BenefitExplorerCard
                        key={partner.partnerId}
                        partner={partner}
                        href={href}
                        carrier={effectiveCarrier}
                        grade={effectiveGrade}
                        selected={
                          hasDesktopDetail && partner.partnerId === selectedPartner?.partnerId
                        }
                        onSelect={(event) => {
                          if (
                            !hasDesktopDetail ||
                            event.button !== 0 ||
                            event.metaKey ||
                            event.ctrlKey ||
                            event.shiftKey ||
                            event.altKey
                          ) {
                            return;
                          }
                          event.preventDefault();
                          const href = hrefFor({ partner: String(partner.partnerId) });
                          window.history.replaceState(null, '', href);
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
            {hasDesktopDetail && selectedPartner ? (
              <div className={styles.detailColumn}>
                <BenefitExplorerDetail
                  key={`${selectedPartner.partnerId}|${effectiveCarrier ?? ''}|${effectiveGrade ?? ''}`}
                  partner={selectedPartner}
                  carrier={effectiveCarrier}
                  grade={effectiveGrade}
                  detailHref={detailHrefFor(selectedPartner.partnerId, selectedPartner.partnerName)}
                />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
