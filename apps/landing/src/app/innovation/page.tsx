import type { Metadata } from 'next';
import { EvidencePageShell, EvidenceSection, FactCard } from '@/components/evidence/EvidencePageShell';

export const metadata: Metadata = {
  title: 'Innovation Note',
  description: 'The evidenced innovation boundary for XeroWA AI.',
  alternates: { canonical: '/innovation' },
};

const differentiators = [
  ['Tenant-aware business context', 'Incoming phone-number IDs resolve to a business boundary before a workflow is selected.', 'DEMONSTRATED'],
  ['Deterministic workflow states', 'Explicit events move a conversation through validated states and record action outcomes.', 'DEMONSTRATED'],
  ['Hinglish intent evaluation', 'A governed 1,800-row synthetic dataset covers 30 intents, five verticals and typo variation.', 'DEMONSTRATED'],
  ['Lead propensity scoring', 'Explicit intent, completeness, urgency and fit produce explainable scoring reasons.', 'DEMONSTRATED'],
  ['Hot-lead SLA escalation', 'The integration test demonstrates an owner-alert path with a ten-minute response target.', 'DEMONSTRATED'],
  ['Real-pilot performance', 'Response, qualification, appointment and owner-satisfaction outcomes require consented pilots.', 'PLANNED'],
] as const;

export default function InnovationPage() {
  return (
    <EvidencePageShell
      eyebrow="Defensible innovation"
      title="Controlled conversational operations for Indian SMBs"
      intro="XeroWA is not presented as inventing messaging APIs or databases. Its product hypothesis is that tenant-aware, deterministic and auditable workflows can make WhatsApp enquiry handling more consistent for owner-led businesses."
    >
      <EvidenceSection title="Problem and solution">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-[#f6f7f3] p-5">
            <h3 className="font-semibold">Problem</h3>
            <p className="mt-3 leading-7 text-[#59655f]">Indian SMBs frequently lose WhatsApp enquiries because replies, qualification, follow-ups, appointments and owner handoffs are handled manually and inconsistently.</p>
          </div>
          <div className="rounded-2xl bg-[#eaf9f3] p-5">
            <h3 className="font-semibold">Solution hypothesis</h3>
            <p className="mt-3 leading-7 text-[#49665d]">XeroWA applies business-approved replies, intent recognition, lead qualification, structured follow-ups, appointment handling, owner escalation and evidence reporting inside a tenant-scoped workflow.</p>
          </div>
        </div>
      </EvidenceSection>

      <EvidenceSection title="Engineering differentiation" intro="Each statement below is bounded by the evidence currently available.">
        <div className="grid gap-4 md:grid-cols-2">
          {differentiators.map(([label, detail, status]) => (
            <FactCard key={label} label={label} value={status === 'PLANNED' ? 'Pilot validation pending' : 'Source-tested prototype'} detail={detail} status={status} />
          ))}
        </div>
      </EvidenceSection>

      <EvidenceSection title="What is not proprietary">
        <p className="leading-7 text-[#59655f]">WhatsApp Cloud API, message delivery infrastructure, Vercel hosting, Supabase/PostgreSQL, authentication primitives and general AI techniques are third-party or commonly available capabilities. XeroWA’s defensible work must come from the governed workflow design, Indian-market datasets, evaluation discipline, tenant safety, operational integrations and validated customer outcomes—not from describing an API connection as a breakthrough.</p>
      </EvidenceSection>
    </EvidencePageShell>
  );
}
