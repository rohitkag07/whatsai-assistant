# XeroWA AI claims register

Last updated: 12 August 2026

`VERIFIED` requires a direct documentary or runtime artifact. `DEMONSTRATED` means source, test, simulation or local prototype evidence exists but customer validation does not. `PLANNED` means unimplemented, unmeasured or unsupported.

| ID | Claim | Class | Evidence | Public wording allowed | Missing proof |
|---|---|---|---|---|---|
| C-001 | Legal applicant name is AVIRO TECHNOLOGIES PRIVATE LIMITED | PLANNED | User-supplied execution brief | “Legal applicant named for this readiness project” | Incorporation certificate and MCA verification |
| C-002 | Registered location is Indore, Madhya Pradesh | PLANNED | User-supplied execution brief | “Registered location stated as Indore” | Registered-address proof |
| C-003 | Rohit Kag is Founder & CEO | PLANNED | User-supplied execution brief | “Founder & CEO named for this project” | Board/company records or signed declaration |
| C-004 | XeroWA has a working public landing build | DEMONSTRATED | `apps/landing`; local build | “Product workflow preview” | Preview/production deployment evidence |
| C-005 | XeroWA supports tenant-aware business context | DEMONSTRATED | tenant/business schema, routing and tests | “Source-tested tenant-aware prototype” | Live two-tenant runtime proof |
| C-006 | Meta webhooks are signed | DEMONSTRATED | signature implementation and tampering tests | “Signed webhook verification in prototype” | Preview/production request evidence |
| C-007 | Webhook processing is idempotent | DEMONSTRATED | provider IDs, event claims and tests | “Idempotent processing in prototype” | Runtime duplicate-delivery log |
| C-008 | Workflow states are deterministic and auditable | DEMONSTRATED | workflow executor, schema and immutable log migration | “Deterministic workflow state machine” | Deployed DB trigger/RPC proof |
| C-009 | New tenant schema separates viewer reads from mutations | DEMONSTRATED | RLS migration contract tests | “Role-aware RLS controls in prototype schema” | Live viewer-denial proof |
| C-010 | Hinglish dataset contains 1,800 governed synthetic examples | VERIFIED | versioned dataset, dataset card and checksum test | Exact count with “synthetic” label | None for dataset integrity; performance still missing |
| C-011 | Hinglish intent performance works for real customers | PLANNED | none | “Pilot validation pending” | Held-out real or consented evaluation set |
| C-012 | Lead scoring and hot-lead escalation work end to end | DEMONSTRATED | integration test and scoring/escalation tests | “Demonstrated in local integration test” | Live pilot/runtime evidence |
| C-013 | Root automated tests pass | VERIFIED | 13 Aug 2026 local test log: 52 passed, 2 skipped | State exact environment and date | CI and secure integration run |
| C-014 | XeroWA has paying customers or revenue | PLANNED | none supplied | “No verified paying customers or revenue” | Contracts, invoices, bank/CA evidence |
| C-015 | XeroWA has completed pilots | PLANNED | none supplied | “Pilot validation pending” | Signed LOIs, consent, raw/aggregated results |
| C-016 | XeroWA improves conversion or response time | PLANNED | no measured baseline/results | “Expected outcome; not yet measured” | Defined metric, sample, window and signed result |
| C-017 | XeroWA is DPIIT recognized | PLANNED | no certificate supplied | Do not claim | Validated DPIIT certificate |
| C-018 | XeroWA or Aviro is government/grant approved | PLANNED | none | Do not claim | Official sanction/approval document |
| C-019 | XeroWA is ISO/SOC 2/CERT-In/pentest certified | PLANNED | none | “No independent certification claimed” | Corresponding valid report/certificate |
| C-020 | Production deployment is current and release-tested | PLANNED | protected Vercel previews passed at the current PR head; local production-mode smoke passed | “Protected preview deployed; production release pending” | Authenticated preview smoke, production URL/SHA and release results |

## Prohibited transformations

- Do not promote `DEMONSTRATED` to `VERIFIED` because a local test passes.
- Do not present synthetic conversations, UI examples or seeded data as customer activity.
- Do not use targets as results.
- Do not describe a portal, draft or submitted form as grant approval.
- Do not expose raw WhatsApp payloads, tokens, signatures, phone numbers or tenant identifiers in public evidence.
