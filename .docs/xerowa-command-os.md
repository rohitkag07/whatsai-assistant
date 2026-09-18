# XeroWA Command OS — Single-Profile Supervised Operating System

XeroWA Command OS keeps Hermes in the current single profile, but forces all company operations through a supervised control layer.

## Principle

Hermes can think broadly, but it can only act through narrow, audited, approval-gated tools.

## Risk constitution

| Level | Name | Default | Examples |
|---|---|---|---|
| L0 | Observe | Automatic | read KPIs, inspect health, analyze logs, summarize conversations with redaction |
| L1 | Draft | Automatic | reports, support drafts, outreach drafts, internal notes, plans |
| L2 | Internal reversible | Automatic within limits | GitHub issue, staging-only task, internal checklist, non-customer task |
| L3 | External impact | Approval required | customer WhatsApp messages, campaigns, public content, workflow changes affecting tenants |
| L4 | Critical | Explicit founder/admin approval required | production deploy, DB migration, billing, pricing, auth/RLS, secrets, refunds, deletion |

## Same-profile safety rules

- Do not give Hermes unrestricted production write access.
- Production/customer/money/auth actions must flow through the XeroWA app control plane.
- Every action records: actor, mode, risk level, reason, evidence, expected impact, approval, result, and rollback note.
- The AI OS mode can be set to `read_only`, `supervised`, or `paused`.
- Kill switch states must be checked by the app before any L2/L3/L4 action executes.

## V1 scope

Included now:

- Admin Command OS page at `/admin/command-os`
- Interactive fleet control for Summoner, Sales, Tool Gateway, Content, Ads, Outbound Follow-up, Operations, and Finance services
- Per-agent enable/pause/disable, risk ceiling, autonomy, schedule, health/dependency checks, queue counts, and recent runs
- Founder-level health brief from existing platform data
- Risk policy cards
- Kill switch visibility
- Approval queue visibility
- Agent/audit activity visibility
- Supabase migration for `ai_os_settings`, `ai_agent_controls`, `agent_actions`, `agent_approvals`, `agent_alerts`, `agent_insights`, and `agent_kpi_snapshots`
- Approval approve/reject endpoint

Still deliberately blocked:

- Direct customer message sending
- Campaign sending
- Production deploys
- Database migration execution
- Billing/refund/pricing changes
- Auth/RLS/secrets mutation

## Build order after V1

1. Apply `supabase/migrations/023_xerowa_command_os.sql`.
2. Wire Hermes tools/MCP to create `agent_actions` and `agent_approvals`, not direct production mutations.
3. Add no-agent sentinel cron scripts for uptime, queue depth, webhook lag, and WhatsApp failure rate.
4. Add support/revenue draft creation tools.
5. Add strict approval execution tools for approved L3/L4 actions only.
