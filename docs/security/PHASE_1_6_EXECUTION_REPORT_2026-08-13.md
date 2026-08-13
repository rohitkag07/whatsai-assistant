# XeroWA Security and Pilot Execution Report

**Date:** 13 August 2026  
**Applicant:** AVIRO TECHNOLOGIES PRIVATE LIMITED  
**Product:** XeroWA AI  
**Current decision:** **NO-GO for customer pilot**

## Executive result

The application-side authorization hotfix is merged and deployed. Database-side authorization, rate limiting and retention controls pass in an isolated PostgreSQL 17 staging harness, but production Supabase deployment is blocked because the currently authenticated CLI account cannot access project `yxiniazontslpivaoxfb`.

The operational controls PR must remain unmerged: its middleware intentionally fails closed when the rate-limit RPC is unavailable, so deploying it before the database migration would return HTTP 503 for protected mutation, webhook and cron routes.

## Phase status

| Phase | Result | Evidence |
|---|---|---|
| 1. Production containment | Complete | Production has one active owner membership and no active viewer/client memberships. Pilot remains paused. |
| 2. Controlled PR split | Complete | Authorization PR #8 merged; operational controls isolated in draft PR #9; original PR #7 closed as superseded. |
| 3. Staging verification | Complete locally; hosted staging blocked | PostgreSQL 17 harness executes both migrations and all synthetic RLS/rate-limit/retention assertions. Supabase hosted project access is denied. |
| 4. Production deployment | Partial | App authorization hotfix deployed. Production DB authorization and operational migrations not deployed. |
| 5. Final security gate | Executed: NO-GO | Live direct-DB proof still permits viewer mutations and tenant-admin membership administration. |
| 6. Pilot launch | Blocked | Production DB proof, independent reviewer sign-off, signed pilot consent/LOI and real pilot participants are unavailable. |

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
- Vitest operational branch: 97 passed, 2 secure-environment tests skipped.
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

Passed:

- owner reads own business;
- owner cannot read, insert, update or delete across businesses;
- viewer reads own business;
- tenant admin can mutate its own business data.

Failed because the production RLS migration is not deployed:

- viewer insert, update and delete denial;
- tenant-admin self-promotion denial;
- tenant-admin modification/deletion of owner denial.

## External blockers

1. The authenticated Supabase CLI account does not have privileges for project `yxiniazontslpivaoxfb`.
2. The production migration ledger cannot be listed or reconciled until project access is restored.
3. An independent security reviewer has not signed the release.
4. No business has signed a pilot LOI, consent/retention terms or final measurement contract.
5. Secret-rotation timestamps remain provider-side evidence, not repository evidence.

## Safe continuation order

1. Grant the active Supabase account access to project `yxiniazontslpivaoxfb`.
2. Run `supabase migration list --linked`; do not repair history without schema evidence.
3. Apply the authorization migration and run `npm run prove:authorization-hotfix` against staging, then production.
4. Apply the operational migration and run `npm run prove:operational-controls` before deploying middleware.
5. Merge PR #9 only after both production RPCs pass.
6. Run the full browser/API canary and obtain independent reviewer sign-off.
7. Launch one consented pilot first; expand only after a clean weekly evidence review.

## Product boundary

Standalone X7 RealEstate remains a separate repository and was not modified. XeroWA retains only the generic tenant-scoped `real_estate` vertical. The retention verifier explicitly proves that standalone builder and project records are preserved.

