# ADR-001: Reversible pilot foundation and compatibility

Status: implemented within Rohit's approved Phase 1 scope, 19 September 2026.

## Context

Rohit authorized a founder-directed ten-business pilot build before market gates.
These gates remain unpassed. The preserved baseline includes unvalidated user work.
Control and Command currently share a shell but not a coherent visual language.
Shell readers collapse errors to empty lists/zero and obscure missing evidence.

## Decision

Use one semantic design system with scoped light/dark themes and one responsive
shell. Keep the prior shell as the default-off fallback. Resolve rollout on the
server, using explicit tenant allowlisting and the existing platform roles. A flag
never changes authorization or makes a new tenant accessible.

Add typed presentation read results to existing shell loaders while keeping legacy
exports. Retain existing tables, tenant predicates and switch endpoint. An error
or unavailable source maps to unknown, never a successful empty business queue.
No schema, sender, workflow authority, role resolution or production config changes.

The design lab is server-guarded and separately flag-gated. Deterministic Synthetic
fixtures are isolated from real read models and mutation APIs. Local dev-bypass
screenshots are rendering evidence only; authorization checks run without that bypass.

## Compatibility and rollback

Flag-off keeps the preserved legacy shell/styles. New colour aliases apply only
inside the foundation scope. Legacy route bodies have a light compatibility surface
inside Command until their own migration phase. All permitted routes remain reachable.
Disable flags to roll back without data writes, schema reversal or a second source
of business truth. Keep the baseline ref separate from Phase 1 commits.

## Consequences and deferred work

Some page bodies retain legacy layout. The source still contains existing backend
and security limitations; visual polish must not hide them or upgrade live readiness.
Onboarding and six configurable templates, full Control/Command workflows, pilot
measurement and external integrations belong to later phases. A new backend/schema
need requires a separate ADR and approval; migration execution requires separate approval.
