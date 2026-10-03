import type { Metadata } from 'next';
import { EvidencePageShell, EvidenceSection, FactCard } from '@/components/evidence/EvidencePageShell';

export const metadata: Metadata = {
  title: 'Grant Readiness',
  description: 'An honest internal grant-readiness assessment and scheme status for XeroWA AI.',
  alternates: { canonical: '/grant-readiness' },
};

const rubric = [
  ['Problem and market need', 13, 15],
  ['Innovation and defensibility', 11, 15],
  ['Technical feasibility', 13, 15],
  ['Prototype maturity', 9, 10],
  ['Pilot and market validation', 1, 15],
  ['Social, economic and MP impact', 5, 10],
  ['Team execution capability', 2, 5],
  ['Fund utilization and milestones', 8, 10],
  ['Governance and evidence quality', 4, 5],
] as const;

const schemes = [
  ['DPIIT Startup Recognition', 'Potentially eligible', 'Recognition service is available through NSWS; incorporation, shareholding and supporting documents must be verified.'],
  ['MP Startup Seed Fund Assistance', 'Verification required', 'Scheme exists; requires DPIIT recognition within two years and portal call availability. Public SOP says calls open in the first seven working days of each quarter.'],
  ['MP State-Level Innovation Challenge', 'Not currently open', 'The 2025 scheme provides a mechanism, but no active XeroWA-relevant problem-statement call was publicly verified on 12 August 2026.'],
  ['Startup India Seed Fund Scheme', 'Not currently open', 'Official final notice set the startup application deadline at 31 May 2026.'],
  ['MSME Idea Hackathon 6.0', 'Not currently open', 'Official portal closed idea submissions on 21 July 2026. Incubation support may still be explored through an approved Host Institute.'],
] as const;

export default function GrantReadinessPage() {
  const score = rubric.reduce((total, [, points]) => total + points, 0);

  return (
    <EvidencePageShell
      eyebrow="Internal readiness assessment"
      title="Ready for pilot validation, not ready to claim grant approval"
      intro="This score is an internal working rubric, not a government scoring formula. Source quality and website polish cannot replace company documents, DPIIT recognition, a signed pilot cohort and measured outcomes."
    >
      <EvidenceSection title="Current verdict">
        <div className="grid gap-4 md:grid-cols-3">
          <FactCard label="Verdict" value="READY FOR PILOT VALIDATION" detail="The source-tested prototype and governance pack support controlled pilot preparation. Formal scheme applications remain document- and window-dependent." status="DEMONSTRATED" />
          <FactCard label="Internal score" value={`${score}/100`} detail="A score above 85 is blocked by the absence of real pilot evidence, verified traction and independent security evidence." status="DEMONSTRATED" />
          <FactCard label="Verified pilots" value="0" detail="No pilot, paying customer, revenue or conversion claim is treated as verified." status="PLANNED" />
        </div>
      </EvidenceSection>

      <EvidenceSection title="Rubric breakdown">
        <div className="grid gap-3">
          {rubric.map(([label, points, maximum]) => (
            <div key={label} className="grid gap-2 rounded-xl border border-[#dce3df] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div><p className="text-sm font-semibold">{label}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5e9e7]"><div className="h-full bg-[#00a884]" style={{ width: `${(points / maximum) * 100}%` }} /></div></div>
              <p className="text-sm font-bold">{points}/{maximum}</p>
            </div>
          ))}
        </div>
      </EvidenceSection>

      <EvidenceSection title="Scheme-match snapshot" intro="Official sources were checked on 12 August 2026. Portal/login state can change; re-verify before submission.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead><tr className="border-b border-[#dce3df] text-[#59655f]"><th className="p-3">Scheme</th><th className="p-3">Classification</th><th className="p-3">Go / no-go</th></tr></thead>
            <tbody>{schemes.map(([name, classification, note]) => <tr key={name} className="border-b border-[#e8ece9] align-top"><td className="p-3 font-semibold">{name}</td><td className="p-3 font-medium text-[#07866f]">{classification}</td><td className="p-3 leading-6 text-[#59655f]">{note}</td></tr>)}</tbody>
          </table>
        </div>
      </EvidenceSection>

      <EvidenceSection title="What is needed to reach 85+">
        <ol className="grid gap-3 text-sm leading-6 text-[#59655f] md:grid-cols-2">
          {[
            'Upload and verify incorporation certificate, PAN, constitutional documents, registered-address proof and authorized signatory letter.',
            'Obtain and independently validate DPIIT recognition before using any recognition wording.',
            'Sign three to five pilot LOIs plus consent/data-processing terms.',
            'Complete 30–60 day pilots and publish anonymized metric definitions, samples and signed outcome evidence.',
            'Run live two-tenant and viewer-mutation denial tests in staging, then obtain an independent security assessment.',
            'Capture data-safe dashboard/workflow screenshots, demo recording, preview deployment SHA and production release evidence.',
          ].map((item, index) => <li key={item} className="rounded-xl bg-[#f6f7f3] p-4"><span className="mr-2 font-bold text-[#07866f]">{index + 1}.</span>{item}</li>)}
        </ol>
      </EvidenceSection>
    </EvidencePageShell>
  );
}
