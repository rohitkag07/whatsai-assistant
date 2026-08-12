# XeroWA AI production release evidence — 13 August 2026

Verification window: 13 August 2026, 00:55–01:01 IST
Release owner: AVIRO TECHNOLOGIES PRIVATE LIMITED

## GitHub release

- Repository: `https://github.com/rohitkag07/whatsai-assistant`
- Pull request: `https://github.com/rohitkag07/whatsai-assistant/pull/5`
- Merge method: controlled squash merge
- Merge SHA: `7c28a3abf491cdbf35f0080266fca1b90bbb96dd`
- GitHub merge time: 13 August 2026, 00:55:48 IST
- Source branch: `codex/grant-readiness-xerowa` (remote branch removed after merge)

The GitHub CLI reported a local cleanup error because `main` was already checked out in the preserved canonical worktree. GitHub's authoritative PR state confirmed the PR was merged and identified the SHA above. The canonical worktree was not switched, reset or cleaned.

## Vercel production mapping

| Project | Root directory | Deployment ID | Immutable deployment | Production aliases | State / Git SHA |
|---|---|---|---|---|---|
| `landing` | `apps/landing` | `dpl_4t2kwNtSmtud5zwuajaXSCBoUa4n` | `landing-p9qen9d7s-rohits-projects-4e5e1c9f.vercel.app` | `landing-iota-lemon.vercel.app`; `landing-rohits-projects-4e5e1c9f.vercel.app`; `landing-git-main-rohits-projects-4e5e1c9f.vercel.app` | READY / `7c28a3abf491cdbf35f0080266fca1b90bbb96dd` |
| `x7-whatsai-dashboard` | repository root | `dpl_9pJfvvpmefre3Dxar1T4BHZ4jQWd` | `x7-whatsai-dashboard-mz8m8qdd0-rohits-projects-4e5e1c9f.vercel.app` | `x7-whatsai-dashboard.vercel.app`; `x7-whatsai-dashboard-rohits-projects-4e5e1c9f.vercel.app`; `x7-whatsai-dashboard-git-main-rohits-projects-4e5e1c9f.vercel.app` | READY / `7c28a3abf491cdbf35f0080266fca1b90bbb96dd` |

The historical Vercel project name `x7-whatsai-dashboard` is hosting configuration for XeroWA. It is not the standalone X7 RealEstate repository.

## Live verification

- Landing routes `/`, `/innovation`, `/evidence`, `/pilot`, `/grant-readiness`, `/privacy`, `/terms`, `/robots.txt` and `/sitemap.xml`: HTTP 200.
- Unauthenticated dashboard `/dashboard`: HTTP 307 to `/login?next=%2Fdashboard`.
- Dashboard `/api/ping`: HTTP 200.
- Dashboard `/api/health/whatsapp`: HTTP 200; public response contains no WhatsApp display number or provider ID.
- Production browser: title and content rendered; navigation duration 835 ms; zero console errors.
- Public `/evidence`: `Current deployment build` is `VERIFIED` and displays `production build · 7c28a3abf491`.
- `WHATSAI_APP_URL=https://x7-whatsai-dashboard.vercel.app` process-only proof with ignored canonical environment: 11/11 passed. No secret values were copied, committed or printed.

## Release boundary

- Standalone X7 RealEstate was not modified.
- The generic XeroWA `real_estate` tenant playbook remains in scope.
- Uncommitted Command OS work in the canonical XeroWA worktree was preserved and excluded from PR #5.
- This release proves source deployment and public/runtime smoke health. It does not prove live two-tenant denial, real pilot outcomes, legal eligibility, DPIIT recognition or independent security assurance.

## Verdict

**DEPLOYED AND VERIFIED — READY FOR PILOT VALIDATION.**
