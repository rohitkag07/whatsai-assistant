import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { BusinessContextError, requirePlatformApiSession } from '@/lib/whatsai-business';
import type { Database } from '@/types/database';

type ServiceClient = SupabaseClient<Database>;

export type AdminModuleId =
  | 'whatsapp'
  | 'assistant'
  | 'knowledge'
  | 'calendar'
  | 'handoffs'
  | 'followups'
  | 'broadcasts';

export type AdminModuleState = {
  enabled: boolean;
  updated_at: string | null;
  updated_by: string | null;
};

export type AdminModuleDefinition = {
  id: AdminModuleId;
  label: string;
  description: string;
  contract: string;
  enforcement: 'runtime' | 'configuration_only';
  defaultEnabled: boolean;
};

export const ADMIN_MODULES: AdminModuleDefinition[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp channel',
    description: 'Inbound/outbound Meta WhatsApp routing for this business.',
    contract: 'business_channels.status',
    enforcement: 'runtime',
    defaultEnabled: true,
  },
  {
    id: 'assistant',
    label: 'AI replies',
    description: 'Active assistant playbooks and keyword replies.',
    contract: 'assistant_playbooks.is_active',
    enforcement: 'runtime',
    defaultEnabled: true,
  },
  {
    id: 'knowledge',
    label: 'Knowledge base',
    description: 'Owner-approved FAQs, policies, offers, and OKF-backed answers. Configuration only; runtime disablement is not enforced yet.',
    contract: 'not runtime-enforced; assistant_knowledge_items does not consume this module state',
    enforcement: 'configuration_only',
    defaultEnabled: true,
  },
  {
    id: 'calendar',
    label: 'Appointments',
    description: 'Booked callbacks, visits, and follow-up slots. Configuration only; runtime disablement is not enforced yet.',
    contract: 'not runtime-enforced; appointments does not consume this module state',
    enforcement: 'configuration_only',
    defaultEnabled: true,
  },
  {
    id: 'handoffs',
    label: 'Owner handoffs',
    description: 'Human takeover and urgent owner-action workflow. Configuration only; runtime disablement is not enforced yet.',
    contract: 'not runtime-enforced; handoff_events does not consume this module state',
    enforcement: 'configuration_only',
    defaultEnabled: true,
  },
  {
    id: 'followups',
    label: 'Follow-up sequence',
    description: 'Durable lead follow-up jobs for active conversations.',
    contract: 'followup_sequences.active',
    enforcement: 'runtime',
    defaultEnabled: true,
  },
  {
    id: 'broadcasts',
    label: 'Broadcasts',
    description: 'Template-based audience campaigns for approved contacts. Configuration only; runtime disablement is not enforced yet.',
    contract: 'not runtime-enforced; broadcast_campaigns does not consume this module state',
    enforcement: 'configuration_only',
    defaultEnabled: false,
  },
];

export const adminModuleSchema = z.object({
  business_id: z.string().uuid(),
  module_id: z.enum(['whatsapp', 'assistant', 'knowledge', 'calendar', 'handoffs', 'followups', 'broadcasts']),
  enabled: z.boolean(),
});

export const adminMemberCreateSchema = z.object({
  business_id: z.string().uuid(),
  user_id: z.string().uuid(),
  display_name: z.string().trim().min(1).max(120),
  role: z.enum(['owner', 'manager', 'agent', 'client', 'admin', 'dev']).default('client'),
});

export const adminMemberUpdateSchema = z.object({
  business_id: z.string().uuid(),
  member_id: z.string().uuid(),
  role: z.enum(['owner', 'manager', 'agent', 'client', 'admin', 'dev']).optional(),
  active: z.boolean().optional(),
});

export async function requireSelectedAdminBusiness(supabase: ServiceClient, businessId: string | null | undefined) {
  const session = await requirePlatformApiSession(['admin', 'dev']);
  if (!businessId) throw new BusinessContextError('selected_business_required', 400);

  const { data, error } = await (supabase.from('businesses') as any)
    .select('id,name,metadata')
    .eq('id', businessId)
    .maybeSingle();

  if (error) throw new BusinessContextError(error.message, 502);
  if (!data) throw new BusinessContextError('business_not_found', 404);

  return { session, business: data as { id: string; name: string; metadata: Record<string, unknown> | null }, businessId };
}

export function getAdminModuleStates(metadata: Record<string, unknown> | null | undefined) {
  const modulesMetadata = metadata?.xerowa_admin_modules;
  const raw: Record<string, unknown> = isRecord(modulesMetadata) ? modulesMetadata : {};

  return ADMIN_MODULES.reduce<Record<AdminModuleId, AdminModuleState>>((states, module) => {
    const storedModule = raw[module.id];
    const stored: Record<string, unknown> = isRecord(storedModule) ? storedModule : {};
    states[module.id] = {
      enabled: typeof stored.enabled === 'boolean' ? stored.enabled : module.defaultEnabled,
      updated_at: typeof stored.updated_at === 'string' ? stored.updated_at : null,
      updated_by: typeof stored.updated_by === 'string' ? stored.updated_by : null,
    };
    return states;
  }, {} as Record<AdminModuleId, AdminModuleState>);
}

export function buildUpdatedModuleMetadata({
  metadata,
  moduleId,
  enabled,
  actorId,
  updatedAt,
}: {
  metadata: Record<string, unknown> | null | undefined;
  moduleId: AdminModuleId;
  enabled: boolean;
  actorId: string;
  updatedAt: string;
}) {
  const base = isRecord(metadata) ? metadata : {};
  const existingModules = isRecord(base.xerowa_admin_modules) ? base.xerowa_admin_modules : {};

  return {
    ...base,
    xerowa_admin_modules: {
      ...existingModules,
      [moduleId]: {
        enabled,
        updated_at: updatedAt,
        updated_by: actorId,
      },
    },
  };
}

export function isRuntimeEnforcedAdminModule(moduleId: AdminModuleId) {
  return ADMIN_MODULES.some((module) => module.id === moduleId && module.enforcement === 'runtime');
}

export async function applyModuleContractSideEffects(
  supabase: ServiceClient,
  businessId: string,
  moduleId: AdminModuleId,
  enabled: boolean,
) {
  const now = new Date().toISOString();

  if (moduleId === 'whatsapp') {
    if (!enabled) {
      return (supabase.from('business_channels') as any)
        .update({ status: 'disabled', updated_at: now })
        .eq('business_id', businessId)
        .eq('channel_type', 'whatsapp');
    }

    return (supabase.from('business_channels') as any)
      .update({ status: 'testing', updated_at: now })
      .eq('business_id', businessId)
      .eq('channel_type', 'whatsapp')
      .eq('status', 'disabled');
  }

  if (moduleId === 'assistant') {
    return (supabase.from('assistant_playbooks') as any)
      .update({ is_active: enabled, updated_at: now })
      .eq('business_id', businessId);
  }

  if (moduleId === 'followups') {
    return (supabase.from('followup_sequences') as any)
      .update({ active: enabled, updated_at: now })
      .eq('business_id', businessId);
  }

  return { error: null };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
