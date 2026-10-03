# XeroWA AI assisted-pilot onboarding checklist

Use once per business. `PASS` requires a dated artifact; unchecked items are not implied to be complete.

## 1. Qualification and ownership

- [ ] Assign a pseudonymous pilot ID and keep business identity in the private agreement only.
- [ ] Confirm the business is one of the approved first-cohort verticals: coaching, salon or gym.
- [ ] Name the Business owner, primary operator, backup operator, Aviro pilot lead, privacy contact and incident contact.
- [ ] Select one WhatsApp number and one narrow workflow for the first seven supervised days.
- [ ] Record current enquiry process, baseline window and known seasonal/confounding factors.

## 2. Agreements and data controls

- [ ] Execute the LOI or pilot order; label it non-binding where applicable.
- [ ] Execute counsel-reviewed consent/data-processing terms.
- [ ] Complete the retention schedule, subprocessors, deletion SLA and publicity approval path.
- [ ] Approve customer notice, opt-out wording and suppression process.
- [ ] Confirm excluded data: passwords, payment-card data, government IDs, medical records and any unapproved special-category data.

## 3. Workflow approval

- [ ] Inventory questions, approved exact replies, media, qualification steps, appointment rules and escalation reasons.
- [ ] Obtain Business-owner approval for every customer-facing reply and fallback.
- [ ] Configure confidence/no-match behavior to fail closed or hand off to a human.
- [ ] Define operator hours, owner-handoff SLA target and out-of-hours response.
- [ ] Label every demo/synthetic record; do not seed it into pilot outcome reports.

### First-cohort vertical guardrails

| Vertical | Initial in-scope workflow | Explicit boundary |
|---|---|---|
| Coaching | Course facts, eligibility questions, counselling slot and follow-up | No admission, placement, score or outcome guarantee |
| Gym | Membership facts, trial/session request and follow-up | No medical, injury or guaranteed fitness claims |
| Salon | Service facts, price/availability and booking request | No unsupported treatment or health claim |

### Deferred second-cohort boundaries

| Vertical | Why deferred | Entry requirement |
|---|---|---|
| Dental | Medical-data and clinical-claim risk | Separate legal/security review; no diagnosis, clinical advice or medical-record processing by default |
| Real estate tenant | Product-boundary complexity | Generic XeroWA tenant workflow only; no standalone X7 RealEstate code, branding, database or customer data |

## 4. Technical and security gate

- [ ] Confirm signed Meta webhook verification and tenant routing by the approved phone-number ID.
- [ ] Confirm duplicate/replayed inbound events create one business effect.
- [ ] Run live Business A/Business B read/write denial tests in a secure non-production test tenant.
- [ ] Run viewer insert/update/delete denial and owner/admin/member boundary tests.
- [ ] Review server/client bundles and Git history for secrets; rotate any exposed credential before launch.
- [ ] Verify dashboard anonymous redirect, business role routes, human takeover, opt-out and deletion paths.
- [ ] Record rate-limit thresholds or keep the workflow blocked until this open control is resolved.
- [ ] Complete `PILOT_SECURITY_REVIEW_CHECKLIST.md`; no unresolved critical finding.

## 5. Measurement readiness

- [ ] Complete `PILOT_BASELINE_MEASUREMENT_SHEET.md` with definitions, sources, exclusions and target values.
- [ ] Confirm event timestamps use one documented time zone and compatible clocks.
- [ ] Confirm metric queries exclude duplicates, tests, stabilization data and opted-out contacts as specified.
- [ ] Schedule weekly evidence reviews and the final sign-off meeting.
- [ ] Create the private evidence folder from `pilot-evidence/_template`; do not store raw customer PII in Git.

## 6. Launch decision

- [ ] Business owner approves go-live date and supervised operators.
- [ ] Aviro pilot lead approves workflow, measurement and support readiness.
- [ ] Security reviewer records `GO`, `CONDITIONAL GO` or `NO-GO` with evidence.
- [ ] Stop conditions and rollback owner have been rehearsed.

Decision: `[GO / CONDITIONAL GO / NO-GO]`
Conditions: `[list or none]`
Business approval: `________________` Date: `________`
Aviro approval: `________________` Date: `________`
