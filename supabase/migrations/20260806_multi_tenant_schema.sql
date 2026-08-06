-- XeroWA AI institutional multi-tenant core.
-- This migration is additive: legacy builder-scoped lead rows retain their
-- builder_id authorization path until they are deliberately backfilled.

create schema if not exists private;

do $$
begin
  create type public.xerowa_tenant_status as enum (
    'trial',
    'active',
    'paused',
    'suspended',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.xerowa_tenant_role as enum (
    'owner',
    'admin',
    'agent',
    'viewer'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.xerowa_conversation_status as enum (
    'open',
    'qualified',
    'handoff',
    'resolved',
    'archived'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.xerowa_message_direction as enum ('inbound', 'outbound');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.xerowa_message_status as enum (
    'received',
    'queued',
    'sent',
    'delivered',
    'read',
    'failed'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  legacy_builder_id uuid unique references public.builders(id) on delete set null,
  name text not null,
  legal_name text,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  whatsapp_phone_number_id text unique
    check (
      whatsapp_phone_number_id is null
      or btrim(whatsapp_phone_number_id) <> ''
    ),
  status public.xerowa_tenant_status not null default 'trial',
  timezone text not null default 'Asia/Kolkata',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenants
  add column if not exists whatsapp_phone_number_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tenants_whatsapp_phone_number_id_key'
      and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_whatsapp_phone_number_id_key
      unique (whatsapp_phone_number_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tenants_whatsapp_phone_number_id_nonempty'
      and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_whatsapp_phone_number_id_nonempty
      check (
        whatsapp_phone_number_id is null
        or btrim(whatsapp_phone_number_id) <> ''
      );
  end if;
end
$$;

create table if not exists public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.xerowa_tenant_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists tenant_memberships_user_tenant_idx
  on public.tenant_memberships (user_id, tenant_id);

create or replace function private.is_tenant_member(check_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.tenant_memberships membership
      where membership.tenant_id = check_tenant_id
        and membership.user_id = (select auth.uid())
    );
$$;

create or replace function private.has_tenant_role(
  check_tenant_id uuid,
  allowed_roles public.xerowa_tenant_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.tenant_memberships membership
      where membership.tenant_id = check_tenant_id
        and membership.user_id = (select auth.uid())
        and membership.role = any(allowed_roles)
    );
$$;

create or replace function private.is_tenant_admin(check_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_tenant_role(
    check_tenant_id,
    array[
      'owner'::public.xerowa_tenant_role,
      'admin'::public.xerowa_tenant_role
    ]
  );
$$;

revoke all on function private.is_tenant_member(uuid) from public, anon;
revoke all on function private.has_tenant_role(uuid, public.xerowa_tenant_role[])
  from public, anon;
revoke all on function private.is_tenant_admin(uuid) from public, anon;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_tenant_member(uuid)
  to authenticated, service_role;
grant execute on function private.has_tenant_role(
  uuid,
  public.xerowa_tenant_role[]
) to authenticated, service_role;
grant execute on function private.is_tenant_admin(uuid)
  to authenticated, service_role;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text,
  phone text not null,
  email text,
  source text not null default 'whatsapp',
  tags text[] not null default array[]::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone),
  unique (tenant_id, id)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contacts_tenant_id_id_key'
      and conrelid = 'public.contacts'::regclass
  ) then
    alter table public.contacts
      add constraint contacts_tenant_id_id_key unique (tenant_id, id);
  end if;
end
$$;

create index if not exists contacts_tenant_created_idx
  on public.contacts (tenant_id, created_at desc);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid not null,
  channel text not null default 'whatsapp',
  external_thread_id text,
  status public.xerowa_conversation_status not null default 'open',
  assigned_user_id uuid references auth.users(id) on delete set null,
  current_state text not null default 'new',
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, channel, external_thread_id),
  unique (tenant_id, id),
  constraint conversations_tenant_contact_fk
    foreign key (tenant_id, contact_id)
    references public.contacts(tenant_id, id)
    on delete cascade
);

alter table public.conversations
  drop constraint if exists conversations_contact_id_fkey;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_tenant_id_id_key'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_tenant_id_id_key unique (tenant_id, id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_tenant_contact_fk'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_tenant_contact_fk
      foreign key (tenant_id, contact_id)
      references public.contacts(tenant_id, id)
      on delete cascade;
  end if;
end
$$;

create index if not exists conversations_tenant_last_message_idx
  on public.conversations (tenant_id, last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null,
  external_message_id text,
  direction public.xerowa_message_direction not null,
  message_type text not null default 'text',
  body text,
  status public.xerowa_message_status not null,
  received_at timestamptz,
  processed_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint messages_tenant_conversation_fk
    foreign key (tenant_id, conversation_id)
    references public.conversations(tenant_id, id)
    on delete cascade,
  constraint messages_processing_order_check
    check (
      processed_at is null
      or received_at is null
      or processed_at >= received_at
    )
);

create unique index if not exists messages_tenant_external_id_idx
  on public.messages (tenant_id, external_message_id)
  where external_message_id is not null;

create index if not exists messages_tenant_created_idx
  on public.messages (tenant_id, created_at desc);

-- The original X7 RealEstate leads table remains the source of truth.
alter table public.leads
  add column if not exists tenant_id uuid
    references public.tenants(id) on delete cascade,
  add column if not exists contact_id uuid,
  add column if not exists conversation_id uuid,
  add column if not exists score_reasons jsonb not null default '[]'::jsonb,
  add column if not exists explicit_site_visit_requested boolean
    not null default false,
  add column if not exists qualified_at timestamptz;

alter table public.leads
  drop constraint if exists leads_contact_id_fkey,
  drop constraint if exists leads_conversation_id_fkey;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_tenant_id_id_key'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_tenant_id_id_key unique (tenant_id, id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_tenant_contact_fk'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_tenant_contact_fk
      foreign key (tenant_id, contact_id)
      references public.contacts(tenant_id, id)
      on delete set null (contact_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_tenant_conversation_fk'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_tenant_conversation_fk
      foreign key (tenant_id, conversation_id)
      references public.conversations(tenant_id, id)
      on delete set null (conversation_id);
  end if;
end
$$;

create index if not exists leads_tenant_created_idx
  on public.leads (tenant_id, created_at desc);
create index if not exists leads_tenant_contact_idx
  on public.leads (tenant_id, contact_id);
create index if not exists leads_tenant_conversation_idx
  on public.leads (tenant_id, conversation_id);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid,
  lead_id uuid,
  appointment_type text not null,
  status text not null default 'scheduled'
    check (
      status in (
        'scheduled',
        'confirmed',
        'completed',
        'cancelled',
        'no_show'
      )
    ),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  constraint appointments_tenant_contact_fk
    foreign key (tenant_id, contact_id)
    references public.contacts(tenant_id, id)
    on delete set null (contact_id),
  constraint appointments_tenant_lead_fk
    foreign key (tenant_id, lead_id)
    references public.leads(tenant_id, id)
    on delete set null (lead_id)
);

-- `appointments` already exists in the legacy WhatsAI schema. Keep legacy
-- rows usable while adding the tenant-native shape required by the new core.
alter table public.appointments
  add column if not exists tenant_id uuid
    references public.tenants(id) on delete cascade,
  add column if not exists lead_id uuid,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists location text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  -- These columns exist only in the pre-multi-tenant WhatsAI schema. Dynamic
  -- statements keep this migration valid on both upgraded and fresh databases.
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'scheduled_at'
  ) then
    execute $sql$
      update public.appointments
      set starts_at = scheduled_at
      where starts_at is null
        and scheduled_at is not null
    $sql$;

    alter table public.appointments
      alter column scheduled_at drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'business_id'
  ) then
    alter table public.appointments
      alter column business_id drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'contact_id'
  ) then
    alter table public.appointments
      alter column contact_id drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'title'
  ) then
    alter table public.appointments
      alter column title drop not null;
  end if;
