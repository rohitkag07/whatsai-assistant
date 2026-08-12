# XeroWA AI pilot data-retention schedule — template

Status: draft for business approval and legal review. Proposed periods below are targets, not executed commitments or evidence of deletion.

## Pilot identification

- Pilot ID: `[pseudonymous ID]`
- Business legal name: `[private agreement only]`
- Pilot dates: `[start]` to `[end]`
- Business data owner: `[name/role]`
- Aviro data owner: `[name/role]`
- Approved legal/dispute holds: `[none or private reference]`

## Proposed schedule

| Data class | Purpose | Proposed starting target | Pilot-close action | Evidence owner |
|---|---|---|---|---|
| Raw message content | Execute and support the approved workflow | Delete or anonymize within 30 days after pilot close | Export only if the Business approves; then delete/anonymize | Pilot operations |
| Provider/message identifiers | Delivery, idempotency and incident investigation | Retain only while operationally required; target 30 days after close | Delete or irreversibly hash where compatible | Engineering |
| Lead and appointment records | Pilot operations and agreed outcome measurement | Target 90 days after close | Return aggregate export; delete or anonymize row-level data | Business owner / Aviro |
| Consent, opt-out and deletion records | Prove suppression and request handling | Target 180 days or the approved legal period | Retain minimum proof without message content | Privacy owner |
| Security and workflow audit logs | Incident detection and integrity review | Target 180 days | Delete on schedule unless an approved incident/legal hold applies | Security owner |
| Authentication/operator logs | Access review and incident response | Target 90 days | Delete on schedule | Security owner |
| Aggregated pilot metrics | Signed pilot report and internal learning | Retain only under the agreement | Keep anonymized signed report; remove re-identification fields | Evidence owner |
| Backups/caches | Recovery and platform continuity | Must expire within the documented provider cycle | Verify expiry; do not restore deleted pilot data except for approved incident recovery | Engineering |

## Required approvals before launch

- Replace every proposed period with an agreed period and purpose.
- Record the approved Meta, Vercel, Supabase and any monitoring/support subprocessors in the private agreement.
- Confirm whether the Business requires a shorter period or immediate close-out deletion.
- Confirm deletion-request SLA, export format, legal-hold authority and incident contact.
- Obtain authorized signatures on the consent/data-processing schedule. This template alone is not an executed agreement.

## Deletion and close-out procedure

1. Freeze pilot ingestion at the agreed close time.
2. Reconcile opt-outs, open incidents, export requests and legal holds.
3. Export only the approved aggregate or business-owned data.
4. Delete/anonymize each data class from active stores using tenant-scoped criteria.
5. Record counts, actor, command/process reference, timestamp and exceptions without copying personal data into public evidence.
6. Verify access fails and provider backup expiry is scheduled.
7. Obtain Business and Aviro close-out sign-off.

## Deletion evidence

| Data class | Action | Completed at | Actor/approver | Evidence reference | Exception/hold |
|---|---|---|---|---|---|
| — | Not executed | — | — | — | — |
