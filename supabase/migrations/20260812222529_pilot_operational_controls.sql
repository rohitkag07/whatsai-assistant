-- Pilot security gate: durable, server-side API rate-limit buckets.
-- This table lives outside the exposed public schema and stores only a SHA-256
-- caller key, never a raw IP address or authorization credential.

create schema if not exists private;

create table if not exists private.api_rate_limit_windows (
  scope text not null,
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (scope, key_hash, window_started_at)
);

create index if not exists api_rate_limit_windows_started_idx
  on private.api_rate_limit_windows (window_started_at);

revoke all on table private.api_rate_limit_windows from public, anon, authenticated;
grant select, insert, update, delete on table private.api_rate_limit_windows to service_role;

create or replace function public.consume_api_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  limit_value integer,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_started_at timestamptz;
  v_count integer;
begin
  if p_scope is null or pg_catalog.length(p_scope) < 1 or pg_catalog.length(p_scope) > 120 then
    raise exception 'invalid_rate_limit_scope';
  end if;
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_rate_limit_key';
  end if;
  if p_limit < 1 or p_limit > 10000 then
    raise exception 'invalid_rate_limit_value';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid_rate_limit_window';
  end if;

  v_window_started_at := pg_catalog.to_timestamp(
    pg_catalog.floor(pg_catalog.date_part('epoch', v_now) / p_window_seconds) * p_window_seconds
  );

  insert into private.api_rate_limit_windows as rate_window (
    scope,
    key_hash,
    window_started_at,
    request_count
  ) values (
    p_scope,
    p_key_hash,
    v_window_started_at,
    1
  )
  on conflict (scope, key_hash, window_started_at)
  do update set request_count = rate_window.request_count + 1
  returning request_count into v_count;

  -- Approximately 1/256 keys performs global expiry cleanup. The caller key
  -- is peppered in application code, so clients cannot choose this shard.
  if pg_catalog.get_byte(pg_catalog.decode(p_key_hash, 'hex'), 0) = 0 then
    delete from private.api_rate_limit_windows
    where window_started_at < v_now - interval '2 days';
  end if;

  return query select
    v_count <= p_limit,
    p_limit,
    greatest(p_limit - v_count, 0),
    v_window_started_at + pg_catalog.make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer)
  to service_role;

comment on function public.consume_api_rate_limit(text, text, integer, integer) is
  'Atomically consumes a private API rate-limit bucket. Service role only.';

-- Business retention deletion is a two-step, service-role-only workflow. The
-- preview returns aggregate counts; execution requires an exact business-bound
-- confirmation phrase and leaves a non-customer-content audit receipt.
create table if not exists private.business_retention_deletion_audit (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  request_reference text not null,
  deleted_counts jsonb not null,
  executed_at timestamptz not null default now()
);

create unique index if not exists business_retention_deletion_request_idx
  on private.business_retention_deletion_audit (request_reference);

revoke all on table private.business_retention_deletion_audit from public, anon, authenticated;
grant select, insert on table private.business_retention_deletion_audit to service_role;

