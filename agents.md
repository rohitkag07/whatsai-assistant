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