end
$$;

alter table public.appointments
  drop constraint if exists appointments_contact_id_fkey,
  drop constraint if exists appointments_lead_id_fkey,
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (
    status in (
      'scheduled',
      'confirmed',
      'completed',
      'cancelled',
      'no_show'
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_tenant_contact_fk'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_tenant_contact_fk
      foreign key (tenant_id, contact_id)
      references public.contacts(tenant_id, id)
      on delete set null (contact_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_tenant_lead_fk'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_tenant_lead_fk
      foreign key (tenant_id, lead_id)
      references public.leads(tenant_id, id)
      on delete set null (lead_id);
  end if;
end
$$;

create index if not exists appointments_tenant_starts_idx
  on public.appointments (tenant_id, starts_at);
create index if not exists appointments_tenant_contact_idx
  on public.appointments (tenant_id, contact_id);
create index if not exists appointments_tenant_lead_idx
  on public.appointments (tenant_id, lead_id);

create table if not exists public.workflow_transition_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id text not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid,
  playbook_id text not null,
  playbook_version text not null,
  transition_id text,
  event text not null,
  from_state text not null,
  to_state text not null,
  outcome text not null
    check (outcome in ('applied', 'rejected', 'action_failed')),
  guard_results jsonb not null default '[]'::jsonb,
  action_results jsonb not null default '[]'::jsonb,
  context_snapshot jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (tenant_id, execution_id),
  constraint workflow_logs_tenant_conversation_fk
    foreign key (tenant_id, conversation_id)
    references public.conversations(tenant_id, id)
    on delete set null (conversation_id)
);

alter table public.workflow_transition_logs
  add column if not exists execution_id text,
  add column if not exists playbook_version text,
  add column if not exists transition_id text;

drop trigger if exists workflow_transition_logs_immutable
  on public.workflow_transition_logs;

update public.workflow_transition_logs
set
  execution_id = coalesce(execution_id, id::text),
  playbook_version = coalesce(playbook_version, 'legacy');

alter table public.workflow_transition_logs
  alter column execution_id set not null,
  alter column playbook_version set not null;

alter table public.workflow_transition_logs
  drop constraint if exists workflow_transition_logs_conversation_id_fkey;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workflow_transition_logs_tenant_id_execution_id_key'
      and conrelid = 'public.workflow_transition_logs'::regclass
  ) then
    alter table public.workflow_transition_logs
      add constraint workflow_transition_logs_tenant_id_execution_id_key
      unique (tenant_id, execution_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'workflow_logs_tenant_conversation_fk'
      and conrelid = 'public.workflow_transition_logs'::regclass
  ) then
    alter table public.workflow_transition_logs
      add constraint workflow_logs_tenant_conversation_fk
      foreign key (tenant_id, conversation_id)
      references public.conversations(tenant_id, id)
      on delete set null (conversation_id);
  end if;
end
$$;

create index if not exists workflow_logs_tenant_created_idx
  on public.workflow_transition_logs (tenant_id, created_at desc);
create index if not exists workflow_logs_tenant_conversation_idx
  on public.workflow_transition_logs (tenant_id, conversation_id);

create table if not exists public.webhook_events (
  event_id text primary key,
  tenant_id uuid references public.tenants(id) on delete set null,
  provider text not null default 'meta',
  event_type text,
  payload_sha256 text not null,
  processing_status text not null default 'claimed'
    check (processing_status in ('claimed', 'processed', 'failed')),
  processing_ms integer check (processing_ms is null or processing_ms >= 0),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists webhook_events_tenant_received_idx
  on public.webhook_events (tenant_id, received_at desc);

create or replace function private.prevent_immutable_log_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'workflow_transition_logs are immutable'
    using errcode = '55000';
end;
$$;

drop trigger if exists workflow_transition_logs_immutable
  on public.workflow_transition_logs;
create trigger workflow_transition_logs_immutable
  before update or delete on public.workflow_transition_logs
  for each row execute function private.prevent_immutable_log_change();

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

drop trigger if exists tenant_memberships_set_updated_at
  on public.tenant_memberships;
create trigger tenant_memberships_set_updated_at
  before update on public.tenant_memberships
  for each row execute function public.set_updated_at();

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.appointments enable row level security;
alter table public.workflow_transition_logs enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists tenants_member_select on public.tenants;
create policy tenants_member_select on public.tenants
  for select to authenticated
  using ((select private.is_tenant_member(id)));

drop policy if exists tenants_admin_update on public.tenants;
create policy tenants_admin_update on public.tenants
  for update to authenticated
  using (
    (select private.has_tenant_role(
      id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role
      ]
    ))
  )
  with check (
    (select private.has_tenant_role(
      id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role
      ]
    ))
  );

