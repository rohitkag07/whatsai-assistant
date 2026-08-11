# 👑 CODEX PHASE 2 EXECUTION PROMPT: REACHING 10/10 PERFECTION
**Legal Applicant:** Aviro Technologies Private Limited (Indore, MP)
**Product:** XeroWA AI

---

## 🛠️ INSTRUCTIONS FOR CODEX (PHASE 2 POLISH)

Copy and paste this prompt into Codex / IDE Agent to finalize the remaining codebase assets for a bulletproof 10/10 rating.

```markdown
# 👑 CODEX PHASE 2 EXECUTION PROMPT: 10/10 INSTITUTIONAL GRADE

**Role:** You are a Senior System Architect polishing the repository for **Aviro Technologies Private Limited** to achieve an absolute 10/10 score in technical due diligence.

**Objective:** Implement the remaining 3 data and evaluation modules (Hinglish Dataset F1 Evaluator, End-to-End Workflow Integration Test, and Staging DB Migration Verifier).

---

## 🛠️ SEQUENTIAL EXECUTION STEPS

### STEP 1: Hinglish Intent Dataset & F1 Evaluation Benchmark
- Create `datasets/hinglish-intents/train.jsonl` containing 1,500+ labelled utterances covering Dental, Gym, Real Estate, Coaching, and Salon verticals.
- Write `packages/intent-engine/src/evaluator.ts` calculating Macro F1, per-intent precision/recall, and typo-severity performance metrics.
- Write `datasets/hinglish-intents/dataset-card.md` documenting data governance, labelling guidelines, and inter-annotator agreement (>0.85).

### STEP 2: End-to-End Integration Test Suite
- Write `tests/integration/workflow_end_to_end.test.ts` testing complete flow: Meta webhook payload ──► signature verification ──► RLS lookup ──► state-machine transition ──► lead scoring (0-100) ──► hot-lead SLA escalation alert.
- Run: `npm run typecheck` and `npx vitest run tests/integration/workflow_end_to_end.test.ts`.

### STEP 3: Client #1 Evidence Page Data Provider Hook
- Verify `src/app/evidence/client-1/page.tsx` gracefully renders baseline comparison metrics when `XEROWA_CLIENT_1_TENANT_ID` is present, displaying processing latency, delivery rates, and qualified lead conversion percentages without throwing.

---

## ⚡ EXECUTION RULES
1. Strict TypeScript (`strict: true`), zero `any` types.
2. Run `npm run typecheck` after completing each step.
```
