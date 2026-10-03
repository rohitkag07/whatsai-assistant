import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const migration = read('supabase/migrations/20260812222528_pilot_authorization_hotfix.sql');

const mutationRoutes = [
  'src/app/api/appointments/[id]/route.ts',
  'src/app/api/chats/[threadId]/assign/route.ts',
  'src/app/api/leads/[id]/stage/route.ts',
  'src/app/api/sales/book-visit/route.ts',
  'src/app/api/sales/drip/route.ts',
  'src/app/api/sales/follow-up/route.ts',
  'src/app/api/sales/site-visits/feedback/route.ts',
  'src/app/api/whatsai/broadcasts/[id]/run/route.ts',
  'src/app/api/whatsai/broadcasts/route.ts',
  'src/app/api/whatsai/followup-sequence/route.ts',
  'src/app/api/whatsai/knowledge/route.ts',
  'src/app/api/whatsai/lead-flow/route.ts',
  'src/app/api/whatsai/media/route.ts',
  'src/app/api/whatsai/owner-summary/route.ts',
  'src/app/api/whatsai/reply/route.ts',
  'src/app/api/whatsai/templates/route.ts',
  'src/app/api/whatsai/templates/sync/route.ts',
  'src/app/api/whatsai/thread-state/route.ts',
];

describe('authorization hotfix source contracts', () => {
  it('uses hardened security-definer membership helpers', () => {
    expect(migration).toContain('private.is_business_member');
    expect(migration).toContain('private.has_business_role');
    expect(migration).toMatch(/security definer\s+set search_path = ''/i);
    expect(migration).toMatch(/revoke all on function private\.has_business_role[\s\S]*from public, anon/i);
  });

  it('keeps membership administration owner-only', () => {
    expect(migration).toMatch(
      /business_members_owner_insert[\s\S]*array\['owner'\]::text\[\]/,
    );
    expect(migration).toMatch(
      /business_members_owner_update[\s\S]*array\['owner'\]::text\[\]/,
    );
    expect(migration).toMatch(
      /business_members_owner_delete[\s\S]*array\['owner'\]::text\[\]/,
    );
    expect(migration).not.toMatch(/business_members_owner_(?:insert|update|delete)[\s\S]{0,300}'admin'/);
  });

  it('allows reads for active members and writes only for business operators', () => {
    expect(migration).toContain('for select to authenticated');
    expect(migration).toContain("array['owner','manager','agent','admin']::text[]");
    expect(migration).not.toContain("array['owner','manager','agent','client']");
    expect(migration).not.toContain("array['owner','manager','agent','admin','dev']");
  });

  it.each(mutationRoutes)('requires mutation authorization in %s', (route) => {
    expect(read(route)).toContain('requireDashboardBusinessMutationContext');
  });
});
