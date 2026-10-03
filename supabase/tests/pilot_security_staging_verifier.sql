\set ON_ERROR_STOP on

create function pg_temp.assert_true(condition boolean, label text)
returns void
language plpgsql
as $$
begin
  if condition is distinct from true then
    raise exception 'assertion_failed: %', label;
  end if;
end;
$$;

insert into public.builders (id) values
  ('10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000003');

insert into public.businesses (id, name, builder_id) values
  ('10000000-0000-0000-0000-000000000001', 'Business A', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Business B', '20000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000003', 'Retention Business', '30000000-0000-0000-0000-000000000003');

insert into public.business_members (business_id, user_id, role, active) values
  ('10000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'owner', true),
  ('10000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'client', true),
  ('10000000-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', 'admin', true);

insert into public.conversation_contacts (id, business_id) values
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('22000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'),
  ('33000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003');

set role authenticated;
select pg_catalog.set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);

select pg_temp.assert_true(
  (select pg_catalog.count(*) from public.conversation_contacts) = 1,
  'owner_reads_only_own_business'
);

do $$
begin
  begin
    insert into public.conversation_contacts (business_id)
    values ('20000000-0000-0000-0000-000000000002');
    raise exception 'owner_cross_business_insert_was_allowed';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

select pg_catalog.set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', false);

select pg_temp.assert_true(
  (select pg_catalog.count(*) from public.conversation_contacts) = 1,
  'viewer_reads_own_business'
);

do $$
begin
  begin
    insert into public.conversation_contacts (business_id)
    values ('10000000-0000-0000-0000-000000000001');
    raise exception 'viewer_insert_was_allowed';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

with changed as (
  update public.conversation_contacts
  set business_id = business_id
  where id = '11000000-0000-0000-0000-000000000001'
  returning id
)
select pg_temp.assert_true((select pg_catalog.count(*) from changed) = 0, 'viewer_update_denied');

with changed as (
  delete from public.conversation_contacts
  where id = '11000000-0000-0000-0000-000000000001'
  returning id
)
select pg_temp.assert_true((select pg_catalog.count(*) from changed) = 0, 'viewer_delete_denied');

select pg_catalog.set_config('request.jwt.claim.sub', 'cccccccc-0000-0000-0000-000000000003', false);

insert into public.conversation_contacts (business_id)
values ('10000000-0000-0000-0000-000000000001');

with changed as (
  update public.business_members
  set role = 'owner'
  where user_id = 'cccccccc-0000-0000-0000-000000000003'
  returning id
)
select pg_temp.assert_true((select pg_catalog.count(*) from changed) = 0, 'tenant_admin_self_promotion_denied');

with changed as (
  delete from public.business_members
  where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  returning id
)
select pg_temp.assert_true((select pg_catalog.count(*) from changed) = 0, 'tenant_admin_owner_delete_denied');

reset role;
select pg_catalog.set_config('request.jwt.claim.sub', '', false);

insert into public.projects (builder_id)
values ('30000000-0000-0000-0000-000000000003');
insert into public.leads (builder_id)
values ('30000000-0000-0000-0000-000000000003');
insert into public.follow_up_queue (builder_id)
values ('30000000-0000-0000-0000-000000000003');
insert into public.whatsapp_messages (builder_id)
values ('30000000-0000-0000-0000-000000000003');
insert into public.agent_runs (builder_id)
values ('30000000-0000-0000-0000-000000000003');

set role service_role;

select pg_temp.assert_true(
  (select allowed from public.consume_api_rate_limit(
    'staging-proof',
    repeat('a', 64),
    1,
    60
  )),
  'rate_limit_first_request_allowed'
);

select pg_temp.assert_true(
  not (select allowed from public.consume_api_rate_limit(
    'staging-proof',
    repeat('a', 64),
    1,
    60
  )),
  'rate_limit_second_request_denied'
);

select pg_temp.assert_true(
  (public.preview_business_retention_delete('30000000-0000-0000-0000-000000000003') #>> '{counts,conversation_contacts}')::integer = 1,
  'retention_preview_counts_generic_rows'
);

select pg_temp.assert_true(
  (public.preview_business_retention_delete('30000000-0000-0000-0000-000000000003') #>> '{counts,legacy_leads}')::integer = 1,
  'retention_preview_counts_legacy_rows'
);

do $$
begin
  begin
    perform public.execute_business_retention_delete(
      '30000000-0000-0000-0000-000000000003',
      'DELETE BUSINESS wrong-id',
      'staging-wrong-confirmation'
    );
    raise exception 'wrong_retention_confirmation_was_allowed';
  exception when raise_exception then
    if sqlerrm <> 'retention_confirmation_mismatch' then
      raise;
    end if;
  end;
end;
$$;

select pg_temp.assert_true(
  (public.execute_business_retention_delete(
    '30000000-0000-0000-0000-000000000003',
    'DELETE BUSINESS 30000000-0000-0000-0000-000000000003',
    'staging-retention-proof'
  ) ->> 'deleted')::boolean,
  'retention_execution_succeeds'
);

reset role;

select pg_temp.assert_true(
  not exists (select 1 from public.businesses where id = '30000000-0000-0000-0000-000000000003'),
  'retention_deletes_business'
);
select pg_temp.assert_true(
  not exists (select 1 from public.conversation_contacts where business_id = '30000000-0000-0000-0000-000000000003'),
  'retention_cascades_generic_rows'
);
select pg_temp.assert_true(
  not exists (select 1 from public.leads where builder_id = '30000000-0000-0000-0000-000000000003'),
  'retention_deletes_legacy_xerowa_rows'
);
select pg_temp.assert_true(
  exists (select 1 from public.builders where id = '30000000-0000-0000-0000-000000000003'),
  'retention_preserves_standalone_builder'
);
select pg_temp.assert_true(
  exists (select 1 from public.projects where builder_id = '30000000-0000-0000-0000-000000000003'),
  'retention_preserves_standalone_project'
);
select pg_temp.assert_true(
  (select pg_catalog.count(*) from private.business_retention_deletion_audit where request_reference = 'staging-retention-proof') = 1,
  'retention_writes_audit_receipt'
);
select pg_temp.assert_true(
  not pg_catalog.has_table_privilege('service_role', 'private.business_retention_deletion_audit', 'UPDATE'),
  'audit_receipt_update_denied'
);
select pg_temp.assert_true(
  not pg_catalog.has_table_privilege('service_role', 'private.business_retention_deletion_audit', 'DELETE'),
  'audit_receipt_delete_denied'
);

select 'pilot_security_staging_verifier_passed' as result;
