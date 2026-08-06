import { describe, expect, it } from 'vitest';
import {
  evaluateIntentPredictions,
  type IntentEvaluationExample,
} from './evaluator';

const examples: readonly IntentEvaluationExample[] = [
  {
    expectedIntent: 'dental.appointment',
    predictedIntent: 'dental.appointment',
    typoSeverity: 'none',
  },
  {
    expectedIntent: 'dental.appointment',
    predictedIntent: 'dental.pricing',
    typoSeverity: 'minor',
  },
  {
    expectedIntent: 'dental.pricing',
    predictedIntent: 'dental.pricing',
    typoSeverity: 'moderate',
  },
  {
    expectedIntent: 'dental.pricing',
    predictedIntent: 'dental.appointment',
    typoSeverity: 'severe',
  },
];

describe('evaluateIntentPredictions', () => {
  it('calculates macro F1 and per-intent precision/recall', () => {
    const report = evaluateIntentPredictions(examples);

    expect(report.macroF1).toBe(0.5);
    expect(report.accuracy).toBe(0.5);
    expect(report.intents['dental.appointment']).toEqual({
      precision: 0.5,
      recall: 0.5,
      f1: 0.5,
      support: 2,
      truePositives: 1,
      falsePositives: 1,
      falseNegatives: 1,
    });
  });

  it('reports performance independently for every typo severity', () => {
    const report = evaluateIntentPredictions(examples);

    expect(report.typoSeverity.none).toEqual({
      accuracy: 1,
      macroF1: 1,
      support: 1,
    });
    expect(report.typoSeverity.severe).toEqual({
      accuracy: 0,
      macroF1: 0,
      support: 1,
    });
  });

  it('uses null for typo severities with no samples', () => {
    const report = evaluateIntentPredictions([examples[0]!]);

    expect(report.typoSeverity.minor).toEqual({
      accuracy: null,
      macroF1: null,
      support: 0,
    });
  });

  it('rejects empty evaluation sets and blank labels', () => {
    expect(() => evaluateIntentPredictions([])).toThrow(
      'At least one evaluation example is required',
    );
    expect(() =>
      evaluateIntentPredictions([
        {
          expectedIntent: '',
          predictedIntent: 'dental.appointment',
          typoSeverity: 'none',
        },
      ]),
    ).toThrow('Intent labels must be non-empty');
  });
});
