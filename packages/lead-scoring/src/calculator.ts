export type LeadUrgency =
  | 'immediate'
  | 'within_30_days'
  | 'within_90_days'
  | 'researching'
  | 'unknown';

export type BudgetFit =
  | 'within_range'
  | 'stretch'
  | 'unknown'
  | 'outside_range';

export interface LeadCompleteness {
  readonly name?: string | null;
  readonly phone?: string | null;
  readonly requirement?: string | null;
  readonly location?: string | null;
  readonly timeline?: string | null;
}
export interface LeadScoringInput {
  readonly explicitIntent: boolean;
  readonly explicitSiteVisitRequested?: boolean;
  readonly completeness: LeadCompleteness;
  readonly urgency: LeadUrgency;
  readonly budgetFit: BudgetFit;
}

export interface ScoreBreakdown {
  readonly explicitIntent: number;
  readonly completeness: number;
  readonly urgency: number;
  readonly budgetFit: number;
}

export interface LeadScore {
  readonly score: number;
  readonly reasons: readonly string[];
  readonly breakdown: ScoreBreakdown;
}

const COMPLETENESS_FIELDS = [
  'name',
  'phone',
  'requirement',
  'location',
  'timeline',
] as const;

const URGENCY_SCORES: Readonly<Record<LeadUrgency, number>> = {
  immediate: 20,
  within_30_days: 15,
  within_90_days: 8,
  researching: 3,
  unknown: 0,
};

const BUDGET_SCORES: Readonly<Record<BudgetFit, number>> = {
  within_range: 20,
  stretch: 10,
  unknown: 3,
  outside_range: 0,
};

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function calculateLeadScore(input: LeadScoringInput): LeadScore {
  const reasons: string[] = [];

  const intentScore = input.explicitSiteVisitRequested
    ? 35
    : input.explicitIntent
      ? 30
      : 0;
  if (input.explicitSiteVisitRequested) {
    reasons.push('Explicit site visit or appointment request (+35)');
  } else if (input.explicitIntent) {
    reasons.push('Explicit buying or booking intent (+30)');
  } else {
    reasons.push('No explicit buying or booking intent (+0)');
  }

  const completeFields = COMPLETENESS_FIELDS.filter((field) =>
    hasValue(input.completeness[field]),
  );
  const completenessScore = completeFields.length * 5;
  reasons.push(
    `${completeFields.length}/${COMPLETENESS_FIELDS.length} qualification fields complete (+${completenessScore})`,
  );

  const urgencyScore = URGENCY_SCORES[input.urgency];
  reasons.push(`Urgency ${input.urgency} (+${urgencyScore})`);

  const budgetScore = BUDGET_SCORES[input.budgetFit];
  reasons.push(`Budget fit ${input.budgetFit} (+${budgetScore})`);

  const score = Math.max(
    0,
    Math.min(100, intentScore + completenessScore + urgencyScore + budgetScore),
  );
  const breakdown = Object.freeze({
    explicitIntent: intentScore,
    completeness: completenessScore,
    urgency: urgencyScore,
    budgetFit: budgetScore,
  });

  return Object.freeze({
    score,
    reasons: Object.freeze(reasons),
    breakdown,
  });
}
