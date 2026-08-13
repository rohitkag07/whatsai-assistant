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
const prefix = `authorization-${run.slice(0, 16)}`;
const password = `Xw!${randomUUID()}aA9`;
const createdUserIds = [];
const createdBusinessIds = [];
const passed = [];
const failed = [];

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

async function signIn(label) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await client.auth.signInWithPassword({
    email: `${prefix}-${label}@example.invalid`,
    password,
  });
  if (result.error || !result.data.session) throw result.error ?? new Error('proof_session_missing');
  return client;
}

async function createBusiness(label, phonePrefix) {
  const result = await service.from('businesses').insert({
    name: `Authorization Proof ${label}`,
    phone: `+${phonePrefix}${run.slice(0, 10)}`,
    category: 'coaching',
    status: 'trial',
  }).select('id').single();
  if (result.error || !result.data) throw result.error ?? new Error('proof_business_missing');
  createdBusinessIds.push(result.data.id);
  return result.data.id;
}

async function runProof() {
  const businessA = await createBusiness('Business A', '91');
  const businessB = await createBusiness('Business B', '92');
  const owner = await createProofUser('owner', businessA);
  const viewer = await createProofUser('viewer', businessA);
  const tenantAdmin = await createProofUser('tenant-admin', businessA);

  const memberships = await service.from('business_members').insert([
    { business_id: businessA, user_id: owner.id, role: 'owner', active: true },
    { business_id: businessA, user_id: viewer.id, role: 'client', active: true },
    { business_id: businessA, user_id: tenantAdmin.id, role: 'admin', active: true },
  ]);
  if (memberships.error) throw memberships.error;

  const contacts = await service.from('conversation_contacts').insert([
    { business_id: businessA, phone: `+93${run.slice(0, 10)}`, name: 'Authorization Proof A' },
    { business_id: businessB, phone: `+94${run.slice(0, 10)}`, name: 'Authorization Proof B' },
  ]).select('id,business_id');
  if (contacts.error || contacts.data?.length !== 2) {
    throw contacts.error ?? new Error('proof_contacts_missing');
  }
  const contactA = contacts.data.find((contact) => contact.business_id === businessA);
  const contactB = contacts.data.find((contact) => contact.business_id === businessB);
  if (!contactA || !contactB) throw new Error('proof_contact_mapping_failed');

  const ownerClient = await signIn('owner');
  const viewerClient = await signIn('viewer');
  const tenantAdminClient = await signIn('tenant-admin');

  const ownRead = await ownerClient.from('conversation_contacts').select('id').eq('business_id', businessA);
  assert(!ownRead.error && ownRead.data?.some((row) => row.id === contactA.id), 'owner_reads_own_business');

  const foreignRead = await ownerClient.from('conversation_contacts').select('id').eq('business_id', businessB);
  assert(!foreignRead.error && foreignRead.data?.length === 0, 'owner_cannot_read_foreign_business');

  const foreignInsert = await ownerClient.from('conversation_contacts').insert({
    business_id: businessB,
    phone: `+95${run.slice(0, 10)}`,
    name: 'Denied cross-business insert',
  });
  assert(Boolean(foreignInsert.error), 'owner_cannot_insert_foreign_business');

  const foreignUpdate = await ownerClient.from('conversation_contacts')
    .update({ name: 'Denied cross-business update' })
    .eq('id', contactB.id)
    .select('id');
  assert(!foreignUpdate.error && foreignUpdate.data?.length === 0, 'owner_cannot_update_foreign_business');

  const foreignDelete = await ownerClient.from('conversation_contacts')
    .delete()
    .eq('id', contactB.id)
    .select('id');
  assert(!foreignDelete.error && foreignDelete.data?.length === 0, 'owner_cannot_delete_foreign_business');

  const viewerRead = await viewerClient.from('conversation_contacts').select('id').eq('business_id', businessA);
  assert(!viewerRead.error && viewerRead.data?.some((row) => row.id === contactA.id), 'viewer_reads_own_business');

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

  const tenantAdminWrite = await tenantAdminClient.from('conversation_contacts').insert({
    business_id: businessA,
    phone: `+97${run.slice(0, 10)}`,
    name: 'Allowed tenant admin insert',
  });
  assert(!tenantAdminWrite.error, 'tenant_admin_can_mutate_own_business_data');

  const tenantAdminPromote = await tenantAdminClient.from('business_members')
    .update({ role: 'owner' })
    .eq('user_id', tenantAdmin.id)
    .select('id');
  assert(!tenantAdminPromote.error && tenantAdminPromote.data?.length === 0, 'tenant_admin_cannot_promote_self');

  const tenantAdminModifyOwner = await tenantAdminClient.from('business_members')
    .update({ role: 'client' })
    .eq('user_id', owner.id)
    .select('id');
  assert(!tenantAdminModifyOwner.error && tenantAdminModifyOwner.data?.length === 0, 'tenant_admin_cannot_modify_owner');

  const tenantAdminDeleteOwner = await tenantAdminClient.from('business_members')
    .delete()
    .eq('user_id', owner.id)
    .select('id');
  assert(!tenantAdminDeleteOwner.error && tenantAdminDeleteOwner.data?.length === 0, 'tenant_admin_cannot_delete_owner');
}

async function cleanup() {
  for (const businessId of createdBusinessIds) {
    await service.from('businesses').delete().eq('id', businessId);
  }
  for (const userId of createdUserIds) {
    await service.auth.admin.deleteUser(userId);
  }
}

let failure = null;
try {
  await runProof();
} catch (error) {
  failure = error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'unknown_authorization_proof_failure';
} finally {
  await cleanup();
}

const ok = !failure && failed.length === 0;
console.log(JSON.stringify({ ok, passed, failed, failure }, null, 2));
if (!ok) process.exit(1);
