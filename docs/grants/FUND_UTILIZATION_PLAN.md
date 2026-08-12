# XeroWA AI fund utilization plan

Working scenario: ₹20.00 lakh over 12 months. This is a needs-based plan suitable for tailoring to an eligible seed/prototype call; it is not a claim that ₹20 lakh has been requested, sanctioned or received.

| Milestone / budget | Objective | Deliverable | Period | Success metric | Verification artifact | Risk | Mitigation |
|---|---|---|---|---|---|---|---|
| Product hardening — ₹3.20L | Stabilize controlled workflows and operator experience | Versioned workflow engine, fallback controls, accessibility and reliability fixes | M1–M4 | All release-gate tests pass; no open P0 defects | CI logs, release notes, demo | Scope growth | Freeze pilot workflow and use change control |
| Security/compliance — ₹2.40L | Validate tenant, role, webhook and privacy boundaries | Live isolation tests, rate limiting, retention/subprocessor pack, incident runbook | M1–M5 | Two-tenant/viewer denials pass; high findings remediated | Security report and runtime logs | Staging mismatch | Production-like staging and independent review |
| WhatsApp integration — ₹1.60L | Improve channel reliability and observability | Provider failure taxonomy, retries, template/consent tooling | M1–M6 | Delivery/failure states traceable for every pilot message | Provider logs and runbook | Meta policy/API changes | Narrow abstraction and change monitoring |
| Pilot onboarding — ₹2.40L | Recruit and support 3–5 consented Indian SMB pilots | LOIs, agreements, configured tenants, weekly reviews | M2–M8 | 3–5 signed, launched pilots with complete baseline | Signed pack and pilot register | Slow recruitment | Vertical partners and staged cohort |
| Intent/model evaluation — ₹2.00L | Build defensible Indian-market evaluation | Held-out consented evaluation set, error analysis and versioned scorecards | M2–M9 | Evaluation coverage and error thresholds approved before release | Dataset card, checksum and scorecard | Data quality/bias | Human review, stratification and dataset governance |
| Infrastructure — ₹1.80L | Run secure staging and pilots with observability | Hosting/database/monitoring budget and backups | M1–M12 | Availability and recovery targets measured | Invoices, dashboards and recovery test | Cost spikes | Budgets, quotas and alerting |
| Hiring/training — ₹3.20L | Add MP-based product/support capacity | Part-time engineering/QA/pilot operations and operator training | M2–M12 | Documented roles, completed training and reviewed output | Contracts, payroll, training records | Hiring delay | Contractors and milestone-based engagement |
| Commercialization — ₹1.00L | Test repeatable onboarding and buyer evidence | Pilot-to-commercial package, pricing research and sales process | M7–M12 | Signed conversion decisions with reasons, not assumed revenue | Customer decisions and funnel definitions | Premature scaling | Commercial gate after evidence review |
| Independent audits — ₹0.80L | Add external credibility | Application-security and privacy/legal review | M5–M10 | High-risk findings closed or accepted by owner | Final reports and remediation log | Auditor availability | Book early and define narrow scope |
| IP/trademark — ₹0.60L | Protect brand and assess defensibility | Trademark search/filing plan and IP landscape note | M4–M10 | Counsel-reviewed decision and filed artifact if justified | Search report, filing receipt | Weak registrability | Search before filing; no patent claim without novelty |
| Contingency — ₹1.00L | Absorb justified pilot/security variance | Approved exception budget | M1–M12 | Every use linked to change request and artifact | Founder/finance approval log | Undisciplined use | Monthly cap and reallocation approval |
| **Total — ₹20.00L** | | | | | | | |

## Disbursement gates

1. **Gate A (M1):** company/DPIIT eligibility and pilot legal pack verified.
2. **Gate B (M3):** secure staging, measurement contract and first signed cohort ready.
3. **Gate C (M6):** active pilots, weekly evidence and no unresolved critical security finding.
4. **Gate D (M9):** interim result quality supports continuation.
5. **Gate E (M12):** independent review, final pilot report and commercialization go/no-go.

## Financial controls

- Pay from the company account and retain invoices, contracts, bank references and approvals.
- Do not double-claim an expense under another state or central scheme.
- Link every expenditure to a milestone and verification artifact.
- Reforecast quarterly; do not spend merely to match a scheme ceiling.
