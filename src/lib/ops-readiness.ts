import { createServiceClient } from '@/lib/supabase/server';

type ReadinessStatus = 'ready' | 'partial' | 'blocked' | 'manual';

type EnvGroup = {
  key: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
  required: string[];
  missing: string[];
};

type ServiceState = {
  key: string;
  label: string;
  url: string;
  configured: boolean;
  reachable: boolean;
  status: ReadinessStatus;
  detail: string;
  health: unknown | null;
  dependencies: unknown | null;
};

type DataProbe = {
  key: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
  count: number | null;
};

type LaunchGate = {
  key: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
};

export type OpsReadiness = {
  generatedAt: string;
  envGroups: EnvGroup[];
  services: ServiceState[];
  dataProbes: DataProbe[];
  launchGates: LaunchGate[];
};

const env = process.env;

const serviceRegistry = [
  { key: 'summoner', label: 'Summoner', url: env.SUMMONER_URL || env.NEXT_PUBLIC_SUMMONER_URL || 'http://localhost:8082' },
  { key: 'sales', label: 'Sales Agent', url: env.SALES_AGENT_URL || 'http://localhost:8080' },
  { key: 'tool_gateway', label: 'Tool Gateway', url: env.TOOL_GATEWAY_URL || 'http://localhost:8081' },
] as const;

const dataProbeRegistry = [
  { key: 'businesses', label: 'Businesses', table: 'businesses' },
  { key: 'business_channels', label: 'Business Channels', table: 'business_channels' },
  { key: 'conversation_threads', label: 'Conversation Threads', table: 'conversation_threads' },
  { key: 'conversation_messages', label: 'Conversation Messages', table: 'conversation_messages' },
  { key: 'leads', label: 'Leads', table: 'leads' },
  { key: 'appointments', label: 'Appointments', table: 'appointments' },
  { key: 'agent_dispatch_queue', label: 'Dispatch Queue', table: 'agent_dispatch_queue' },
] as const;

function hasValue(key: string) {
  return Boolean(env[key]?.trim());
}

function buildEnvGroup(key: string, label: string, required: string[], partial: string[] = []): EnvGroup {
  const missingRequired = required.filter((name) => !hasValue(name));
  const missingPartial = partial.filter((name) => !hasValue(name));
  const missing = [...missingRequired, ...missingPartial];

  if (!required.length) {
    return { key, label, status: 'manual', detail: 'Manual verification required.', required, missing };
  }

  if (!missingRequired.length && !missingPartial.length) {
    return { key, label, status: 'ready', detail: 'All required values are present.', required, missing };
  }

  if (!missingRequired.length) {
    return {
      key,
      label,
      status: 'partial',
      detail: `Core values present. Optional values missing: ${missingPartial.join(', ')}.`,
      required,
      missing,
    };
  }

  return {
    key,
    label,
    status: 'blocked',
    detail: `Missing required values: ${missingRequired.join(', ')}.`,
    required,
    missing,
  };
}

async function fetchJson(url: string) {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2_500),
    });
    const text = await response.text();
    const data = text ? safeJson(text) : null;
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      status: null,
      data: { error: error instanceof Error ? error.message : 'unreachable' },
    };
  }
}

