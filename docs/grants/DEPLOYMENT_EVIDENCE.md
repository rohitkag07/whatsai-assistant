# XeroWA AI deployment evidence

Verified on: 13 August 2026 (Asia/Kolkata)  
Delivery type: protected Vercel preview; no production release

## Source release

- Repository: `https://github.com/rohitkag07/whatsai-assistant`
- Branch: `codex/grant-readiness-xerowa`
- Pull request: `https://github.com/rohitkag07/whatsai-assistant/pull/5`
- Application-artifact commit: `19e9a47cb73f1724315377e01bd6c1e4f382ce93` (the later PR commits update deployment documentation only)
- Base SHA: `a9057ac327f8dc953b9c1020653a97c63fab6e51`
- Review state: draft; not merged

## Vercel project mapping

| Project | Root directory | Preview URL | GitHub deployment status |
|---|---|---|---|
| `landing` | `apps/landing` | `https://landing-git-codex-grant-readine-6601a4-rohits-projects-4e5e1c9f.vercel.app` | Passed |
| `x7-whatsai-dashboard` | repository root | `https://x7-whatsai-dashboard-git-codex-cef49b-rohits-projects-4e5e1c9f.vercel.app` | Passed |

The historical Vercel project name `x7-whatsai-dashboard` is hosting configuration only. The source repository and this branch are XeroWA; standalone X7 RealEstate remains a separate repository.

## Verification results

- Vercel deployment checks passed for both projects.
- Public preview requests return a Vercel authentication redirect because deployment protection is enabled.
- An unauthenticated external browser therefore cannot validate product HTML or runtime behavior on the preview.
- The same landing artifact was verified locally in production mode: all nine requested public/static routes returned HTTP 200, discovered internal links returned HTTP 200, and desktop/mobile/evidence browser runs reported zero product console errors.
- Root and landing production builds passed at this branch head.

## Release decision

**NO PRODUCTION RELEASE.** This is preview/review evidence only. Production merge and deployment remain blocked by the legal/company document gate, signed pilot evidence, secure live tenant-isolation proof and security review described in `GRANT_READINESS.md`.
