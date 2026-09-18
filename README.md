# WhatsAI Assistant / XeroWA

WhatsAI Assistant is a WhatsApp-first receptionist and lead-conversion platform
for Indian SMBs. It captures inbound customer messages, sends
business-approved replies, qualifies leads, books appointments or callbacks,
queues follow-ups, and hands important conversations to the owner.

> **Simple buyer promise:** customer WhatsApp message ka instant reply, lead
> qualification, follow-up, appointment/site-visit booking, aur owner ko hot-lead
> handoff.

This repository is the canonical XeroWA codebase.

- **Live demo / landing:** https://landing-iota-lemon.vercel.app/
- **Primary app:** Next.js dashboard and serverless WhatsApp runtime in `src/`
- **Core stack:** Next.js, TypeScript, Supabase/PostgreSQL, Meta WhatsApp Cloud
  API, Vercel serverless routes, Vitest
- **Status:** MVP runtime and proof gates exist; production launch depends on
  tenant env, Meta webhook credentials, Supabase Cron/Vault, and live tenant
  configuration.

## Why this project exists

Most Indian SMBs already sell through WhatsApp, but the process is manual:
owners reply late, leads are not qualified consistently, appointments are missed,
and follow-ups depend on memory. WhatsAI turns that messy workflow into a
deterministic software system that a business owner can trust.

The product intentionally uses **business-approved replies** for the launch
runtime. That keeps customer-facing responses predictable, auditable, and usable
without requiring an LLM key for every tenant.

## Product workflow

```text
Customer WhatsApp message
        ↓
Meta webhook verification + signature validation
        ↓
Phone-number-to-business resolution
        ↓
Tenant playbook lookup + approved reply selection
        ↓
Conversation, lead, appointment, handoff, and follow-up state in Supabase
        ↓
Owner dashboard evidence + scheduled follow-up
```

## What it handles today

- WhatsApp webhook verification and canonical inbound message ingest
- Deterministic keyword and knowledge-base reply engine
- Tenant-scoped assistant playbooks for industry-specific behavior
- Lead qualification, appointment/site-visit capture, callback paths, and owner
  handoff state
- Follow-up queue and secured scheduler route
- Direct WhatsApp Cloud API sending for text, media, template, and interactive
  messages
- Operator dashboard surfaces for trials, leads, conversations, appointments,
  integrations, and evidence
- Supported real-estate tenant category for budget, location, property type,
  purchase timeline, loan readiness, site-visit slot, reminders, and handoff

## Architecture map

| Area | Path | Purpose |
| --- | --- | --- |
| Dashboard + serverless runtime | `src/` | Active Next.js app for operator UI, API routes, webhook ingest, cron route, and product workflow. |
| WhatsApp webhook | `src/app/api/webhooks/whatsapp` | Meta verification, signature validation, and canonical inbound message handling. |
| Reply engine | `src/lib/sales-agent-engine.ts` | Deterministic approved-reply and qualification logic. |
| WhatsApp sender | `src/lib/whatsapp-cloud-api.ts` | Direct Meta Cloud API send layer for text, media, templates, and interactive messages. |
| Follow-up scheduler | `src/app/api/cron/followup-scheduler` | Secured follow-up execution invoked by Supabase Cron. |
| Agent services | `agents/xerowa-*` | Local routing, sales-agent, and tool-gateway services used as migration reference / local fallback. |
| Supabase schema | `supabase/migrations/` | Tenant, conversation, lead, appointment, playbook, usage, and handoff persistence. |

## Key engineering decisions

- **Deterministic first, AI-ready later:** launch replies come from tenant
  playbooks, not generated text. This reduces hallucination risk and makes the
  system easier for business owners to approve.
- **Tenant playbooks as source of truth:** Supabase `assistant_playbooks` stores
  live reply behavior. Vertical templates can seed onboarding, but runtime agents
  must not load customer reply text from source files.
- **Serverless production path:** the launch-critical WhatsApp path runs through
  the root Next.js/Vercel deployment. Supabase Cron invokes follow-ups every five
  minutes, so no local Mac, PM2 process, VPS, or always-on worker is required for
  the MVP path.
- **Human owner handoff:** uncertain, high-intent, or manually taken-over
  conversations are moved toward owner visibility instead of pretending the bot
  can resolve everything.

## Proof and verification

The repo includes release gates for the WhatsAI path:

```bash
npm run prove:whatsai
npm run prove:keyword-engine
```

These commands cover required environment checks, health surfaces, WhatsApp
webhook verification, cron authentication, canonical Supabase tables, tenant
isolation for overlapping keywords, exact replies, fallback handoff, manual
takeover suppression, unified routing, and Tool Gateway sending.

Previously verified local evidence from the job-readiness pass:

- 11/11 WhatsAI readiness checks
- 22 passing integration / RLS / evidence tests
- 19 passing keyword-engine tests

## Local setup

```bash
cd /Users/rohit/Projects/saas-products/whatsai-assistant
npm install
npm run dev
```

Default local URL: `http://localhost:3000`.

To prove a deployed URL instead of localhost, set `WHATSAI_APP_URL` before
running the readiness proof.

## Required launch configuration

Launch blockers for a real tenant are intentionally narrow:

- Supabase env and canonical conversation tables must be reachable.
- WhatsApp Cloud API token and verify token must be valid.
- Meta app secret must be configured so webhook signatures can be verified.
- Public webhook verification must return `200`.
- Supabase Cron and Vault must be configured for the secured follow-up route.

Content generation, society management, finance workflows, and ad operations are
outside the current XeroWA runtime and are not MVP launch dependencies.

## Documentation

Start here for deeper implementation context:

- `project_overview.md`
- `WHATSAI_RUNBOOK.md`
- `.docs/ghost-ai/CURRENT_SYSTEM_MAP.md`
- `.docs/ghost-ai/ENV_CONTRACT.md`
- `.docs/ghost-ai/PRODUCTION_READINESS.md`
- `.docs/ghost-ai/DEPLOYMENT_CHECKLIST.md`

## Recruiter / reviewer summary

This project shows practical full-stack product ownership: webhook ingress,
tenant-aware data modeling, Supabase persistence, deterministic automation,
dashboard UX, scheduled workflows, integration boundaries, and testing around the
business rules that are easiest to break.
