# XeroWA AI security and privacy overview

Status: prototype controls demonstrated in source; independent assurance pending.

## Control matrix

| Control | Current evidence | Status | Required runtime/independent proof |
|---|---|---|---|
| Cross-tenant isolation | RLS schema/policy contract tests and composite tenant keys | Demonstrated | Two live tenants, foreign reads empty, foreign writes denied |
| Viewer mutation denial | New tenant policies exclude viewer from insert/update/delete | Demonstrated | Authenticated viewer mutation attempts in staging |
| Owner/admin boundaries | Membership owner-only and admin API selected-business checks | Demonstrated | Role-session route matrix and rejected cross-business mutation |
| Webhook signature | HMAC SHA-256 and timing-safe equality; tampering tests | Demonstrated | Signed and invalid preview requests with sanitized log |
| Idempotency | Unique event/message IDs and conflict handling | Demonstrated | Provider retry with one business effect |
| Composite foreign keys | Tenant plus record ID across contacts/conversations/leads/appointments | Demonstrated | Deployed schema verifier output |
| Service-role access | Server-only client and explicit grants in migration | Demonstrated | Deployment secret/access inventory and rotation evidence |
| Secret leakage | Tracked-source pattern scan found no embedded secret values | Verified locally | CI secret scan and Git history scan |
| Authentication bypass | Middleware/session/platform checks in source | Demonstrated | Anonymous/client/admin route matrix in preview |
| Rate limiting | No repository-wide public endpoint control found | Planned | Implement and load-test thresholds/alerts |
| Audit-log integrity | Immutable transition trigger and atomic RPC contract | Demonstrated | Deployed update/delete denial and append trace |

## Data protection approach

- Minimize fields to the approved pilot use case.
- Keep service credentials server-side and out of public artifacts.
- Use transport encryption provided by Meta, hosting and database providers.
- Separate businesses through application checks and database policies.
- Retain raw data only for the signed operational, security and legal purpose.
- Aggregate or anonymize public evidence.
- Route ambiguity, complaints and sensitive decisions to a human.

## Required security test run

1. Anonymous requests to protected dashboard/admin/API routes.
2. Client requests to admin routes.
3. Admin without selected `business_id` and with a foreign/missing business.
4. Business A reads/writes Business B records.
5. Viewer attempts insert/update/delete on every mutable tenant table.
6. Owner/admin/member management boundary tests.
7. Valid, missing, malformed and tampered Meta signatures.
8. Duplicate webhook retry with one persisted effect.
9. Cross-tenant composite-key insert attempts.
10. Direct service-role key exposure scan and server/client bundle review.
11. Rate-limit threshold, bypass and recovery tests after implementation.
12. Workflow audit-log update/delete attempts and transaction-failure integrity.

## Incident response minimum

- Validate reporter and severity without collecting unnecessary personal data.
- Contain affected tenant, token, route or workflow.
- Preserve a least-privilege audit trail.
- Notify the affected business under the signed SLA.
- Rotate exposed credentials and verify revocation.
- Document root cause, affected data, recovery and prevention.
- Assess applicable legal/provider reporting with qualified counsel.

## Explicit non-claims

XeroWA does not claim ISO 27001, SOC 2, CERT-In empanelled audit, independent penetration testing or government security certification. Those terms may be used only when the corresponding valid report/certificate is supplied and its scope covers the deployed product.
