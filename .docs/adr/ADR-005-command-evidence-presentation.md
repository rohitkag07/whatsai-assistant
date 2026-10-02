# ADR-005 — Command evidence presentation

2 October 2026. Local Phase 4C presentation; platform evidence adapter deferred.

Existing Command OS aggregates service-client reads and can collapse unavailable
counts into healthy/zero. Phase 4A/B Control authority is a different business-scoped
contract. Sharing the visual surface must not silently merge these authorities.

Use a typed, bounded presentation snapshot for six Command views. The authorized
server entry either provides explicitly Synthetic non-production lab fixtures or
an unavailable snapshot. It makes no service-client reads, health probes, mutations
or second approval store. Existing admin/dev server guards and foundation flags are
required. Query parameters cannot enable a source or permission.

The presentation projection rejects foreign parents/children and mismatched linked
approvals, but is not a replacement for authorization/RLS. Missing source, receipt,
timing, queue, version and health observations remain unknown. Configuration is
distinct from reachability. Simulated action history is always labelled Synthetic.
Changed, expired, revoked, denied and executed states are inspectable without any
execution control. No customer/production readiness is implied.

Rollback: turn off XEROWA_COMMAND_ENABLED. Legacy page exports and shell reads return;
no data/schema reversal is needed. Existing operational semantics remain unchanged.

Future adapter approval must specify approved origin, user-scoped membership/role
authority, platform versus business permissions, source tables, explicit grants and
RLS, freshness/caps, foreign-child rejection and provider reconciliation. Reuse the
Phase 4B immutable receipts and version approval contract when legitimately scoped;
do not duplicate stores. No SQL or permission change is included in this ADR.
