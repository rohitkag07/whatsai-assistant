-- XeroWA Phase 4B: authenticated, tenant-bound command receipts and
-- immutable onboarding publication history. This migration deliberately
-- performs no external messaging and creates no provider-side effects.

create extension if not exists pgcrypto with schema extensions;

alter table public.conversation_threads add column if not exists version bigint not null default 0;
alter table public.handoff_events add column if not exists version bigint not null default 0;
alter table public.followup_jobs add column if not exists version bigint not null default 0;
alter table public.appointments add column if not exists version bigint not null default 0;

create table if not exists public.control_command_receipts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  operation text not null check (operation in (
    'assign_owner', 'acknowledge_handoff', 'human_takeover',
    'pause_automation', 'resume_automation', 'decide_followup',
    'decide_appointment', 'record_outcome', 'save_configuration',
    'approve_configuration', 'publish_configuration'
  )),
  resource_id uuid not null,
  idempotency_key uuid not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  expected_version bigint,
  reason text not null check (char_length(reason) between 3 and 1000),
  evidence_reference text check (evidence_reference is null or char_length(evidence_reference) <= 1000),
  status text not null check (status in ('succeeded', 'rejected')),
  result jsonb not null default '{}'::jsonb,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  completed_at timestamptz not null default now(),
  unique (business_id, operation, idempotency_key)
);

create table if not exists public.control_audit_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  receipt_id uuid not null references public.control_command_receipts(id) on delete restrict,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  operation text not null,
  resource_id uuid not null,
  event_type text not null,
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.control_outcomes (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  thread_id uuid not null references public.conversation_threads(id) on delete restrict,
  outcome text not null check (outcome in ('qualified', 'appointment_confirmed', 'won', 'lost', 'resolved')),
  evidence_reference text not null check (char_length(evidence_reference) between 3 and 1000),
  verified_by uuid not null references auth.users(id) on delete restrict,
  version bigint not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.onboarding_configuration_versions (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  schema_version integer not null check (schema_version = 1),
  template_id text not null,
  version bigint not null,
  payload jsonb not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique (business_id, id, version),
  unique (business_id, payload_hash)
);

create table if not exists public.onboarding_configuration_approvals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  configuration_id uuid not null references public.onboarding_configuration_versions(id) on delete restrict,
  payload_hash text not null,
  approved_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  unique (business_id, configuration_id, payload_hash)
);

create table if not exists public.business_configuration_publications (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  configuration_id uuid not null references public.onboarding_configuration_versions(id) on delete restrict,
  payload_hash text not null,
  published_by uuid not null references auth.users(id) on delete restrict,
  revision bigint not null default 1,
  published_at timestamptz not null default now()
);

create index if not exists control_receipts_business_completed_idx
  on public.control_command_receipts (business_id, completed_at desc);
create index if not exists control_audit_business_occurred_idx
  on public.control_audit_events (business_id, occurred_at desc);

alter table public.control_command_receipts enable row level security;
alter table public.control_audit_events enable row level security;
alter table public.control_outcomes enable row level security;
alter table public.onboarding_configuration_versions enable row level security;
alter table public.onboarding_configuration_approvals enable row level security;
alter table public.business_configuration_publications enable row level security;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
create or replace function private.is_active_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business_id
      and user_id = auth.uid()
      and active = true
  );
$$;
revoke all on function private.is_active_business_member(uuid) from public, anon, authenticated;
grant execute on function private.is_active_business_member(uuid) to authenticated;

revoke all on table public.control_command_receipts, public.control_audit_events,
  public.control_outcomes, public.onboarding_configuration_versions,
  public.onboarding_configuration_approvals, public.business_configuration_publications
  from anon, authenticated;
grant select on table public.control_command_receipts, public.control_audit_events,
  public.control_outcomes, public.onboarding_configuration_versions,
  public.onboarding_configuration_approvals, public.business_configuration_publications
  to authenticated;

create policy control_receipts_member_select on public.control_command_receipts
  for select to authenticated using (private.is_active_business_member(business_id));
create policy control_audit_member_select on public.control_audit_events
  for select to authenticated using (private.is_active_business_member(business_id));
create policy control_outcomes_member_select on public.control_outcomes
  for select to authenticated using (private.is_active_business_member(business_id));
create policy onboarding_versions_member_select on public.onboarding_configuration_versions
  for select to authenticated using (private.is_active_business_member(business_id));
create policy onboarding_approvals_member_select on public.onboarding_configuration_approvals
  for select to authenticated using (private.is_active_business_member(business_id));
create policy business_publications_member_select on public.business_configuration_publications
  for select to authenticated using (private.is_active_business_member(business_id));

