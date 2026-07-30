import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { BusinessContextError, requirePlatformApiSession } from '@/lib/whatsai-business';
import type { Database } from '@/types/database';
import {
  ADMIN_MODULES,
  type AdminModuleId,
  type AdminModuleState,
} from '@/lib/admin-modules';

type ServiceClient = SupabaseClient<Database>;

export { ADMIN_MODULES };
export type { AdminModuleId, AdminModuleState };

export const adminModuleSchema = z.object({
  business_id: z.string().uuid(),
  module_id: z.enum(['whatsapp', 'assistant', 'knowledge', 'calendar', 'handoffs', 'followups', 'broadcasts']),
  enabled: z.boolean(),
});

export const adminMemberCreateSchema = z.object({
  business_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  email: z.string().trim().email().optional(),
  display_name: z.string().trim().min(1).max(120),
  role: z.enum(['owner', 'manager', 'agent', 'client', 'admin', 'dev']).default('client'),
}).refine((value) => Boolean(value.user_id || value.email), {
  message: 'Provide an email address or user ID.',
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
