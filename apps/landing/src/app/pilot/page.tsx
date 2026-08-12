import type { Metadata } from 'next';
import { EvidencePageShell, EvidenceSection, FactCard } from '@/components/evidence/EvidencePageShell';

export const metadata: Metadata = {
  title: 'Assisted Pilot Program',
  description: 'A consent-led 30–60 day assisted pilot methodology for XeroWA AI.',
  alternates: { canonical: '/pilot' },
};

const measures = [
  'Median first-response time',
  'Successfully processed enquiries',
  'Qualified lead rate',
  'Follow-up completion rate',
  'Appointment request rate',
  'Owner-handoff time',
  'Delivery failure rate',
  'Workflow fallback rate',
  'Human override rate',
  'Business-owner satisfaction',
  'Consent and opt-out handling',
] as const;

export default function PilotPage() {
  return (
    <EvidencePageShell
      eyebrow="Pilot validation system"
      title="A measured assisted pilot, not a manufactured traction story"
      intro="The proposed pilot runs for 30–60 days with three to five Indian SMBs. Participation, customer communication, consent, opt-out, access and deletion handling must be agreed before processing starts."
    >
      <EvidenceSection title="Pilot design">
        <div className="grid gap-4 md:grid-cols-3">
          <FactCard label="Cohort" value="3–5 SMBs" detail="Preferred verticals: dental, coaching, salon, gym and local services. One generic real-estate tenant may be included without importing X7-specific systems." status="PLANNED" />
          <FactCard label="Duration" value="30–60 days" detail="Baseline, configuration, supervised operation, weekly review and final results sign-off." status="PLANNED" />
          <FactCard label="Current results" value="Not yet measured" detail="No sample result is displayed as customer evidence before a consented pilot is completed." status="PLANNED" />
        </div>
      </EvidenceSection>

      <EvidenceSection title="Phased protocol">
        <ol className="grid gap-4 md:grid-cols-2">
          {[
            ['1. Baseline and consent', 'Confirm business owner, controller/operator roles, channels, approved use cases, retention, opt-out and baseline response process.'],
            ['2. Controlled configuration', 'Connect one number, configure approved replies and fallbacks, test tenant routing and train operators.'],
            ['3. Assisted operation', 'Monitor daily exceptions, delivery failures, fallbacks, overrides and owner escalations without inventing outcomes.'],
            ['4. Evidence review', 'Publish only aggregated, anonymized metrics signed off by the business owner with method and sample size.'],
          ].map(([title, text]) => (
            <li key={title} className="rounded-2xl border border-[#dce3df] bg-[#f8f9f6] p-5">
              <h3 className="font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#59655f]">{text}</p>
            </li>
          ))}
        </ol>
      </EvidenceSection>

      <EvidenceSection title="Measurement contract" intro="Each result must name its formula, source, window, sample size, environment and last-updated date.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {measures.map((measure) => <div key={measure} className="rounded-xl border border-[#dce3df] p-4 text-sm font-semibold">{measure}<p className="mt-2 text-xs font-medium text-amber-700">Pilot validation pending</p></div>)}
        </div>
      </EvidenceSection>

      <EvidenceSection title="Safety gates">
        <ul className="grid gap-3 text-sm leading-6 text-[#59655f] md:grid-cols-2">
          {[
            'Business owner approves all customer-facing replies and escalation rules.',
            'Opt-out stops non-essential follow-up and is recorded for review.',
            'No special-category data is intentionally solicited unless separately approved.',
            'Human takeover is available for ambiguity, complaints and sensitive decisions.',
            'Tenant and operator access are reviewed before launch and at pilot close.',
            'Raw personal data stays out of the public evidence centre.',
          ].map((item) => <li key={item} className="rounded-xl bg-[#f6f7f3] p-4">{item}</li>)}
        </ul>
      </EvidenceSection>
    </EvidencePageShell>
  );
}
