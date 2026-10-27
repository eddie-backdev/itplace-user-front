import {
  formatSourceCapturedDate,
  getBenefitConditionRows,
  getBenefitOfferEligibility,
  getBenefitOffers,
  hasOverallBenefitSummaryContent,
  getSingleOfferRewardSummary,
  partitionBenefitOffers,
} from '../apis/benefitConditions.mjs';
import type {
  BenefitConditions as BenefitConditionsData,
  BenefitOffer,
} from '../apis/benefitConditions.mjs';
import { formatOfferFacts, formatOfferRewardFacts } from '../apis/benefitFactFormatting.mjs';
import {
  getMembershipGradeLabel,
  isGradeApplicableToProfile,
  type CarrierCode,
} from '@/utils/membership';
import { useReferenceData } from '@/components/ReferenceDataProvider';

type BenefitConditionsProps = {
  conditions?: BenefitConditionsData | null;
  legacyLimit?: string | null;
  sourceUrl?: string | null;
  sourceCapturedAt?: string | null;
  manual?: string | null;
  usageType?: 'ONLINE' | 'OFFLINE' | 'BOTH' | 'UNKNOWN' | null;
  carrier?: CarrierCode;
  grade?: string | null;
  showAllOffers?: boolean;
  className?: string;
  tierConditions?: Array<{ grades: string[]; context: string }>;
  includeTierDetails?: boolean;
  collapsibleConditions?: boolean;
  offerHeadingLevel?: 3 | 4 | 5;
};

const validHttpUrl = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};

type ConditionRow = ReturnType<typeof getBenefitConditionRows>[number];

const isTierRow = (row: ConditionRow) =>
  row.key === 'benefit' ||
  row.key === 'grades' ||
  row.key.startsWith('benefit-') ||
  row.key.startsWith('grades-');

const channelLabel = (usageType: BenefitOffer['usageType'] | null | undefined) =>
  usageType === 'ONLINE'
    ? '온라인'
    : usageType === 'OFFLINE'
      ? '오프라인'
      : usageType === 'BOTH'
        ? '온라인 · 오프라인'
        : '이용 방식 확인 필요';

const offerFields = [
  ['products', '대상 상품'],
  ['availability', '이용 가능일'],
  ['limits', '이용 한도'],
  ['usage', '이용 방법'],
  ['exclusions', '제외 조건'],
] as const;

const overallFieldLabels = {
  products: '대상 상품',
  availability: '이용 가능일',
  limits: '이용 한도',
  usage: '이용 방법',
  exclusions: '제외 조건',
} as const;

const issueNotice = (code: string) => code === 'SOURCE_BLOCKS_MISSING' || code === 'SOURCE_DETAIL_MISSING' || code === 'SOURCE_PARSE_ERROR'
  ? '일부 이용 조건은 제휴처 공식 안내에서 확인해 주세요.'
  : '이용 조건은 제휴처 공식 안내에서 추가 확인해 주세요.';

