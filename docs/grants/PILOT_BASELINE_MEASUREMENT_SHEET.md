# XeroWA AI pilot baseline and KPI measurement sheet

All values begin as `Not measured`. Targets must be agreed before the measured pilot window and must never be presented as results.

## Measurement contract

- Pilot ID: `[pseudonymous ID]`
- Vertical/workflow: `[approved scope]`
- Environment: `[real pilot / staging / simulation]`
- Workflow version/SHA: `[version]`
- Time zone: `[for example Asia/Kolkata]`
- Baseline window: `[start/end]`
- Stabilization window excluded from outcomes: `[start/end]`
- Measured pilot window: `[start/end; 30–60 days]`
- Evidence owner/query reference: `[private reference]`

## KPI sheet

| KPI | Formula and unit | Inclusion/exclusion rule | Baseline | Target (not result) | Pilot result | Sample |
|---|---|---|---:|---:|---:|---:|
| Median first-response latency | Median seconds from accepted inbound enquiry to first successful approved automated/business response | Exclude duplicates, tests, provider-rejected inbound and agreed out-of-hours cases | Not measured | Set before launch | Not measured | 0 |
| Delivery rate | Successfully delivered outbound messages / attempted outbound messages × 100 | Separate provider failures from business suppressions and opt-outs | Not measured | Set before launch | Not measured | 0 |
| Qualified-lead rate | Unique qualified leads / eligible unique enquiries × 100 | Use the approved rule version; exclude spam, tests, duplicates and ineligible enquiries | Not measured | Set before launch | Not measured | 0 |
| Appointment conversion | Confirmed appointment requests / eligible unique enquiries × 100 | Report requests and completed appointments separately where available | Not measured | Set before launch | Not measured | 0 |
| Owner-handoff SLA | Median acknowledgement time plus percentage acknowledged within the agreed target | Start at escalation event; record missing acknowledgements as misses | Not measured | Set before launch | Not measured | 0 |
| Opt-out compliance | Valid opt-outs actioned within agreed SLA / valid opt-outs received × 100 | Include every recognized opt-out channel and exception | Not measured | Set before launch | Not measured | 0 |
| Error rate | Failed or unsafe workflow outcomes / accepted unique enquiries × 100 | Break out delivery, no-match, system, policy and operator errors | Not measured | Set before launch | Not measured | 0 |
| Workflow fallback rate | Unique enquiries reaching configured fallback / accepted unique enquiries × 100 | Report fallback reason and workflow version | Not measured | Set before launch | Not measured | 0 |

## Baseline collection

| Date/week | Eligible enquiries | Response sample | Delivered/attempted | Qualified | Appointments | Handoffs | Opt-outs | Errors | Evidence reference |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| — | 0 | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 | Not collected |

## Quality checks

- [ ] Numerators and denominators reconcile to the source records.
- [ ] Duplicate provider/message IDs are removed exactly once.
- [ ] Tests, synthetic conversations and stabilization days are labeled and excluded where specified.
- [ ] Workflow/config changes are timestamped and segmented.
- [ ] Missing values remain null/`Not measured`, never zero unless zero is the observed value.
- [ ] No public artifact contains names, phone numbers, message bodies, provider IDs or tenant identifiers.

Business metric owner: `________________` Date: `________`
Aviro evidence owner: `________________` Date: `________`
