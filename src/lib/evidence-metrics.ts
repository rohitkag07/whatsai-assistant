import { unstable_noStore as noStore } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildClientOneMetrics,
  emptyMetrics,
  type ClientOneMetrics,
  type EvidenceLeadRecord,
  type EvidenceMessageRecord,
  type EvidencePeriod,
  type EvidenceWebhookRecord,
  type PeriodMetric,
} from '@/lib/evidence-calculator';
import { createClient } from '@/lib/supabase/server';

const PERIOD_DAYS = 30;
const PROCESSING_LATENCY_TARGET_MS = 3_000;
const DELIVERY_RATE_TARGET_PERCENT = 99;

export type { PeriodMetric };

interface EvidenceDatabase {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          legacy_builder_id: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      messages: {
        Row: {
          direction: EvidenceMessageRecord['direction'];
          status: EvidenceMessageRecord['status'];
          received_at: string | null;
          processed_at: string | null;
          created_at: string;
          tenant_id: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      leads: {
        Row: {
          lead_stage: string;
          created_at: string;
          tenant_id: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      webhook_events: {
        Row: {
          processing_ms: number | null;
          received_at: string;
          tenant_id: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      conversation_messages: {
        Row: {
          direction: EvidenceMessageRecord['direction'];
          status: EvidenceMessageRecord['status'];
          created_at: string;
          builder_id: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface ClientOneEvidence {
  readonly status: 'ready' | 'auth_required' | 'unavailable';
  readonly generatedAt: string;
  readonly period: EvidencePeriod;
  readonly metrics: ClientOneMetrics;
  readonly targets: Readonly<{
    processingLatencyMs: number;
    deliveryRatePercent: number;
  }>;
  readonly messageSource:
    | 'tenant_messages'
    | 'legacy_conversation_messages'
    | 'none';
  readonly errors: readonly string[];
}

function targets(): ClientOneEvidence['targets'] {
  return Object.freeze({
    processingLatencyMs: PROCESSING_LATENCY_TARGET_MS,
    deliveryRatePercent: DELIVERY_RATE_TARGET_PERCENT,
  });
}

export async function loadClientOneEvidence(): Promise<ClientOneEvidence> {
  noStore();
  const generatedAt = new Date();
  const currentStart = new Date(
    generatedAt.getTime() - PERIOD_DAYS * 86_400_000,
  );
  const previousStart = new Date(
    currentStart.getTime() - PERIOD_DAYS * 86_400_000,
  );
  const defaultPeriod = Object.freeze({
    currentStart: currentStart.toISOString(),
    previousStart: previousStart.toISOString(),
    currentEnd: generatedAt.toISOString(),
  });

  try {
    const clientOneTenantId = process.env.XEROWA_CLIENT_1_TENANT_ID;
    if (!clientOneTenantId) {
      return Object.freeze({
        status: 'unavailable',
        generatedAt: generatedAt.toISOString(),
        period: defaultPeriod,
        metrics: emptyMetrics(),
        targets: targets(),
        messageSource: 'none',
        errors: Object.freeze([
          'XEROWA_CLIENT_1_TENANT_ID is not configured on the server.',
        ]),
      });
    }

    const client = (await createClient()) as unknown as
      SupabaseClient<EvidenceDatabase>;
    const userResult = await client.auth.getUser();
    if (userResult.error || !userResult.data.user) {
      return Object.freeze({
        status: 'auth_required',
        generatedAt: generatedAt.toISOString(),
        period: defaultPeriod,
        metrics: emptyMetrics(),
        targets: targets(),
        messageSource: 'none',
        errors: Object.freeze(['Sign in to load tenant-scoped evidence.']),
      });
    }

    const tenantResult = await client
      .from('tenants')
      .select('id,legacy_builder_id')
      .eq('id', clientOneTenantId)
      .maybeSingle();
    if (tenantResult.error || !tenantResult.data) {
      return Object.freeze({
        status: 'unavailable',
        generatedAt: generatedAt.toISOString(),
        period: defaultPeriod,
        metrics: emptyMetrics(),
        targets: targets(),
        messageSource: 'none',
        errors: Object.freeze([
          tenantResult.error?.message
            ?? 'The signed-in user cannot access the configured Client #1 tenant.',
        ]),
      });
    }

    const errors: string[] = [];
    const [tenantMessagesResult, leadsResult, webhooksResult] = await Promise.all([
      client
        .from('messages')
        .select('direction,status,received_at,processed_at,created_at')
        .eq('tenant_id', clientOneTenantId)
        .gte('created_at', previousStart.toISOString()),
      client
        .from('leads')
        .select('lead_stage,created_at')
        .eq('tenant_id', clientOneTenantId)
        .gte('created_at', previousStart.toISOString()),
      client
        .from('webhook_events')
        .select('processing_ms,received_at')
        .eq('tenant_id', clientOneTenantId)
        .gte('received_at', previousStart.toISOString()),
    ]);

    let messageSource: ClientOneEvidence['messageSource'] = 'tenant_messages';
    let messages: EvidenceMessageRecord[] = [];

    if (tenantMessagesResult.error) {
      const legacyBuilderId = tenantResult.data.legacy_builder_id;
      const legacyMessagesResult = legacyBuilderId
        ? await client
            .from('conversation_messages')
            .select('direction,status,created_at')
            .eq('builder_id', legacyBuilderId)
            .gte('created_at', previousStart.toISOString())
        : null;
      if (!legacyMessagesResult || legacyMessagesResult.error) {
        messageSource = 'none';
        errors.push(
          `Messages unavailable: ${
            legacyMessagesResult?.error.message
              ?? 'No legacy builder mapping exists for Client #1'
          }`,
        );
      } else {
        messageSource = 'legacy_conversation_messages';
        messages = (legacyMessagesResult.data ?? []).map((row) => ({
          direction: row.direction,
          status: row.status,
          receivedAt: null,
          processedAt: null,
          createdAt: row.created_at,
        }));
        errors.push('Processing timestamps unavailable on legacy message records.');
      }
    } else {
      messages = (tenantMessagesResult.data ?? []).map((row) => ({
        direction: row.direction,
        status: row.status,
        receivedAt: row.received_at,
        processedAt: row.processed_at,
        createdAt: row.created_at,
      }));
    }

    const leads: EvidenceLeadRecord[] = leadsResult.error
      ? []
      : (leadsResult.data ?? []).map((row) => ({
          stage: row.lead_stage,
          createdAt: row.created_at,
        }));
    if (leadsResult.error) {
      errors.push(`Lead metrics unavailable: ${leadsResult.error.message}`);
    }

    const webhooks: EvidenceWebhookRecord[] = webhooksResult.error
      ? []
      : (webhooksResult.data ?? []).map((row) => ({
          processingMs: row.processing_ms,
          receivedAt: row.received_at,
        }));
    if (webhooksResult.error) {
      errors.push(`Webhook latency unavailable: ${webhooksResult.error.message}`);
    }

    const calculated = buildClientOneMetrics(
      messages,
      leads,
      webhooks,
      generatedAt,
    );
    return Object.freeze({
      status: 'ready',
      generatedAt: generatedAt.toISOString(),
      period: calculated.period,
      metrics: calculated.metrics,
      targets: targets(),
      messageSource,
      errors: Object.freeze(errors),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown evidence query error';
    return Object.freeze({
      status: 'unavailable',
      generatedAt: generatedAt.toISOString(),
      period: defaultPeriod,
      metrics: emptyMetrics(),
      targets: targets(),
      messageSource: 'none',
      errors: Object.freeze([message]),
    });
  }
}