create or replace function public.execute_xerowa_control_command(
  p_business_id uuid,
  p_operation text,
  p_resource_id uuid,
  p_idempotency_key uuid,
  p_payload jsonb,
  p_payload_hash text,
  p_expected_version bigint,
  p_reason text,
  p_evidence_reference text,
  p_issued_at timestamptz,
  p_expires_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_existing public.control_command_receipts%rowtype;
  v_receipt public.control_command_receipts%rowtype;
  v_version bigint;
  v_event text;
  v_target_user uuid;
  v_decision text;
  v_thread_id uuid;
  v_command_hash text;
  v_configuration_hash text;
begin
  if v_actor is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_payload_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_payload_hash' using errcode = '22023'; end if;
  if p_issued_at > now() + interval '30 seconds' or p_expires_at <= now() or
     p_expires_at > p_issued_at + interval '24 hours' then
    raise exception 'command_expired_or_invalid' using errcode = '22023';
  end if;
  if char_length(p_reason) not between 3 and 1000 then raise exception 'invalid_reason' using errcode = '22023'; end if;
  v_command_hash := encode(digest(convert_to(jsonb_build_object(
    'operation', p_operation,
    'resource_id', p_resource_id,
    'payload', p_payload,
    'expected_version', p_expected_version
  )::text, 'utf8'), 'sha256'), 'hex');

  select role into v_role from public.business_members
   where business_id = p_business_id and user_id = v_actor and active = true;
  if v_role is null then raise exception 'business_membership_required' using errcode = '42501'; end if;

  select * into v_existing from public.control_command_receipts
   where business_id = p_business_id and operation = p_operation and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.payload_hash <> v_command_hash then
      raise exception 'idempotency_payload_mismatch' using errcode = '23505';
    end if;
    return jsonb_build_object('receipt_id', v_existing.id, 'status', v_existing.status,
      'replayed', true, 'result', v_existing.result);
  end if;

  if p_operation in ('assign_owner','pause_automation','resume_automation','decide_followup',
                     'decide_appointment','record_outcome','save_configuration',
                     'approve_configuration','publish_configuration')
     and v_role not in ('owner','manager') then
    raise exception 'owner_or_manager_required' using errcode = '42501';
  end if;
  if v_role = 'viewer' then raise exception 'viewer_is_read_only' using errcode = '42501'; end if;

  if p_operation = 'assign_owner' then
    v_target_user := nullif(p_payload->>'target_user_id','')::uuid;
    if not exists (select 1 from public.business_members where business_id = p_business_id and user_id = v_target_user and active) then
      raise exception 'target_member_invalid' using errcode = '23503';
    end if;
    update public.conversation_threads set assigned_user_id = v_target_user,
      assigned_to = coalesce(p_payload->>'target_display_name', assigned_to), version = version + 1
      where id = p_resource_id and business_id = p_business_id and version = p_expected_version returning version into v_version;
    v_event := 'assignment_changed';
  elsif p_operation = 'acknowledge_handoff' then
    update public.handoff_events set status = 'acknowledged', version = version + 1
      where id = p_resource_id and business_id = p_business_id and version = p_expected_version returning version into v_version;
    v_event := 'handoff_acknowledged';
  elsif p_operation in ('human_takeover','pause_automation','resume_automation') then
    update public.conversation_threads set ai_mode = case when p_operation = 'resume_automation' then 'assistant' else 'manual' end,
      version = version + 1 where id = p_resource_id and business_id = p_business_id and version = p_expected_version returning version into v_version;
    v_event := case p_operation when 'human_takeover' then 'takeover_started' when 'pause_automation' then 'automation_paused' else 'automation_resumed' end;
  elsif p_operation = 'decide_followup' then
    v_decision := p_payload->>'decision';
    if v_decision not in ('approved','rejected') then raise exception 'invalid_decision' using errcode = '22023'; end if;
    update public.followup_jobs set status = v_decision, version = version + 1
      where id = p_resource_id and business_id = p_business_id and version = p_expected_version returning version into v_version;
    v_event := 'followup_' || v_decision;
  elsif p_operation = 'decide_appointment' then
    v_decision := p_payload->>'decision';
    if v_decision not in ('confirmed','rescheduled','cancelled') then raise exception 'invalid_decision' using errcode = '22023'; end if;
    update public.appointments set status = v_decision,
      scheduled_at = case when v_decision = 'rescheduled' then (p_payload->>'scheduled_at')::timestamptz else scheduled_at end,
      version = version + 1 where id = p_resource_id and business_id = p_business_id and version = p_expected_version returning version into v_version;
    v_event := 'appointment_' || v_decision;
  elsif p_operation = 'record_outcome' then
    v_thread_id := nullif(p_payload->>'thread_id','')::uuid;
    if not exists (select 1 from public.conversation_threads where id = v_thread_id and business_id = p_business_id) then
      raise exception 'thread_not_found' using errcode = '23503';
    end if;
    insert into public.control_outcomes(id,business_id,thread_id,outcome,evidence_reference,verified_by)
      values (p_resource_id,p_business_id,v_thread_id,p_payload->>'outcome',p_evidence_reference,v_actor);
    v_version := 1; v_event := 'outcome_verified';
  elsif p_operation = 'save_configuration' then
    v_configuration_hash := encode(digest(convert_to((p_payload->'configuration')::text, 'utf8'), 'sha256'), 'hex');
    insert into public.onboarding_configuration_versions(id,business_id,created_by,schema_version,template_id,version,payload,payload_hash)
      values (p_resource_id,p_business_id,v_actor,1,p_payload->>'template_id',coalesce(p_expected_version,0)+1,p_payload->'configuration',v_configuration_hash);
    v_version := coalesce(p_expected_version,0)+1; v_event := 'configuration_saved';
  elsif p_operation = 'approve_configuration' then
    if not exists (select 1 from public.onboarding_configuration_versions where id=p_resource_id and business_id=p_business_id and payload_hash=p_payload->>'configuration_hash') then
      raise exception 'configuration_hash_mismatch' using errcode = '23503';
    end if;
    if (p_payload->>'approval_expires_at')::timestamptz <= now() or
       (p_payload->>'approval_expires_at')::timestamptz > now() + interval '24 hours' then
      raise exception 'invalid_approval_expiry' using errcode = '22023';
    end if;
    insert into public.onboarding_configuration_approvals(business_id,configuration_id,payload_hash,approved_by,expires_at)
      values (p_business_id,p_resource_id,p_payload->>'configuration_hash',v_actor,(p_payload->>'approval_expires_at')::timestamptz);
    v_version := 1; v_event := 'configuration_approved';
  elsif p_operation = 'publish_configuration' then
    if not exists (select 1 from public.onboarding_configuration_approvals a where a.business_id=p_business_id and a.configuration_id=p_resource_id and a.payload_hash=p_payload->>'configuration_hash' and a.revoked_at is null and a.expires_at>now()) then
      raise exception 'valid_approval_required' using errcode = '42501';
    end if;
    insert into public.business_configuration_publications(business_id,configuration_id,payload_hash,published_by)
      values (p_business_id,p_resource_id,p_payload->>'configuration_hash',v_actor)
      on conflict (business_id) do update set configuration_id=excluded.configuration_id,payload_hash=excluded.payload_hash,
        published_by=excluded.published_by,revision=public.business_configuration_publications.revision+1,published_at=now()
      where public.business_configuration_publications.revision = p_expected_version
      returning revision into v_version;
    v_event := 'configuration_published';
  else
    raise exception 'unsupported_operation' using errcode = '22023';
  end if;

  if v_version is null then raise exception 'resource_not_found_or_version_conflict' using errcode = '40001'; end if;
  insert into public.control_command_receipts(business_id,actor_user_id,operation,resource_id,idempotency_key,payload_hash,
    expected_version,reason,evidence_reference,status,result,issued_at,expires_at)
  values (p_business_id,v_actor,p_operation,p_resource_id,p_idempotency_key,v_command_hash,p_expected_version,p_reason,
    p_evidence_reference,'succeeded',jsonb_build_object('version',v_version,'event',v_event),p_issued_at,p_expires_at)
  returning * into v_receipt;
  insert into public.control_audit_events(business_id,receipt_id,actor_user_id,operation,resource_id,event_type,evidence)
  values (p_business_id,v_receipt.id,v_actor,p_operation,p_resource_id,v_event,
    jsonb_build_object('payload_hash',v_command_hash,'reason',p_reason,'evidence_reference',p_evidence_reference));
  return jsonb_build_object('receipt_id',v_receipt.id,'status','succeeded','replayed',false,'result',
    v_receipt.result || case when p_operation = 'save_configuration' then jsonb_build_object('configuration_hash',v_configuration_hash) else '{}'::jsonb end);
end;
$$;

revoke all on function public.execute_xerowa_control_command(uuid,text,uuid,uuid,jsonb,text,bigint,text,text,timestamptz,timestamptz) from public, anon;
grant execute on function public.execute_xerowa_control_command(uuid,text,uuid,uuid,jsonb,text,bigint,text,text,timestamptz,timestamptz) to authenticated;

comment on function public.execute_xerowa_control_command(uuid,text,uuid,uuid,jsonb,text,bigint,text,text,timestamptz,timestamptz)
  is 'Tenant-bound XeroWA control command. No external sends or provider effects.';
