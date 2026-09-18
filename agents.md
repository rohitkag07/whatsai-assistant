# WhatsAI Assistant - Agent Guide

## Agent Contract Rules

- every agent is an independent Node/Express service
- all inter-agent traffic uses `x-agent-secret`
- health surface should include `GET /health`
- dependencies surface should include `GET /health/dependencies`
- domain mutations should be explicit and narrow

## Current Local Ports

- sales / assistant compatibility service `8080`
- tool-gateway `8081`
- summoner `8082`

These are the only supported local agent services. Product-specific services
must not be reintroduced into this repo.

## Summoner Rules

Summoner is responsible for:

- WhatsApp ingress
- business context resolution
- assistant playbook selection
- intent routing
- queue orchestration
- cron fan-out

## Pivot Rule

Do not expose agent names to SMB customers. Customer-facing language is WhatsApp receptionist, lead qualifier, follow-up assistant, appointment booking, and owner handoff.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
