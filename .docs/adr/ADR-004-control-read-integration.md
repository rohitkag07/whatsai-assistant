# ADR-004 — Control read integration and configuration publication

24 September 2026. Written before Phase 4A implementation. Status: local read integration authorized; environment activation, schema changes and operational writes are not authorized.

## Authority and scope

Use the existing business-scoped contract: businesses, business_profiles, business_members, business_channels, conversation_threads, conversation_messages, lead_qualification_answers, handoff_events, followup_jobs and appointments. Do not equate businesses.id with tenants.id or merge the separate tenant_memberships/conversations/messages model. No permanent source of truth is added.

Existing SQL migrations 009, 010_conversation_thread_channel_id, 015 and 017 define the reusable fields. The duplicate 010 prefixes and the tenant-native 20260806 migration require ledger/schema reconciliation in an approved environment. Source definitions alone do not prove deployed schema or RLS. The cached origin security release differs from this frozen implementation baseline; do not cherry-pick it or apply its migrations in this phase.

## Reader architecture and security

Add a server-only Supabase gateway with SELECT capability only, using the existing user-scoped cookie client. Never use service-role fallback. Verify getUser identity against the server session and require an active business membership for that actor, including platform administrators. Recheck that membership through the same user-scoped client. Ignore user_metadata/platform-role shortcuts as read authority. Do not change existing auth or RLS.

The adapter accepts a narrow query port for deterministic local tests. Business ID and actor ID come from verified server context, never query parameters. Each business-scoped query has an equality predicate. Qualification answers are scoped through enumerated same-business thread IDs, in bounded batches. Validate returned row schemas, business identity, parent joins and duplicate IDs even after database filtering. Any foreign row fails the read closed. Membership/business visibility failure suppresses all operational data. A schema error remains an error, not an empty array.

Runtime connection requires existing Control rollout, an additional default-off read flag, an explicit approved non-production URL matching the configured Supabase origin, confirmed schema contract and a non-production runtime. Existing dev-auth bypass is incompatible with real reads. Synthetic mode remains a separate branch; it must never fall back to a real reader or merge real records. Production remains disabled in this slice. No environment is inferred from a credential's presence. No production credentials are read for this work.

## Field authority

| Field | Authoritative source for this phase | Unsupported inference |
|---|---|---|
| Business name/profile | businesses.id/name and business_profiles business_id/timezone/vertical | Browser-local onboarding draft is not published identity/policy |
| Enquiry and intent | conversation_threads IDs, summary and created/last-message timestamps | Summary remains an interpretation; no qualification from replies |
| Messages | conversation_messages ID/body/direction/status/created_at | sent is not delivered; delivered is not won |
| Qualification answers | lead_qualification_answers with validated parent thread | Answers/confidence are not an approved qualification decision |
| Ownership | assigned_user_id reconciled to active business_members.user_id | assigned_to text is only a legacy owner claim; assignment is not acknowledgement |
| Handoff | existing reason/status/created_at | acknowledged status lacks responsible-human receipt; assigned_to is absent from the checked-in handoff DDL and is not selected |
| Follow-up | followup_jobs schedule/status/error/sent_at | step_index is not attempts; no inferred consent, eligibility, approval or delivery |
| Appointment | appointments schedule/title/status and linked thread/contact | scheduled/completed status alone does not supply verification authority |
| Connection | business_channels provider/is_active/status/last_verified_at | Configuration and a historical timestamp do not prove live provider health |
| Outcome | No approved authoritative source in this baseline | No real Won/completed, Lost or conversion receipt is fabricated |

No channel config, verify_token, metadata or provider credentials are selected. Owner display uses verified member identity where available and labels unresolved legacy claims. Null/unlinked appointments or follow-ups outside the loaded parent set are counted as omitted and make the resource partial, never silently complete.

## Pagination, completeness and freshness

