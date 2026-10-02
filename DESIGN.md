# XeroWA — Precision Operations

Status: founder-directed pilot foundation, under explicit uncertainty. No market fit,
winning vertical, willingness to pay, ten active customers or outcome improvement has
been validated. This document is the shared product and interaction contract.

## One product, configurable work

Understand an inbound WhatsApp enquiry, qualify it, use approved business knowledge,
persist the lead, assign an accountable owner, execute an eligible follow-up, record
an appointment or next action, and reconcile the final outcome. Messages sent are
activity, not success. Unknown is a valid outcome.

Gym, clinic, real estate, product sales, coaching/college and general services are
future configuration templates over one tenant/workflow model. No vertical forks.
Clinic operational intake does not authorize diagnosis, treatment or sensitive-data
collection. Real pilot access, consent and measurements remain future work.

## Visual foundation

One semantic token source in `src/app/globals.css`, scoped by `data-foundation`.
Control is a light neutral workspace; Command uses dark neutral surfaces. The two
share geometry, spacing, type, interactions and state semantics. Existing page bodies
sit in an explicitly light compatibility surface until their approved migration.
No unscoped changes to legacy colours, geometry or motion while flags are off.

- UI: self-hosted Instrument Sans Variable; sparse Outfit display/numerical emphasis.
- Identifiers: JetBrains Mono Variable, tabular numbers.
- Mixed Hindi/English: bundled Noto Sans Devanagari, sensible wrapping and line-height.
- Body 14/21; metadata 12/18; section 20/28; title 30/36.
- Spacing: 4/8/12/16/24/32/48px. Radius: 6px control, 10px panel, 14px overlay.
- Sidebar 248px or 72px; top rail at least 56px. Content is fluid, max 1600px.
- Borders and alignment establish hierarchy. No decorative gradient or fake KPI card.
- Tokens describe canvas, surface, elevated, foreground, muted, border, focus,
  selection and meaningful states. Components must not introduce literal colours.

## State language and evidence

Verified/completed, active, waiting for customer, waiting for human, paused, failed,
permission-limited, disconnected and outcome unknown are distinct. Colour always
has a text/icon equivalent. Empty data is not disconnected data; a failed read is
not zero. A request is not a confirmed booking; a send is not a delivered message
or a verified business outcome. No synthetic record is merged into a live read.

Every fixture surface is persistently labelled **Synthetic**. The design lab makes
no network mutations. Metrics use an em dash and explanation when unmeasured.
Technical details stay in Command or progressive disclosure, not customer task copy.

## Interaction and accessibility

Use semantic landmarks, one primary page heading, visible focus, real labels and
keyboard-complete navigation. Drawers/palette trap focus, close on Escape and restore
focus. Touch targets are at least 44px. Text contrast: 4.5:1 normal / 3:1 large;
meaningful UI boundaries: 3:1. Status never depends on colour alone. Support 320px,
200% zoom, long workspace names and mixed-script content without clipped actions.
Motion: 80–120ms feedback and 160–220ms panels. Transform/opacity only; no perpetual
health pulse. Reduced motion removes nonessential transitions. Loading reserves
space. Screen reader feedback describes state changes without excessive alerts.

## Rollout and rollback

Server-resolved flags default off. Control requires an explicit allowed tenant;
Command requires an existing admin/dev role. Flags never grant permissions. The lab
requires the existing server admin/dev guard and its own flag. Query strings cannot
enable rollout. Legacy APIs and mutation behavior remain unchanged.

Turn flags off to restore the preserved shell without schema/data rollback. This
is a UI foundation, not a security remediation or permission to activate pilots.

## Acceptance and open assumptions

Type-check, lint, targeted behavior tests, protected-route tests, Chromium/WebKit
screenshots, keyboard/responsive/contrast checks and flag-off comparisons accompany
this slice. Fixture-render tests do not prove production RLS or live readiness.
The baseline, commands, exact file list and screenshots live in the external Phase 1
verification packet. Revisit workflow fit, success definitions, language needs,
accessibility with actual operators and technical release blockers before pilots.

## Command inspection — Phase 4C

Overview, Runs, Agents, Approvals, Businesses and System share the dark foundation.
Global mode remains Read-only and critical-incident verification remains visible on
every enabled Command route. An incident leads to business scope, run, policy,
linked approval, receipt availability and recovery context. Raw identifiers stay
in collapsed disclosure; hidden reasoning and secret payloads are never displayed.

`XEROWA_COMMAND_ENABLED=1` requires the existing Command foundation and admin/dev
authority. With it off, legacy route readers and shell remain intact. A separately
guarded non-production Synthetic source requires the design-lab and Synthetic flags.
Fixtures cannot be enabled through query strings and never blend with genuine reads.
Platform evidence has no approved adapter in this slice; the real-source view is
explicitly unavailable. Repository configuration is not measured service health.

Approval inspection performs no mutation. Changed payloads, expiry, revocation and
denial stay visible; even a pending decision has no executable control here.
Phase 4B remains the sole Control command/configuration/receipt authority. A future
platform adapter needs explicit scope, actor, freshness and relationship validation;
new schema/RLS or mutation authority requires separate approval.
