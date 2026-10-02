# ADR-006 — First-run proposals and readiness evidence

3 October 2026. Local Phase 5; no schema or external mutations.

The first-run journey reuses the Phase 2 ten-step editor, six templates, validation,
browser-local actor/business-scoped draft adapter and scripted preview. It does
not create a second configuration store or approval mechanism. The original
onboarding command surface remains available on its existing guarded route;
the `/setup` editor disables those commands in both presentation and handler.

`XEROWA_FIRST_RUN_ENABLED=1` is default-off. Setup also requires the existing
foundation flag, selected-business allowlist and business guard. A genuine edit
requires an active owner membership in the selected business. Platform role or
authentication alone does not grant editing. Operators/viewers inspect only.
Missing selected membership returns `/guard`. Existing users can always continue
to Control; setup is a secondary destination, never a forced redirect.

The authenticated reader uses the existing approved non-production origin/schema
gate and user-scoped client. It reads only existing businesses, configuration
versions, approvals, published pointer and channels, at most 51 rows per source.
More than 50 fails closed instead of presenting an incomplete set as complete.
Foreign business/child/hash references fail closed. Expired, revoked or future
approvals are not current approval. Browser-held observations age to stale after
five minutes, hiding authority claims until refresh. RLS and explicit Data API
grants remain distinct and unchanged. No service client or user_metadata predicate
was added. Existing session code's service-client fallback and legacy platform-role
metadata behavior remain deferred authentication risks; this UI is no security
certification. The loader requires actual active membership even for platform roles.

Local proposal completeness and acknowledgement do not imply a hash-bound owner
approval, staging publication, channel verification, consent or activation. Editing
invalidates local review and any command hash state. A local proposal with changed
configuration cannot inherit the server version's approval/publication labels.

The enquiry input is transient memory, bounded to 400 characters and rejects
common contact-like text. This is a convenience guard, not a complete PII detector.
The test is visibly Synthetic and scripted; no LLM/provider request, contact,
conversation, job or send is created. A result is bound to the exact configuration
and discarded when input/configuration changes or the page reloads.

Synthetic readiness teaching fixtures additionally require the non-production
auth-bypass parser, explicit Synthetic-first-run flag and protected design-lab
flag. Query parameters cannot enable them. Genuine evidence never uses the fixture
footer; fixture evidence never claims to be a Supabase observation.

Rollback: disable `XEROWA_FIRST_RUN_ENABLED`; old login/pending-access presentation,
dashboard entry and shell behavior return, and `/setup` is hidden. No migration,
record or cleanup command is required. Saved Phase 2 drafts remain in the same
adapter and are not discarded by rollback.

References: [SELECT client](https://supabase.com/docs/reference/javascript/select),
[password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword),
[Data API security](https://supabase.com/docs/guides/api/securing-your-api).
G-DISCOVERY/G-WEDGE NOT PASSED. Security/pilot NO-GO. Genuine signed-in acceptance
of this new readiness projection is not established by local Synthetic tests.
