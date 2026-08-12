# XeroWA AI production release evidence — 13 August 2026

Verification window: 13 August 2026, after the PR #6 merge at 03:48 IST
Release owner: AVIRO TECHNOLOGIES PRIVATE LIMITED

## GitHub release

- Repository: `https://github.com/rohitkag07/whatsai-assistant`
- Pull request: `https://github.com/rohitkag07/whatsai-assistant/pull/6`
- Merge method: controlled squash merge
- Merge SHA: `5bac793f5922940ea7cb52e55dd0162074a525ab`
- GitHub merge time: 13 August 2026, 03:48:04 IST
- Source branch: `codex/pilot-validation-launch`

The GitHub CLI reported a local cleanup error because `main` was already checked out in the preserved canonical worktree. GitHub's authoritative PR state confirmed the PR was merged and identified the SHA above. The canonical worktree was not switched, reset or cleaned.

## Vercel production mapping

| Project | Root directory | Deployment ID | Immutable deployment | Production aliases | State / Git SHA |
|---|---|---|---|---|---|
| `landing` | `apps/landing` | `dpl_CZfspoT9yH2KUfw3P9er9aBf1w3k` | `landing-cqsucfjfr-rohits-projects-4e5e1c9f.vercel.app` | `landing-iota-lemon.vercel.app`; `landing-rohits-projects-4e5e1c9f.vercel.app`; `landing-git-main-rohits-projects-4e5e1c9f.vercel.app` | READY / `5bac793f5922940ea7cb52e55dd0162074a525ab` |
| `x7-whatsai-dashboard` | repository root | `dpl_6kJ56WbuVLsGB9wpgxFCgk8fPo9M` | `x7-whatsai-dashboard-4517k8l4m-rohits-projects-4e5e1c9f.vercel.app` | `x7-whatsai-dashboard.vercel.app`; `x7-whatsai-dashboard-rohits-projects-4e5e1c9f.vercel.app`; `x7-whatsai-dashboard-git-main-rohits-projects-4e5e1c9f.vercel.app` | READY / `5bac793f5922940ea7cb52e55dd0162074a525ab` |

The historical Vercel project name `x7-whatsai-dashboard` is hosting configuration for XeroWA. It is not the standalone X7 RealEstate repository.

## Live verification

- Landing routes `/`, `/innovation`, `/evidence`, `/pilot`, `/grant-readiness`, `/privacy`, `/terms`, `/robots.txt` and `/sitemap.xml`: HTTP 200.
- Unauthenticated dashboard `/dashboard`: HTTP 307 to `/login?next=%2Fdashboard`.
- Dashboard `/api/ping`: HTTP 200.
- Dashboard `/api/health/whatsapp`: HTTP 200; public response contains no WhatsApp display number or provider ID.
- Public `/evidence` contains the deployed short SHA `5bac793f5922`.
- PR validation: 52 tests passed, 2 skipped; type-check, lint, required pilot files 12/12, KPIs 7/7, security controls 14/14, frozen wording and secret-pattern scan passed.
- No secret values were copied, committed or printed.

## Release boundary

- Standalone X7 RealEstate was not modified.
- The generic XeroWA `real_estate` tenant playbook remains in scope.
- Uncommitted Command OS work in the canonical XeroWA worktree was preserved and excluded from PR #6.
- This release proves source deployment and public/runtime smoke health. It does not prove live two-tenant denial, real pilot outcomes, legal eligibility, DPIIT recognition or independent security assurance.

## Verdict

**69/100 — READY FOR PILOT VALIDATION**
