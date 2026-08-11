# WhatsAI Assistant - Architecture

## Core Pattern

The system follows a WhatsApp-first, Summoner-routed, multi-agent architecture:

- Dashboard is the operator UI
- WhatsApp is the primary customer channel
- Summoner is the preferred central routing layer
- Assistant playbooks define vertical behavior
- Specialist agents handle domain logic
- Tool Gateway owns external API/tool execution
- Supabase is the system of record

## Product Boundary

XeroWA is industry-agnostic. Industry behavior belongs in tenant playbooks, not
product-specific runtime modules.

Supported generic concepts are:

- businesses
- business profiles
- assistant playbooks
- conversation threads
- leads
- appointments
- handoffs
- owner summaries
- trial accounts

A real-estate company can be a XeroWA tenant without coupling the two products.

For a `real_estate` tenant, property inquiry and qualification stay inside the
tenant playbook. A chosen site-visit slot is represented as an appointment with
`appointment_type = 'site_visit'`, then appears in the shared Calendar and owner
handoff surfaces.

## Agent Roles

- `xerowa-summoner`: routing, WhatsApp ingress, orchestration, cron fan-out
- `xerowa-sales-agent`: current lead qualification engine and first generic assistant base
- `xerowa-tool-gateway`: WhatsApp send, payment links, PDF/media helpers

## Data Flow

1. customer message enters through WhatsApp webhook
2. Summoner resolves business context from phone/channel/default trial config
3. Summoner selects assistant playbook and target agent
4. target agent replies or asks qualification question
5. Tool Gateway sends external WhatsApp/payment/PDF actions
6. results are written back to Supabase
7. dashboard shows lead, thread, appointment, and handoff state
8. owner receives hot-lead handoff or daily summary

## Current Architectural Rule

Prefer Summoner-first routing for new integration work. Do not add new direct point-to-point agent paths unless there is a clear reason.
