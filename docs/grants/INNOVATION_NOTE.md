# XeroWA AI innovation note

## Problem

Indian SMBs frequently handle discovery, pricing, qualification, appointment and follow-up conversations through WhatsApp. The channel is convenient, but the operating process is often manual: answers differ by operator, customer context stays inside chats, follow-ups have no owner, and a business cannot reconstruct why a lead was qualified or handed over.

This problem is currently a defensible market hypothesis, not a quantified nationwide finding. Pilot research must measure its severity for each target vertical.

## Solution

XeroWA provides controlled conversational workflows for:

- business-approved replies and media;
- configured Hinglish/English/Hindi intent recognition;
- structured qualification and lead scoring;
- follow-up and appointment state;
- human takeover and owner escalation;
- tenant-scoped evidence and operational reporting.

The current stage is pre-launch validation/staging. The architecture is demonstrated in source and automated tests; customer outcomes are not yet verified.

## Technical differentiation

1. **Tenant-aware context before execution.** Incoming WhatsApp phone-number IDs are intended to resolve to a tenant/business boundary before a playbook and data graph are selected.
2. **Deterministic workflow state machines.** Explicit events, schemas and allowed transitions control when the system may reply, schedule, follow up or escalate.
3. **Controlled action execution.** External actions are represented as explicit workflow effects rather than arbitrary model tool calls.
4. **Hinglish evaluation discipline.** A versioned synthetic dataset contains 1,800 unique examples across 30 intents, five SMB verticals and typo-severity bands. It is useful for governed development, not proof of real-user accuracy.
5. **Explainable lead scoring.** Scores retain human-readable reasons based on intent, completeness, urgency and fit.
6. **Hot-lead SLA escalation.** The integration test demonstrates a ten-minute owner-response target for explicit high-intent/site-visit cases.
7. **Signed and idempotent ingress.** HMAC validation and unique event/message identifiers reduce tampering and duplicate processing risk.
8. **Auditable transitions.** The new tenant schema includes immutable workflow-transition logs and an atomic commit boundary.

## Ordinary platform capabilities

WhatsApp Cloud API, web hosting, PostgreSQL, authentication, HMAC, row-level security and generic AI/LLM techniques are not proprietary breakthroughs. XeroWA’s defensibility depends on the integrated governance, workflow/IP artifacts, Indian-market evaluation assets, operational know-how and proven pilot outcomes.

## Validation questions

- Which verticals have enough repeated WhatsApp enquiry volume to benefit?
- What percentage of messages can be handled with approved workflows without unsafe false matches?
- Does the workflow reduce median response and handoff time after controlling for volume and staffing?
- Do business owners accept the configuration and evidence workload?
- What failures require human override, and are they detected quickly?
- Can onboarding and support be delivered at a sustainable cost?

## Current claim boundary

Use “source-tested prototype,” “product workflow preview” and “pilot validation pending.” Do not use “proprietary AI breakthrough,” “proven conversion improvement,” “live at scale,” “government approved” or “grant approved.”