function safeJson(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

function statusFromHealth(healthOk: boolean, dependencyOk: boolean) {
  if (healthOk && dependencyOk) return 'ready';
  if (healthOk) return 'partial';
  return 'blocked';
}

function inferDependencyOk(key: string, payload: unknown) {
  const data = (payload && typeof payload === 'object') ? payload as Record<string, unknown> : {};

  switch (key) {
    case 'summoner': {
      const checks = (data.checks && typeof data.checks === 'object') ? data.checks as Record<string, { ok?: boolean }> : {};
      const allChecksOk = Object.values(checks).every((item) => item?.ok !== false);
      return Boolean(data.supabase) && Boolean(data.orchestration) && allChecksOk;
    }
    case 'sales': {
      const checks = (data.checks && typeof data.checks === 'object') ? data.checks as Record<string, unknown> : {};
      const supabaseConfigured = Boolean((checks.supabase as { configured?: boolean } | undefined)?.configured);
      return supabaseConfigured;
    }
    case 'tool_gateway':
      return true;
    default:
      return false;
  }
}

function serviceDetail(key: string, health: unknown, dependencies: unknown, healthOk: boolean) {
  if (!healthOk) return 'Service health endpoint is unreachable.';

  const dep = (dependencies && typeof dependencies === 'object') ? dependencies as Record<string, unknown> : {};

  switch (key) {
    case 'summoner': {
      const checks = (dep.checks && typeof dep.checks === 'object') ? dep.checks as Record<string, { ok?: boolean }> : {};
      const down = Object.entries(checks)
        .filter(([, value]) => value?.ok === false)
        .map(([name]) => name);
      return down.length
        ? `Reachable, but downstream services are failing: ${down.join(', ')}.`
        : 'Reachable with downstream agent health checks responding.';
    }
    case 'sales': {
      const checks = (dep.checks && typeof dep.checks === 'object') ? dep.checks as Record<string, unknown> : {};
      const whatsapp = checks.whatsapp_cloud_api as { configured?: boolean; check?: { ok?: boolean; reason?: string } } | undefined;
      if (whatsapp?.configured && whatsapp?.check?.ok) return 'Reachable with live WhatsApp Graph API check passing.';
      if (whatsapp?.configured) return `Reachable, but WhatsApp Graph check is not passing${whatsapp.check?.reason ? `: ${whatsapp.check.reason}` : '.'}`;
      return 'Reachable, but WhatsApp Cloud API credentials are incomplete.';
    }
    case 'tool_gateway':
      return Boolean(dep.whatsapp) || Boolean(dep.meta)
        ? 'Reachable with at least one external execution path configured.'
        : 'Reachable, but external execution credentials are mostly missing.';
    default:
      return 'Reachable and reporting dependencies.';
  }
}

async function getServiceStates(): Promise<ServiceState[]> {
  return Promise.all(
    serviceRegistry.map(async (service) => {
      const configured = Boolean(service.url);
      if (!configured) {
        return {
          key: service.key,
          label: service.label,
          url: service.url,
          configured,
          reachable: false,
          status: 'blocked',
          detail: 'Service URL is not configured.',
          health: null,
          dependencies: null,
        };
      }

      const [health, dependencies] = await Promise.all([
        fetchJson(`${service.url}/health`),
        fetchJson(`${service.url}/health/dependencies`),
      ]);
      const dependencyOk = inferDependencyOk(service.key, dependencies.data);
      const status = statusFromHealth(health.ok, dependencyOk);

      return {
        key: service.key,
        label: service.label,
        url: service.url,
        configured,
        reachable: health.ok,
        status,
        detail: serviceDetail(service.key, health.data, dependencies.data, health.ok),
        health: health.data,
        dependencies: dependencies.data,
      };
    }),
  );
}

async function getDataProbes(): Promise<DataProbe[]> {
  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return dataProbeRegistry.map((probe) => ({
      key: probe.key,
      label: probe.label,
      status: 'blocked',
      detail: 'Service-role Supabase client is not configured in dashboard env.',
      count: null,
    }));
  }

  return Promise.all(
    dataProbeRegistry.map(async (probe) => {
      try {
        const { count, error } = await supabase
          .from(probe.table)
          .select('id', { head: true, count: 'exact' });

        if (error) {
          return {
            key: probe.key,
            label: probe.label,
            status: 'blocked',
            detail: error.message,
            count: null,
          };
        }

        const total = count ?? 0;
        return {
          key: probe.key,
          label: probe.label,
          status: 'ready',
          detail: `${total} record${total === 1 ? '' : 's'} accessible.`,
          count: total,
        };
      } catch (error) {
        return {
          key: probe.key,
          label: probe.label,
          status: 'blocked',
          detail: error instanceof Error ? error.message : 'Supabase probe failed.',
          count: null,
        };
      }
    }),
  );
}

