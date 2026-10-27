'use client';

import type { PartnerBenefitDetailResponse } from '@/features/allBenefitsPage/apis/partnerBenefitModel';
import { getApplicableTierBenefits, hasStructuredOffers } from '@/features/allBenefitsPage/apis/partnerBenefitModel';
import { getCarrierLabel, getMembershipGradeLabel } from '@/utils/membership';
import {
  getCarrierBenefitDisplayName,
  getMembershipOptionLabel,
} from '@/features/allBenefitsPage/apis/partnerBenefitModel';
import styles from './PartnerBenefitPage.module.css';
import BenefitConditions from '@/features/allBenefitsPage/components/BenefitConditions';
import { useReferenceData } from '@/components/ReferenceDataProvider';

export function PartnerBenefitComparison({
  detail,
  selectedBenefitId,
}: {
  detail: PartnerBenefitDetailResponse | null;
  selectedBenefitId?: number | null;
}) {
  const { data } = useReferenceData();
  if (!detail?.carrierGroups.length) return null;
  const comparisonGroups = detail.carrierGroups
    .map((group) => ({
      ...group,
      benefits: group.benefits.filter((benefit) => benefit.benefitId !== selectedBenefitId),
    }))
    .filter((group) => group.benefits.length > 0);
  if (!comparisonGroups.length) return null;

  return (
    <section className={styles.comparison} aria-labelledby="benefit-comparison-title">
      <h3 id="benefit-comparison-title">통신사·등급별 혜택 비교</h3>
      <div className={styles.comparisonGroups}>
        {comparisonGroups.map((group) => (
          <section className={styles.comparisonGroup} key={group.carrier}>
            <h4>{getCarrierLabel(group.carrier)}</h4>
            {group.benefits.map((benefit) => {
              const tiers = getApplicableTierBenefits(benefit.tierBenefits, group.carrier);
              const contexts = new Map<string, Set<string>>();
              tiers.forEach((tier) => {
                const context = tier.context.trim();
                if (!context) return;
                const grades = contexts.get(context) ?? new Set<string>();
                const contextRows = benefit.tierBenefits.filter(
                  (item) => item.context.trim() === context
                );
                if (tier.isAll && !contextRows.some((item) => !item.isAll)) {
                  grades.add('전체 등급');
                } else if (!tier.isAll) {
                  grades.add(getMembershipGradeLabel(tier.grade, data));
                }
                contexts.set(context, grades);
              });
              return (
                <div className={styles.comparisonBenefit} key={benefit.benefitId}>
                  <p>
                    {getMembershipOptionLabel(benefit)
                      ? `${getMembershipOptionLabel(benefit)} · `
                      : ''}
                    {getCarrierBenefitDisplayName(benefit)}
                  </p>
                  <BenefitConditions
                    collapsibleConditions
                    offerHeadingLevel={5}
                    conditions={benefit.conditions}
                    legacyLimit={benefit.benefitLimit}
                    sourceUrl={benefit.sourceUrl}
                    sourceCapturedAt={benefit.sourceCapturedAt}
                    manual={benefit.manual}
                    usageType={benefit.usageType}
                    carrier={group.carrier}
                    showAllOffers
                    tierConditions={
                      contexts.size > 0
                        ? [...contexts.entries()].map(([context, grades]) => ({
                            grades: [...grades],
                            context,
                          }))
                        : !hasStructuredOffers(benefit.conditions) && benefit.description
                          ? [{ grades: [], context: benefit.description }]
                          : []
                    }
                    className={styles.comparisonFacts}
                  />
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </section>
  );
}

export default PartnerBenefitComparison;