drop policy if exists memberships_member_select on public.tenant_memberships;
create policy memberships_member_select on public.tenant_memberships
  for select to authenticated
  using ((select private.is_tenant_member(tenant_id)));

drop policy if exists memberships_admin_insert on public.tenant_memberships;
drop policy if exists memberships_admin_update on public.tenant_memberships;
drop policy if exists memberships_admin_delete on public.tenant_memberships;

drop policy if exists memberships_insert_owner on public.tenant_memberships;
create policy memberships_insert_owner on public.tenant_memberships
  for insert to authenticated
  with check (
    (select private.has_tenant_role(
      tenant_id,
      array['owner'::public.xerowa_tenant_role]
    ))
  );

drop policy if exists memberships_update_owner on public.tenant_memberships;
create policy memberships_update_owner on public.tenant_memberships
  for update to authenticated
  using (
    (select private.has_tenant_role(
      tenant_id,
      array['owner'::public.xerowa_tenant_role]
    ))
  )
  with check (
    (select private.has_tenant_role(
      tenant_id,
      array['owner'::public.xerowa_tenant_role]
    ))
  );

drop policy if exists memberships_delete_owner on public.tenant_memberships;
create policy memberships_delete_owner on public.tenant_memberships
  for delete to authenticated
  using (
    (select private.has_tenant_role(
      tenant_id,
      array['owner'::public.xerowa_tenant_role]
    ))
  );