function buildLaunchGates({
  envGroups,
  services,
  dataProbes,
}: {
  envGroups: EnvGroup[];
  services: ServiceState[];
  dataProbes: DataProbe[];
}): LaunchGate[] {
  const envByKey = Object.fromEntries(envGroups.map((group) => [group.key, group]));
  const serviceByKey = Object.fromEntries(services.map((service) => [service.key, service]));
  const probeByKey = Object.fromEntries(dataProbes.map((probe) => [probe.key, probe]));

  const supabaseReady =
    envByKey.supabase_client?.status !== 'blocked' &&
    envByKey.supabase_service?.status !== 'blocked' &&
    probeByKey.businesses?.status === 'ready' &&
    probeByKey.business_channels?.status === 'ready' &&
    probeByKey.conversation_threads?.status === 'ready';

  const summonerReady =
    serviceByKey.summoner?.status === 'ready' &&
    envByKey.whatsapp_ingress?.status !== 'blocked' &&
    envByKey.default_context?.status !== 'blocked';

  const queueProofReady =
    serviceByKey.summoner?.status === 'ready' &&
    probeByKey.agent_dispatch_queue?.status === 'ready';

  const liveDashboardReady =
    probeByKey.leads?.status === 'ready' &&
    probeByKey.conversation_threads?.status === 'ready' &&
    probeByKey.appointments?.status === 'ready';

  return [
    {
      key: 'supabase_live',
      label: 'Live Supabase Connection',
      status: supabaseReady ? 'ready' : 'blocked',
      detail: supabaseReady
        ? 'Dashboard can reach live tables with service-role access.'
        : 'Supabase env or table probes are still failing.',
    },
    {
      key: 'summoner_ingress',
      label: 'Summoner-First WhatsApp Ingress',
      status: summonerReady ? 'manual' : 'blocked',
      detail: summonerReady
        ? 'Config and health are present. Still needs one public webhook proof.'
        : 'Summoner health, default context, or WhatsApp env is incomplete.',
    },
    {
      key: 'queue_cron',
      label: 'Queue and Cron Path',
      status: queueProofReady ? 'manual' : 'blocked',
      detail: queueProofReady
        ? 'Queue table and Summoner health are in place. Still needs a real execution proof.'
        : 'Summoner orchestration path or queue table access is not ready.',
    },
    {
      key: 'dashboard_live_data',
      label: 'Dashboard on Live Data',
      status: liveDashboardReady ? 'ready' : 'blocked',
      detail: liveDashboardReady
        ? 'Lead, conversation, and appointment tables are queryable from the dashboard.'
        : 'Lead, conversation, or appointment probes are failing, so live UI proof is weak.',
    },
  ];
}

export async function getOpsReadiness(): Promise<OpsReadiness> {
  const envGroups: EnvGroup[] = [
    buildEnvGroup('supabase_client', 'Supabase Client', [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]),
    buildEnvGroup('supabase_service', 'Supabase Service Role', [
      'SUPABASE_SERVICE_ROLE_KEY',
    ]),
    buildEnvGroup('default_context', 'Default Business Context', [
      'DEFAULT_BUSINESS_ID',
    ]),
    buildEnvGroup('whatsapp_ingress', 'WhatsApp Ingress', [
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_VERIFY_TOKEN',
      'META_APP_SECRET',
    ], [
      'WHATSAPP_GRAPH_VERSION',
    ]),
  ];

  const [services, dataProbes] = await Promise.all([
    getServiceStates(),
    getDataProbes(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    envGroups,
    services,
    dataProbes,
    launchGates: buildLaunchGates({ envGroups, services, dataProbes }),
  };
}
