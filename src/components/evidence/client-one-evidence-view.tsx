import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  MessageCircleMore,
  ShieldCheck,
  Target,
  UsersRound,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ClientOneEvidence,
  type PeriodMetric,
} from '@/lib/evidence-metrics';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatMetric(
  value: number | null,
  unit: 'ms' | 'percent',
): string {
  if (value === null) return 'No data';
  if (unit === 'ms') {
    return value >= 1_000
      ? `${(value / 1_000).toFixed(2)}s`
      : `${value.toFixed(0)}ms`;
  }
  return `${value.toFixed(1)}%`;
}

function Delta({
  metric,
  lowerIsBetter = false,
  unit,
}: {
  metric: PeriodMetric;
  lowerIsBetter?: boolean;
  unit: 'ms' | 'percent';
}) {
  if (metric.delta === null) {
    return <span className="text-xs text-muted-foreground">No prior baseline</span>;
  }

  const improved = lowerIsBetter ? metric.delta < 0 : metric.delta > 0;
  const Icon = metric.delta < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <span
      className={
        improved
          ? 'inline-flex items-center gap-1 text-xs font-medium text-emerald-600'
          : 'inline-flex items-center gap-1 text-xs font-medium text-amber-600'
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {formatMetric(Math.abs(metric.delta), unit)} vs prior period
    </span>
  );
}

function EvidenceMetricCard({
  title,
  description,
  metric,
  target,
  unit,
  lowerIsBetter = false,
  icon: Icon,
}: {
  title: string;
  description: string;
  metric: PeriodMetric;
  target?: number;
  unit: 'ms' | 'percent';
  lowerIsBetter?: boolean;
  icon: typeof Clock3;
}) {
  const targetMet =
    metric.current !== null
    && target !== undefined
    && (lowerIsBetter ? metric.current < target : metric.current >= target);

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription className="mt-1 text-xs">{description}</CardDescription>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold tracking-tight">
              {formatMetric(metric.current, unit)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {metric.sampleSize} measured samples
            </p>
          </div>
          {target !== undefined && metric.current !== null ? (
            <span
              className={
                targetMet
                  ? 'rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700'
                  : 'rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700'
              }
            >
              {targetMet ? 'Target met' : 'Below target'}
            </span>
          ) : null}
        </div>
        <div className="mt-4 border-t pt-3">
          <Delta metric={metric} lowerIsBetter={lowerIsBetter} unit={unit} />
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientOneEvidenceView({
  evidence,
}: {
  evidence: ClientOneEvidence;
}) {
  const { metrics } = evidence;

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
        <header className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-slate-950 px-6 py-8 text-white lg:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Tenant-scoped server evidence
                </div>
                <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                  Client #1 Evidence
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  XeroWA AI operating proof for Aviro Technologies Private Limited.
                  Values below are queried from the signed-in tenant, never demo-filled.
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Evidence window
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(evidence.period.currentStart)} – {formatDate(evidence.period.currentEnd)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Refreshed {new Date(evidence.generatedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-6 py-4 text-sm md:grid-cols-3 lg:px-8">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span>P95 processing target: &lt;3s</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Delivery target: 99%</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span>Baseline: previous 30 days</span>
            </div>
          </div>
        </header>

        {evidence.status !== 'ready' ? (
          <Card className="mt-6 border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-base">
                {evidence.status === 'auth_required'
                  ? 'Sign-in required'
                  : 'Evidence source unavailable'}
              </CardTitle>
              <CardDescription>
                Metrics remain blank until a tenant-scoped server query succeeds.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {evidence.errors.join(' ')}
            </CardContent>
          </Card>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <EvidenceMetricCard
            title="Processing latency"
            description="P95 across messages and claimed webhooks"
            metric={metrics.processingLatencyMs}
            target={evidence.targets.processingLatencyMs}
            unit="ms"
            lowerIsBetter
            icon={Clock3}
          />
          <EvidenceMetricCard
            title="Delivery rate"
            description="Delivered or read outbound messages"
            metric={metrics.deliveryRatePercent}
            target={evidence.targets.deliveryRatePercent}
            unit="percent"
            icon={MessageCircleMore}
          />
          <EvidenceMetricCard
            title="Qualified lead rate"
            description="Qualified-or-later leads / all new leads"
            metric={metrics.qualifiedLeadRatePercent}
            unit="percent"
            icon={UsersRound}
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Before / after baseline</CardTitle>
              <CardDescription>
                Previous 30 days compared with the latest 30-day operating window.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-3 font-medium">Metric</th>
                      <th className="pb-3 font-medium">Before</th>
                      <th className="pb-3 font-medium">After</th>
                      <th className="pb-3 text-right font-medium">Sample</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <ComparisonRow
                      label="P95 processing latency"
                      metric={metrics.processingLatencyMs}
                      unit="ms"
                    />
                    <ComparisonRow
                      label="Delivery rate"
                      metric={metrics.deliveryRatePercent}
                      unit="percent"
                    />
                    <ComparisonRow
                      label="Qualified lead rate"
                      metric={metrics.qualifiedLeadRatePercent}
                      unit="percent"
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evidence integrity</CardTitle>
              <CardDescription>How to interpret this view.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <IntegrityItem
                title="RLS scoped"
                detail="The server query uses the signed-in user session. Cross-tenant rows are filtered in Postgres."
              />
              <IntegrityItem
                title="No synthetic fallback"
                detail="Missing samples render as “No data”; target values are never substituted as actuals."
              />
              <IntegrityItem
                title="Source"
                detail={
                  evidence.messageSource === 'tenant_messages'
                    ? 'Multi-tenant messages + webhook events'
                    : evidence.messageSource === 'legacy_conversation_messages'
                      ? 'Legacy conversation messages; latency may be unavailable'
                      : 'No message source available'
                }
              />
            </CardContent>
          </Card>
        </section>

        {evidence.errors.length > 0 && evidence.status === 'ready' ? (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-800">
            Partial evidence: {evidence.errors.join(' ')}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function ComparisonRow({
  label,
  metric,
  unit,
}: {
  label: string;
  metric: PeriodMetric;
  unit: 'ms' | 'percent';
}) {
  return (
    <tr>
      <td className="py-4 font-medium">{label}</td>
      <td className="py-4 text-muted-foreground">
        {formatMetric(metric.previous, unit)}
      </td>
      <td className="py-4 font-semibold">{formatMetric(metric.current, unit)}</td>
      <td className="py-4 text-right text-muted-foreground">
        {metric.previousSampleSize} → {metric.sampleSize}
      </td>
    </tr>
  );
}

function IntegrityItem({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}