function OfferCard({
  offer,
  carrier,
  eligibility,
  showAllOffers,
  offerResolution,
  summaryContext,
  headingLevel,
}: {
  offer: BenefitOffer;
  carrier?: CarrierCode;
  eligibility: 'ELIGIBLE' | 'INELIGIBLE' | 'UNKNOWN';
  showAllOffers: boolean;
  offerResolution?: BenefitConditionsData['offerResolution'];
  summaryContext?: string;
  headingLevel: 3 | 4 | 5;
}) {
  const { data: referenceData } = useReferenceData();
  const Heading = `h${headingLevel}` as const;
  const grades =
    offer.allGrades === true
      ? ['전체 등급']
      : offer.gradeCodes.length
        ? offer.gradeCodes.map((code) =>
            carrier ? getMembershipGradeLabel(code, referenceData) : code
          )
        : ['적용 등급 확인 필요'];
  const eligibilityLabel = offerResolution === 'UNRESOLVED'
    ? '혜택·등급 조건 확인 필요'
    : offer.allGrades === true
      ? '전체 등급 적용'
      : showAllOffers
        ? offer.gradeCodes.length
          ? `적용 대상 등급 · ${grades.join(' · ')}`
          : '적용 등급 확인 필요'
        : eligibility === 'ELIGIBLE'
          ? '선택 등급 적용'
          : eligibility === 'INELIGIBLE'
            ? '선택 등급 대상 아님'
            : '적용 여부 확인 필요';
  const rewardFacts = formatOfferRewardFacts(offer.facts);

  return (
    <article className="rounded-xl border border-[var(--itplace-color-border)] bg-[var(--itplace-color-surface)] p-3">
      <Heading className="font-semibold text-[var(--itplace-color-text)]">
        {rewardFacts.length ? `${rewardFacts.join(' · ')} · ` : ''}
        {offer.title || '혜택 조건 확인 필요'}
      </Heading>
      <p className="mt-1 text-xs font-medium text-[var(--itplace-color-text-secondary)]">{eligibilityLabel}</p>
      {summaryContext ? (
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--itplace-color-text)]">
          <span className="font-medium">혜택 내용 · </span>{summaryContext}
        </p>
      ) : null}
      {offer.facts?.length ? (
        <>
        <ul className="mt-2 space-y-1 text-sm leading-6 text-[var(--itplace-color-text)]">
          {formatOfferFacts(offer.facts).map((label, index) => (
            <li key={`${offer.key}-${index}`}>{label}</li>
          ))}
        </ul>
        {offer.facts.some((fact) => fact.sharedLimitGroup) ? <p className="mt-1 text-xs text-[var(--itplace-color-text-secondary)]">{offer.facts.some((fact) => fact.sharedLimitGroup?.includes('VVIP_CHOICE')) ? '이 한도는 해당 VVIP 초이스 제휴사 전체에서 함께 사용해요.' : '이 한도는 해당 초이스 제휴사 전체에서 함께 사용해요.'}</p> : null}
        </>
      ) : null}
      <dl className="mt-2 divide-y divide-[var(--itplace-color-border)] border-y border-[var(--itplace-color-border)]">
        <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-2 text-sm leading-6 max-sm:grid-cols-[5rem_minmax(0,1fr)]">
          <dt className="font-medium text-[var(--itplace-color-text-secondary)]">이용 채널</dt>
          <dd className="m-0 text-[var(--itplace-color-text)]">
            {channelLabel(offerResolution === 'UNRESOLVED' ? 'UNKNOWN' : offer.usageType)}
          </dd>
        </div>
        <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-2 text-sm leading-6 max-sm:grid-cols-[5rem_minmax(0,1fr)]">
          <dt className="font-medium text-[var(--itplace-color-text-secondary)]">적용 등급</dt>
          <dd className="m-0 text-[var(--itplace-color-text)]">{grades.join(' · ')}</dd>
        </div>
        {offerFields.map(([key, label]) => {
          const values = offer[key].filter((value) => typeof value === 'string' && value.trim());
          return values.length ? (
            <div
              key={key}
              className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-2 text-sm leading-6 max-sm:grid-cols-[5rem_minmax(0,1fr)]"
            >
              <dt className="font-medium text-[var(--itplace-color-text-secondary)]">{label}</dt>
              <dd className="m-0 min-w-0 whitespace-pre-line break-words text-[var(--itplace-color-text)]">
                {values.map((value, index) => (
                  <p key={index}>{value}</p>
                ))}
              </dd>
            </div>
          ) : null;
        })}
      </dl>
      {offer.channelEvidence.length ? (
        <details className="mt-2 rounded-lg border border-[var(--itplace-color-border)] px-3">
          <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-medium text-[var(--itplace-color-text-secondary)]">
            이용 채널 근거
          </summary>
          <ul className="list-disc space-y-1 pb-3 pl-5 text-sm leading-6 text-[var(--itplace-color-text-secondary)]">
            {offer.channelEvidence.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}
      {offer.sourceText?.trim() ? (
        <details className="mt-2 rounded-lg border border-[var(--itplace-color-border)] px-3">
          <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-medium text-[var(--itplace-color-text-secondary)]">
            안내 원문 보기
          </summary>
          <p className="whitespace-pre-line break-words pb-3 text-sm leading-6 text-[var(--itplace-color-text-secondary)]">
            {offer.sourceText}
          </p>
        </details>
      ) : null}
    </article>
  );
}

