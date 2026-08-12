#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  console.error(JSON.stringify({ ok: false, error: 'Supabase proof environment is incomplete.' }));
  process.exit(2);
}

const service = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const run = randomUUID().replaceAll('-', '');
const prefix = `security-${run.slice(0, 16)}`;
const password = `X7!${randomUUID()}aA9`;
const createdUserIds = [];
const createdBusinessIds = [];
const passed = [];
const failed = [];
const blocked = [];

function assert(condition, control) {
  if (condition) passed.push(control);
  else failed.push(control);
}

async function createProofUser(label, businessId) {
  const result = await service.auth.admin.createUser({
    email: `${prefix}-${label}@example.invalid`,
    password,
    email_confirm: true,
    app_metadata: { builder_id: businessId, platform_role: 'client' },
  });
  if (result.error || !result.data.user) throw result.error ?? new Error('proof_user_missing');
  createdUserIds.push(result.data.user.id);
  return result.data.user;
}

async function signIn(email) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.session) throw result.error ?? new Error('proof_session_missing');
  return client;
}

async function createBusiness(label, phonePrefix) {
  const result = await service.from('businesses').insert({
    name: `Security Proof ${label}`,
    phone: `+${phonePrefix}${run.slice(0, 10)}`,
    category: 'coaching',
    status: 'trial',
  }).select('id').single();
  if (result.error || !result.data) throw result.error ?? new Error('proof_business_missing');
  createdBusinessIds.push(result.data.id);
  return result.data.id;
}

async function proveBusinessIsolation() {
  const businessA = await createBusiness('Business A', '91');
  const businessB = await createBusiness('Business B', '92');
  const owner = await createProofUser('owner', businessA);
  const viewer = await createProofUser('viewer', businessA);

  const memberships = await service.from('business_members').insert([
    { business_id: businessA, user_id: owner.id, role: 'owner', active: true },
    { business_id: businessA, user_id: viewer.id, role: 'client', active: true },
  ]);
  if (memberships.error) throw memberships.error;

  const contacts = await service.from('conversation_contacts').insert([
    { business_id: businessA, phone: `+93${run.slice(0, 10)}`, name: 'Security Proof A' },
    { business_id: businessB, phone: `+94${run.slice(0, 10)}`, name: 'Security Proof B' },
  ]).select('id,business_id');
  if (contacts.error || contacts.data?.length !== 2) throw contacts.error ?? new Error('proof_contacts_missing');
  const contactA = contacts.data.find((contact) => contact.business_id === businessA);
  const contactB = contacts.data.find((contact) => contact.business_id === businessB);
  if (!contactA || !contactB) throw new Error('proof_contact_mapping_failed');

  const ownerClient = await signIn(`${prefix}-owner@example.invalid`);
  const viewerClient = await signIn(`${prefix}-viewer@example.invalid`);

  const ownRead = await ownerClient.from('conversation_contacts').select('id').eq('business_id', businessA);
  assert(!ownRead.error && ownRead.data?.some((row) => row.id === contactA.id), 'owner_a_reads_business_a');

  const foreignRead = await ownerClient.from('conversation_contacts').select('id').eq('business_id', businessB);
  assert(!foreignRead.error && foreignRead.data?.length === 0, 'owner_a_cannot_read_business_b');

  const foreignInsert = await ownerClient.from('conversation_contacts').insert({
    business_id: businessB,
    phone: `+95${run.slice(0, 10)}`,
    name: 'Denied cross-business insert',
  });
  assert(Boolean(foreignInsert.error), 'owner_a_cannot_insert_business_b');

  const foreignUpdate = await ownerClient.from('conversation_contacts')
    .update({ name: 'Denied cross-business update' })
    .eq('id', contactB.id)
    .select('id');
  assert(!foreignUpdate.error && foreignUpdate.data?.length === 0, 'owner_a_cannot_update_business_b');

  const foreignDelete = await ownerClient.from('conversation_contacts')
    .delete()
    .eq('id', contactB.id)
    .select('id');
  assert(!foreignDelete.error && foreignDelete.data?.length === 0, 'owner_a_cannot_delete_business_b');

  const viewerRead = await viewerClient.from('conversation_contacts').select('id').eq('business_id', businessA);
  assert(!viewerRead.error && viewerRead.data?.some((row) => row.id === contactA.id), 'viewer_can_read_own_business');

  const viewerInsert = await viewerClient.from('conversation_contacts').insert({
    business_id: businessA,
    phone: `+96${run.slice(0, 10)}`,
    name: 'Denied viewer insert',
  });
  assert(Boolean(viewerInsert.error), 'viewer_cannot_insert');

  const viewerUpdate = await viewerClient.from('conversation_contacts')
    .update({ name: 'Denied viewer update' })
    .eq('id', contactA.id)
    .select('id');
  assert(!viewerUpdate.error && viewerUpdate.data?.length === 0, 'viewer_cannot_update');

  const viewerDelete = await viewerClient.from('conversation_contacts')
    .delete()
    .eq('id', contactA.id)
    .select('id');
  assert(!viewerDelete.error && viewerDelete.data?.length === 0, 'viewer_cannot_delete');

  return businessB;
}

