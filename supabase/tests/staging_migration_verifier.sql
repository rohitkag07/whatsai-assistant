\set ON_ERROR_STOP on

do $verifier$
declare
  required_table text;
  mutation_command text;
  privilege_name text;
  policy_record record;
  function_record record;
  commit_is_definer boolean;
  constraint_definition text;
  search_setting text;
begin
  foreach required_table in array array[
    'tenants',
    'tenant_memberships',
    'contacts',
    'conversations',
    'messages',
    'leads',
    'appointments',
    'workflow_transition_logs',
    'webhook_events'
  ]
  loop
    if to_regclass(format('public.%I', required_table)) is null then
      raise exception 'missing required table public.%', required_table;
    end if;

    if not exists (
      select 1
      from pg_class relation
      join pg_namespace namespace
        on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relname = required_table
        and relation.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', required_table;
    end if;
  end loop;

  foreach required_table in array array[
    'contacts',
    'conversations',
    'messages',
    'leads',
    'appointments'
  ]
  loop
    select *
    into policy_record
    from pg_policies
    where schemaname = 'public'
      and tablename = required_table
      and policyname = required_table || '_tenant_select'
      and cmd = 'SELECT';

    if not found
      or not ('authenticated' = any(policy_record.roles))
      or cardinality(policy_record.roles) <> 1
      or position(
        'is_tenant_member' in coalesce(policy_record.qual, '')
      ) = 0
    then
      raise exception 'invalid member SELECT policy for public.%', required_table;
    end if;

    foreach mutation_command in array array['INSERT', 'UPDATE', 'DELETE']
    loop
      select *
      into policy_record
      from pg_policies
      where schemaname = 'public'
        and tablename = required_table
        and policyname =
          required_table || '_tenant_' || lower(mutation_command)
        and cmd = mutation_command;

      if not found
        or not ('authenticated' = any(policy_record.roles))
        or cardinality(policy_record.roles) <> 1
        or position(
          'has_tenant_role' in
          coalesce(policy_record.qual, '')
          || coalesce(policy_record.with_check, '')
        ) = 0
        or position(
          'viewer' in
          coalesce(policy_record.qual, '')
          || coalesce(policy_record.with_check, '')
        ) > 0
      then
        raise exception
          'invalid % operator policy for public.%',
          mutation_command,
          required_table;
      end if;
    end loop;
  end loop;

  foreach mutation_command in array array['INSERT', 'UPDATE', 'DELETE']
  loop
    select *
    into policy_record
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tenant_memberships'
      and policyname =
        'memberships_' || lower(mutation_command) || '_owner'
      and cmd = mutation_command;

    if not found
      or not ('authenticated' = any(policy_record.roles))
      or cardinality(policy_record.roles) <> 1
      or position(
        'has_tenant_role' in
        coalesce(policy_record.qual, '')
        || coalesce(policy_record.with_check, '')
      ) = 0
      or position(
        'owner' in
        coalesce(policy_record.qual, '')
        || coalesce(policy_record.with_check, '')
      ) = 0
      or position(
        'admin' in
        coalesce(policy_record.qual, '')
        || coalesce(policy_record.with_check, '')
      ) > 0
    then
      raise exception
        'tenant membership % is not owner-only',
        mutation_command;
    end if;
  end loop;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tenant_memberships'
      and policyname like 'memberships_admin_%'
  ) then
    raise exception 'legacy admin membership policies still exist';
  end if;

  for function_record in
    select
      procedure.oid,
      namespace.nspname as schema_name,
      procedure.proname,
      procedure.prosecdef,
      procedure.proconfig
    from pg_proc procedure
    join pg_namespace namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'private'
      and procedure.proname in (
        'is_tenant_member',
        'is_tenant_admin',
        'has_tenant_role'
      )
  loop
    if not function_record.prosecdef then
      raise exception
        'private.% must be SECURITY DEFINER',
        function_record.proname;
    end if;

    search_setting := null;
    select setting
    into search_setting
    from unnest(
      coalesce(function_record.proconfig, array[]::text[])
    ) as setting
    where setting like 'search_path=%'
    limit 1;

    if replace(coalesce(search_setting, ''), ' ', '')
      not in ('search_path=', 'search_path=""')
    then
      raise exception
        'private.% has unsafe search_path: %',
        function_record.proname,
        coalesce(search_setting, '<unset>');
    end if;
  end loop;

  if (
    select count(*)
    from pg_proc procedure
    join pg_namespace namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'private'
      and procedure.proname in (
        'is_tenant_member',
        'is_tenant_admin',
        'has_tenant_role'
      )
  ) <> 3 then
    raise exception 'one or more tenant security helpers are missing';
  end if;

  if has_function_privilege(
    'anon',
    'private.is_tenant_member(uuid)',
    'EXECUTE'
  ) then
    raise exception 'anon can execute private.is_tenant_member';
  end if;

  if not has_function_privilege(
    'authenticated',
    'private.is_tenant_member(uuid)',
    'EXECUTE'
  ) then
    raise exception 'authenticated cannot execute private.is_tenant_member';
  end if;

  select pg_get_constraintdef(oid)
  into constraint_definition
  from pg_constraint
  where conrelid = 'public.contacts'::regclass
    and conname = 'contacts_tenant_id_id_key';
  if constraint_definition is null
    or constraint_definition !~ 'UNIQUE \(tenant_id, id\)'
  then
    raise exception 'contacts tenant composite key is missing';
  end if;

  select pg_get_constraintdef(oid)
  into constraint_definition
  from pg_constraint
  where conrelid = 'public.conversations'::regclass
    and conname = 'conversations_tenant_id_id_key';
  if constraint_definition is null
    or constraint_definition !~ 'UNIQUE \(tenant_id, id\)'
  then
    raise exception 'conversations tenant composite key is missing';
  end if;

  select pg_get_constraintdef(oid)
  into constraint_definition
  from pg_constraint
  where conrelid = 'public.leads'::regclass
    and conname = 'leads_tenant_id_id_key';
  if constraint_definition is null
    or constraint_definition !~ 'UNIQUE \(tenant_id, id\)'
  then
    raise exception 'leads tenant composite key is missing';
  end if;

  foreach required_table in array array[
    'messages_tenant_conversation_fk',
    'leads_tenant_contact_fk',
    'leads_tenant_conversation_fk',
    'appointments_tenant_contact_fk',
    'appointments_tenant_lead_fk',
    'workflow_logs_tenant_conversation_fk'
  ]
  loop
    select pg_get_constraintdef(oid)
    into constraint_definition
    from pg_constraint
    where conname = required_table
      and contype = 'f';

    if constraint_definition is null
      or constraint_definition
        !~ 'FOREIGN KEY \(tenant_id, [a-z_]+\)'
      or constraint_definition
        !~ 'REFERENCES (public\.)?[a-z_]+\(tenant_id, id\)'
      or constraint_definition !~ 'ON DELETE (CASCADE|SET NULL)'
    then
      raise exception
        'invalid tenant composite foreign key %: %',
        required_table,
        coalesce(constraint_definition, '<missing>');
    end if;
  end loop;

  foreach privilege_name in array array[
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'REFERENCES',
    'TRIGGER'
  ]
  loop
    if not has_table_privilege(
      'service_role',
      'public.webhook_events',
      privilege_name
    ) then
      raise exception
        'service_role lacks webhook_events %',
        privilege_name;
    end if;
  end loop;

  foreach privilege_name in array array['SELECT', 'INSERT', 'UPDATE']
  loop
    if not has_table_privilege(
      'authenticated',
      'public.webhook_events',
      privilege_name
    ) then
      raise exception
        'authenticated lacks webhook_events %',
        privilege_name;
    end if;
  end loop;

  if has_table_privilege(
    'authenticated',
    'public.webhook_events',
    'DELETE'
  ) then
    raise exception 'authenticated unexpectedly has webhook_events DELETE';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.workflow_transition_logs'::regclass
      and tgname = 'workflow_transition_logs_immutable'
      and tgenabled <> 'D'
  ) then
    raise exception 'immutable workflow log trigger is missing or disabled';
  end if;

  select procedure.prosecdef
  into strict commit_is_definer
  from pg_proc procedure
  join pg_namespace namespace
    on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname = 'commit_workflow_transition';

  if commit_is_definer then
    raise exception 'commit_workflow_transition must be SECURITY INVOKER';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tenants'
      and column_name = 'whatsapp_phone_number_id'
  ) then
    raise exception 'tenants.whatsapp_phone_number_id is missing';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tenants'::regclass
      and conname = 'tenants_whatsapp_phone_number_id_key'
      and contype = 'u'
  ) then
    raise exception 'tenants.whatsapp_phone_number_id is not unique';
  end if;

  raise notice
    'PASS: XeroWA multi-tenant staging migration controls verified';
end
$verifier$;