-- Viewers can read tenant data. Only owners, admins, and agents can mutate it.
drop policy if exists contacts_tenant_access on public.contacts;
drop policy if exists contacts_tenant_select on public.contacts;
create policy contacts_tenant_select on public.contacts
  for select to authenticated
  using ((select private.is_tenant_member(tenant_id)));
drop policy if exists contacts_tenant_insert on public.contacts;
create policy contacts_tenant_insert on public.contacts
  for insert to authenticated
  with check (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  );
drop policy if exists contacts_tenant_update on public.contacts;
create policy contacts_tenant_update on public.contacts
  for update to authenticated
  using (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  )
  with check (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  );
drop policy if exists contacts_tenant_delete on public.contacts;
create policy contacts_tenant_delete on public.contacts
  for delete to authenticated
  using (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  );

drop policy if exists conversations_tenant_access on public.conversations;
drop policy if exists conversations_tenant_select on public.conversations;
create policy conversations_tenant_select on public.conversations
  for select to authenticated
  using ((select private.is_tenant_member(tenant_id)));
drop policy if exists conversations_tenant_insert on public.conversations;
create policy conversations_tenant_insert on public.conversations
  for insert to authenticated
  with check (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  );
drop policy if exists conversations_tenant_update on public.conversations;
create policy conversations_tenant_update on public.conversations
  for update to authenticated
  using (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  )
  with check (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  );
drop policy if exists conversations_tenant_delete on public.conversations;
create policy conversations_tenant_delete on public.conversations
  for delete to authenticated
  using (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  );

drop policy if exists messages_tenant_access on public.messages;
drop policy if exists messages_tenant_select on public.messages;
create policy messages_tenant_select on public.messages
  for select to authenticated
  using ((select private.is_tenant_member(tenant_id)));
drop policy if exists messages_tenant_insert on public.messages;
create policy messages_tenant_insert on public.messages
  for insert to authenticated
  with check (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  );
drop policy if exists messages_tenant_update on public.messages;
create policy messages_tenant_update on public.messages
  for update to authenticated
  using (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  )
  with check (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  );
drop policy if exists messages_tenant_delete on public.messages;
create policy messages_tenant_delete on public.messages
  for delete to authenticated
  using (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  );

-- Existing null-tenant leads retain builder JWT isolation. New tenant rows
-- use membership for reads and operator roles for mutations.
drop policy if exists leads_tenant on public.leads;
drop policy if exists leads_multi_tenant_access on public.leads;
drop policy if exists leads_tenant_select on public.leads;
create policy leads_tenant_select on public.leads
  for select to authenticated
  using (
    case
      when tenant_id is not null
        then (select private.is_tenant_member(tenant_id))
      else builder_id = public.auth_builder_id()
    end
  );
drop policy if exists leads_tenant_insert on public.leads;
create policy leads_tenant_insert on public.leads
  for insert to authenticated
  with check (
    case
      when tenant_id is not null
        then (select private.has_tenant_role(
          tenant_id,
          array[
            'owner'::public.xerowa_tenant_role,
            'admin'::public.xerowa_tenant_role,
            'agent'::public.xerowa_tenant_role
          ]
        ))
      else builder_id = public.auth_builder_id()
    end
  );