function ConditionRows({ rows }: { rows: ConditionRow[] }) {
  if (!rows.length) return null;

  return (
    <dl className="divide-y divide-[var(--itplace-color-border)] border-y border-[var(--itplace-color-border)]">
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-2.5 text-sm leading-6 max-sm:grid-cols-[5rem_minmax(0,1fr)]"
        >
          <dt className="font-medium text-[var(--itplace-color-text-secondary)]">{row.label}</dt>
          <dd
            className={`m-0 min-w-0 whitespace-pre-line break-words ${row.isUnknown ? 'text-[var(--itplace-color-text-secondary)]' : 'text-[var(--itplace-color-text)]'}`}
          >
            {isTierRow(row) ? (
              row.values.join(' · ')
            ) : (
              <div className="space-y-2">
                {row.values.map((value, index) => (
                  <p key={index}>{value}</p>
                ))}
              </div>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function BenefitConditions({
  conditions,
  legacyLimit,
  sourceUrl,
  sourceCapturedAt,
  manual,
  usageType,
  carrier,
  grade,
  showAllOffers = false,
  className,
  tierConditions,
  includeTierDetails = true,
  collapsibleConditions = false,
  offerHeadingLevel = 3,
}: BenefitConditionsProps) {
  const { data: referenceData } = useReferenceData();
  const offers = getBenefitOffers(conditions);
  const hasOffers = offers.length > 0;
  const unresolved =
    conditions?.offerResolution === 'UNRESOLVED' ||
    (!hasOffers && Boolean(conditions?.offerResolution));
  const getEligibility = (offer: BenefitOffer) =>
    getBenefitOfferEligibility(
      offer,
      Boolean(grade),
      Boolean(
        carrier &&
          grade &&
          offer.gradeCodes.some((benefitGrade) =>
            isGradeApplicableToProfile({
              benefitCarrier: carrier,
              benefitGrade,
              userCarrier: carrier,
              userGrade: grade,
              referenceData,
            })
          )
      ),
      conditions?.offerResolution
    );
  const partitionedOffers = partitionBenefitOffers(offers, getEligibility, showAllOffers);
  const singleOfferSummary = !showAllOffers && grade
    ? getSingleOfferRewardSummary(
        conditions?.offerResolution,
        offers.length,
        offers.length === 1 && getEligibility(offers[0]) === 'ELIGIBLE',
        tierConditions
      )
    : undefined;
  const allRows = getBenefitConditionRows(conditions, legacyLimit, tierConditions);
  const rows = includeTierDetails ? allRows : allRows.filter((row) => !isTierRow(row));
  const safeSourceUrl = validHttpUrl(sourceUrl);
  const capturedDate = formatSourceCapturedDate(sourceCapturedAt);
  const hasManual = Boolean(manual?.trim());
  const overallRows = offerFields.flatMap(([key]) => {
    if (conditions?.offerResolution) return [];
    const values =
      conditions?.[key]?.filter((value) => typeof value === 'string' && value.trim()) ?? [];
    return values.length ? [{ key, label: overallFieldLabels[key], values }] : [];
  });
  const usageChannel = channelLabel(usageType);

  return (
    <div className={className}>
      {!hasOffers && !unresolved ? (
        <p className="mb-2 text-xs text-[var(--itplace-color-text-secondary)]">
          <span className="font-medium text-[var(--itplace-color-text)]">이용 채널</span> · {usageChannel}
        </p>
      ) : null}
      {unresolved ? (
        <p className="mb-2 text-sm text-[var(--itplace-color-text-secondary)]">
          혜택별 조건을 확인하기 어려워요. 이용 전 공식 안내에서 혜택과 적용 등급을 확인해 주세요.
        </p>
      ) : null}
      {conditions?.offerResolution === 'PARTIAL' ? (
        <div className="mb-2 rounded-lg bg-[var(--itplace-color-surface-subtle)] p-3 text-sm leading-6 text-[var(--itplace-color-warning)]">
          추가 이용 안내가 있어요. 전체 등급과 여러 혜택의 안내가 포함되어 있으니 선택한 등급·혜택에 해당하는 조건을 확인해 주세요.
          {conditions.normalizationIssues?.length ? <details className="mt-2">
            <summary className="min-h-9 cursor-pointer font-medium">추가 이용 안내(전체 혜택)</summary>
            <ul className="list-disc space-y-2 pl-5">
              {conditions.normalizationIssues.map((issue, index) => (
                <li key={`${issue.sourcePath ?? ''}-${index}`}>
                  <p>{issueNotice(issue.code)}</p>
                  {issue.sourceText ? <p className="whitespace-pre-line">{issue.sourceText}</p> : null}
                </li>
              ))}
            </ul>
          </details> : null}
        </div>
      ) : null}
      {hasOffers ? (
        <div className="space-y-3">
          {partitionedOffers.visible.map((offer) => (
            <OfferCard
              key={offer.key}
              offer={offer}
              carrier={carrier}
              eligibility={getEligibility(offer)}
              showAllOffers={showAllOffers}
              offerResolution={conditions?.offerResolution}
              summaryContext={singleOfferSummary}
              headingLevel={offerHeadingLevel}
            />
          ))}
          {partitionedOffers.otherGrades.length ? (
            <details className="rounded-lg border border-[var(--itplace-color-border)] px-3">
              <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-medium text-[var(--itplace-color-text-secondary)]">
                다른 등급 혜택 {partitionedOffers.otherGrades.length}개 보기
              </summary>
              <div className="space-y-3 pb-3">
                {partitionedOffers.otherGrades.map((offer) => (
                  <OfferCard
                    key={offer.key}
                    offer={offer}
                    carrier={carrier}
                    eligibility={getEligibility(offer)}
                    showAllOffers={showAllOffers}
                    offerResolution={conditions?.offerResolution}
                    headingLevel={offerHeadingLevel}
                  />
                ))}
              </div>
            </details>
          ) : null}
          {hasOverallBenefitSummaryContent(overallRows, conditions?.channelDecision) ? (
            <details className="rounded-lg border border-[var(--itplace-color-border)] px-3">
              <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-medium text-[var(--itplace-color-text-secondary)]">
                전체 안내 요약
              </summary>
              {overallRows.length ? (
                <dl className="divide-y divide-[var(--itplace-color-border)] border-y border-[var(--itplace-color-border)]">
                  {overallRows.map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-2 text-sm leading-6 max-sm:grid-cols-[5rem_minmax(0,1fr)]"
                    >
                      <dt className="font-medium text-[var(--itplace-color-text-secondary)]">{row.label}</dt>
                      <dd className="m-0 whitespace-pre-line break-words text-[var(--itplace-color-text)]">
                        {row.values.join('\n')}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {conditions?.channelDecision?.evidence.length ? (
                <div className="py-2 text-sm leading-6 text-[var(--itplace-color-text-secondary)]">
                  <p className="mb-1 font-medium">이용 채널을 확인한 안내 문구</p>
                  {[
                    ...conditions.channelDecision.evidence,
                  ].map((item, index) => (
                    <p key={index}>{item}</p>
                  ))}
                </div>
              ) : null}
              {hasManual ? (
                <div className="py-2 text-sm leading-6 text-[var(--itplace-color-text-secondary)]">
                  <p className="mb-1 font-medium">전체 공식 안내 원문</p>
                  <p className="mb-1 text-xs">전체 등급과 여러 혜택의 안내가 포함되어 있어요. 선택한 등급·혜택에 해당하는 조건을 확인해 주세요.</p>
                  <p className="whitespace-pre-line break-words">{manual}</p>
                </div>
              ) : null}
            </details>
          ) : hasManual ? (
            <details className="rounded-lg border border-[var(--itplace-color-border)] px-3">
              <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-medium text-[var(--itplace-color-text-secondary)]">
                전체 공식 안내 원문 보기
              </summary>
              <p className="whitespace-pre-line break-words pb-3 text-sm leading-6 text-[var(--itplace-color-text-secondary)]">
                {manual}
              </p>
            </details>
          ) : null}
        </div>
      ) : unresolved ? (
        <details className="rounded-lg border border-[var(--itplace-color-border)] px-3">
          <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-medium text-[var(--itplace-color-text-secondary)]">
            전체 안내 원문 보기
          </summary>
          <p className="py-2 text-xs leading-5 text-[var(--itplace-color-text-secondary)]">전체 등급과 여러 혜택의 안내가 포함되어 있어요. 선택한 등급·혜택에 해당하는 조건을 확인해 주세요.</p>
          <ConditionRows rows={rows.filter((row) => !isTierRow(row))} />
          {conditions?.channelDecision?.evidence.length ? (
            <div className="py-2 text-sm leading-6 text-[var(--itplace-color-text-secondary)]">
              <p className="mb-1 font-medium">이용 채널을 확인한 안내 문구</p>
              {conditions.channelDecision.evidence.map((item, index) => <p key={index}>{item}</p>)}
            </div>
          ) : null}
          {hasManual ? (
            <div className="py-2 text-sm leading-6 text-[var(--itplace-color-text-secondary)]">
              <p className="mb-1 font-medium">전체 공식 안내 원문</p>
              <p className="mb-1 text-xs">전체 등급과 여러 혜택의 안내가 포함되어 있어요. 선택한 등급·혜택에 해당하는 조건을 확인해 주세요.</p>
              <p className="whitespace-pre-line break-words">{manual}</p>
            </div>
          ) : null}
        </details>
      ) : (
        <>
          <ConditionRows rows={collapsibleConditions ? rows.filter(isTierRow) : rows} />
          {collapsibleConditions ? (
            <details className="mt-2 rounded-lg border border-[var(--itplace-color-border)] px-3">
              <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-medium text-[var(--itplace-color-text-secondary)] hover:text-[var(--itplace-color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--itplace-color-accent)]">
                이용 조건 보기
              </summary>
              <ConditionRows rows={rows.filter((row) => !isTierRow(row))} />
              {hasManual ? (
                <div className="py-2 text-sm leading-6 text-[var(--itplace-color-text-secondary)]">
                  <p className="mb-1 font-medium">전체 공식 안내 원문</p>
                  <p className="mb-1 text-xs">전체 등급과 여러 혜택의 안내가 포함되어 있어요. 선택한 등급·혜택에 해당하는 조건을 확인해 주세요.</p>
                  <p className="whitespace-pre-line break-words">{manual}</p>
                </div>
              ) : null}
            </details>
          ) : hasManual ? (
            <details className="mt-2 rounded-lg border border-[var(--itplace-color-border)] px-3">
              <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-medium text-[var(--itplace-color-text-secondary)] hover:text-[var(--itplace-color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--itplace-color-accent)]">
                전체 공식 안내 원문 보기
              </summary>
              <p className="whitespace-pre-line break-words pb-2 text-sm leading-6 text-[var(--itplace-color-text-secondary)]">
                {manual}
              </p>
            </details>
          ) : null}
        </>
      )}
      {safeSourceUrl || capturedDate ? (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-[var(--itplace-color-text-secondary)]">
          {safeSourceUrl ? (
            <a
              href={safeSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-[var(--itplace-color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--itplace-color-accent)]"
            >
              출처 보기
            </a>
          ) : null}
          {capturedDate ? <span>{capturedDate} 확인</span> : null}
        </p>
      ) : null}
    </div>
  );
}
