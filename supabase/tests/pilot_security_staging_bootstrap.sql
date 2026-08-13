\set ON_ERROR_STOP on

create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

create schema auth;
create schema storage;

grant usage on schema public, auth, storage to anon, authenticated, service_role;

create function auth.uid()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(pg_catalog.current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  name text not null
);

create function storage.foldername(path text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.string_to_array(path, '/');
$$;

create table public.builders (
  id uuid primary key
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.builders(id) on delete cascade
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  builder_id uuid
);

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  active boolean not null default true,
  unique (business_id, user_id)
);

do $$
declare
  table_name text;
  direct_tables text[] := array[
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
begin
  foreach table_name in array direct_tables loop
    execute pg_catalog.format(
      'create table public.%I (id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade)',
      table_name
    );
  end loop;
end
$$;

create table public.lead_qualification_answers (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads(id) on delete cascade
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['leads', 'follow_up_queue', 'whatsapp_messages', 'agent_runs'] loop
    execute pg_catalog.format(
      'create table public.%I (id uuid primary key default gen_random_uuid(), builder_id uuid references public.builders(id) on delete cascade)',
      table_name
    );
  end loop;
end
$$;

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant select, insert, update, delete on table storage.objects to authenticated, service_role;