create or replace function private.business_deletion_counts(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_builder_id uuid;
begin
  select coalesce(
    business.builder_id,
    case when exists (select 1 from public.builders where id = business.id) then business.id end
  )
  into v_builder_id
  from public.businesses business
  where business.id = p_business_id;

  return pg_catalog.jsonb_build_object(
    'business_profiles', (select pg_catalog.count(*) from public.business_profiles where business_id = p_business_id),
    'business_channels', (select pg_catalog.count(*) from public.business_channels where business_id = p_business_id),
    'trial_accounts', (select pg_catalog.count(*) from public.trial_accounts where business_id = p_business_id),
    'assistant_playbooks', (select pg_catalog.count(*) from public.assistant_playbooks where business_id = p_business_id),
    'assistant_knowledge_items', (select pg_catalog.count(*) from public.assistant_knowledge_items where business_id = p_business_id),
    'conversation_contacts', (select pg_catalog.count(*) from public.conversation_contacts where business_id = p_business_id),
    'conversation_threads', (select pg_catalog.count(*) from public.conversation_threads where business_id = p_business_id),
    'conversation_messages', (select pg_catalog.count(*) from public.conversation_messages where business_id = p_business_id),
    'appointments', (select pg_catalog.count(*) from public.appointments where business_id = p_business_id),
    'handoff_events', (select pg_catalog.count(*) from public.handoff_events where business_id = p_business_id),
    'daily_owner_summaries', (select pg_catalog.count(*) from public.daily_owner_summaries where business_id = p_business_id),
    'followup_sequences', (select pg_catalog.count(*) from public.followup_sequences where business_id = p_business_id),
    'followup_jobs', (select pg_catalog.count(*) from public.followup_jobs where business_id = p_business_id),
    'whatsapp_templates', (select pg_catalog.count(*) from public.whatsapp_templates where business_id = p_business_id),
    'broadcast_campaigns', (select pg_catalog.count(*) from public.broadcast_campaigns where business_id = p_business_id),
    'broadcast_recipients', (select pg_catalog.count(*) from public.broadcast_recipients where business_id = p_business_id),
    'playbook_media_assets', (select pg_catalog.count(*) from public.playbook_media_assets where business_id = p_business_id),
    'business_members', (select pg_catalog.count(*) from public.business_members where business_id = p_business_id),
    'legacy_leads', (select pg_catalog.count(*) from public.leads where builder_id = v_builder_id),
    'legacy_follow_up_queue', (select pg_catalog.count(*) from public.follow_up_queue where builder_id = v_builder_id),
    'legacy_whatsapp_messages', (select pg_catalog.count(*) from public.whatsapp_messages where builder_id = v_builder_id),
    'legacy_agent_runs', (select pg_catalog.count(*) from public.agent_runs where builder_id = v_builder_id)
  );
end;
$$;

revoke all on function private.business_deletion_counts(uuid) from public, anon, authenticated;
grant execute on function private.business_deletion_counts(uuid) to service_role;

create or replace function public.preview_business_retention_delete(p_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  select name into v_name from public.businesses where id = p_business_id for share;
  if v_name is null then
    raise exception 'business_not_found';
  end if;
  return pg_catalog.jsonb_build_object(
    'business_id', p_business_id,
    'business_name', v_name,
    'confirmation_required', 'DELETE BUSINESS ' || p_business_id::text,
    'counts', private.business_deletion_counts(p_business_id)
  );
end;
$$;

revoke all on function public.preview_business_retention_delete(uuid)
  from public, anon, authenticated;
grant execute on function public.preview_business_retention_delete(uuid)
  to service_role;

create or replace function public.execute_business_retention_delete(
  p_business_id uuid,
  p_confirmation text,
  p_request_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_builder_id uuid;
  v_counts jsonb;
  v_audit_id uuid;
begin
  if p_confirmation is distinct from 'DELETE BUSINESS ' || p_business_id::text then
    raise exception 'retention_confirmation_mismatch';
  end if;
  if p_request_reference is null
    or pg_catalog.length(pg_catalog.btrim(p_request_reference)) < 3
    or pg_catalog.length(p_request_reference) > 200 then
    raise exception 'invalid_retention_request_reference';
  end if;

  select
    business.name,
    coalesce(
      business.builder_id,
      case when exists (select 1 from public.builders where id = business.id) then business.id end
    )
  into v_name, v_builder_id
  from public.businesses business
  where business.id = p_business_id
  for update;
  if v_name is null then
    raise exception 'business_not_found';
  end if;
  v_counts := private.business_deletion_counts(p_business_id);

  insert into private.business_retention_deletion_audit (
    business_id,
    request_reference,
    deleted_counts
  ) values (
    p_business_id,
    pg_catalog.btrim(p_request_reference),
    v_counts
  ) returning id into v_audit_id;

  -- Delete only XeroWA compatibility records for the mapped legacy builder.
  -- The builder, projects and all standalone X7-specific tables remain intact.
  if v_builder_id is not null then
    delete from public.follow_up_queue where builder_id = v_builder_id;
    delete from public.whatsapp_messages where builder_id = v_builder_id;
    delete from public.agent_runs where builder_id = v_builder_id;
    delete from public.leads where builder_id = v_builder_id;
  end if;

  delete from public.businesses where id = p_business_id;

  return pg_catalog.jsonb_build_object(
    'deleted', true,
    'audit_id', v_audit_id,
    'business_id', p_business_id,
    'counts', v_counts
  );
end;
$$;

revoke all on function public.execute_business_retention_delete(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.execute_business_retention_delete(uuid, text, text)
  to service_role;
