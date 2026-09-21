# ADR-003 — Shared Control operations read model

21 September 2026. Written before Phase 3 implementation. Accepted for the founder-authorized local review slice; production adapter activation and new data authority are not approved.

## Decision

Today, Inbox, Pipeline, Follow-ups and Appointments use one tenant-scoped, immutable read model. A pure projection adapts existing typed conversation/message/qualification/handoff/appointment/followup contracts. It performs no SDK calls or writes. The server loader selects only an explicitly enabled non-production Synthetic adapter for this slice; otherwise it returns unavailable data. No existing permanent store is duplicated.

The default-off `XEROWA_CONTROL_ENABLED=1` also requires the Phase 1 Control flag, a selected allowed tenant and the existing server business-access guard. Synthetic data additionally requires `XEROWA_CONTROL_SYNTHETIC=1` and a non-production runtime. Query strings cannot enable either. Existing routes retain Phase 2 behavior when the flag is off. `/follow-ups` is unavailable when off. Command is unchanged.

## Authoritative sources and reuse

| Read-model field | Existing source / authority | Phase 3 treatment and missing proof |
|---|---|---|
| Tenant / actor | Existing server session and active membership | Existing guard unchanged; reject any foreign parent or child row before projection |
| Enquiry identity, opened time, owner, AI mode | `conversation_threads`, `conversation_contacts` | Reuse IDs, timestamps and explicit assignment; owner text is a claim, not verified membership |
| Timeline, inbound/outbound activity | `conversation_messages` | Source row ID and time shown; sending/delivery is never an outcome |
| Qualification answers | `lead_qualification_answers`, scoped through validated thread IDs | Answer evidence is extraction provenance; confidence and answer count do not establish Qualified |
| Intent | `conversation_threads.summary` | Explicitly an unverified summary unless backed by a reviewed event |
| Handoff | `handoff_events` reason, priority, assignment, status | Status can be displayed as a recorded claim; acknowledged progression needs actor/time/source receipt |
| Appointment | `appointments` ID, thread/contact, scheduled time, status | `scheduled` is a recorded scheduling claim, not confirmation; completed/no-show/cancelled also need a receipt to be verified |
| Follow-up | `followup_jobs` schedule/status/sent time/error | Pending maps to Due/Scheduled against snapshot time; sent means outcome unknown; cancelled means paused; step index is not an actual attempt count |
| Qualification decision, acknowledgement, outcome, confirmation | Future authoritative audit event / approved human verification | Typed evidence contract only; local Synthetic receipts demonstrate the UI; no production event store created |
| Eligibility / stop reason / attempt count / approval | Future consent, suppression, send-attempt and approval receipts | Unknown unless explicitly supplied with evidence; no sender or eligibility decision executes here |
| Configuration | Phase 2 proposal schema; future approved published version | Local drafts cannot establish operational policy. The read model carries no imported draft authority |

Reviewed source: `src/types/database.ts`, `src/lib/whatsai-data.ts`, `src/lib/calendar-data.ts`, existing auth/shell contracts. Current readers flatten errors into arrays and contain inferred qualification/stages; the new projection intentionally does not reuse those inference rules. Backend code, schema and readers remain unchanged.

## Truth and state semantics

All records carry source IDs and timestamps. Explicit stage evidence determines Qualifying, Qualified, Acknowledged, Confirmed, Won/completed or Lost/not eligible. A message count, bot reply, raw legacy stage string or schedule row cannot advance those stages. Assigned requires an explicit owner. Missing proof produces Outcome unknown / verification unavailable. Requests and tentative proposals remain separate from confirmations. An outcome receipt must identify authority, reference, timestamp and detail; local examples are Synthetic receipts, never real verification.

Read status is ready, empty, partial, stale, loading, error, permission, disconnected or unavailable. Empty means a successful complete read of zero records. Partial counts are lower bounds; stale counts are last known. Error/disconnected/permission/unavailable suppress records and counts, never show zero. Snapshot timestamps drive age and overdue calculations, avoiding a fabricated “updated just now”. Re-selecting a review state does not refresh a source.

## Tenant and adapter boundaries

Every parent carries business ID. Child messages, qualification answers, handoffs, appointments and follow-ups must reference a same-tenant thread; contacts must match the thread's contact; duplicate IDs and broken references fail closed. The full snapshot is rejected rather than silently dropping foreign rows. Server context is the sole scope input. UI selection IDs only select an already scoped record. Runtime data and fixtures are never merged. Fixture names, messages, receipts and operators carry a persistent Synthetic label.

## Mutations and approval

The slice exposes inspection, filtering, list/board switching, mobile drill-in and an explicitly labelled local takeover/acknowledgement simulation. No mutation API, server action, send, drag-to-progress, appointment confirmation or write-through adapter is added. A simulation changes only the preview session and never constitutes an authoritative receipt. Production takeover, assignment, approval, follow-up or appointment actions need separately approved permission checks and auditable receipts.

## Proposed future persistence / migration requirements

Before wiring a real reader: review RLS and membership isolation, per-resource pagination/completeness, row-level timestamps and error propagation. Reconcile existing metadata before proposing a canonical event/receipt contract for acknowledgement, consent, appointments and outcomes. Add no duplicate business truth. Any schema changes require an explicit migration plan, environment approval, idempotent backfill, authority reconciliation, verification and rollback before application. This ADR is a proposal, not an executable migration.

## Rollback and verification

Turn off `XEROWA_CONTROL_ENABLED`: original four page bodies and Phase 2 navigation/shell return unchanged; follow-up review route disappears. No schema or data rollback is needed. Compare frozen Phase 2 baseline screenshots with flag-off at desktop/tablet/mobile in Chromium/WebKit. Test status honesty, evidence requirements, tenant/child boundaries, no network mutation, keyboard/focus, mobile drill-in, contrast and 200% zoom. Run relevant prior tests, type-check, lint and build. No production access, push, deployment, outbound messages or Phase 4.

## Retained Phase 2 follow-ups

Owner comprehension testing, ten-step simplification, owner-friendly timezone/qualification wording, server persistence, recovery/export and publish lifecycle remain recorded follow-ups; none blocks this local Phase 3 slice. G-DISCOVERY/G-WEDGE remain unpassed; live security and pilot launch remain NO-GO.
