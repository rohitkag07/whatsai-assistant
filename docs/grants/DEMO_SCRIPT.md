# XeroWA AI evaluator demo script

Target duration: 8–10 minutes. Use a synthetic tenant and synthetic contacts only.

## Pre-demo evidence card

- Branch/SHA: `[insert deployed preview SHA]`
- Environment: `[preview/staging]`
- Tenant: `[synthetic identifier]`
- Workflow version: `[version]`
- Data notice: “All people and conversations shown are synthetic.”
- Known limitations: no verified customer/pilot outcome.

## 1. Problem and product stage — 60 seconds

Explain that owner-led Indian businesses receive WhatsApp enquiries but often lack consistent qualification, follow-up and evidence. State: “Current stage: Pre-launch validation/staging. XeroWA AI is being prepared for assisted pilot validation with selected Indian businesses.”

## 2. Approved business context — 60 seconds

Open the synthetic tenant setup. Show one business profile, approved replies, a fallback and owner escalation. Do not expose credentials or provider IDs.

## 3. Hinglish enquiry — 90 seconds

Send a synthetic message such as: “Consultation fess kya hai? Aaj evening slot h?” Show the configured intent match and exact approved reply. Label the result “prototype demonstration,” not a customer conversation.

## 4. Structured lead and workflow — 90 seconds

Show intent, captured fields, lead score reasons and deterministic state. Explain which parts are common platform capabilities and which source artifacts implement XeroWA’s workflow controls.

## 5. Appointment or owner handoff — 90 seconds

Choose one explicit transition. Show appointment state or human escalation, the owner action and the audit entry. Do not imply a delivered provider message unless the delivery status is genuinely observed.

## 6. Security boundary — 90 seconds

Show sanitized test output for signature tampering, idempotency, tenant policy and immutable logs. State that live cross-tenant tests and independent assessment are still required if they have not been completed.

## 7. Evidence centre — 60 seconds

Open `/evidence`. Show metric provenance and the difference between verified, demonstrated and planned. Point out “Not yet measured” pilot outcomes.

## 8. Pilot and grant use — 60 seconds

Open `/pilot` and `/grant-readiness`. Explain the 30–60 day cohort, consent, measures, ₹20 lakh needs-based plan and current 66/100 internal score.

## Close

Verdict: “READY FOR PILOT VALIDATION.” Ask for an assisted pilot or evaluator feedback, not grant approval. Record questions, requested artifacts and follow-up owner.