async function proveWebhookReplay() {
  const businessId = await createBusiness('Replay Business', '97');
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
    p_phone: `+98${run.slice(0, 10)}`,
    p_contact_name: 'Replay Proof',
    p_provider_message_id: `${prefix}-message`,
    p_message_type: 'text',
    p_body: 'Synthetic security replay proof',
    p_metadata: { synthetic_security_proof: true },
  };
  const first = await service.rpc('ingest_whatsapp_inbound', params);
  const second = await service.rpc('ingest_whatsapp_inbound', params);
  if (first.error || second.error) throw first.error ?? second.error;
  assert(first.data?.duplicate === false, 'first_webhook_message_is_accepted_once');
  assert(second.data?.duplicate === true, 'replayed_webhook_is_marked_duplicate');
  assert(first.data?.message_id === second.data?.message_id, 'replay_reuses_original_message');
}

async function proveNewDatabaseControls(businessB) {
  const rateKey = run.padEnd(64, '0').slice(0, 64);
  const firstRate = await service.rpc('consume_api_rate_limit', {
    p_scope: `security-proof-${prefix}`,
    p_key_hash: rateKey,
    p_limit: 1,
    p_window_seconds: 60,
  });
  if (firstRate.error) {
    blocked.push('rate_limit_runtime_migration_not_applied');
  } else {
    const secondRate = await service.rpc('consume_api_rate_limit', {
      p_scope: `security-proof-${prefix}`,
      p_key_hash: rateKey,
      p_limit: 1,
      p_window_seconds: 60,
    });
    if (secondRate.error) throw secondRate.error;
    assert(firstRate.data?.[0]?.allowed === true, 'rate_limit_allows_within_budget');
    assert(secondRate.data?.[0]?.allowed === false, 'rate_limit_denies_over_budget');
  }

  const preview = await service.rpc('preview_business_retention_delete', { p_business_id: businessB });
  if (preview.error) {
    blocked.push('retention_runtime_migration_not_applied');
    return;
  }
  assert(preview.data?.counts?.conversation_contacts === 1, 'retention_preview_counts_business_rows');
  const executed = await service.rpc('execute_business_retention_delete', {
    p_business_id: businessB,
    p_confirmation: `DELETE BUSINESS ${businessB}`,
    p_request_reference: `${prefix}-synthetic-proof`,
  });
  if (executed.error) throw executed.error;
  const remaining = await service.from('businesses').select('id').eq('id', businessB);
  assert(executed.data?.deleted === true && remaining.data?.length === 0, 'retention_delete_cascades_business');
  const index = createdBusinessIds.indexOf(businessB);
  if (index >= 0) createdBusinessIds.splice(index, 1);
}

async function cleanup() {
  for (const businessId of createdBusinessIds) await service.from('businesses').delete().eq('id', businessId);
  for (const userId of createdUserIds) await service.auth.admin.deleteUser(userId);
}

let failure = null;
try {
  const businessB = await proveBusinessIsolation();
  await proveWebhookReplay();
  await proveNewDatabaseControls(businessB);
} catch (error) {
  failure = error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'unknown_security_proof_failure';
} finally {
  await cleanup();
}

const requireAll = process.env.REQUIRE_ALL_SECURITY_CONTROLS === '1';
const ok = !failure && failed.length === 0 && (!requireAll || blocked.length === 0);
console.log(JSON.stringify({ ok, passed, failed, blocked, failure }, null, 2));
if (!ok) process.exit(1);