Keyset pagination orders by unique ID, not unstable offset pages. Bound rows and requests per resource; batch parent IDs. Read exact counts where available to detect server caps. Unknown counts, duplicate/out-of-order keys, truncation, page errors and omitted parent links cannot produce a complete result. Never convert a permission or unavailable source into zero.

Expose per-resource state, returned count, omitted count, completeness scope and read time. This is a bounded, non-transactional enumeration, not an atomic database snapshot. Business-wide appointment/follow-up enumeration is reconciled only to available same-business parents; missing parents are omitted with an explicit partial result. A later reader may add approved server-side snapshot/keyset contracts if consistency requires it.

Read freshness is time since retrieval, not proof of current customer activity or provider health. No cross-user or cross-tenant stale cache is introduced. The UI expires displayed reads after a fixed review TTL and shows stale values without offering writes. Individual source failures remain visible; counts for failed sources use an em dash. Source completeness and stale state remain separate facts. Existing Synthetic snapshots retain their fixed time and explicitly labelled review controls.

## Receipts, reconciliation and audit history

Real reads supply no newly invented receipts. Qualification decisions need rule/configuration version, inputs/source IDs and authorized decision maker. Acknowledgement needs assigned responsible-human identity and timestamp. Appointments need authoritative event/approved human verification. Follow-ups need consent/window/template, approval, attempt and provider receipts. Outcomes need explicit evidence and verifier. These are gaps for a separately approved event contract, not JSON inferred from legacy text.

Future commands require a business-scoped idempotency key, canonical payload hash, expected version/state, expiry and authorized actor. Same key/same payload returns the original result; same key/different payload rejects. Provider timeouts are Unknown until reconciled; never retry a send as a new command by default. Append-only audit events must preserve request, decision, execution and reconciliation references without storing secrets. Reversal uses a linked compensating event, not history deletion.

## Onboarding publication proposal

Draft → Validated → Owner approved → Published configuration → Connected → Ready for controlled testing → Active only after explicit release approval.

Continue ADR-002: business_configuration_versions references businesses.id and existing profile/playbook/knowledge sources. Store immutable versioned proposals, schema/template version, expected revision, canonical content hash, validation receipt and owner approval bound to that hash. Editing invalidates validation and approval. Publication atomically records a version and reconciles the existing runtime playbook/profile contract; it does not activate messaging. Connection and readiness require separate evidence. Activation requires a distinct authorized release receipt. Browser drafts may be imported only as untrusted proposals after actor/tenant validation.

Proposed schema capabilities: versioned configuration and publication pointer, append-only operational/audit receipts, follow-up attempts/eligibility decisions and provider reconciliation keys. Reconcile existing command/audit tables first; do not create duplicate stores or assign migration filenames before review. No SQL migration is included. RLS, atomic compare-and-swap, role/expiry checks, recovery/export, rollback and immutable approval binding must be tested in an approved environment before release.

## Rollback and release boundaries

Disable the new read flag: Phase 3 Synthetic/unavailable behavior returns. Disable Control: original Phase 2 page bodies return. No data/schema rollback is required for Phase 4A. Do not redesign Command or add funding/investor-profile features. Phase 4B requires a separate mutation approval packet and approval; no operational write endpoint is implemented here.

## Evidence and limits

Verify typed adapter/gateway queries, tenant rejection, paging/caps, null counts, stale/partial/error behavior, no mutation, existing regressions, build, Chromium/WebKit, keyboard/accessibility, screenshots and flag-off comparisons. Protocol mocks are Synthetic, not proof of a real Supabase environment or RLS. If an approved non-production backend is unavailable, record environment prerequisites and blocked integration evidence; create no cloud resources. The recorded security/pilot status remains NO-GO; G-DISCOVERY/G-WEDGE remain NOT PASSED regardless of local tests.

References checked: Supabase SELECT and ordered inclusive range documentation (https://supabase.com/docs/reference/javascript/select and https://supabase.com/docs/reference/javascript/using-modifiers-range), current changelog (https://supabase.com/changelog.md). This implementation uses explicit ordered keysets and bounded reads; it does not use Management API logs or modify schema.
