# 👑 CODEX MASTER EXECUTION PROMPT: XEROWA AI CODEBASE UPGRADE
**Legal Applicant:** Aviro Technologies Private Limited (Indore, MP)
**Product:** XeroWA AI

---

## 🛠️ INSTRUCTIONS FOR CODEX

Copy and paste this prompt into Codex / IDE Agent to execute the codebase upgrade step-by-step.

```markdown
# 👑 CODEX MASTER EXECUTION PROMPT: XEROWA AI CODEBASE UPGRADE

**Role:** You are a Senior Full-Stack Engineer and System Architect implementing institutional-grade engineering upgrades for **XeroWA AI** (Legal Applicant: **Aviro Technologies Private Limited**).

**Objective:** Execute the Technical Implementation Specification step-by-step. Build, typecheck, and test all 5 core modules sequentially without breaking existing client features.

---

## 🛠️ SEQUENTIAL EXECUTION STEPS

### STEP 1: Supabase Multi-Tenant RLS Schema & Security Test Suite
- Write `supabase/migrations/20260806_multi_tenant_schema.sql` with enums, core tables (`tenants`, `tenant_memberships`, `contacts`, `conversations`, `messages`, `leads`, `appointments`, `workflow_transition_logs`, `webhook_events`), triggers, and `is_tenant_member()` security definer function.
- Write `supabase/tests/rls_isolation.test.ts` using Vitest testing cross-tenant isolation (Owner A reading Tenant B ──► Expect 0 rows / Denied).
- Run: `npm run typecheck` and `npx vitest run supabase/tests/rls_isolation.test.ts`.

### STEP 2: Deterministic Workflow State-Machine Engine
- Write `packages/workflow-engine/src/schema.ts` defining Playbook Zod Schema, State Types, Guard Types, and Action Types.
- Write `packages/workflow-engine/src/executor.ts` implementing `executeTransition()` with guard validation, action execution, and immutable transition logging.
- Write `packages/workflow-engine/src/playbooks/dental.json` & `real_estate.json` with production playbook definitions.
- Write workflow vitest tests ensuring invalid transitions are safely rejected.

### STEP 3: Edge Webhook Router & HMAC Signature Verification
- Write `apps/webhook-api/src/verify-signature.ts` implementing Node.js `crypto.timingSafeEqual` HMAC `sha256` verification.
- Write `apps/webhook-api/src/idempotency.ts` suppressing duplicate Meta webhooks using `webhook_events` primary key conflict (`23505`).

### STEP 4: Lead Propensity Scoring & Hot-Lead Escalation Protocol
- Write `packages/lead-scoring/src/calculator.ts` returning 0-100 score + explanation reasons array based on explicit intent, completeness, urgency, and budget fit.
- Write `packages/escalation-engine/src/escalate.ts` sending 10-minute SLA owner escalation alerts when score > 75 or explicit site visit requested.

### STEP 5: Client #1 Evidence Dashboard View
- Write Server Component `src/app/evidence/client-1/page.tsx` querying real system health metrics server-side: processing latency (< 3s), delivery rate (99%), qualified lead rate, and before/after baseline comparisons.

---

## ⚡ EXECUTION RULES
1. Strict TypeScript (`strict: true`), zero `any` types.
2. Run `npm run typecheck` after completing each step.
3. Preserve all existing client dashboard routes (`/dashboard`, `/chats`, `/leads`, `/calendar`, `/knowledge`, `/whatsapp-status`, `/plan-support`).
```
