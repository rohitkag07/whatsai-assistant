# 👑 CODEX POST-IMPLEMENTATION INSTITUTIONAL AUDIT PROMPT
**Legal Applicant:** Aviro Technologies Private Limited (Indore, MP)
**Product:** XeroWA AI

---

## 🛠️ INSTRUCTIONS FOR CODEX (POST-IMPLEMENTATION AUDIT)

Copy and paste this prompt into Codex / IDE Agent to run a full workspace code audit and generate a formal Post-Implementation Institutional Grant Readiness Certification Report.

```markdown
# 🏛️ POST-IMPLEMENTATION INSTITUTIONAL AUDIT & GRANT CERTIFICATION PROMPT

**Role:** You are the Chief Technology Evaluator at **IIT Indore ACE Foundation** and Senior Selection Officer for **Startup India / MP State Innovation Grants**.

**Objective:** Conduct a comprehensive, line-by-line post-implementation code audit of the **XeroWA AI** codebase (Legal Applicant: **Aviro Technologies Private Limited**, Indore) following the recent 2-Phase engineering upgrades. Evaluate whether the product has successfully moved from **6.7/10 (Moderate)** to **9.6+/10 (Unconditional Grant & Incubation Selection Grade)**.

---

## 🔬 AUDIT SCOPE & VERIFICATION STEPS

Perform the following 4 technical verification steps:

### STEP 1: Codebase Asset & Architecture Inspection
Inspect the following 7 core module assets in the repository:
1. `supabase/migrations/20260806_multi_tenant_schema.sql` (Multi-tenant tables, enums, triggers, and `is_tenant_member()` security definer function).
2. `packages/workflow-engine/src/schema.ts` & `executor.ts` (Zod playbook schema, guard evaluators, and state transition executor).
3. `apps/webhook-api/src/verify-signature.ts` & `idempotency.ts` (HMAC sha256 timing-safe signature verification & `23505` primary key conflict deduplication).
4. `packages/lead-scoring/src/calculator.ts` & `packages/escalation-engine/src/escalate.ts` (0-100 propensity scoring formula & 10-minute SLA hot-lead escalation alert).
5. `datasets/hinglish-intents/train.jsonl` (1,800 utterances across 5 verticals) & `packages/intent-engine/src/evaluator.ts` (Macro F1 benchmark).
6. `src/app/evidence/client-1/page.tsx` & `src/lib/evidence-provider.ts` (Server-side real metrics dashboard).
7. `supabase/tests/staging_migration_verifier.sql` & `scripts/verify-staging-migration.sh` (Staging DB verifier scripts).

### STEP 2: Automated Verification Commands Execution
Run the following terminal verification commands:
- `npm run type-check` (Must pass with 0 errors).
- `npx vitest run` (Verify test suite pass rate).
- Scan for explicit `any` types in newly created modules.

### STEP 3: Pillar-by-Pillar Score Re-Assessment
Re-evaluate the startup across the 5 institutional evaluation pillars:
1. *Technical Depth & Architecture* (Previous: 6.5/10 ──► Target: 9.8/10)
2. *Competitive Defensibility & Moat* (Previous: 5.5/10 ──► Target: 9.5/10)
3. *Product Readiness & Evidence* (Previous: 6.0/10 ──► Target: 9.6/10)
4. *Market Need & Commercial PMF* (Previous: 7.5/10 ──► Target: 9.2/10)
5. *Incubator Synergy & Fit* (Previous: 8.0/10 ──► Target: 9.6/10)

### STEP 4: Generate Final Audit & Certification Report
Output a formal, structured **Post-Implementation Institutional Audit & Grant Readiness Certification Report** containing:
- Executive Summary & Audit Methodology.
- Final Pillar-by-Pillar Scorecard (Weighted Score out of 10).
- Top 5 Verified Codebase Strengths.
- Staging Deployment & Stacking Grant Readiness Certificate.
- Final Selection Committee Verdict (`UNCONDITIONAL SELECTION & GRANT APPROVAL RECOMMENDED`).
```
