-- XeroWA authorization hotfix.
--
-- This migration deliberately contains no rate limiting or retention controls.
-- It can be deployed independently before application code, and it is safe to
-- rerun because helpers are replaced and table policies are rebuilt by name.

create schema if not exists private;

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
    using ((select private.has_business_role(id, array['owner','manager','agent','admin']::text[])))
    with check ((select private.has_business_role(id, array['owner','manager','agent','admin']::text[])));

  -- Membership administration is owner-only; all active members may read the
  -- roster. Platform admin/dev privileges are application-side app_metadata
  -- roles and must never become tenant membership escalation paths.
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
    with check ((select private.has_business_role(business_id, array['owner']::text[])));
  create policy business_members_owner_update on public.business_members
    for update to authenticated
    using ((select private.has_business_role(business_id, array['owner']::text[])))
    with check ((select private.has_business_role(business_id, array['owner']::text[])));
  create policy business_members_owner_delete on public.business_members
    for delete to authenticated
    using ((select private.has_business_role(business_id, array['owner']::text[])));

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
      'create policy %I on public.%I for insert to authenticated with check ((select private.has_business_role(business_id, array[''owner'',''manager'',''agent'',''admin'']::text[])))',
      target_table || '_operator_insert', target_table
    );
    execute pg_catalog.format(
      'create policy %I on public.%I for update to authenticated using ((select private.has_business_role(business_id, array[''owner'',''manager'',''agent'',''admin'']::text[]))) with check ((select private.has_business_role(business_id, array[''owner'',''manager'',''agent'',''admin'']::text[])))',
      target_table || '_operator_update', target_table
    );
    execute pg_catalog.format(
      'create policy %I on public.%I for delete to authenticated using ((select private.has_business_role(business_id, array[''owner'',''manager'',''agent'',''admin'']::text[])))',
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
      'create policy %I on public.%I for insert to authenticated with check ((select private.has_business_role_for_builder(builder_id, array[''owner'',''manager'',''agent'',''admin'']::text[])))',
      target_table || '_business_operator_insert', target_table
    );
    execute pg_catalog.format(
      'create policy %I on public.%I for update to authenticated using ((select private.has_business_role_for_builder(builder_id, array[''owner'',''manager'',''agent'',''admin'']::text[]))) with check ((select private.has_business_role_for_builder(builder_id, array[''owner'',''manager'',''agent'',''admin'']::text[])))',
      target_table || '_business_operator_update', target_table
    );
    execute pg_catalog.format(
      'create policy %I on public.%I for delete to authenticated using ((select private.has_business_role_for_builder(builder_id, array[''owner'',''manager'',''agent'',''admin'']::text[])))',
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
          and (select private.has_business_role(thread.business_id, array['owner','manager','agent','admin']::text[]))
      ));
    create policy lead_qualification_answers_operator_update on public.lead_qualification_answers
      for update to authenticated
      using (exists (
        select 1 from public.conversation_threads thread
        where thread.id = lead_qualification_answers.thread_id
          and (select private.has_business_role(thread.business_id, array['owner','manager','agent','admin']::text[]))
      ))
      with check (exists (
        select 1 from public.conversation_threads thread
        where thread.id = lead_qualification_answers.thread_id
          and (select private.has_business_role(thread.business_id, array['owner','manager','agent','admin']::text[]))
      ));
    create policy lead_qualification_answers_operator_delete on public.lead_qualification_answers
      for delete to authenticated
      using (exists (
        select 1 from public.conversation_threads thread
        where thread.id = lead_qualification_answers.thread_id
          and (select private.has_business_role(thread.business_id, array['owner','manager','agent','admin']::text[]))
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
  with check (bucket_id = 'whatsai-media' and (select private.has_business_role_text((storage.foldername(name))[1], array['owner','manager','agent','admin']::text[])));
create policy "whatsai media update own business" on storage.objects
  for update to authenticated
  using (bucket_id = 'whatsai-media' and (select private.has_business_role_text((storage.foldername(name))[1], array['owner','manager','agent','admin']::text[])))
  with check (bucket_id = 'whatsai-media' and (select private.has_business_role_text((storage.foldername(name))[1], array['owner','manager','agent','admin']::text[])));
create policy "whatsai media delete own business" on storage.objects
  for delete to authenticated
  using (bucket_id = 'whatsai-media' and (select private.has_business_role_text((storage.foldername(name))[1], array['owner','manager','agent','admin']::text[])));
