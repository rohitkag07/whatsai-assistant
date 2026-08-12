# XeroWA Current System Map

## Repository Shape

- root `src/`: active Next.js dashboard and production serverless runtime
- `apps/landing`: public landing application
- `agents/xerowa-summoner`: local ingress, routing, queue, and cron orchestration
- `agents/xerowa-sales-agent`: qualification, approved replies, and follow-up
- `agents/xerowa-tool-gateway`: controlled WhatsApp and external side effects
- `supabase/migrations`: schema and row-level security
- `scripts`: setup, proof, and local runtime helpers

Only the three `xerowa-*` services are supported in the local agent mesh.

## Runtime Pattern

1. Meta sends a signed WhatsApp event.
2. `phone_number_id` resolves to `business_channels`.
3. XeroWA resolves the business, contact, thread, and active playbook.
4. The approved reply engine selects the deterministic response.
5. Tool Gateway or the serverless sender performs the outbound action.
6. Supabase stores the conversation, lead, appointment, and handoff state.
7. The dashboard exposes operational evidence.

## Real-Estate Tenant Flow

`real_estate` setup creates a tenant-scoped playbook and starter rules. Property
inquiries collect budget, location, property type, timeline, loan readiness, and
site-visit preference. A confirmed slot is stored in `appointments` as
`site_visit`, queued for confirmation/reminders, visible in Calendar, and linked
to an owner handoff.

## Production Boundary

The launch-critical production path is the root Next.js deployment. The Express
services are a local compatibility and orchestration surface, not a requirement
for the Vercel WhatsApp webhook path.
