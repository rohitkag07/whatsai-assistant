# XeroWA AI independent pilot security-review checklist

Status values: `NOT TESTED`, `PASS`, `FAIL`, `N/A`. Source tests alone cannot mark a live-runtime item `PASS`. The independent reviewer must keep sensitive evidence in the approved private location.

## Review scope

- Deployment SHA/environment: `[SHA and non-production/production scope]`
- Pilot IDs/roles: `[pseudonymous references]`
- Reviewer and independence statement: `[name/organization/relationship]`
- Test window: `[date/time/time zone]`
- Critical/high finding rule: unresolved critical finding is `NO-GO`; high findings require documented owner, deadline and launch decision.

## Control checklist

| ID | Test | Minimum procedure and expected result | Evidence reference | Status |
|---|---|---|---|---|
| SEC-01 | Live two-tenant read isolation | Business A sessions query Business B tenant rows across conversations, leads, appointments, knowledge, playbooks and evidence; response is empty/denied | `[private log]` | NOT TESTED |
| SEC-02 | Live two-tenant write isolation | Business A attempts create/update/delete using Business B record and composite keys; every mutation is denied and no row changes | `[private log]` | NOT TESTED |
| SEC-03 | Viewer mutation denial | Viewer attempts insert/update/delete on every mutable tenant table and protected API; reads stay scoped and mutations fail | `[private log]` | NOT TESTED |
| SEC-04 | Owner/admin/member boundaries | Missing/foreign selected business and unauthorized membership/status/module mutations fail closed | `[private log]` | NOT TESTED |
| SEC-05 | Webhook signature validation | Valid request succeeds; missing, malformed and tampered signatures fail before business effects | `[sanitized trace]` | NOT TESTED |
| SEC-06 | Replay/idempotency | Replay the same provider event/message IDs; exactly one message/workflow/business effect persists | `[sanitized trace]` | NOT TESTED |
| SEC-07 | Rate limiting | Test documented thresholds, tenant/IP/provider keys, bypass attempts, retry response and recovery; alerts are observed | `[load-test report]` | NOT TESTED |
| SEC-08 | Secret handling | Scan tracked history and browser bundles; verify server-only placement, least privilege, rotation owner and redacted health/errors | `[scan/inventory]` | NOT TESTED |
| SEC-09 | Authentication/session handling | Anonymous, expired, client, viewer, agent, admin and owner route matrix produces intended redirects/denials without data leakage | `[route matrix]` | NOT TESTED |
| SEC-10 | Audit-log integrity | Attempt workflow/audit update/delete and transaction partial failure; immutable/atomic behavior is preserved | `[DB trace]` | NOT TESTED |
| SEC-11 | Retention/deletion | Tenant-scoped export/delete removes approved data classes, preserves minimum consent/security proof and records backup expiry | `[close-out test]` | NOT TESTED |
| SEC-12 | Logging and error privacy | Errors/logs omit message bodies, phone numbers, provider/tenant IDs, credentials and signatures unless explicitly protected/required | `[log review]` | NOT TESTED |
| SEC-13 | Human takeover and stop controls | Operator can pause automation; unsafe/no-match/opt-out/tenant ambiguity fails closed and records the reason | `[runtime trace]` | NOT TESTED |
| SEC-14 | Dependency/deployment integrity | Production aliases map to reviewed SHA; lockfiles/audits are clean or exceptions are owned; rollback path is tested/documented | `[release report]` | NOT TESTED |

## Findings

| Finding ID | Severity | Affected control | Description | Owner | Due date | Retest evidence/status |
|---|---|---|---|---|---|---|
| — | — | — | No assessment performed yet | — | — | NOT TESTED |

## Decision

- Critical findings open: `Not assessed`
- High findings open: `Not assessed`
- Launch decision: `[GO / CONDITIONAL GO / NO-GO]`
- Conditions and expiry: `[details]`
- Public assurance permitted: none until the signed report defines scope and limitations.

Independent reviewer: `________________` Date: `________`
Aviro remediation owner: `________________` Date: `________`
Business acknowledgement: `________________` Date: `________`
