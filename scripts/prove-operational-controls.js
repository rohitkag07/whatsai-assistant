#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(JSON.stringify({ ok: false, error: 'Supabase proof environment is incomplete.' }));
  process.exit(2);
}

const service = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const run = randomUUID().replaceAll('-', '');
const prefix = `operations-${run.slice(0, 16)}`;
const createdBusinessIds = [];
const passed = [];
const failed = [];

function assert(condition, control) {
  if (condition) passed.push(control);
  else failed.push(control);
}

async function createBusiness(label, phonePrefix) {
  const result = await service.from('businesses').insert({
    name: `Operations Proof ${label}`,
    phone: `+${phonePrefix}${run.slice(0, 10)}`,
    category: 'coaching',
    status: 'trial',
  }).select('id').single();
  if (result.error || !result.data) throw result.error ?? new Error('proof_business_missing');
  createdBusinessIds.push(result.data.id);
  return result.data.id;
}

async function proveRateLimit() {
  const keyHash = createHash('sha256').update(run).digest('hex');
  const params = {
    p_scope: `operations-proof-${prefix}`,
    p_key_hash: keyHash,
    p_limit: 1,
    p_window_seconds: 60,
  };
  const first = await service.rpc('consume_api_rate_limit', params);
  const second = await service.rpc('consume_api_rate_limit', params);
  if (first.error || second.error) throw first.error ?? second.error;
  assert(first.data?.[0]?.allowed === true, 'rate_limit_allows_within_budget');
  assert(second.data?.[0]?.allowed === false, 'rate_limit_denies_over_budget');
  assert(second.data?.[0]?.remaining === 0, 'rate_limit_remaining_reaches_zero');
}

async function proveWebhookReplay() {
  const businessId = await createBusiness('Replay', '91');
  const phoneNumberId = `${prefix}-phone`;
  const channel = await service.from('business_channels').insert({
    business_id: businessId,
    provider: 'meta_whatsapp',
    channel_id: phoneNumberId,
    phone_number_id: phoneNumberId,
    channel_type: 'whatsapp',
    is_active: true,
    is_primary: true,
  });
  if (channel.error) throw channel.error;

  const params = {
    p_phone_number_id: phoneNumberId,
    p_phone: `+92${run.slice(0, 10)}`,
    p_contact_name: 'Operations Replay Proof',
    p_provider_message_id: `${prefix}-message`,
    p_message_type: 'text',
    p_body: 'Synthetic operational replay proof',
    p_metadata: { synthetic_operations_proof: true },
  };
  const first = await service.rpc('ingest_whatsapp_inbound', params);
  const second = await service.rpc('ingest_whatsapp_inbound', params);
  if (first.error || second.error) throw first.error ?? second.error;
  assert(first.data?.duplicate === false, 'first_webhook_message_is_accepted_once');
  assert(second.data?.duplicate === true, 'replayed_webhook_is_marked_duplicate');
  assert(first.data?.message_id === second.data?.message_id, 'replay_reuses_original_message');
}

async function proveRetention() {
  const businessId = await createBusiness('Retention', '93');
  const contact = await service.from('conversation_contacts').insert({
    business_id: businessId,
    phone: `+94${run.slice(0, 10)}`,
    name: 'Synthetic Retention Proof',
  }).select('id').single();
  if (contact.error || !contact.data) throw contact.error ?? new Error('retention_contact_missing');

  const preview = await service.rpc('preview_business_retention_delete', {
    p_business_id: businessId,
  });
  if (preview.error) throw preview.error;
  assert(preview.data?.counts?.conversation_contacts === 1, 'retention_preview_counts_business_rows');
  assert(
    preview.data?.confirmation_required === `DELETE BUSINESS ${businessId}`,
    'retention_preview_binds_confirmation_to_business',
  );

  const wrongConfirmation = await service.rpc('execute_business_retention_delete', {
    p_business_id: businessId,
    p_confirmation: 'DELETE BUSINESS wrong-id',
    p_request_reference: `${prefix}-wrong-confirmation`,
  });
  assert(Boolean(wrongConfirmation.error), 'retention_rejects_wrong_confirmation');

  const executed = await service.rpc('execute_business_retention_delete', {
    p_business_id: businessId,
    p_confirmation: `DELETE BUSINESS ${businessId}`,
    p_request_reference: `${prefix}-synthetic-retention`,
  });
  if (executed.error) throw executed.error;
  const remainingBusiness = await service.from('businesses').select('id').eq('id', businessId);
  const remainingContact = await service.from('conversation_contacts').select('id').eq('id', contact.data.id);
  assert(
    executed.data?.deleted === true && Boolean(executed.data?.audit_id),
    'retention_returns_immutable_audit_reference',
  );
  assert(remainingBusiness.data?.length === 0, 'retention_deletes_business');
  assert(remainingContact.data?.length === 0, 'retention_cascades_business_rows');

  const index = createdBusinessIds.indexOf(businessId);
  if (index >= 0) createdBusinessIds.splice(index, 1);
}

async function cleanup() {
  for (const businessId of createdBusinessIds) {
    await service.from('businesses').delete().eq('id', businessId);
  }
}

let failure = null;
try {
  await proveRateLimit();
  await proveWebhookReplay();
  await proveRetention();
} catch (error) {
  failure = error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'unknown_operational_proof_failure';
} finally {
  await cleanup();
}

const ok = !failure && failed.length === 0;
console.log(JSON.stringify({ ok, passed, failed, failure }, null, 2));
if (!ok) process.exit(1);
