# XeroWA Hinglish Intent Dataset

## Summary

`train.jsonl` is a versioned, synthetic Hinglish (Latin script) intent
classification dataset for Dental, Gym, Real Estate, Coaching, and Salon
assistants. It is intended for model development and offline evaluation; it is
not evidence of production intent accuracy.

Each JSONL row contains:

- `id`: stable synthetic example identifier
- `text`: Hinglish utterance
- `vertical`: one of five supported verticals
- `intent`: namespaced intent label (`vertical.intent`)
- `language`: `hinglish-latin`
- `typoSeverity`: `none`, `minor`, `moderate`, or `severe`
- `split`: dataset split
- `source`: generation provenance
- `containsPii`: explicit PII assessment

## Coverage and balance

The generator produces 1,800 unique utterances: 360 per vertical, 60 per
intent, and 30 intents overall. Templates cover booking, pricing, availability,
service discovery, scheduling, urgent/human handoff, payments or financing,
and vertical-specific commercial questions.

Release SHA-256 for `train.jsonl`:
`47fa090825aa3ca8f7f0871fb028441f855c9b3307416b87260d141fc070771f`.

Typo severity is deterministically distributed across each intent. Severity
means:

- `none`: normalized Hinglish without injected spelling errors
- `minor`: one long token loses non-leading vowels
- `moderate`: two affected tokens plus common chat abbreviations
- `severe`: multiple compressed tokens while retaining intent evidence

## Labelling guidelines

1. Label the user's immediate requested action, not the business outcome.
2. Use the vertical namespace; never map a Dental appointment to a Salon
   appointment even when surface wording overlaps.
3. Prefer `human_handoff` only for explicit human/manager/owner requests.
4. Emergency labels require present-tense urgent symptoms or immediate risk.
5. Pricing labels cover cost, fees, discounts, rates, and payment totals.
6. Availability asks whether a slot, unit, trainer, stylist, or service exists;
   appointment labels ask to create a booking.
7. Annotators must mark ambiguous examples for adjudication rather than infer
   missing facts.

## Data governance

- Source: deterministic synthetic templates; the committed JSONL and its
  release checksum are the source of truth for this benchmark candidate.
- Personal data: no customer conversations, names, phone numbers, addresses, or
  other personal data are used.
- Consent: not applicable to synthetic records.
- Review: every release must pass schema validation, uniqueness checks, balance
  checks, label leakage review, and harmful-content review.
- Change control: generator version, dataset checksum, reviewer, and approval
  must be recorded for every promoted release.
- Usage boundary: do not use this dataset alone to claim production quality,
  demographic fairness, or safety performance.

## Inter-annotator agreement

The institutional release gate is Cohen's kappa greater than `0.85` on a
stratified, independently double-annotated sample of at least 10% of rows, with
all disagreements adjudicated by a third domain reviewer.

This synthetic release has deterministic generator-label agreement, but no
independent human double-annotation has been completed. Therefore no human IAA
score is claimed yet. The dataset must remain marked `benchmark-candidate`
until a signed annotation report demonstrates kappa greater than `0.85`.

## Known limitations

- Synthetic phrasing cannot reproduce the full distribution of real customer
  language, code-switching, regional vocabulary, speech-to-text errors, or
  adversarial inputs.
- Latin-script Hindi spelling has no single canonical standard.
- Vertical balance is deliberate and does not represent production traffic.
- Typos are controlled transformations, not measured user error patterns.

## Evaluation

Use `packages/intent-engine/src/evaluator.ts` to calculate macro F1,
per-intent precision/recall/F1, overall accuracy, and severity-stratified
performance. Keep the evaluation set separate from training data before
reporting model scores.
