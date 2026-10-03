-- Close legacy public-schema surfaces reported by the Supabase security
-- advisor. These aggregate views are not consumed by the XeroWA browser app;
-- retain service-role access for trusted server diagnostics only.

do $$
declare
  target_view text;
  legacy_views text[] := array[
    'v_lead_funnel',
    'v_agent_activity_today',
    'v_content_pipeline',
    'v_campaign_today',
    'v_ghost_closer_funnel',
    'v_dispatch_queue_backlog',
    'v_defaulters',
    'v_ticket_sla',
    'v_monthly_collection'
  ];
begin
  foreach target_view in array legacy_views
  loop
    if pg_catalog.to_regclass('public.' || target_view) is null then
      continue;
    end if;

    execute pg_catalog.format(
      'alter view public.%I set (security_invoker = true)',
      target_view
    );
    execute pg_catalog.format(
      'revoke all privileges on table public.%I from public, anon, authenticated',
      target_view
    );
    execute pg_catalog.format(
      'grant select on table public.%I to service_role',
      target_view
    );
  end loop;

  if pg_catalog.to_regprocedure(
    'public.claim_broadcast_recipients(uuid,integer,text)'
  ) is not null then
    revoke all on function public.claim_broadcast_recipients(uuid, integer, text)
      from public, anon, authenticated;
    grant execute on function public.claim_broadcast_recipients(uuid, integer, text)
      to service_role;
  end if;

  if pg_catalog.to_regprocedure(
    'public.refresh_broadcast_campaign_metrics(uuid)'
  ) is not null then
    revoke all on function public.refresh_broadcast_campaign_metrics(uuid)
      from public, anon, authenticated;
    grant execute on function public.refresh_broadcast_campaign_metrics(uuid)
      to service_role;
  end if;
end
$$;
