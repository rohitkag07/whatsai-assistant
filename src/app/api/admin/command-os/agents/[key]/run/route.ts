import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformApiSession } from '@/lib/whatsai-business';
import { serviceClientOrNull } from '@/lib/sales-server';
import { evaluateAgentRun } from '@/lib/command-os-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const agentKeySchema = z.enum(['summoner', 'sales', 'tool_gateway', 'content', 'ads', 'ghost_closer', 'colony', 'finance']);
const runSchema = z.object({ action: z.enum(['health_check', 'dependency_check']) });

const serviceUrls: Record<z.infer<typeof agentKeySchema>, () => string> = {
  summoner: () => process.env.SUMMONER_URL || process.env.NEXT_PUBLIC_SUMMONER_URL || 'http://localhost:8082',
  sales: () => process.env.SALES_AGENT_URL || 'http://localhost:8080',
  tool_gateway: () => process.env.TOOL_GATEWAY_URL || 'http://localhost:8081',
  content: () => process.env.CONTENT_AGENT_URL || 'http://localhost:8083',
  ads: () => process.env.ADS_AGENT_URL || 'http://localhost:8085',
  ghost_closer: () => process.env.GHOST_CLOSER_URL || 'http://localhost:8086',
  colony: () => process.env.COLONY_AGENT_URL || 'http://localhost:8087',
  finance: () => process.env.FINANCE_AGENT_URL || 'http://localhost:8088',
};

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await requirePlatformApiSession(['admin', 'dev']);
  const { key: rawKey } = await params;
  const key = agentKeySchema.safeParse(rawKey);
  const run = runSchema.safeParse(await request.json().catch(() => null));

  if (!key.success || !run.success) {
    return NextResponse.json({ ok: false, error: 'Invalid safe agent run request.' }, { status: 400 });
  }

  const supabase = serviceClientOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase service client unavailable.' }, { status: 503 });
  }

  const [settingsResult, controlResult] = await Promise.all([
    (supabase.from('ai_os_settings') as any).select('mode').eq('id', true).maybeSingle(),
    (supabase.from('ai_agent_controls') as any).select('status,max_risk_level,allowed_tools').eq('agent_key', key.data).maybeSingle(),
  ]);

  if (controlResult.error || !controlResult.data) {
    return NextResponse.json({ ok: false, error: controlResult.error?.message || 'Agent control is not configured.' }, { status: 409 });
  }

  if (!Array.isArray(controlResult.data.allowed_tools) || !controlResult.data.allowed_tools.includes(run.data.action)) {
    return NextResponse.json({ ok: false, error: 'This safe action is not allowed for the selected agent.' }, { status: 403 });
  }

  const decision = evaluateAgentRun({
    globalMode: settingsResult.data?.mode ?? 'supervised',
    agentStatus: controlResult.data.status,
    maxRiskLevel: controlResult.data.max_risk_level,
    requestedRiskLevel: 'L0',
  });

  if (decision.outcome !== 'run') {
    return NextResponse.json({ ok: false, error: decision.reason }, { status: 423 });
  }

  const path = run.data.action === 'health_check' ? '/health' : '/health/dependencies';
  const startedAt = Date.now();
  let status: 'success' | 'failure' = 'success';
  let output: unknown = null;
  let error: string | null = null;

  try {
    const response = await fetch(`${serviceUrls[key.data]()}${path}`, {
      cache: 'no-store',
      headers: process.env.AGENT_SECRET ? { 'x-agent-secret': process.env.AGENT_SECRET } : {},
      signal: AbortSignal.timeout(5_000),
    });
    const text = await response.text();
    output = text ? safeJson(text) : null;
    if (!response.ok) {
      status = 'failure';
      error = `Health endpoint returned HTTP ${response.status}.`;
    }
  } catch (runError) {
    status = 'failure';
    error = runError instanceof Error ? runError.message : 'Agent health check failed.';
  }

  const durationMs = Date.now() - startedAt;
  await Promise.all([
    (supabase.from('agent_runs') as any).insert({
      agent: key.data,
      action: `command_os.${run.data.action}`,
      input: { source: 'command-os-dashboard' },
      output: output && typeof output === 'object' ? output : { value: output },
      status,
      duration_ms: durationMs,
      error,
    }),
    (supabase.from('agent_actions') as any).insert({
      source: 'command-os-dashboard',
      mode: 'sentinel',
      action_type: run.data.action,
      title: `${key.data} ${run.data.action.replaceAll('_', ' ')}`,
      summary: `Manual safe check from the agent control dashboard.`,
      risk_level: 'L0',
      status: status === 'success' ? 'executed' : 'failed',
      approval_required: false,
      input: { agent_key: key.data, action: run.data.action },
      output: output && typeof output === 'object' ? output : { value: output },
      evidence: [],
      result: status === 'success' ? 'Safe health check completed.' : null,
      error,
      created_by: session.user.id,
      executed_by: session.user.id,
      executed_at: new Date().toISOString(),
    }),
  ]);

  return NextResponse.json({ ok: status === 'success', status, duration_ms: durationMs, result: output, error }, { status: status === 'success' ? 200 : 502 });
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
