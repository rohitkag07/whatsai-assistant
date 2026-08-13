# XeroWA Security and Pilot Execution Report

**Date:** 13 August 2026

**Applicant:** AVIRO TECHNOLOGIES PRIVATE LIMITED

**Product:** XeroWA AI
**Current decision:** **TECHNICAL GO for one controlled, consented customer pilot**

## Executive result

The application authorization hotfix is deployed. Supabase CLI access to project `yxiniazontslpivaoxfb` was restored, the migration ledger was inspected without repair, and the production authorization, rate-limiting, retention and exposed-surface hardening migrations were applied atomically.

Live authorization proof passed 13 controls and live operational proof passed 12 controls. Synthetic customer fixtures were removed and production returned to three businesses, one membership and sixteen contacts. One non-PII immutable proof audit receipt remains by design.

## Phase status

| Phase | Result | Evidence |
|---|---|---|
| 1. Production containment | Complete | Production has one active owner membership and no active viewer/client memberships. Pilot remains paused. |
| 2. Controlled PR split | Complete | Authorization PR #8 merged; operational controls isolated in draft PR #9; original PR #7 closed as superseded. |
| 3. Staging verification | Complete | PostgreSQL 17 harness executes authorization, operational and advisor-hardening migrations plus all synthetic assertions. |
| 4. Production deployment | Database complete; app release pending PR #9 merge | Authorization, rate-limit, retention and advisor-hardening controls are live in production Supabase. |
| 5. Final security gate | Passed | Viewer mutations, cross-business access and tenant-admin membership escalation are denied; operational RPC and replay/retention proofs pass. |
| 6. Pilot launch | Technical GO, operationally gated | One controlled pilot may launch only after signed consent/LOI and named reviewer approval. |

## Production release evidence

- Git main SHA: `11b4bf28ff7610ed00ffce0fe658d3542752470d`
- Dashboard deployment: `dpl_84N1Ta6N7dYWBsqCrEmqgDVqsti8`
- Landing deployment: `dpl_5d5GMGwFF3rEg1T6L7xiL7hsKJJW`
- Both deployments: `READY`, target `production`, Git ref `main`, exact SHA verified through the Vercel API.
- Production aliases: `x7-whatsai-dashboard.vercel.app` and `landing-iota-lemon.vercel.app` resolve to the verified deployments.
- Landing, innovation, evidence, pilot, grant-readiness, privacy and terms routes returned HTTP 200.
- `/api/ping` and redacted `/api/health/whatsapp` returned HTTP 200.
- `/dashboard` redirected to `/login?next=%2Fdashboard`.
- Desktop and 390 px mobile browser checks completed with zero console errors or warnings.

## Source and staging validation

- TypeScript type-check: pass, zero errors.
- ESLint: pass.
- Vitest authorization branch: 93 passed, 2 secure-environment tests skipped.
- Vitest operational branch: 99 passed, 2 secure-environment tests skipped.
- Next.js production build: pass.
- Local PostgreSQL 17 staging migration execution: pass.
- Staging assertions passed:
  - owner can read own business and cannot write across businesses;
  - viewer can read own business and cannot insert, update or delete;
  - tenant admin may mutate own-business data but cannot promote itself or modify/delete an owner;
  - rate-limit budget allows the first request and denies the second;
  - retention requires preview and an exact business-bound confirmation;
  - retention deletes generic tenant rows and XeroWA legacy PII rows;
  - retention writes a private immutable audit receipt;
  - standalone X7 builder and project rows remain intact.

The staging harness caught and fixed a real SQL defect before release: `pg_catalog.greatest(...)` was invalid and was replaced with PostgreSQL's `greatest(...)` expression.

## Live production security proof

The proof used uniquely named synthetic fixtures and cleaned them in a `finally` block. Post-run counts returned to the original values: three businesses, one membership and sixteen contacts. No synthetic security users remain.

Passed live:

- owner reads own business;
- owner cannot read, insert, update or delete across businesses;
- viewer reads own business;
- viewer cannot insert, update or delete;
- tenant admin can mutate its own business data.
- tenant admin cannot self-promote or modify/delete the owner;
- service-role rate limiting allows the first request and denies the second;
- webhook replay returns the original message instead of duplicating it;
- retention preview, exact confirmation, cascade and immutable receipt pass.

Supabase security advisor errors were reduced to zero. Nine legacy aggregate views now use `security_invoker`, deny `anon`/`authenticated` access and retain service-role read access. Broadcast mutation functions are service-role-only. Four legacy functions have fixed empty search paths.

## External blockers

1. An independent security reviewer has not signed the release.
2. No business has signed a pilot LOI, consent/retention terms or final measurement contract.
3. Secret-rotation timestamps remain provider-side evidence, not repository evidence.
4. Supabase leaked-password protection is disabled on the current Free organization plan; provider setting and plan support must be confirmed before enabling it. This remains the sole security-advisor warning.

## Safe continuation order

1. Merge PR #9 only after its refreshed CI and Vercel previews pass.
2. Verify dashboard and landing production deployments against the exact merge SHA.
3. Run the full browser/API canary and confirm protected routes do not fail closed with HTTP 503.
4. Obtain named independent reviewer sign-off and execute pilot consent/LOI documents.
5. Launch one consented pilot first; expand only after a clean weekly evidence review.

## Product boundary

Standalone X7 RealEstate remains a separate repository and was not modified. XeroWA retains only the generic tenant-scoped `real_estate` vertical. The retention verifier explicitly proves that standalone builder and project records are preserved.
