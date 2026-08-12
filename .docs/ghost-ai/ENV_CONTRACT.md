# WhatsAI Assistant Env Contract

This file is the source of truth for runtime environment variables required for the current WhatsAI lead-to-appointment MVP.

XeroWA uses only the `xerowa-*` service names. Product-specific service names
and runtime defaults are not part of this repository.

## Shared Rules

- `AGENT_SECRET` must be identical across dashboard server routes, Summoner, sales-agent, and tool-gateway.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required for write-capable backend flows.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are client-safe dashboard values.
- Local defaults are acceptable for development, but production must use explicit values.
- Prefer Summoner as the public ingress for WhatsApp webhooks and agent fan-out.
- New WhatsAI work should resolve business context before falling back to old `DEFAULT_BUILDER_ID` / `DEFAULT_PROJECT_ID` values.
- Content, colony, finance, advanced Meta Ads, and OpenAI content generation are
  outside the current XeroWA runtime and are not MVP launch blockers.

## Pivot Compatibility Values

Use these for the generic WhatsAI layer when implemented:

- `DEFAULT_BUSINESS_ID`
- `DEFAULT_ASSISTANT_PLAYBOOK_ID`
- `DEFAULT_VERTICAL` such as `real_estate`, `clinic`, `coaching`, `fitness`, `local_service`
- `OWNER_HANDOFF_PHONE`
- `TRIAL_MODE_ENABLED`
- `DAILY_SUMMARY_TIMEZONE` default `Asia/Kolkata`

Compatibility variables should be removed only with a reviewed database migration.

## Dashboard

File: `.env.local` at the repository root

Required core values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AGENT_SECRET`
- `NEXT_PUBLIC_SITE_URL`

Agent URLs:

- `SUMMONER_URL`
- `NEXT_PUBLIC_SUMMONER_URL`
- `SALES_AGENT_URL`
- `TOOL_GATEWAY_URL`

WhatsApp:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_GRAPH_VERSION`
- `META_APP_SECRET`

Default context:

- `DEFAULT_BUILDER_ID`
- `DEFAULT_PROJECT_ID`
- `DEFAULT_BUSINESS_ID`
- `DEFAULT_ASSISTANT_PLAYBOOK_ID`
- `DEFAULT_VERTICAL`
- `OWNER_HANDOFF_PHONE`
- `TRIAL_MODE_ENABLED`

Deferred optional integrations:

- `OPENAI_API_KEY`
- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`

## Summoner

File: `agents/xerowa-summoner/.env`

Required:

- `PORT` default `8082`
- `AGENT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Routing and default context:

- `DEFAULT_BUILDER_ID`
- `DEFAULT_PROJECT_ID`
- `DEFAULT_BUSINESS_ID`
- `DEFAULT_ASSISTANT_PLAYBOOK_ID`
- `DEFAULT_VERTICAL`
- `SALES_AGENT_URL`
- `TOOL_GATEWAY_URL`

WhatsApp ingress:

- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_GRAPH_VERSION`
- `META_APP_SECRET`

## Sales / Assistant Agent

File: `agents/xerowa-sales-agent/.env`

This service remains named sales-agent for now, but it is the first candidate to become the generic assistant-agent.

Required:

- `PORT` default `8080`
- `AGENT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Sales, assistant, and WhatsApp:

- `DEFAULT_BUILDER_ID`
- `DEFAULT_PROJECT_ID`
- `DEFAULT_BUSINESS_ID`
- `DEFAULT_ASSISTANT_PLAYBOOK_ID`
- `DEFAULT_VERTICAL`
- `OWNER_HANDOFF_PHONE`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_GRAPH_VERSION`
- `META_APP_SECRET`

Optional intelligence and proxy:

- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SUMMONER_URL`

## Tool Gateway

File: `agents/xerowa-tool-gateway/.env`

Required:

- `PORT` default `8081`
- `NODE_ENV`
- `AGENT_SECRET`

WhatsApp:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`

Optional generic social publishing integrations:

- `META_ACCESS_TOKEN`
- `META_IG_USER_ID`
- `META_FB_PAGE_ID`

## Local Port Map

| Service | Port |
| --- | --- |
| Dashboard | `3000` |
| Sales / Assistant Agent | `8080` |
| Tool Gateway | `8081` |
| Summoner | `8082` |

Only ports `8080`, `8081`, and `8082` belong to the current XeroWA runtime.

## Deployment Rule

Before any production rollout:

1. fill the env files or platform secrets from this contract
2. ensure Summoner, sales-agent, and tool-gateway URLs point to the correct deployed services
3. verify `AGENT_SECRET` matches everywhere
4. verify Supabase service credentials are present only in backend services
5. verify the default business/playbook context before enabling a trial business
6. run `npm run prove:whatsai`
