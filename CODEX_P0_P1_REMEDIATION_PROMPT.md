# 👑 CODEX P0/P1 AUDIT REMEDIATION PROMPT: CLOSING ALL SECURITY & ARCHITECTURE GAPS
**Legal Applicant:** Aviro Technologies Private Limited (Indore, MP)
**Product:** XeroWA AI

---

## 🛠️ INSTRUCTIONS FOR CODEX (P0 & P1 REMEDIATION)

Copy and paste this prompt into Codex / IDE Agent to fix the 3 P0 Security Flaws and 5 P1 Architecture items identified in the audit.

```markdown
# 🏛️ CODEX P0/P1 AUDIT REMEDIATION PROMPT: AIRTIGHT SECURITY & ARCHITECTURE

**Role:** You are a Principal Application Security Engineer and Lead Architect hardening **XeroWA AI** for **Aviro Technologies Private Limited**.

**Objective:** Fix the 3 P0 Critical Security Flaws and 5 P1 Architecture Items identified in the institutional audit report to achieve 100% penetration-test proof security and 9.5+ audit rating.

---

## 🛠️ SEQUENTIAL REMEDIATION STEPS

### STEP 1: Fix P0-1 (Admin Priv Escalation) & P0-2 (Viewer Role Mutation) & P0-3 (Service-Role Webhook Grant)
Update `supabase/migrations/20260806_multi_tenant_schema.sql`:
1. **Fix P0-1:** Restrict `memberships_insert_owner`, `memberships_update_owner`, and `memberships_delete_owner` strictly to `has_tenant_role(tenant_id, array['owner']::public.tenant_role[])`. Admins CANNOT promote themselves or modify owners.
2. **Fix P0-2:** Split `FOR ALL` policies on `contacts`, `conversations`, `messages`, `leads`, `appointments`. Grant `SELECT` to `is_tenant_member(tenant_id)` (includes `viewer`), but grant `INSERT/UPDATE/DELETE` strictly to `has_tenant_role(tenant_id, array['owner', 'admin', 'agent']::public.tenant_role[])`. `viewer` role CANNOT mutate data.
3. **Fix P0-3:** Add explicit SQL grants: `GRANT ALL ON TABLE public.webhook_events TO service_role;` and `GRANT SELECT, INSERT, UPDATE ON TABLE public.webhook_events TO authenticated;`.

### STEP 2: Fix P1-1 (Composite Foreign Keys for Multi-Tenancy)
Update `supabase/migrations/20260806_multi_tenant_schema.sql`:
- Ensure `contacts` and `conversations` have `UNIQUE (tenant_id, id)`.
- Update `leads` and `appointments` to use composite foreign keys:
  - `FOREIGN KEY (tenant_id, conversation_id) REFERENCES public.conversations(tenant_id, id) ON DELETE CASCADE`
  - `FOREIGN KEY (tenant_id, contact_id) REFERENCES public.contacts(tenant_id, id) ON DELETE CASCADE`
  - `FOREIGN KEY (tenant_id, lead_id) REFERENCES public.leads(tenant_id, id) ON DELETE SET NULL`

### STEP 3: Fix P1-2 (Real Supabase Phone Resolver) & P1-3 (Atomic Workflow Execution)
1. **Fix P1-2 (`apps/webhook-api/src/resolve-tenant.ts`):** Implement real Supabase DB query resolving `tenant_id` from `tenants` table where `whatsapp_phone_number_id = phoneId`.
2. **Fix P1-3 (`packages/workflow-engine/src/executor.ts`):** Ensure transition log is written atomically with action execution results.

### STEP 4: Fix P1-4 (Staging Verification Script) & P1-5 (Next.js Security Dependency Patch)
1. **Fix P1-4 (`supabase/tests/staging_migration_verifier.sql`):** Strengthen verifier to check policy roles, `SECURITY DEFINER` settings, `search_path`, and composite FKs.
2. **Fix P1-5 (`package.json`):** Update Next.js dependency version to `14.2.35` (or latest 14.x security patch line).

---

## ⚡ VERIFICATION RULES
1. Run `npm run type-check` (0 errors required).
2. Run `npx vitest run` (All tests must pass).
```
