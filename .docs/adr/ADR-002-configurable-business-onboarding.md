# ADR-002 — Configurable business onboarding

19 September 2026. Accepted for a local review slice under Rohit's Phase 2 authorization; production persistence/publishing is proposed, not approved. Written before Phase 2 implementation.

## Decision and boundaries

One versioned configuration model serves gym, clinic, real estate, product seller, admissions and service templates. Templates seed editable policy, never a tenant, permission, connection or evidence of business facts. The existing admin/dev server guard protects `/admin/onboarding`. A new default-off server flag also requires the accepted Command foundation. No auth resolver, API endpoint, sender, existing business record or schema is changed.

The review slice stores at most ten local drafts per signed-in actor and selected-tenant context. New drafts have random local IDs and do not provision businesses. The actor/context comes from the server session, not URL/storage parameters. Browser storage is a convenience, not an authorization boundary or a permanent source of truth. Same-origin scripts/browser users can inspect it; it must not contain customer conversations, patient details or credentials. Clinic questions are restricted to an operational catalog; no diagnosis/symptom/medical-history fields exist.

## Shared configuration and field authority

Every editable field below is an **owner-entered proposal** in this slice, not a verified operational fact. Template defaults have template provenance and need review. No existing data is silently imported, merged or overwritten.

| Fields | Draft source | Future authoritative source / verification |
|---|---|---|
| Name, description, locations | Owner-entered business identity | Existing `businesses` identity; owner approval before publish |
| Template ID/version | Selected shipped template snapshot | Configuration version; selection cannot grant access |
| Timezone, operating hours, primary/supported languages | Owner settings | Published business configuration; validate IANA timezone and schedule |
| Offerings, indicative prices, availability, eligibility, allowed/restricted information | Owner-approved catalog/policy | Published catalog/config with owner evidence; price/stock never inferred |
| Objectives and selected measurable outcome | Owner measurement contract | Published configuration; outcomes require external receipts/events |
| Required/optional questions, disqualification, urgency, missing-information handling, operator evidence | Template seed plus owner overrides | Published qualification policy; answers remain separate customer records |
| Handoff owner/team, conditions, acknowledgement, escalation, after-hours behavior | Owner routing proposal | Verified membership/assignment IDs plus published policy; text names are not permission grants |
| Next action, confirmation authority, reschedule/cancel boundary | Owner policy proposal | Authoritative scheduling/order service or named human receipt; requests remain requested |
| Follow-up eligibility, delay, attempt cap, pause/approval/reply/opt-out policies | Owner policy proposal | Published consent-aware policy; sender enforces opt-out, approval, limits; no executor here |
| Approved facts, source reference, reviewed date, restricted claims, missing-answer handling, test questions | Owner-entered knowledge proposal | Existing approved knowledge/playbook source plus review/version receipts |
| Tone, response boundaries, escalation, prohibited actions | Template seed plus owner overrides | Versioned assistant policy; no runtime LLM calls in this slice |
| Local review acknowledgement | Local UI action | Only readiness for Synthetic testing; not consent, security or business verification |
| Actor and tenant context | Existing server auth session | Existing auth/membership system; unchanged |
| Local ID, schema version, revision, saved time | Local adapter | Draft bookkeeping only; never business KPIs |
| Connection, consent, publication, activation and actual outcomes | Not available in this adapter | Future server-verified receipts; always Not connected / Unverified / Not activated here |

## Draft / version / published lifecycle

Schema version 1 is parsed strictly at every storage read/write; unknown versions and malformed payloads fail closed. Draft progress can be incomplete. Save increments a revision under a browser Web Lock and checks the expected revision to reject stale tabs. Storage denial, quota, corruption and unsupported locking are visible errors, never false “Saved”. The UI retains unsaved edits and requires explicit discard before switching drafts/templates. Template changes create a new draft, preserving the old configuration.

Ready for testing is derived from complete validation plus an explicit local review; an unsaved configuration stays Draft. Active is a distinct future lifecycle state, deliberately unreachable from local drafts. Editing invalidates the review acknowledgement. No local checkbox may certify connection, consent, RLS, publication or activation. There is no permanent published copy or publish action in this slice.

## Template inheritance and overrides

A draft snapshots template ID/version and defaults once. All templates share the same schema, wizard, validation, storage key structure and preview. Subsequent edits affect only that draft; template updates never silently change an existing draft. Clinic qualification uses the same question records with a narrower allowed catalog. No patient-content field or custom medical intake is permitted. Template comparison and shared-model mapping are included with the UI and planning evidence.

## Compatibility and proposed backend work (not implemented)

Current code defines `businesses` identity/category/metadata, `business_profiles` timezone/location/profile metadata, `assistant_playbooks`, approved business knowledge and `business_setup_checklist`. Migration 017 permits gym/clinic/coaching/real_estate/local_service/other; a product seller would map to `other` until a separately approved category change. Local template IDs do not change that constraint. Existing setup/playbook screens keep their behavior.

A production draft/publish workflow needs a separately reviewed authority and migration proposal. Proposed design: tenant-owned `business_configuration_versions` referencing existing `businesses.id`, immutable published versions, schema/template versions and provenance, optimistic concurrency, actor audit and a single active-version pointer. Existing identity remains in `businesses` and the existing unique-per-business `business_profiles` record; configuration references those sources instead of duplicating authoritative identity/profile fields. Publish must transactionally validate and compile relevant policy into existing playbook/knowledge contracts with a configuration-version receipt; no independent competing runtime reader. Reconcile existing metadata/playbook semantics before final schema design or backfill.

Approval gates before any executable migration: field-by-field ownership reconciliation; migration-history audit; tenant RLS and membership tests; idempotent backfill/conflict policy; rollback/recovery test; explicit non-production environment and credentials authorization; separate production rollout approval. **No SQL migration, table, backend authority, server write or runtime adapter is created by Phase 2.** The migration proposal is this design, not a migration queued for execution.

## Rollback

Set `XEROWA_ONBOARDING_ENABLED` off: route becomes unavailable and navigation returns to Phase 1, without altering its flags, page bodies or local draft data. Local drafts remain inert in the browser. No data/schema rollback exists because none was changed. The Phase 1 commit remains the comparison baseline. Source changes are isolated in the already-approved worktree and kept in a separate Phase 2 commit.

## Verification and unresolved evidence

Test all six template seeds, validation and truthful lifecycle, forbidden clinic questions, actor/tenant/config isolation, malformed/foreign schemas, local locking/stale revisions, capacity/storage errors, server permission/flag gate, preview network isolation, keyboard/responsive/contrast, 200% zoom, build and flag-off comparison. Synthetic preview is deterministic branching, not an LLM evaluation or proof of a real business workflow. No production security/pilot readiness is upgraded. Rohit reviews Phase 2 before Phase 3 or backend authority work.
