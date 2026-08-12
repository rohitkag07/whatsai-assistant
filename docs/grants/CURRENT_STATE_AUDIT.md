# XeroWA AI current-state forensic audit

Audit date: 12 August 2026
Audit scope: canonical repository at `/Users/rohit/Projects/saas-products/whatsai-assistant`
Audit branch: `codex/grant-readiness-xerowa`
Production changes during audit: none

## Repository identity proof

- Canonical XeroWA remote: `https://github.com/rohitkag07/whatsai-assistant.git`.
- Standalone X7 RealEstate remote: `https://github.com/rohitkag07/x7-realestate.git`.
- The Documents path for X7 is a symlink to `/Users/rohit/Projects/X7 Real estate`; it does not resolve to XeroWA.
- Canonical XeroWA `main` was at `a9057ac327f8dc953b9c1020653a97c63fab6e51` when the worktree was created.
- The canonical `main` worktree contained unrelated uncommitted Command OS work. It was preserved and not copied into this branch.
- X7 code, branding, services, credentials and Git history were not modified.

## Current architecture map

```text
Meta WhatsApp webhook
  -> signature validation
  -> phone_number_id tenant/business resolution
  -> idempotent inbound persistence
  -> approved-reply / workflow execution
  -> intent evaluation and lead scoring
  -> appointment, follow-up or owner escalation
  -> tenant-scoped Supabase records and workflow logs
  -> dashboard/admin evidence surfaces
```

The root Next.js application contains the authenticated dashboard, admin panel and serverless API routes. `apps/landing` is the public product website. `xerowa-summoner` is the preferred central ingress/orchestration service, `xerowa-sales-agent` handles approved-reply and qualification behavior, and `xerowa-tool-gateway` centralizes external actions. Supabase/PostgreSQL is the system of record.

## Feature inventory

| Surface | Evidence | Status |
|---|---|---|
| Public landing | `apps/landing` | Demonstrated; legal and claims remediation required at audit start |
| Client dashboard | root `src/app/(dashboard)` | Demonstrated in source; live role session not re-proved in this audit |
| Admin panel | `src/app/admin` and admin APIs | Demonstrated in source; live admin/client separation not re-proved |
| Authentication | Supabase session middleware and role helpers | Demonstrated in source |
| Tenant isolation | RLS migration, composite tenant keys and contract tests | Demonstrated; secure live RLS tests skipped without staging credentials |
| WhatsApp webhook | HMAC signature check, business routing and persistence | Demonstrated in source and tests |
| Idempotency | provider message IDs and webhook event claim logic | Demonstrated in source and tests |
| Workflow engine | deterministic transition executor and playbooks | Demonstrated in source and tests |
| Hinglish evaluation | 1,800-row governed synthetic dataset, 30 intents | Demonstrated; no held-out real-pilot accuracy |
| Lead scoring/escalation | explainable score and ten-minute hot-lead SLA test | Demonstrated in simulation/test |
| Evidence calculation | null-safe 30-day metric calculator | Demonstrated; no verified pilot sample |
| Database migrations | tenant, RLS, workflow, evidence and client-contract migrations | Demonstrated in static tests; deployed migration state not verified here |
| Vercel configuration | root and landing Next configurations plus `.vercelignore` | Present; preview mapping and deployed SHA pending |

## Evidence inventory

- Root baseline before changes: type-check passed, lint passed, 51 tests passed and 2 secure-environment tests skipped.
- Landing baseline before changes: type-check, lint and production build passed.
- The synthetic Hinglish dataset has 1,800 unique rows, 30 intents, five verticals, four typo-severity bands and a governed SHA-256 checksum.
- Source tests cover signature validation, payload tampering, idempotency conflict handling, workflow transitions, lead scoring, escalation and migration contracts.
- No verified paying-customer, revenue, completed pilot, real conversion-improvement or owner-satisfaction artifact was found.
- No data-safe dashboard screenshots, product-demo recording, independent penetration report or production deployment SHA was supplied for the public evidence centre.

