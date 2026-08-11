# WhatsAI Assistant - WhatsApp-First Lead Conversion Platform

This repo is the canonical XeroWA codebase for a deterministic WhatsApp
receptionist platform for Indian businesses.

## Current Positioning

WhatsAI Assistant is a 24/7 rule-based WhatsApp receptionist, lead qualifier, follow-up assistant, and owner handoff system for Indian SMBs. Automated replies are exact business-approved keyword responses; no LLM key is required.

Primary buyer promise:

> Customer WhatsApp message ka instant reply, lead qualification, follow-up, appointment/site-visit booking, aur owner ko daily hot-lead summary.

Industry-specific behavior is configured through tenant playbooks. The core
runtime stays the same for every business.

`real_estate` is a supported XeroWA tenant category. Its approved playbook
qualifies budget, location, property type, purchase timeline, and loan readiness;
collects a preferred site-visit slot; persists it as a tenant-scoped appointment;
shows it in Calendar; queues reminders; and creates an owner handoff. This
vertical has no runtime dependency on any standalone property-management product.

## What Already Exists

The repo already contains a meaningful base that should be reused:

- Next.js dashboard shell
- lead pipeline and manual CRM flows
- appointment, site-visit, and callback workflows
- WhatsApp-oriented sales paths
- follow-up queue concepts
- Vercel-hosted WhatsApp webhook and deterministic sales runtime
- direct Meta Cloud API sender with media and interactive message support
- Supabase persistence

## Main App

| App | Path | Purpose |
| --- | --- | --- |
| Dashboard | root `src/` | Active Next.js operator dashboard for trials, leads, conversations, appointments, and integrations. |

Canonical local repo path:

```text
/Users/rohit/Projects/saas-products/whatsai-assistant
```

Do not use the deprecated spaced Claude project copy for new WhatsAI work. It is kept only as a temporary safety backup.

## Production Runtime

The launch-critical WhatsAI path runs inside the root Next.js deployment:

- `/api/webhooks/whatsapp` - Meta verification, signature validation, canonical ingest
- `src/lib/sales-agent-engine.ts` - deterministic keyword and knowledge response engine
- `src/lib/whatsapp-cloud-api.ts` - direct text, media, template, and interactive sends
- `/api/cron/followup-scheduler` - secured follow-up execution

Supabase Cron invokes the scheduler every five minutes. This is required because
Vercel Hobby does not support five-minute cron schedules. No PM2, Mac, Cloud Run,
VPS, or always-on process is required for the production WhatsApp path.

The older Express services remain in `agents/` as migration reference and a
local fallback. They are not production launch blockers.

The supported agent services are `xerowa-summoner`, `xerowa-sales-agent`, and
`xerowa-tool-gateway`.

## Documentation

Start here:

- `.docs/ghost-ai/DOCS_INDEX.md`
- `.docs/ghost-ai/CURRENT_SYSTEM_MAP.md`
- `.docs/ghost-ai/NEXT_BUILD_PLAN.md`
- `.docs/ghost-ai/ENV_CONTRACT.md`
- `.docs/ghost-ai/PRODUCTION_READINESS.md`
- `.docs/ghost-ai/DEPLOYMENT_CHECKLIST.md`

## Local Setup

Always work from the canonical path:

```bash
cd /Users/rohit/Projects/saas-products/whatsai-assistant
```

Install dependencies inside the app or agent you are working on:

```bash
npm install
```

Run dashboard:

```bash
npm run dev
```

Default URL: `http://localhost:3000`.

Run the complete WhatsAI readiness proof:

```bash
npm run prove:whatsai
```

This checks required env, the Vercel serverless health surface, WhatsApp webhook
verification, cron authentication, and canonical Supabase tables. Set
`WHATSAI_APP_URL` to prove a deployed URL instead of localhost.

Run the deterministic reply release gate:

```bash
npm run prove:keyword-engine
```

This proves tenant isolation for overlapping keywords, exact replies, fallback handoff, manual takeover suppression, unified Summoner routing, and Tool Gateway sending.

## Current Build Rule

Supabase `assistant_playbooks` is the only source of truth for live keyword replies. Vertical templates are copied into onboarding and saved to the tenant playbook; agents must never load business reply text from source files.

## Launch Blockers

Launch blockers for the current WhatsAI MVP are only:

- Supabase env and canonical conversation tables are not reachable.
- WhatsApp Cloud API token or verify token is missing/invalid.
- Meta app secret is missing, so webhook signatures cannot be verified.
- Public webhook verification cannot return `200`.
- Supabase Cron and Vault are not configured for the secured follow-up route.

Content generation, society management, finance workflows, and ad operations
are outside the current XeroWA runtime. They are not launch dependencies.
