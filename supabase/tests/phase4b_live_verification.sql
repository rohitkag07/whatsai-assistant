-- Staging-only rollback test. The final exception is intentional and proves
-- the entire test transaction, including command writes, was rolled back.
begin;
create temp table phase4b_test_results(name text, passed boolean, detail text);
grant insert, select on phase4b_test_results to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub','bfa46635-c850-410d-8c0b-cf456dcd4e13',true);
select set_config('request.jwt.claim.role','authenticated',true);
do $$
declare first_result jsonb; replay_result jsonb;
begin
  first_result := public.execute_xerowa_control_command(
    '10000000-0000-4000-8000-000000000001','save_configuration',
    '91000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001',
    '{"template_id":"gym","configuration":{"synthetic":true}}','0000000000000000000000000000000000000000000000000000000000000000',
    0,'Phase 4B staging verification','test:phase4b',now(),now()+interval '5 minutes');
  replay_result := public.execute_xerowa_control_command(
    '10000000-0000-4000-8000-000000000001','save_configuration',
    '91000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001',
    '{"template_id":"gym","configuration":{"synthetic":true}}','0000000000000000000000000000000000000000000000000000000000000000',
    0,'Phase 4B staging verification','test:phase4b',now(),now()+interval '5 minutes');
  insert into phase4b_test_results values
    ('owner_save_receipt', first_result->>'status'='succeeded', first_result::text),
    ('same_key_same_payload_replay', (replay_result->>'replayed')::boolean, replay_result::text);
end $$;

do $$ begin
  perform public.execute_xerowa_control_command(
    '10000000-0000-4000-8000-000000000001','save_configuration',
    '91000000-0000-4000-8000-000000000002','92000000-0000-4000-8000-000000000001',
    '{"template_id":"gym","configuration":{"changed":true}}','0000000000000000000000000000000000000000000000000000000000000000',
    0,'Phase 4B staging verification','test:phase4b',now(),now()+interval '5 minutes');
  insert into phase4b_test_results values ('same_key_changed_payload_denied',false,'unexpected success');
exception when unique_violation then
  insert into phase4b_test_results values ('same_key_changed_payload_denied',true,sqlstate);
end $$;

do $$ begin
  perform public.execute_xerowa_control_command(
    '10000000-0000-4000-8000-000000000002','human_takeover',
    '20000000-0000-4000-8000-000000000002',gen_random_uuid(),'{}',
    '0000000000000000000000000000000000000000000000000000000000000000',0,
    'Cross tenant denial verification','test:phase4b',now(),now()+interval '5 minutes');
  insert into phase4b_test_results values ('cross_tenant_mutation_denied',false,'unexpected success');
exception when insufficient_privilege then
  insert into phase4b_test_results values ('cross_tenant_mutation_denied',true,sqlstate);
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','05adda5c-1a9d-4795-83a3-1d3f6f135b3e',true);
do $$ begin
  perform public.execute_xerowa_control_command(
    '10000000-0000-4000-8000-000000000001','human_takeover',
    '20000000-0000-4000-8000-000000000001',gen_random_uuid(),'{}',
    '0000000000000000000000000000000000000000000000000000000000000000',0,
    'Viewer denial verification','test:phase4b',now(),now()+interval '5 minutes');
  insert into phase4b_test_results values ('viewer_mutation_denied',false,'unexpected success');
exception when insufficient_privilege then
  insert into phase4b_test_results values ('viewer_mutation_denied',true,sqlstate);
end $$;

reset role;
update public.business_members set active=false where user_id='0a14128c-dbe6-4517-9b86-b96a3b597962';
set local role authenticated;
select set_config('request.jwt.claim.sub','0a14128c-dbe6-4517-9b86-b96a3b597962',true);
do $$ declare visible_rows integer; begin
  select (select count(*) from public.businesses) +
         (select count(*) from public.control_command_receipts) +
         (select count(*) from public.control_audit_events) into visible_rows;
  insert into phase4b_test_results values ('inactive_member_reads_zero',visible_rows=0,visible_rows::text);
end $$;

reset role;
do $$ declare summary jsonb; failed integer; begin
  select jsonb_agg(jsonb_build_object('name',name,'passed',passed,'detail',detail) order by name),
         count(*) filter (where not passed)
    into summary, failed from phase4b_test_results;
  raise exception 'PHASE4B_ROLLBACK_TEST failed=% results=%',failed,summary;
end $$;