drop policy if exists leads_tenant_update on public.leads;
create policy leads_tenant_update on public.leads
  for update to authenticated
  using (
    case
      when tenant_id is not null
        then (select private.has_tenant_role(
          tenant_id,
          array[
            'owner'::public.xerowa_tenant_role,
            'admin'::public.xerowa_tenant_role,
            'agent'::public.xerowa_tenant_role
          ]
        ))
      else builder_id = public.auth_builder_id()
    end
  )
  with check (
    case
      when tenant_id is not null
        then (select private.has_tenant_role(
          tenant_id,
          array[
            'owner'::public.xerowa_tenant_role,
            'admin'::public.xerowa_tenant_role,
            'agent'::public.xerowa_tenant_role
          ]
        ))
      else builder_id = public.auth_builder_id()
    end
  );
drop policy if exists leads_tenant_delete on public.leads;
create policy leads_tenant_delete on public.leads
  for delete to authenticated
  using (
    case
      when tenant_id is not null
        then (select private.has_tenant_role(
          tenant_id,
          array[
            'owner'::public.xerowa_tenant_role,
            'admin'::public.xerowa_tenant_role,
            'agent'::public.xerowa_tenant_role
          ]
        ))
      else builder_id = public.auth_builder_id()
    end
  );

drop policy if exists appointments_tenant_access on public.appointments;
drop policy if exists appointments_tenant_select on public.appointments;
create policy appointments_tenant_select on public.appointments
  for select to authenticated
  using (
    case
      when tenant_id is not null
        then (select private.is_tenant_member(tenant_id))
      else business_id = public.auth_builder_id()
    end
  );
drop policy if exists appointments_tenant_insert on public.appointments;
create policy appointments_tenant_insert on public.appointments
  for insert to authenticated
  with check (
    case
      when tenant_id is not null
        then (select private.has_tenant_role(
          tenant_id,
          array[
            'owner'::public.xerowa_tenant_role,
            'admin'::public.xerowa_tenant_role,
            'agent'::public.xerowa_tenant_role
          ]
        ))
      else business_id = public.auth_builder_id()
    end
  );
drop policy if exists appointments_tenant_update on public.appointments;
create policy appointments_tenant_update on public.appointments
  for update to authenticated
  using (
    case
      when tenant_id is not null
        then (select private.has_tenant_role(
          tenant_id,
          array[
            'owner'::public.xerowa_tenant_role,
            'admin'::public.xerowa_tenant_role,
            'agent'::public.xerowa_tenant_role
          ]
        ))
      else business_id = public.auth_builder_id()
    end
  )
  with check (
    case
      when tenant_id is not null
        then (select private.has_tenant_role(
          tenant_id,
          array[
            'owner'::public.xerowa_tenant_role,
            'admin'::public.xerowa_tenant_role,
            'agent'::public.xerowa_tenant_role
          ]
        ))
      else business_id = public.auth_builder_id()
    end
  );
drop policy if exists appointments_tenant_delete on public.appointments;
create policy appointments_tenant_delete on public.appointments
  for delete to authenticated
  using (
    case
      when tenant_id is not null
        then (select private.has_tenant_role(
          tenant_id,
          array[
            'owner'::public.xerowa_tenant_role,
            'admin'::public.xerowa_tenant_role,
            'agent'::public.xerowa_tenant_role
          ]
        ))
      else business_id = public.auth_builder_id()
    end
  );

drop policy if exists workflow_logs_member_select
  on public.workflow_transition_logs;
create policy workflow_logs_member_select on public.workflow_transition_logs
  for select to authenticated
  using ((select private.is_tenant_member(tenant_id)));

drop policy if exists workflow_logs_member_insert
  on public.workflow_transition_logs;
drop policy if exists workflow_logs_operator_insert
  on public.workflow_transition_logs;
