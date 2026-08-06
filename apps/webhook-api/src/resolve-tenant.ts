import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

export type XeroWATenantRole = 'owner' | 'admin' | 'agent' | 'viewer';

export interface WebhookRoutingDatabase {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          whatsapp_phone_number_id: string | null;
        };
        Insert: {
          id?: string;
          whatsapp_phone_number_id?: string | null;
        };
        Update: {
          id?: string;
          whatsapp_phone_number_id?: string | null;
        };
        Relationships: [];
      };
      tenant_memberships: {
        Row: {
          tenant_id: string;
          user_id: string;
          role: XeroWATenantRole;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          user_id: string;
          role?: XeroWATenantRole;
          created_at?: string;
        };
        Update: {
          tenant_id?: string;
          user_id?: string;
          role?: XeroWATenantRole;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      xerowa_tenant_role: XeroWATenantRole;
    };
    CompositeTypes: Record<string, never>;
  };
}

export interface WebhookTenantRoute {
  readonly tenantId: string;
  readonly ownerId: string;
  readonly phoneNumberId: string;
}

export interface RlsTenantDirectory {
  findAccessibleTenantByPhoneNumberId(
    phoneNumberId: string,
  ): Promise<WebhookTenantRoute | null>;
}

export class WebhookTenantNotFoundError extends Error {
  readonly phoneNumberId: string;

  constructor(phoneNumberId: string) {
    super('No RLS-accessible tenant route exists for the Meta phone number');
    this.name = 'WebhookTenantNotFoundError';
    this.phoneNumberId = phoneNumberId;
  }
}

export class WebhookTenantLookupError extends Error {
  readonly operation: 'tenant_lookup' | 'owner_lookup';
  readonly databaseCode: string;

  constructor(
    operation: 'tenant_lookup' | 'owner_lookup',
    error: PostgrestError,
  ) {
    super(`Supabase ${operation} failed: ${error.message}`, { cause: error });
    this.name = 'WebhookTenantLookupError';
    this.operation = operation;
    this.databaseCode = error.code;
  }
}

/**
 * Real Supabase-backed phone resolver. With an authenticated client, RLS limits
 * the result to accessible tenants. A server-side service-role client may
 * resolve every tenant, but the query still uses the exact phone-number
 * predicate and must never be exposed to a browser.
 */
export class SupabaseTenantDirectory implements RlsTenantDirectory {
  constructor(
    private readonly client: SupabaseClient<WebhookRoutingDatabase>,
  ) {}

  async findAccessibleTenantByPhoneNumberId(
    phoneNumberId: string,
  ): Promise<WebhookTenantRoute | null> {
    const tenantResult = await this.client
      .from('tenants')
      .select('id, whatsapp_phone_number_id')
      .eq('whatsapp_phone_number_id', phoneNumberId)
      .maybeSingle();

    if (tenantResult.error) {
      throw new WebhookTenantLookupError(
        'tenant_lookup',
        tenantResult.error,
      );
    }
    if (!tenantResult.data) {
      return null;
    }

    const ownerResult = await this.client
      .from('tenant_memberships')
      .select('user_id')
      .eq('tenant_id', tenantResult.data.id)
      .eq('role', 'owner')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (ownerResult.error) {
      throw new WebhookTenantLookupError('owner_lookup', ownerResult.error);
    }
    if (!ownerResult.data) {
      return null;
    }

    return Object.freeze({
      tenantId: tenantResult.data.id,
      ownerId: ownerResult.data.user_id,
      phoneNumberId:
        tenantResult.data.whatsapp_phone_number_id ?? phoneNumberId,
    });
  }
}

export async function resolveWebhookTenant(
  directory: RlsTenantDirectory,
  phoneNumberId: string,
): Promise<WebhookTenantRoute> {
  const normalizedPhoneNumberId = phoneNumberId.trim();
  if (normalizedPhoneNumberId.length === 0) {
    throw new Error('phoneNumberId is required');
  }

  const route = await directory.findAccessibleTenantByPhoneNumberId(
    normalizedPhoneNumberId,
  );
  if (!route || route.phoneNumberId !== normalizedPhoneNumberId) {
    throw new WebhookTenantNotFoundError(normalizedPhoneNumberId);
  }

  return Object.freeze({ ...route });
}
