-- Pin search_path on legacy helper and trigger functions reported by the
-- Supabase advisor. All relation references are already schema-qualified.

do $$
begin
  if pg_catalog.to_regprocedure('public.set_updated_at()') is not null then
    alter function public.set_updated_at() set search_path = '';
  end if;

  if pg_catalog.to_regprocedure('public.auth_builder_id()') is not null then
    alter function public.auth_builder_id() set search_path = '';
  end if;

  if pg_catalog.to_regprocedure('public.seed_setup_checklist(uuid)') is not null then
    alter function public.seed_setup_checklist(uuid) set search_path = '';
  end if;

  if pg_catalog.to_regprocedure('public.whatsai_touch_updated_at()') is not null then
    alter function public.whatsai_touch_updated_at() set search_path = '';
  end if;
end
$$;
