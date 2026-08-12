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
    pg_catalog.greatest(p_limit - v_count, 0),
    v_window_started_at + pg_catalog.make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer)
  to service_role;

comment on function public.consume_api_rate_limit(text, text, integer, integer) is
  'Atomically consumes a private API rate-limit bucket. Service role only.';

-- Current XeroWA production authorization is business-based. Replace legacy
-- builder-claim FOR ALL policies with membership reads and role-aware writes.
create or replace function private.is_business_member(check_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.business_members membership
      where membership.business_id = check_business_id
        and membership.user_id = (select auth.uid())
        and membership.active = true
    );
$$;

create or replace function private.has_business_role(
  check_business_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.business_members membership
      where membership.business_id = check_business_id
        and membership.user_id = (select auth.uid())
        and membership.active = true
        and membership.role = any(allowed_roles)
    );
$$;

create or replace function private.is_business_member_text(check_business_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.business_members membership
      where membership.business_id::text = check_business_id
        and membership.user_id = (select auth.uid())
        and membership.active = true
    );
$$;

create or replace function private.has_business_role_text(
  check_business_id text,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.business_members membership
      where membership.business_id::text = check_business_id
        and membership.user_id = (select auth.uid())
        and membership.active = true
        and membership.role = any(allowed_roles)
    );
$$;

create or replace function private.is_business_member_for_builder(check_builder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses business
    where business.id = check_builder_id or business.builder_id = check_builder_id
  ) and exists (
    select 1
    from public.businesses business
    join public.business_members membership on membership.business_id = business.id
    where (business.id = check_builder_id or business.builder_id = check_builder_id)
      and membership.user_id = (select auth.uid())
      and membership.active = true
  );
$$;

create or replace function private.has_business_role_for_builder(
  check_builder_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses business
    join public.business_members membership on membership.business_id = business.id
    where (business.id = check_builder_id or business.builder_id = check_builder_id)
      and membership.user_id = (select auth.uid())
      and membership.active = true
      and membership.role = any(allowed_roles)
  );
$$;

revoke all on function private.is_business_member(uuid) from public, anon;
revoke all on function private.has_business_role(uuid, text[]) from public, anon;
revoke all on function private.is_business_member_text(text) from public, anon;
revoke all on function private.has_business_role_text(text, text[]) from public, anon;
revoke all on function private.is_business_member_for_builder(uuid) from public, anon;
revoke all on function private.has_business_role_for_builder(uuid, text[]) from public, anon;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_business_member(uuid) to authenticated, service_role;
grant execute on function private.has_business_role(uuid, text[]) to authenticated, service_role;
grant execute on function private.is_business_member_text(text) to authenticated, service_role;
grant execute on function private.has_business_role_text(text, text[]) to authenticated, service_role;
grant execute on function private.is_business_member_for_builder(uuid) to authenticated, service_role;
grant execute on function private.has_business_role_for_builder(uuid, text[]) to authenticated, service_role;

do $$
declare
  policy_record record;
  target_table text;
  direct_business_tables text[] := array[
    'business_profiles',
    'business_channels',
    'trial_accounts',
    'assistant_playbooks',
    'assistant_knowledge_items',
    'conversation_contacts',
    'conversation_threads',
    'conversation_messages',
    'appointments',
    'handoff_events',
    'daily_owner_summaries',
    'followup_sequences',
    'followup_jobs',
    'whatsapp_templates',
    'broadcast_campaigns',
    'broadcast_recipients',
    'playbook_media_assets'
  ];
  legacy_builder_tables text[] := array[
    'leads',
    'follow_up_queue',
    'whatsapp_messages',
    'agent_runs'
  ];
