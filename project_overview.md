# XeroWA Project Overview

XeroWA is a WhatsApp-first receptionist and lead-conversion platform for Indian
businesses. It captures inbound messages, sends business-approved replies,
qualifies leads, books appointments or callbacks, follows up, and hands important
conversations to the owner.

## Product Boundary

XeroWA is industry-agnostic. Industry-specific behavior is tenant data stored in
assistant playbooks; it is not implemented as a separate product runtime inside
this repository.

The `real_estate` tenant category remains supported through its own approved
keyword rules and qualification questions. Site visits use the generic
`appointments` and Calendar flow, plus tenant-scoped handoff and reminder state.

## Supported Runtime

- root Next.js dashboard and serverless WhatsApp path
- Supabase business, channel, contact, conversation, lead, appointment, handoff,
  usage, and playbook records
- `xerowa-summoner` for local routing and orchestration
- `xerowa-sales-agent` for qualification and approved replies
- `xerowa-tool-gateway` for controlled external side effects

## Launch Goal

Prove one real business flow end to end:

1. signed WhatsApp inbound webhook
2. phone-number-to-business resolution
3. tenant-scoped approved reply
4. persisted conversation and lead state
5. appointment or owner handoff
6. scheduled follow-up
7. operator-visible evidence
