# XeroWA AI evidence index

Last updated: 13 August 2026

| Artifact | Owner | Source | Verification status | Last updated | Related claim | Missing evidence |
|---|---|---|---|---|---|---|
| Repository identity audit | Founder / engineering | Git paths, remotes, HEAD and worktree output | Verified locally | 12 Aug 2026 | XeroWA/X7 isolation | Signed release record |
| Landing source and build | Engineering | `apps/landing`, production alias and release report | READY at merged SHA `5bac793f5922`; live routes passed | 13 Aug 2026 | Public product preview | Continued monitoring and approved demo recording |
| Dashboard/admin source | Engineering | root Next.js app | Demonstrated in source | 12 Aug 2026 | Product prototype | Authenticated runtime screenshots |
| Webhook signature tests | Engineering | `apps/webhook-api/src/webhook-security.test.ts` | Verified local test result | 12 Aug 2026 | Signed ingress | Runtime signed/tampered request log |
| Idempotency tests | Engineering | webhook event and message-ID tests | Verified local test result | 12 Aug 2026 | Duplicate suppression | Runtime retry trace |
| Business isolation and RLS | Engineering | `20260812222528_pilot_security_gate.sql`, synthetic live proof | Cross-business read/write denial passed; current production viewer mutations failed; migration not applied | 13 Aug 2026 | Tenant isolation | Apply reviewed migration and pass viewer denial in staging + production |
| Workflow engine | Engineering | `packages/workflow-engine` | Verified local test result | 12 Aug 2026 | Deterministic states | Deployed transition log sample, anonymized |
| End-to-end workflow simulation | Engineering | `tests/integration/workflow_end_to_end.test.ts` | Verified local simulation | 12 Aug 2026 | Scoring/escalation path | Real pilot/runtime proof |
| Hinglish dataset card | Product / engineering | `datasets/hinglish-intents/dataset-card.md` | Versioned | 12 Aug 2026 | Indian language relevance | Held-out real-pilot evaluation set |
| Hinglish dataset checksum | Engineering | dataset integration test | Verified local test result | 12 Aug 2026 | Dataset integrity | Signed release manifest |
| Root test summary | Engineering | Vitest output | 52 passed, 2 skipped | 13 Aug 2026 | Source quality | CI and secure integration results |
| Landing quality summary | Engineering | type-check, lint, build, HTTP/link and Playwright checks | Passed locally on desktop/mobile; zero product console errors | 13 Aug 2026 | Public-site quality | Authenticated preview and Lighthouse evidence |
| Privacy and Terms | Legal owner / counsel | public pages and source | Draft, not legal-reviewed | 12 Aug 2026 | Governance | Counsel approval and executed agreements |
| Architecture diagram | Engineering | `TECHNICAL_ARCHITECTURE.md` and public route | Demonstrated from source | 12 Aug 2026 | Technical feasibility | Deployed topology and data-flow review |
| Pilot protocol/templates | Product / legal owner | `PILOT_PACKAGE_INDEX.md`, protocol, LOI, consent, retention, onboarding, baseline, weekly and result templates | Draft package ready for review/use | 13 Aug 2026 | Pilot readiness | Counsel review, completed/signed copies and cohort |
| Pilot evidence storage structure | Evidence owner | `pilot-evidence/_template` | Blank PII-safe structure created | 13 Aug 2026 | Evidence governance | Private access-controlled stores and populated manifests |
| Pilot security gate pre-review | Security owner | `../security/PILOT_SECURITY_GATE_REPORT.md`, redacted live JSON | Internal NO-GO: cross-business and replay pass; viewer/rate-limit/retention blocked | 13 Aug 2026 | Security assurance | Migration deploy/retest, secret rotation evidence and independent sign-off |
| Fund utilization plan | Founder / finance | `FUND_UTILIZATION_PLAN.md` | Draft | 12 Aug 2026 | Funding need | Quotes, salaries and scheme-specific budget |
| Scheme match matrix | Founder / grant owner | official URLs | Desk-verified | 12 Aug 2026 | Eligibility/open status | Portal/login confirmation and company docs |
| Incorporation certificate | Founder | private data room | Missing | — | Legal identity | Required |
| PAN / constitutional documents | Founder | private data room | Missing | — | Legal identity | Required |
| DPIIT recognition certificate | Founder | private data room | Missing | — | Scheme eligibility | Required where applicable |
| Pilot dashboard screenshots | Product | redacted runtime captures | Missing | — | Product evidence | Capture after safe pilot/staging setup |
| Product-demo recording | Product | approved recording URL | Missing | — | Product evidence | Record without personal data |
| Production deployment evidence | Engineering | `PRODUCTION_RELEASE_2026-08-13.md`, GitHub, Vercel and live canary | PR #6 merged at `5bac793f5922`; landing deployment `dpl_CZfspoT9yH2KUfw3P9er9aBf1w3k` and dashboard `dpl_6kJ56WbuVLsGB9wpgxFCgk8fPo9M` READY | 13 Aug 2026 | Release readiness | Continued monitoring; does not replace live security proof |
| Independent security report | Security owner | private data room | Missing | — | Security assurance | Independent assessment |
