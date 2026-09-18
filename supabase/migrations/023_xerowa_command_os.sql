-- =====================================================================
-- XeroWA Command OS — Supervised Company Operating Layer
-- =====================================================================
-- Single-Hermes-profile safety foundation: read/draft/reversible actions
-- can be prepared, while external/critical actions require approval.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.ai_os_mode AS ENUM ('read_only', 'supervised', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.agent_risk_level AS ENUM ('L0', 'L1', 'L2', 'L3', 'L4');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.agent_action_status AS ENUM ('proposed', 'drafted', 'queued', 'approved', 'rejected', 'executed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_os_settings (
  id                         boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  mode                       public.ai_os_mode NOT NULL DEFAULT 'supervised',
  external_comms_enabled     boolean NOT NULL DEFAULT false,
  production_writes_enabled  boolean NOT NULL DEFAULT false,
  deployments_enabled        boolean NOT NULL DEFAULT false,
  cron_enabled               boolean NOT NULL DEFAULT true,
  mcp_writes_enabled         boolean NOT NULL DEFAULT false,
  notes                      text,
  updated_by                 uuid,
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_os_paused_disables_writes CHECK (
    mode <> 'paused'
    OR (
      external_comms_enabled = false
      AND production_writes_enabled = false
      AND deployments_enabled = false
      AND mcp_writes_enabled = false
    )
  ),
  CONSTRAINT ai_os_read_only_disables_writes CHECK (
    mode <> 'read_only'
    OR (
      external_comms_enabled = false
      AND production_writes_enabled = false
      AND deployments_enabled = false
      AND mcp_writes_enabled = false
    )
  )
);

INSERT INTO public.ai_os_settings (id, mode, notes)
VALUES (true, 'supervised', 'Default supervised mode: L0-L2 can be prepared; L3-L4 require approval.')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ai_agent_controls (
  agent_key        text PRIMARY KEY,
  status           text NOT NULL DEFAULT 'enabled' CHECK (status IN ('enabled', 'paused', 'disabled')),
  max_risk_level   public.agent_risk_level NOT NULL DEFAULT 'L1',
  autonomy_enabled boolean NOT NULL DEFAULT false,
  schedule_enabled boolean NOT NULL DEFAULT true,
  allowed_tools    text[] NOT NULL DEFAULT ARRAY['health_check', 'dependency_check']::text[],
  notes            text,
  updated_by       uuid,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.ai_agent_controls
  (agent_key, status, max_risk_level, autonomy_enabled, schedule_enabled, allowed_tools, notes)
VALUES
  ('summoner', 'enabled', 'L2', true, true, ARRAY['health_check', 'dependency_check', 'queue_scan'], 'Launch-critical orchestration and WhatsApp ingress.'),
  ('sales', 'enabled', 'L2', true, true, ARRAY['health_check', 'dependency_check', 'pipeline_digest'], 'Launch-critical lead qualification and appointment workflows.'),
  ('tool_gateway', 'enabled', 'L1', false, true, ARRAY['health_check', 'dependency_check'], 'Launch-critical execution boundary. External writes stay approval-gated.'),
  ('content', 'paused', 'L1', false, false, ARRAY['health_check', 'dependency_check', 'draft_calendar'], 'Deferred content workflow; draft-first only.'),
  ('ads', 'paused', 'L1', false, false, ARRAY['health_check', 'dependency_check', 'draft_campaign'], 'Deferred ads workflow; campaign execution remains gated.'),
  ('ghost_closer', 'paused', 'L1', false, false, ARRAY['health_check', 'dependency_check', 'prospect_digest'], 'Deferred outbound workflow; sending remains gated.'),
  ('colony', 'paused', 'L1', false, false, ARRAY['health_check', 'dependency_check', 'ops_digest'], 'Deferred colony operations workflow.'),
  ('finance', 'disabled', 'L0', false, false, ARRAY['health_check', 'dependency_check'], 'Disabled by default because money-impacting actions require L4 approval.')
ON CONFLICT (agent_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.agent_actions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  builder_id         uuid REFERENCES public.builders(id) ON DELETE SET NULL,
  mode               text NOT NULL DEFAULT 'founder',
  source             text NOT NULL DEFAULT 'hermes-single-profile',
  action_type        text NOT NULL,
  title              text NOT NULL,
  summary            text NOT NULL,
  risk_level         public.agent_risk_level NOT NULL DEFAULT 'L1',
  status             public.agent_action_status NOT NULL DEFAULT 'proposed',
  approval_required  boolean NOT NULL DEFAULT false,
  approval_id        uuid,
  input              jsonb NOT NULL DEFAULT '{}'::jsonb,
  output             jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence           jsonb NOT NULL DEFAULT '[]'::jsonb,
  expected_impact    text,
  rollback_plan      text,
  result             text,
  error              text,
  created_by         uuid,
  executed_by        uuid,
  executed_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_actions_l3_l4_require_approval CHECK (
    risk_level IN ('L0', 'L1', 'L2')
    OR approval_required = true
  )
);

CREATE TABLE IF NOT EXISTS public.agent_approvals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id         uuid REFERENCES public.agent_actions(id) ON DELETE CASCADE,
  business_id       uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  title             text NOT NULL,
  reason            text NOT NULL,
  risk_level        public.agent_risk_level NOT NULL,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  evidence          jsonb NOT NULL DEFAULT '[]'::jsonb,
  expected_impact   text,
  rollback_plan     text,
  requested_by      uuid,
  decided_by        uuid,
  decided_at        timestamptz,
  decision_notes    text,
  expires_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_actions
  ADD CONSTRAINT agent_actions_approval_fk
  FOREIGN KEY (approval_id) REFERENCES public.agent_approvals(id) ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE IF NOT EXISTS public.agent_alerts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  source       text NOT NULL DEFAULT 'sentinel',
  severity     text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title        text NOT NULL,
  summary      text NOT NULL,
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored')),
  evidence     jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz
);

CREATE TABLE IF NOT EXISTS public.agent_insights (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  category     text NOT NULL,
  title        text NOT NULL,
  summary      text NOT NULL,
  confidence   text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  evidence     jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_kpi_snapshots (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date  date NOT NULL DEFAULT CURRENT_DATE,
  metrics        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_created ON public.agent_actions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON public.agent_actions (status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_risk ON public.agent_actions (risk_level);
CREATE INDEX IF NOT EXISTS idx_agent_actions_business ON public.agent_actions (business_id);
CREATE INDEX IF NOT EXISTS idx_agent_approvals_status ON public.agent_approvals (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_approvals_action ON public.agent_approvals (action_id);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_status ON public.agent_alerts (status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_insights_category ON public.agent_insights (category, created_at DESC);

CREATE TRIGGER trg_ai_os_settings_updated_at BEFORE UPDATE ON public.ai_os_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ai_agent_controls_updated_at BEFORE UPDATE ON public.ai_agent_controls
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_agent_actions_updated_at BEFORE UPDATE ON public.agent_actions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_agent_approvals_updated_at BEFORE UPDATE ON public.agent_approvals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ai_os_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_kpi_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_os_settings_admin ON public.ai_os_settings;
CREATE POLICY ai_os_settings_admin ON public.ai_os_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')));

DROP POLICY IF EXISTS ai_agent_controls_admin ON public.ai_agent_controls;
CREATE POLICY ai_agent_controls_admin ON public.ai_agent_controls FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')));

DROP POLICY IF EXISTS agent_actions_admin ON public.agent_actions;
CREATE POLICY agent_actions_admin ON public.agent_actions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')));

DROP POLICY IF EXISTS agent_approvals_admin ON public.agent_approvals;
CREATE POLICY agent_approvals_admin ON public.agent_approvals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')));

DROP POLICY IF EXISTS agent_alerts_admin ON public.agent_alerts;
CREATE POLICY agent_alerts_admin ON public.agent_alerts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')));

DROP POLICY IF EXISTS agent_insights_admin ON public.agent_insights;
CREATE POLICY agent_insights_admin ON public.agent_insights FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')));

DROP POLICY IF EXISTS agent_kpi_snapshots_admin ON public.agent_kpi_snapshots;
CREATE POLICY agent_kpi_snapshots_admin ON public.agent_kpi_snapshots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.active = true AND bm.role IN ('admin', 'dev')));

CREATE OR REPLACE VIEW public.v_command_os_overview AS
SELECT
  (SELECT mode FROM public.ai_os_settings WHERE id = true) AS mode,
  (SELECT COUNT(*)::int FROM public.agent_approvals WHERE status = 'pending') AS pending_approvals,
  (SELECT COUNT(*)::int FROM public.agent_actions WHERE created_at >= now() - interval '24 hours') AS actions_24h,
  (SELECT COUNT(*)::int FROM public.agent_alerts WHERE status = 'open') AS open_alerts,
  (SELECT COUNT(*)::int FROM public.agent_actions WHERE risk_level IN ('L3', 'L4') AND status IN ('proposed', 'drafted', 'queued')) AS gated_high_risk_actions;
