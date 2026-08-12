# Secret Rotation Audit

**Audit date:** 2026-08-13

**Handling:** Names and status only; secret values are intentionally excluded.

## Repository exposure checks

| Check | Result |
|---|---|
| Tracked current files: common Supabase, Stripe, Meta, Google API, and private-key value patterns | No matching value found |
| Git history: same high-confidence value patterns, filenames/commit IDs only | No matching commit found |
| Tracked environment files | Example files only |
| Runtime secret values included in this report | No |

## Runtime inventory and rotation status

| Secret class | Expected storage | Last rotated | Status |
|---|---|---|---|
| Supabase service role | Vercel/agent server environment | Not independently verified | ACTION REQUIRED |
| Supabase anon/publishable key | Vercel public environment | Not independently verified | ACTION REQUIRED |
| Meta app secret | Vercel webhook environment | Not independently verified | ACTION REQUIRED |
| WhatsApp access token | Vercel/agent server environment | Not independently verified | ACTION REQUIRED |
| WhatsApp verify token | Vercel webhook environment | Not independently verified | ACTION REQUIRED |
| Agent shared secret | Vercel + Cloud Run agent environments | Not independently verified | ACTION REQUIRED |
| Cron secret | Vercel + Supabase Vault | Not independently verified | ACTION REQUIRED |

## Required close-out evidence

For each secret class, record the provider/dashboard rotation timestamp, responsible owner, affected deployments, rollback method, and post-rotation health check. Never paste the secret value into GitHub, PR comments, or this document.

This audit verifies repository hygiene only. It does not prove that provider credentials were recently rotated.