begin
  -- Businesses: members may read; operators may update. Creation and deletion
  -- remain trusted service-role workflows.
  for policy_record in
    select policyname from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'businesses'
  loop
    execute pg_catalog.format('drop policy if exists %I on public.businesses', policy_record.policyname);
  end loop;
  alter table public.businesses enable row level security;
  create policy businesses_member_select on public.businesses
    for select to authenticated
    using ((select private.is_business_member(id)));
  create policy businesses_operator_update on public.businesses
    for update to authenticated
    using ((select private.has_business_role(id, array['owner','manager','agent','admin','dev']::text[])))
    with check ((select private.has_business_role(id, array['owner','manager','agent','admin','dev']::text[])));

  -- Membership administration is owner/admin/dev only; all active members can
  -- read their business roster.
  for policy_record in
    select policyname from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'business_members'
  loop
    execute pg_catalog.format('drop policy if exists %I on public.business_members', policy_record.policyname);
  end loop;
  alter table public.business_members enable row level security;
  create policy business_members_member_select on public.business_members
    for select to authenticated
    using ((select private.is_business_member(business_id)));
  create policy business_members_owner_insert on public.business_members
    for insert to authenticated
    with check ((select private.has_business_role(business_id, array['owner','admin','dev']::text[])));
  create policy business_members_owner_update on public.business_members
    for update to authenticated
    using ((select private.has_business_role(business_id, array['owner','admin','dev']::text[])))
    with check ((select private.has_business_role(business_id, array['owner','admin','dev']::text[])));
  create policy business_members_owner_delete on public.business_members
    for delete to authenticated
    using ((select private.has_business_role(business_id, array['owner','admin','dev']::text[])));

  foreach target_table in array direct_business_tables
  loop
    if pg_catalog.to_regclass('public.' || target_table) is null then
      continue;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = target_table
        and column_name = 'business_id'
    ) then
      continue;
    end if;

    for policy_record in
      select policyname from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = target_table
    loop
      execute pg_catalog.format('drop policy if exists %I on public.%I', policy_record.policyname, target_table);
    end loop;

    execute pg_catalog.format('alter table public.%I enable row level security', target_table);
    execute pg_catalog.format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_business_member(business_id)))',
      target_table || '_member_select', target_table
    );
    execute pg_catalog.format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.has_business_role(business_id, array[''owner'',''manager'',''agent'',''admin'',''dev'']::text[])))',
      target_table || '_operator_insert', target_table
    );
    execute pg_catalog.format(
      'create policy %I on public.%I for update to authenticated using ((select private.has_business_role(business_id, array[''owner'',''manager'',''agent'',''admin'',''dev'']::text[]))) with check ((select private.has_business_role(business_id, array[''owner'',''manager'',''agent'',''admin'',''dev'']::text[])))',
      target_table || '_operator_update', target_table
    );
    execute pg_catalog.format(
      'create policy %I on public.%I for delete to authenticated using ((select private.has_business_role(business_id, array[''owner'',''manager'',''agent'',''admin'',''dev'']::text[])))',
      target_table || '_operator_delete', target_table
    );
  end loop;

  -- These legacy tables are still used by XeroWA compatibility flows. Scope
  -- them through businesses.builder_id without touching standalone X7-only
  -- project, plot, booking, resident, or colony tables.
  foreach target_table in array legacy_builder_tables
  loop
    if pg_catalog.to_regclass('public.' || target_table) is null then
      continue;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = target_table
        and column_name = 'builder_id'
    ) then
      continue;
    end if;

    for policy_record in
      select policyname from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = target_table
    loop
      execute pg_catalog.format('drop policy if exists %I on public.%I', policy_record.policyname, target_table);
    end loop;

    execute pg_catalog.format('alter table public.%I enable row level security', target_table);
    execute pg_catalog.format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_business_member_for_builder(builder_id)))',
      target_table || '_business_member_select', target_table
    );
    execute pg_catalog.format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.has_business_role_for_builder(builder_id, array[''owner'',''manager'',''agent'',''admin'',''dev'']::text[])))',
      target_table || '_business_operator_insert', target_table
    );
    execute pg_catalog.format(
      'create policy %I on public.%I for update to authenticated using ((select private.has_business_role_for_builder(builder_id, array[''owner'',''manager'',''agent'',''admin'',''dev'']::text[]))) with check ((select private.has_business_role_for_builder(builder_id, array[''owner'',''manager'',''agent'',''admin'',''dev'']::text[])))',
      target_table || '_business_operator_update', target_table
    );
    execute pg_catalog.format(
      'create policy %I on public.%I for delete to authenticated using ((select private.has_business_role_for_builder(builder_id, array[''owner'',''manager'',''agent'',''admin'',''dev'']::text[])))',
      target_table || '_business_operator_delete', target_table
    );
  end loop;

  if pg_catalog.to_regclass('public.lead_qualification_answers') is not null then
    for policy_record in
      select policyname from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = 'lead_qualification_answers'
    loop
      execute pg_catalog.format('drop policy if exists %I on public.lead_qualification_answers', policy_record.policyname);
    end loop;
    alter table public.lead_qualification_answers enable row level security;
    create policy lead_qualification_answers_member_select on public.lead_qualification_answers
      for select to authenticated
      using (exists (
        select 1 from public.conversation_threads thread
        where thread.id = lead_qualification_answers.thread_id
          and (select private.is_business_member(thread.business_id))
      ));
    create policy lead_qualification_answers_operator_insert on public.lead_qualification_answers
      for insert to authenticated
      with check (exists (
        select 1 from public.conversation_threads thread
        where thread.id = lead_qualification_answers.thread_id
          and (select private.has_business_role(thread.business_id, array['owner','manager','agent','admin','dev']::text[]))
      ));
    create policy lead_qualification_answers_operator_update on public.lead_qualification_answers
      for update to authenticated
      using (exists (
        select 1 from public.conversation_threads thread
        where thread.id = lead_qualification_answers.thread_id
          and (select private.has_business_role(thread.business_id, array['owner','manager','agent','admin','dev']::text[]))
      ))
      with check (exists (
        select 1 from public.conversation_threads thread
        where thread.id = lead_qualification_answers.thread_id
          and (select private.has_business_role(thread.business_id, array['owner','manager','agent','admin','dev']::text[]))
      ));
    create policy lead_qualification_answers_operator_delete on public.lead_qualification_answers
      for delete to authenticated
      using (exists (
        select 1 from public.conversation_threads thread
        where thread.id = lead_qualification_answers.thread_id
          and (select private.has_business_role(thread.business_id, array['owner','manager','agent','admin','dev']::text[]))
      ));
  end if;
