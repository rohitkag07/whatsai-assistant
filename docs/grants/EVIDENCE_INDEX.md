# XeroWA AI evidence index

Last updated: 12 August 2026

| Artifact | Owner | Source | Verification status | Last updated | Related claim | Missing evidence |
|---|---|---|---|---|---|---|
| Repository identity audit | Founder / engineering | Git paths, remotes, HEAD and worktree output | Verified locally | 12 Aug 2026 | XeroWA/X7 isolation | Signed release record |
| Landing source and build | Engineering | `apps/landing` | Demonstrated; local build and protected preview deployment passed | 13 Aug 2026 | Public product preview | Authenticated preview smoke and production release |
| Dashboard/admin source | Engineering | root Next.js app | Demonstrated in source | 12 Aug 2026 | Product prototype | Authenticated runtime screenshots |
| Webhook signature tests | Engineering | `apps/webhook-api/src/webhook-security.test.ts` | Verified local test result | 12 Aug 2026 | Signed ingress | Runtime signed/tampered request log |
| Idempotency tests | Engineering | webhook event and message-ID tests | Verified local test result | 12 Aug 2026 | Duplicate suppression | Runtime retry trace |
| Tenant schema and RLS | Engineering | `20260806_multi_tenant_schema.sql` | Demonstrated by contract tests | 12 Aug 2026 | Tenant isolation | Live two-tenant and viewer-denial proof |
| Workflow engine | Engineering | `packages/workflow-engine` | Verified local test result | 12 Aug 2026 | Deterministic states | Deployed transition log sample, anonymized |
| End-to-end workflow simulation | Engineering | `tests/integration/workflow_end_to_end.test.ts` | Verified local simulation | 12 Aug 2026 | Scoring/escalation path | Real pilot/runtime proof |
| Hinglish dataset card | Product / engineering | `datasets/hinglish-intents/dataset-card.md` | Versioned | 12 Aug 2026 | Indian language relevance | Held-out real-pilot evaluation set |
| Hinglish dataset checksum | Engineering | dataset integration test | Verified local test result | 12 Aug 2026 | Dataset integrity | Signed release manifest |
| Root test summary | Engineering | Vitest output | 52 passed, 2 skipped | 13 Aug 2026 | Source quality | CI and secure integration results |
| Landing quality summary | Engineering | type-check, lint, build, HTTP/link and Playwright checks | Passed locally on desktop/mobile; zero product console errors | 13 Aug 2026 | Public-site quality | Authenticated preview and Lighthouse evidence |
| Privacy and Terms | Legal owner / counsel | public pages and source | Draft, not legal-reviewed | 12 Aug 2026 | Governance | Counsel approval and executed agreements |
| Architecture diagram | Engineering | `TECHNICAL_ARCHITECTURE.md` and public route | Demonstrated from source | 12 Aug 2026 | Technical feasibility | Deployed topology and data-flow review |
| Pilot protocol/templates | Product / legal owner | `docs/grants` | Draft | 12 Aug 2026 | Pilot readiness | Signed LOIs/consent and cohort |
| Fund utilization plan | Founder / finance | `FUND_UTILIZATION_PLAN.md` | Draft | 12 Aug 2026 | Funding need | Quotes, salaries and scheme-specific budget |
| Scheme match matrix | Founder / grant owner | official URLs | Desk-verified | 12 Aug 2026 | Eligibility/open status | Portal/login confirmation and company docs |
| Incorporation certificate | Founder | private data room | Missing | — | Legal identity | Required |
| PAN / constitutional documents | Founder | private data room | Missing | — | Legal identity | Required |
| DPIIT recognition certificate | Founder | private data room | Missing | — | Scheme eligibility | Required where applicable |
| Pilot dashboard screenshots | Product | redacted runtime captures | Missing | — | Product evidence | Capture after safe pilot/staging setup |
| Product-demo recording | Product | approved recording URL | Missing | — | Product evidence | Record without personal data |
| Deployment evidence | Engineering | `DEPLOYMENT_EVIDENCE.md`, Vercel/GitHub PR checks | Protected preview deployments passed at the current PR head; not production | 13 Aug 2026 | Release readiness | Authenticated preview product smoke and production release |
| Independent security report | Security owner | private data room | Missing | — | Security assurance | Independent assessment |
