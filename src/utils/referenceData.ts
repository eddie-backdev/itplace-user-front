export type ReferenceGrade = {
  carrier: string;
  code: string;
  label: string;
  sortOrder: number;
  active: boolean;
  profileSelectable: boolean;
  benefitEnabled: boolean;
  allGradeMember: boolean;
};

export type ReferenceData = {
  grades: ReferenceGrade[];
  programs: Array<{ code: string; label: string; sortOrder: number; active: boolean }>;
  categories: Array<{ code: string; label: string; sortOrder: number; active: boolean }>;
  gradeMatches: Array<{ carrier: string; profileGrade: string; benefitGrade: string }>;
};

export type ReferenceDataState = { data: ReferenceData | null; error: boolean; retry: () => void };

export const getCategoryLabel = (code?: string | null, data?: ReferenceData | null) =>
  code ? data?.categories.find((item) => item.code === code)?.label ?? code : '';

export const getProgramLabel = (code?: string | null, data?: ReferenceData | null) =>
  code ? data?.programs.find((item) => item.code === code)?.label ?? code : '';

export const getBenefitGradeOptions = (carrier?: string | null, data?: ReferenceData | null) =>
  data?.grades.filter((grade) => grade.carrier === carrier && grade.active && grade.benefitEnabled && grade.allGradeMember)
    .sort((a, b) => a.sortOrder - b.sortOrder).map(({ code, label }) => ({ code, label })) ?? [];

export const toCategoryOptions = (data: ReferenceData | null) => [
  { id: '전체', name: '전체' },
  ...(data?.categories
    .filter((item) => item.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ code, label }) => ({ id: code, name: label })) ?? []),
];
