# 🛠️ XeroWA AI — 30-Day Engineering & Architecture Upgrade Roadmap
**Legal Entity:** Aviro Technologies Private Limited (Indore, MP)
**Target Score:** 6.7/10 ──► **9.2/10 (Institutional Unconditional Admission & Seed Grant Grade)**

---

## 📊 Target Milestone Matrix

| Pillar | Current | Target | Concrete Deliverable Required |
|:---|:---:|:---:|:---|
| **Technical Depth** | 6.5 | **9.5** | State-Machine Engine, RLS Test Suite, Webhook Idempotency, Hinglish Classifier |
| **Competitive Moat** | 5.5 | **9.0** | 5-Min Playbook Compiler, Hinglish Dataset v1.0, Propensity Scoring Engine |
| **Product Readiness** | 6.0 | **9.5** | Live `/evidence/client-1` View, 5 Signed LOIs, VAPT Security Assessment |
| **Incubator Fit** | 8.0 | **9.0** | IIT Indore ACE (Tech) & IIM Indore (Commercial) Separate Tailored Applications |
| **PROJECTED OVERALL** | **6.7** | **9.2** | **Unconditional Incubation & Seed Support Recommendation** |

---

## 📁 1. Target Repository Structure

```text
apps/
  dashboard/                     # Next.js Client & Admin Dashboard
  webhook-api/                   # Edge Webhook Router & Meta Ingestion

packages/
  workflow-engine/               # Deterministic State Machine Engine
  intent-engine/                 # Hinglish Typo Matcher & Intent Classifier
  lead-scoring/                  # Propensity Scoring Algorithm
  escalation-engine/             # Real-time Hot Lead SLA Escalation Protocol
  tenant-security/               # Supabase RLS Helper Policies & Test Harness
  playbook-compiler/             # 5-Minute Vertical Playbook Compiler

supabase/
  migrations/                    # Multi-tenant DB DDLs
  policies/                      # RLS Security Policies
  seed/                          # Staging data
  tests/                         # Automated RLS Isolation Tests

datasets/
  hinglish-intents/
    train.jsonl                  # 1,500+ Labelled Intent Utterances
    validation.jsonl
    test.jsonl
    dataset-card.md

docs/
  architecture/                  # State Machine & Webhook Diagrams
  security/                      # VAPT Security Assessment Report
  evaluation/                    # Intent Benchmark F1 Scorecard
  pilots/                        # 5 Signed Partner LOIs
```

---

## 📅 2. Week-by-Week Implementation Roadmap

### 🗓️ Week 1: Multi-Tenancy Security & Database Hardening
- [ ] Add `tenant_id` foreign key to all core business tables (`contacts`, `conversations`, `messages`, `leads`, `appointments`, `knowledge_items`).
- [ ] Implement `is_tenant_member(requested_tenant_id uuid)` SQL helper function in Supabase.
- [ ] Enable Row-Level Security (RLS) policies on all tenant-sensitive tables.
- [ ] Build automated RLS test suite (`supabase/tests/rls_isolation.test.ts`) with 4 test personas (`owner_a`, `staff_a`, `owner_b`, `unauthorized_user`).
- [ ] Generate `docs/security/rls_matrix.md` and record cross-tenant denial video proof.

### 🗓️ Week 2: Deterministic State-Machine Engine & Webhook Router
- [ ] Implement JSON Schema validator for vertical playbooks (`packages/workflow-engine/src/schema.ts`).
- [ ] Build state-machine transition executor (`packages/workflow-engine/src/executor.ts`) restricting AI to owner-approved responses.
- [ ] Write 50+ automated transition tests (Dental appointment booking, pricing query, emergency handoff).
- [ ] Implement Meta HMAC `sha256` signature verification on Edge Webhook Router (`apps/webhook-api/src/verify-signature.ts`).
- [ ] Create `webhook_events` idempotency table in Supabase to suppress duplicate Meta webhooks.

### 🗓️ Week 3: Vertical Playbook Compiler, Hinglish Dataset & Scoring
- [ ] Build 5-Minute Vertical Playbook Compiler UI (`packages/playbook-compiler`) with pre-built templates for Dental, Gym, Real Estate, Coaching, and Salon.
- [ ] Curate 1,500+ labelled Hinglish intent dataset (`datasets/hinglish-intents/train.jsonl`) and generate benchmark evaluation report (target Macro F1 ≥ 0.90).
- [ ] Build explainable Lead Propensity Scoring engine (`packages/lead-scoring/src/calculator.ts`) returning 0-100 score + explanation array.
- [ ] Build Hot-Lead Escalation Engine with 10-minute SLA timer and WhatsApp owner notification.

### 🗓️ Week 4: Client #1 Evidence View, 5 Signed LOIs & VAPT Pack
- [ ] Build read-only evaluation dashboard route `/evidence/client-1` displaying real metrics (response latency < 3s, delivery rate 99%, lead conversion %).
- [ ] Execute Section 7 Pilot LOI Template with 3 to 5 local Indore business partners (1 Dental Clinic, 1 Gym, 1 Broker).
- [ ] Complete VAPT security testing (0 Critical, 0 High open findings) and generate `docs/security/vapt_report.pdf`.
- [ ] Create 3-minute live end-to-end demo script (WhatsApp message ──► Edge Webhook ──► RLS DB ──► State Machine ──► Hot-Lead Alert).
- [ ] Submit Master Application to IIT Indore ACE Foundation & IIM Indore Incubation portals.

---

## 🎯 3. Live 3-Minute Presentation Demo Script

1. **0:00–0:20 (Context & Isolation Setup):** Show empty tenant dashboard, active tenant ID, and mapped WhatsApp number.
2. **0:20–0:40 (Live Hinglish Ingest):** Send WhatsApp message: *"Vijay nagar me 2bhk chaiye budget 60 lakh ke around sunday visit kr skte h?"*. Show live edge webhook log, signature verification, and latency (< 2.5s).
3. **0:40–1:10 (Deterministic State Machine):** Show intent extraction (`PROPERTY_ENQUIRY`, `Sunday site visit`, `₹60L budget`) and state transition to `COLLECT_TIMELINE`. Show that AI refuses to confirm booking until authorized staff confirms.
4. **1:10–2:00 (Hot-Lead Escalation):** Show lead score jump to 84 (HOT), trigger reason list, SLA timer, and owner alert.
5. **2:00–2:45 (RLS Security Proof):** Switch to Tenant B account and query Tenant A lead ID. Show 0 rows returned (Access Denied).
6. **2:45–3:00 (Conclusion & Deliverable Report):** Display Client #1 live metrics dashboard, VAPT certificate, and pilot LOIs.

---

## 🏆 Final Result
Upon completion of this 30-day engineering roadmap, **Aviro Technologies Private Limited (XeroWA AI)** will possess an unassailable institutional application dossier rated **9.2/10**, qualifying for unconditional incubation admission and milestone seed funding.