end
$$;

-- Storage mutations follow the same viewer/operator distinction.
drop policy if exists "whatsai media select own business" on storage.objects;
drop policy if exists "whatsai media insert own business" on storage.objects;
drop policy if exists "whatsai media update own business" on storage.objects;
drop policy if exists "whatsai media delete own business" on storage.objects;
create policy "whatsai media select own business" on storage.objects
  for select to authenticated
  using (bucket_id = 'whatsai-media' and (select private.is_business_member_text((storage.foldername(name))[1])));
create policy "whatsai media insert own business" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'whatsai-media' and (select private.has_business_role_text((storage.foldername(name))[1], array['owner','manager','agent','admin','dev']::text[])));
create policy "whatsai media update own business" on storage.objects
  for update to authenticated
  using (bucket_id = 'whatsai-media' and (select private.has_business_role_text((storage.foldername(name))[1], array['owner','manager','agent','admin','dev']::text[])))
  with check (bucket_id = 'whatsai-media' and (select private.has_business_role_text((storage.foldername(name))[1], array['owner','manager','agent','admin','dev']::text[])));
create policy "whatsai media delete own business" on storage.objects
  for delete to authenticated
  using (bucket_id = 'whatsai-media' and (select private.has_business_role_text((storage.foldername(name))[1], array['owner','manager','agent','admin','dev']::text[])));

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

revoke all on table private.business_retention_deletion_audit from public, anon, authenticated;
grant select, insert on table private.business_retention_deletion_audit to service_role;

create or replace function private.business_deletion_counts(p_business_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'business_members', (select pg_catalog.count(*) from public.business_members where business_id = p_business_id),
    'conversation_contacts', (select pg_catalog.count(*) from public.conversation_contacts where business_id = p_business_id),
    'conversation_threads', (select pg_catalog.count(*) from public.conversation_threads where business_id = p_business_id),
    'conversation_messages', (select pg_catalog.count(*) from public.conversation_messages where business_id = p_business_id),
    'appointments', (select pg_catalog.count(*) from public.appointments where business_id = p_business_id),
    'followup_jobs', (select pg_catalog.count(*) from public.followup_jobs where business_id = p_business_id),
    'business_channels', (select pg_catalog.count(*) from public.business_channels where business_id = p_business_id),
    'assistant_knowledge_items', (select pg_catalog.count(*) from public.assistant_knowledge_items where business_id = p_business_id)
  );
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

  select name into v_name from public.businesses where id = p_business_id for update;
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
