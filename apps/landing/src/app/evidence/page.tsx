import type { Metadata } from 'next';
import { EvidencePageShell, EvidenceSection, FactCard, StatusBadge } from '@/components/evidence/EvidencePageShell';

export const metadata: Metadata = {
  title: 'Product Evidence Centre',
  description: 'Traceable prototype, test, dataset and limitation evidence for XeroWA AI.',
  alternates: { canonical: '/evidence' },
};

const metrics = [
  {
    metric: 'Automated source tests',
    value: '51 passed · 2 skipped',
    definition: 'Root Vitest checks completed successfully during the local audit.',
    source: 'npm test / Vitest',
    window: 'Point-in-time run, 12 Aug 2026',
    sample: '53 test cases',
    environment: 'Local isolated worktree',
  },
  {
    metric: 'Hinglish dataset integrity',
    value: '1,800 synthetic rows',
    definition: 'Unique governed training examples across 30 intents and five verticals.',
    source: 'datasets/hinglish-intents/train.jsonl + checksum test',
    window: 'Dataset release snapshot',
    sample: '1,800; synthetic-template-v1',
    environment: 'Synthetic, not customer data',
  },
  {
    metric: 'Real-pilot operating outcomes',
    value: 'Not yet measured',
    definition: 'Response, delivery, qualification, appointment, override and satisfaction metrics.',
    source: 'No consented pilot dataset available',
    window: 'Pilot validation pending',
    sample: '0 verified pilots',
    environment: 'No real-pilot claim',
  },
] as const;

export default function EvidencePage() {
  const deploymentSha = process.env.VERCEL_GIT_COMMIT_SHA;
  const deploymentEnvironment = process.env.VERCEL_ENV;
  const deploymentStatus = deploymentSha ? 'VERIFIED' : 'PLANNED';
  const deploymentEvidence = deploymentSha
    ? `${deploymentEnvironment ?? 'Vercel'} build · ${deploymentSha.slice(0, 12)}`
    : 'Exact hosting/Git mapping is recorded when built by Vercel';
  const artifacts = [
    ['Workflow engine and playbooks', 'Source + automated tests', 'DEMONSTRATED', 'Available in repository'],
    ['Signed webhook and idempotency controls', 'Source + automated tests', 'DEMONSTRATED', 'Available in repository'],
    ['RLS and composite-key controls', 'Migration contract tests', 'DEMONSTRATED', 'Live cross-tenant tests skipped without secure environment'],
    ['Dashboard and workflow screenshots', 'Runtime capture', 'PLANNED', 'Private data-safe captures not yet supplied'],
    ['Product-demo recording', 'Runtime recording', 'PLANNED', 'No verified recording URL supplied'],
    ['Current deployment build', 'Vercel build environment', deploymentStatus, deploymentEvidence],
  ] as const;

  return (
    <EvidencePageShell
      eyebrow="Product evidence centre"
      title="What exists, what was demonstrated and what remains unproven"
      intro="This page deliberately separates source-tested prototype evidence from customer validation. It contains no customer names, WhatsApp message content, private tenant identifiers or fabricated outcomes."
    >
      <EvidenceSection title="Claims discipline">
        <div className="grid gap-4 sm:grid-cols-3">
          <FactCard label="Verified" value="Document or runtime evidence" detail="Reserved for a traceable artifact that directly supports the claim." status="VERIFIED" />
          <FactCard label="Demonstrated" value="Working prototype evidence" detail="Shown in source, local build, tests or simulation; not validated by customers." status="DEMONSTRATED" />
          <FactCard label="Planned" value="Roadmap or missing proof" detail="Not implemented, not measured or not yet backed by an acceptable artifact." status="PLANNED" />
        </div>
      </EvidenceSection>

      <EvidenceSection title="Metric cards" intro="Every metric includes definition, source, window, sample size, update date and environment.">
        <div className="grid gap-4 lg:grid-cols-3">
          {metrics.map((item) => (
            <article key={item.metric} className="rounded-2xl border border-[#dce3df] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#74807a]">{item.metric}</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{item.value}</p>
              <dl className="mt-5 grid gap-3 text-sm">
                <div><dt className="font-semibold">Definition</dt><dd className="mt-1 leading-6 text-[#59655f]">{item.definition}</dd></div>
                <div><dt className="font-semibold">Data source</dt><dd className="mt-1 break-words text-[#59655f]">{item.source}</dd></div>
                <div><dt className="font-semibold">Measurement window</dt><dd className="mt-1 text-[#59655f]">{item.window}</dd></div>
                <div><dt className="font-semibold">Sample size</dt><dd className="mt-1 text-[#59655f]">{item.sample}</dd></div>
                <div><dt className="font-semibold">Environment / updated</dt><dd className="mt-1 text-[#59655f]">{item.environment} · 12 Aug 2026</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </EvidenceSection>

      <EvidenceSection title="Artifact index">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-[#dce3df] text-[#59655f]"><th className="p-3">Artifact</th><th className="p-3">Source</th><th className="p-3">Status</th><th className="p-3">Limitation</th></tr></thead>
            <tbody>
              {artifacts.map(([artifact, source, status, limitation]) => (
                <tr key={artifact} className="border-b border-[#e8ece9] align-top">
                  <td className="p-3 font-semibold">{artifact}</td><td className="p-3 text-[#59655f]">{source}</td><td className="p-3"><StatusBadge status={status} /></td><td className="p-3 leading-6 text-[#59655f]">{limitation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EvidenceSection>

      <EvidenceSection title="Current limitations">
        <ul className="grid gap-3 text-sm leading-6 text-[#59655f] md:grid-cols-2">
          <li className="rounded-xl bg-amber-50 p-4">No verified paying customer, revenue or completed assisted-pilot evidence.</li>
          <li className="rounded-xl bg-amber-50 p-4">Live two-tenant denial and viewer-mutation tests require secure staging credentials.</li>
          <li className="rounded-xl bg-amber-50 p-4">No independent penetration test, ISO, SOC 2 or CERT-In certification.</li>
          <li className="rounded-xl bg-amber-50 p-4">No data-safe dashboard screenshots or product-demo recording supplied yet.</li>
        </ul>
      </EvidenceSection>
    </EvidencePageShell>
  );
}