## Legal and branding mismatch report

P0 mismatches found at audit start:

- Landing footer named `Xero Seven AI`, not AVIRO TECHNOLOGIES PRIVATE LIMITED.
- Public email was `rohit@xeroseven.in`, not the official Aviro email supplied for this project.
- Privacy and Terms did not identify Aviro as the service owner.
- Product metadata used an unbounded “24/7 revenue” positioning.
- Company registration documents, CIN, PAN, DPIIT certificate and registered-address proof were not present in the repository.

## Unsupported claims report

The audit found public wording such as “Turn Every WhatsApp Inbound into Revenue,” “Watch the real workflow,” “Live product workflow” and “Connected” on a prototype preview. The dashboard also contains illustrative UI examples and historical chart defaults that must never be reused as grant or customer evidence. No customer, revenue, grant, patent, certification or approval claim is supported by the repository alone.

## Security and privacy gap report

### Demonstrated controls

- Timing-safe Meta webhook signature validation.
- Idempotent message/event handling.
- Tenant-bound composite keys in the new tenant schema.
- RLS policies separating viewer reads from owner/admin/agent mutations in the new tenant schema.
- Immutable workflow-transition logs.
- Server-only service credentials and a clean secret-pattern scan of tracked source.

### Open gaps

- Secure live cross-tenant and viewer-mutation tests were skipped because the required staging credentials were not present.
- No independent penetration test, CERT-In review, ISO 27001 or SOC 2 evidence exists.
- No repository-wide API rate-limiting control was found for public endpoints; provider and hosting controls require explicit verification.
- The legacy generic business-table RLS model and the new tenant model coexist and require a production schema/state audit before claiming universal enforcement.
- A signed retention schedule, subprocessor list, incident-response runbook and executed data-processing/pilot agreement are missing.
- Deployment secret inventory and rotation evidence are not stored in the public repository and were not inspected.

## Internal readiness score

This is not an official government score.

| Category | Score |
|---|---:|
| Problem and market need | 13/15 |
| Innovation and defensibility | 11/15 |
| Technical feasibility | 13/15 |
| Prototype maturity | 9/10 |
| Pilot and market validation | 1/15 |
| Social/economic and MP impact | 5/10 |
| Team execution capability | 2/5 |
| Fund utilization and milestones | 8/10 |
| Governance and evidence quality | 4/5 |
| **Total** | **66/100** |

## Prioritized remediation

### P0 — blocks formal application or pilot launch

1. Verify incorporation certificate, PAN, constitutional documents, registered address, shareholding and authorized signatory.
2. Obtain and validate DPIIT recognition before using any DPIIT wording or entering MP startup calls.
3. Execute pilot LOIs, consent/data-processing terms, retention schedule and subprocessor list.
4. Run secure live two-tenant, viewer-denial, admin-boundary, webhook and audit-integrity tests in staging.
5. Remove unsupported public claims and publish only evidence with provenance.

### P1 — required for a strong pilot and evaluator package

1. Capture anonymized dashboard/workflow screenshots and a product-demo recording.
2. Establish API rate limiting and document thresholds, exemptions and incident alerts.
3. Obtain an independent application-security assessment.
4. Complete the 30–60 day pilot and publish signed, anonymized metric results.
5. Record preview and production deployment URLs, Git SHAs, Vercel root directories and route smoke results.

### P2 — improves defensibility and scale readiness

1. Build a held-out, consented Indian SMB intent evaluation set.
2. Commission a trademark/IP landscape review.
3. Establish cost, reliability and model-drift monitoring.
4. Add a supplier/subprocessor review cadence and disaster-recovery exercise.

## Audit verdict

**READY FOR PILOT VALIDATION**. The source-tested prototype is credible enough to prepare a controlled pilot. It is not yet ready to claim verified traction, grant eligibility, independent security assurance or application success.