create policy workflow_logs_operator_insert on public.workflow_transition_logs
  for insert to authenticated
  with check (
    (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
    and (created_by is null or created_by = (select auth.uid()))
  );

drop policy if exists webhook_events_member_select on public.webhook_events;
create policy webhook_events_member_select on public.webhook_events
  for select to authenticated
  using (
    tenant_id is not null
    and (select private.is_tenant_member(tenant_id))
  );

drop policy if exists webhook_events_operator_insert on public.webhook_events;
create policy webhook_events_operator_insert on public.webhook_events
  for insert to authenticated
  with check (
    tenant_id is not null
    and (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  );

drop policy if exists webhook_events_operator_update on public.webhook_events;
create policy webhook_events_operator_update on public.webhook_events
  for update to authenticated
  using (
    tenant_id is not null
    and (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  )
  with check (
    tenant_id is not null
    and (select private.has_tenant_role(
      tenant_id,
      array[
        'owner'::public.xerowa_tenant_role,
        'admin'::public.xerowa_tenant_role,
        'agent'::public.xerowa_tenant_role
      ]
    ))
  );

-- A security-invoker RPC gives the TypeScript executor one atomic database
-- boundary: compare-and-swap the conversation state and insert the immutable
-- log, including every action result, in the same transaction.
create or replace function public.commit_workflow_transition(
  p_log_id uuid,
  p_execution_id text,
  p_tenant_id uuid,
  p_conversation_id uuid,
  p_playbook_id text,
  p_playbook_version text,
  p_transition_id text,
  p_event text,
  p_expected_state text,
  p_next_state text,
  p_outcome text,
  p_guard_results jsonb,
  p_action_results jsonb,
  p_context_snapshot jsonb,
  p_error_message text
)
returns public.workflow_transition_logs
language plpgsql
security invoker
set search_path = ''
as $$
declare
  committed public.workflow_transition_logs;
begin
  select log_row.*
  into committed
  from public.workflow_transition_logs log_row
  where log_row.tenant_id = p_tenant_id
    and log_row.execution_id = p_execution_id;

  if found then
    return committed;
  end if;

  if p_outcome = 'applied' and p_conversation_id is not null then
    update public.conversations
    set
      current_state = p_next_state,
      updated_at = now()
    where tenant_id = p_tenant_id
      and id = p_conversation_id
      and current_state = p_expected_state;

    if not found then
      raise exception 'workflow state changed before atomic commit'
        using errcode = '40001';
    end if;
  end if;

  insert into public.workflow_transition_logs (
    id,
    execution_id,
    tenant_id,
    conversation_id,
    playbook_id,
    playbook_version,
    transition_id,
    event,
    from_state,
    to_state,
    outcome,
    guard_results,
    action_results,
    context_snapshot,
    error_message
  )
  values (
    p_log_id,
    p_execution_id,
    p_tenant_id,
    p_conversation_id,
    p_playbook_id,
    p_playbook_version,
    p_transition_id,
    p_event,
    p_expected_state,
    p_next_state,
    p_outcome,
    coalesce(p_guard_results, '[]'::jsonb),
    coalesce(p_action_results, '[]'::jsonb),
    coalesce(p_context_snapshot, '{}'::jsonb),
    p_error_message
  )
  returning * into committed;

  return committed;
end;
$$;

revoke all on function public.commit_workflow_transition(
  uuid,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  jsonb,
  jsonb,
  text
) from public, anon;
grant execute on function public.commit_workflow_transition(
  uuid,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  jsonb,
  jsonb,
  text
) to authenticated, service_role;

revoke all on table
  public.tenants,
  public.tenant_memberships,
  public.contacts,
  public.conversations,
  public.messages,
  public.leads,
  public.appointments,
  public.workflow_transition_logs,
  public.webhook_events
from public, anon;

grant select, insert, update, delete on table
  public.contacts,
  public.conversations,
  public.messages,
  public.leads,
  public.appointments
to authenticated;

grant select, update on table public.tenants to authenticated;
grant select, insert, update, delete on table
  public.tenant_memberships
to authenticated;
revoke all on table public.workflow_transition_logs from authenticated;
grant select, insert on table
  public.workflow_transition_logs
to authenticated;

revoke all on table public.webhook_events from authenticated;
grant select, insert, update on table
  public.webhook_events
to authenticated;

grant all on table
  public.tenants,
  public.tenant_memberships,
  public.contacts,
  public.conversations,
  public.messages,
  public.leads,
  public.appointments
to service_role;

grant select, insert on table
  public.workflow_transition_logs
to service_role;

grant all on table public.webhook_events to service_role;
