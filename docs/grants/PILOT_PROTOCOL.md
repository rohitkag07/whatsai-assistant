# XeroWA AI assisted pilot protocol

Version: 1.0 draft
Duration: 30–60 days
Cohort: 3–5 Indian SMBs

## Purpose

Test whether controlled WhatsApp workflows can improve the consistency and observability of enquiry handling without making unsupported commercial claims. Preferred verticals are dental clinics, coaching institutes, salons, gyms and local services. A real-estate business may join as a generic XeroWA tenant; the standalone X7 RealEstate product is out of scope.

## Entry criteria

- Signed LOI, pilot order and consent/data-processing schedule.
- Named business owner, pilot operator and Aviro pilot lead.
- One approved WhatsApp number and Meta business setup.
- Written use cases, approved replies, fallbacks and human-escalation rules.
- Baseline period or documented baseline method.
- Agreed retention, opt-out, deletion and incident contacts.
- No prohibited, high-impact or special-category workflow without separate review.

## Phases

### Phase 0 — baseline and readiness (days -7 to 0)

1. Inventory current enquiry volume and response process.
2. Agree metric definitions and source tables.
3. Complete tenant/access review and data-minimization checklist.
4. Verify signed webhook, idempotency, tenant mapping and human takeover in staging.
5. Train business operators and record approval of every customer-facing reply.

### Phase 1 — supervised launch (days 1–7)

- Operate one narrow workflow.
- Review every fallback, override, delivery failure and escalation daily.
- Stop automation on tenant, consent or safety ambiguity.
- Do not publish metrics from this stabilization period as outcomes unless the result template identifies it separately.

### Phase 2 — measured operation (days 8–45)

- Review service health daily and pilot metrics weekly.
- Record workflow/version changes with timestamps.
- Sample false matches, missed intents and unsafe/ambiguous cases.
- Obtain business-owner confirmation for corrections and material incidents.

### Phase 3 — close and report (days 46–60 or agreed close)

- Freeze the measurement window and export aggregate evidence.
- Reconcile opt-outs, deletion/export requests and outstanding incidents.
- Compare baseline and pilot periods only when definitions and samples are compatible.
- Obtain business-owner sign-off or explicitly record disagreement.
- Delete or retain data according to the signed schedule.

## Metric contract

| Metric | Definition | Primary source | Required dimensions |
|---|---|---|---|
| Median first-response time | Median seconds from accepted inbound enquiry to first successful business/automated response | inbound/outbound message timestamps | window, sample, excluded failures |
| Successfully processed enquiries | Unique accepted enquiries that reached an approved terminal or handoff state | workflow/event records | total, duplicates excluded |
| Qualified lead rate | qualified unique leads / eligible unique enquiries | lead/workflow records | numerator, denominator, rule version |
| Follow-up completion rate | completed scheduled follow-ups / due follow-ups | follow-up records | due window and opt-outs excluded |
| Appointment request rate | enquiries reaching appointment-request state / eligible enquiries | workflow/appointment records | vertical and workflow version |
| Owner-handoff time | median time from escalation event to owner acknowledgement | handoff/audit events | SLA target and sample |
| Delivery failure rate | failed outbound messages / attempted outbound messages | provider delivery status | provider error classes |
| Workflow fallback rate | enquiries reaching configured fallback / accepted enquiries | transition logs | fallback reason |
| Human override rate | conversations manually paused/taken over / active conversations | operator/audit records | operator role and reason |
| Owner satisfaction | agreed survey score and qualitative note | signed survey | respondents and scale |
| Consent/opt-out handling | valid opt-outs actioned within agreed time / valid opt-outs received | consent/follow-up logs | exceptions and resolution |

Every reported metric must include definition, source, measurement window, sample size, update date and environment (`simulation`, `staging` or `real pilot`).

## Safety and stop conditions

Pause the affected workflow on signature failure, cross-tenant ambiguity, unauthorized access, repeated unsafe reply, unhandled opt-out, material provider outage, data exposure or business-owner request. Record the event, containment, owner communication, root cause and restart approval.

## Public evidence rule

Public artifacts must be aggregated or anonymized, stripped of names, phone numbers, message bodies, IDs, credentials and signatures, and approved under the pilot agreement. Synthetic or demo results must never be relabeled as real-pilot outcomes.
