export type TypoSeverity = 'none' | 'minor' | 'moderate' | 'severe';

export interface IntentEvaluationExample {
  readonly expectedIntent: string;
  readonly predictedIntent: string;
  readonly typoSeverity: TypoSeverity;
}
export interface IntentMetrics {
  readonly precision: number;
  readonly recall: number;
  readonly f1: number;
  readonly support: number;
  readonly truePositives: number;
  readonly falsePositives: number;
  readonly falseNegatives: number;
}

export interface TypoSeverityMetrics {
  readonly accuracy: number | null;
  readonly macroF1: number | null;
  readonly support: number;
}

export interface IntentEvaluationReport {
  readonly macroF1: number;
  readonly accuracy: number;
  readonly totalExamples: number;
  readonly intents: Readonly<Record<string, IntentMetrics>>;
  readonly typoSeverity: Readonly<Record<TypoSeverity, TypoSeverityMetrics>>;
}

const TYPO_SEVERITIES: readonly TypoSeverity[] = [
  'none',
  'minor',
  'moderate',
  'severe',
];

function roundMetric(value: number): number {
  return Number(value.toFixed(6));
}

function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function collectIntents(
  examples: readonly IntentEvaluationExample[],
): readonly string[] {
  return Object.freeze(
    [...new Set(
      examples.flatMap((example) => [
        example.expectedIntent,
        example.predictedIntent,
      ]),
    )].sort(),
  );
}

function computeIntentMetrics(
  examples: readonly IntentEvaluationExample[],
  intent: string,
): IntentMetrics {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let support = 0;

  for (const example of examples) {
    if (example.expectedIntent === intent) support += 1;
    if (
      example.expectedIntent === intent
      && example.predictedIntent === intent
    ) {
      truePositives += 1;
    } else if (
      example.expectedIntent !== intent
      && example.predictedIntent === intent
    ) {
      falsePositives += 1;
    } else if (
      example.expectedIntent === intent
      && example.predictedIntent !== intent
    ) {
      falseNegatives += 1;
    }
  }

  const precision = safeDivide(
    truePositives,
    truePositives + falsePositives,
  );
  const recall = safeDivide(truePositives, truePositives + falseNegatives);
  const f1 = safeDivide(2 * precision * recall, precision + recall);

  return Object.freeze({
    precision: roundMetric(precision),
    recall: roundMetric(recall),
    f1: roundMetric(f1),
    support,
    truePositives,
    falsePositives,
    falseNegatives,
  });
}

function macroF1For(
  examples: readonly IntentEvaluationExample[],
): number | null {
  if (examples.length === 0) return null;
  const intents = collectIntents(examples);
  if (intents.length === 0) return null;
  const sum = intents.reduce(
    (total, intent) => total + computeIntentMetrics(examples, intent).f1,
    0,
  );
  return roundMetric(sum / intents.length);
}

export function evaluateIntentPredictions(
  examples: readonly IntentEvaluationExample[],
): IntentEvaluationReport {
  if (examples.length === 0) {
    throw new Error('At least one evaluation example is required');
  }

  for (const example of examples) {
    if (
      example.expectedIntent.trim().length === 0
      || example.predictedIntent.trim().length === 0
    ) {
      throw new Error('Intent labels must be non-empty');
    }
  }

  const intentNames = collectIntents(examples);
  const perIntent: Record<string, IntentMetrics> = {};
  for (const intent of intentNames) {
    perIntent[intent] = computeIntentMetrics(examples, intent);
  }

  const correct = examples.filter(
    (example) => example.expectedIntent === example.predictedIntent,
  ).length;
  const severityReport = {} as Record<TypoSeverity, TypoSeverityMetrics>;
  for (const severity of TYPO_SEVERITIES) {
    const subset = examples.filter(
      (example) => example.typoSeverity === severity,
    );
    const subsetCorrect = subset.filter(
      (example) => example.expectedIntent === example.predictedIntent,
    ).length;
    severityReport[severity] = Object.freeze({
      accuracy:
        subset.length === 0
          ? null
          : roundMetric(subsetCorrect / subset.length),
      macroF1: macroF1For(subset),
      support: subset.length,
    });
  }

  return Object.freeze({
    macroF1: macroF1For(examples) ?? 0,
    accuracy: roundMetric(correct / examples.length),
    totalExamples: examples.length,
    intents: Object.freeze(perIntent),
    typoSeverity: Object.freeze(severityReport),
  });
}
