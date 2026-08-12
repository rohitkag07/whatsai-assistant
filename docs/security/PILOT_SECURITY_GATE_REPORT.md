# Pilot Security Gate Report

**Assessment date:** 2026-08-13

**Scope:** XeroWA pilot runtime, current `businesses/business_members` authorization model

**Assessment type:** AI-assisted internal pre-review — **not an independent security review**

**Gate decision:** **NO-GO**

## Executive result

Source fixes are prepared for two high-impact authorization defects, durable API rate limiting, tenant-safe RLS, and controlled retention deletion. The current production runtime must not be approved for a pilot yet: a synthetic live viewer was able to insert, update, and delete its own business rows, and the new rate-limit/retention migration is not deployed.

## Evidence matrix

| Control | Source result | Live result | Gate status |
|---|---|---|---|
| Business A → Business B read denial | Existing RLS + live synthetic proof | PASS | PASS |
| Business A → Business B insert/update/delete denial | Existing RLS + live synthetic proof | PASS | PASS |
| Viewer mutation denial | Route authorization helper + replacement RLS migration | FAIL on current production DB | BLOCKED |
| Editable metadata privilege escalation | `user_metadata` removed from authorization + unit tests | Deployment pending | BLOCKED |
| WhatsApp replay/idempotency | Advisory lock + duplicate lookup | PASS: second identical provider message reused original message | PASS |
| Webhook/API rate limiting | Atomic private DB bucket + middleware 429/503 behavior | Migration/RPC absent | BLOCKED |
| Retention/deletion | Preview + exact confirmation + cascade + audit receipt | Migration/RPC absent | BLOCKED |
| Secret rotation | Redacted repository scan complete | Provider rotation timestamps unavailable | BLOCKED |
| Independent reviewer | Reviewer-ready scope and evidence available | No independent reviewer signed report | BLOCKED |

## Live proof summary

The runner created uniquely named synthetic businesses, users, memberships, contacts, and a WhatsApp channel. Cleanup ran in `finally`; no customer business IDs or message contents were used.

- Passed: own-business read, five cross-business read/write denials, viewer own-business read, and three replay/idempotency assertions.
- Failed: viewer insert, update, and delete denial.
- Blocked: live rate-limit and retention RPC proofs because the migration is not applied.
- Evidence artifact: `docs/security/evidence/2026-08-13-live-pre-migration.json`.

## Release blockers

1. Review and apply `20260812222528_pilot_security_gate.sql` to staging, then run `REQUIRE_ALL_SECURITY_CONTROLS=1 npm run prove:security-gate` with staging credentials.
2. Standard migration push is not currently safe to treat as routine: production does not expose tables from `20260806_multi_tenant_schema.sql`, so the migration ledger/order must be reconciled before any push. That older migration must receive a product-boundary review before application.
3. Deploy the exact reviewed commit, rerun the proof against production, and attach redacted output.
4. Record provider-side last-rotated dates and complete the approved rotation procedure.
5. Obtain a signed report from a reviewer independent of this implementation.

No pilot contact or customer-data onboarding should occur until every blocker is closed and no critical/high finding remains.

## Disclaimer

This AI-assisted security scan is not comprehensive, guaranteed, or a substitute for a professional security audit. Complex authorization and production systems can contain subtle issues or false negatives. For systems handling PII or other sensitive data, engage a qualified independent penetration-testing firm and use this report only as a first-pass remediation aid.
