# CLAUDE.md - WhatsAI Assistant

## Current Mission

This repo is XeroWA: a WhatsApp-first receptionist, lead qualifier, follow-up,
appointment, and owner handoff platform for Indian SMBs.

Do not add product-specific runtime services, routes, society modules, branding,
or source code here. Industry behavior belongs in tenant playbooks.

## Read Order

1. `README.md`
2. `project_overview.md`
3. `.docs/ghost-ai/CURRENT_SYSTEM_MAP.md`
4. `.docs/ghost-ai/NEXT_BUILD_PLAN.md`
5. `.docs/ghost-ai/ENV_CONTRACT.md`
6. `.docs/ghost-ai/PRODUCTION_READINESS.md`

## Architecture Rules

- Summoner-first routing is preferred.
- WhatsApp is the primary customer channel.
- Supabase is the system of record.
- Tool Gateway owns external side effects.
- Generic business, playbook, conversation, contact, lead, appointment, and
  handoff concepts are the supported product model.
- Preserve `real_estate` as a tenant category with tenant-scoped property inquiry,
  qualification, site-visit appointment, reminder, and owner-handoff behavior.
- Never couple the real-estate tenant playbook to standalone property-management,
  colony, resident, maintenance, or property-content services.
- Legacy database columns may remain temporarily for migration compatibility,
  but new runtime code must not depend on product-specific tables.

## Product Rules

- Do not sell or expose multi-agent complexity to SMB customers.
- Use customer-facing language: WhatsApp receptionist, instant reply, missed lead recovery, appointment booking, follow-up, owner summary.
- First MVP goal is 10 local business trials, not a complete self-serve SaaS.

## Deploy Configuration (configured by /setup-deploy)

- Platform: Vercel
- Production URL: https://x7-whatsai-dashboard.vercel.app
- Deploy workflow: automatic preview on branch push; production only after explicit approval
- Deploy status command: `vercel inspect https://x7-whatsai-dashboard.vercel.app`
- Merge method: squash
- Project type: Next.js web app and API
- Post-deploy health check: https://x7-whatsai-dashboard.vercel.app/login

### Custom deploy hooks

- Pre-merge: `npm run type-check && npm run lint -- --max-warnings=0 && npm test && npm run build`
- Deploy trigger: branch push creates preview; approved merge to `main` creates production deployment
- Deploy status: inspect the target deployment in Vercel and wait for `Ready`
- Health check: confirm `/login` returns 200 and unauthenticated `/dashboard` redirects to `/login`
