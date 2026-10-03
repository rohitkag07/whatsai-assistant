# XeroWA AI risk register

Last updated: 12 August 2026

| ID | Risk | Likelihood | Impact | Owner | Mitigation | Verification / trigger |
|---|---|---:|---:|---|---|---|
| R-01 | Company identity or eligibility document is missing/inconsistent | High | Critical | Founder | Verify incorporation, PAN, address, shareholding and signatory before application | Private data-room checklist signed |
| R-02 | Public claims overstate prototype, traction or approval | Medium | Critical | Founder/product | Claims register, review gate and evidence owner | Page/content scan before release |
| R-03 | Cross-tenant data access | Medium | Critical | Security/engineering | RLS, composite keys, role policies and live two-tenant tests | Staging denial suite |
| R-04 | Viewer/client performs unauthorized mutation | Medium | High | Security/engineering | Role-separated policies and API checks | Viewer mutation matrix |
| R-05 | Service-role credential is exposed or overused | Medium | Critical | Engineering | Server-only secrets, least privilege, rotation and bundle scan | CI/history scan and rotation log |
| R-06 | Forged or replayed webhook causes action | Medium | High | Engineering | Signature validation, idempotency and provider IDs | Tamper/retry test |
| R-07 | Public endpoint abuse or denial of service | Medium | High | Engineering | Add rate limiting, provider quotas, monitoring and fail-closed behavior | Load/rate-limit test; currently open |
| R-08 | Incorrect Hinglish match sends an unsafe reply | Medium | High | Product/engineering | Approved replies, confidence/fallback rules, human override and held-out evaluation | Error analysis and pilot review |
| R-09 | Synthetic data is mistaken for customer evidence | Medium | High | Evidence owner | Prominent environment labels and separate real-pilot index | Evidence publication checklist |
| R-10 | Opt-out or deletion request is missed | Medium | High | Pilot operations | Consent state, stop-follow-up logic, request register and SLA | Weekly reconciliation |
| R-11 | Meta/API policy or availability changes | High | High | Engineering/product | Provider monitoring, graceful fallback and human process | Provider change log and incident drill |
| R-12 | Pilot recruitment is delayed | Medium | Medium | Founder/pilot lead | Narrow vertical partners, staged cohort and explicit qualification | Weekly cohort funnel |
| R-13 | Pilot sample is too small for broad claims | High | High | Evidence owner | Report samples/uncertainty and limit conclusions | Statistical/method review |
| R-14 | Grant window closes or eligibility interpretation changes | High | High | Grant owner | Official-source recheck immediately before submission | Dated scheme matrix and portal receipt |
| R-15 | Budget is inflated to a scheme ceiling | Low | High | Founder/finance | Needs-based ₹20L plan, quotes and quarterly reforecast | Finance approval and utilization evidence |
| R-16 | Independent assessment finds critical issues | Medium | High | Security/engineering | Schedule early, reserve remediation budget and block launch | Findings log and closure evidence |
| R-17 | Legacy and new schema controls diverge | Medium | High | Engineering | Production schema inventory, migration verifier and consolidation plan | Deployed schema report |
| R-18 | Public evidence exposes personal/tenant data | Medium | Critical | Evidence owner | Synthetic captures, redaction, approval and metadata stripping | Privacy review before publish |
| R-19 | Workflow/audit record becomes inconsistent | Low | High | Engineering | Atomic commit, immutable logs and reconciliation | Transaction and tamper tests |
| R-20 | Product is presented as X7 RealEstate | Low | High | Product/release | Path/remote/config boundary audit and generic `real_estate` wording | Release boundary checklist |

## Release stop conditions

Stop pilot launch or public evidence release on an unverified legal identity, unresolved critical security finding, missing signed data terms, ambiguous tenant routing, exposed secret, unsupported result claim or active material incident.
