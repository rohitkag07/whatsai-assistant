import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for XeroWA AI by AVIRO TECHNOLOGIES PRIVATE LIMITED.',
  alternates: { canonical: '/privacy' },
};

const sections = [
  ['Service owner and roles', 'XeroWA AI is operated by AVIRO TECHNOLOGIES PRIVATE LIMITED, Indore, Madhya Pradesh, India. During a business pilot or service engagement, the participating business generally decides why and how its customer data is used, while Aviro operates XeroWA as its technology service provider. The written pilot or service agreement controls the final role allocation.'],
  ['Information collected', 'Depending on the approved workflow, XeroWA may process business account details, authorized operator identity, customer name and phone number, WhatsApp message content and identifiers, configured qualification answers, lead stage, appointment or handoff details, consent and opt-out state, delivery status, audit events and support records.'],
  ['Purpose of processing', 'Information is used to route a message to the correct business, apply the business-approved workflow, record a lead or appointment, coordinate follow-up or human escalation, prevent duplicate processing, secure the service, troubleshoot failures and produce agreed operational reports. Personal data is not sold.'],
  ['Tenant isolation and access', 'The prototype includes tenant-scoped records, row-level database controls, role-aware mutation policies in the new tenant schema and composite tenant keys. Access is intended to be limited to authorized business operators and Aviro personnel who require it for support. Live cross-tenant validation remains a staging release gate.'],
  ['Security controls', 'The prototype uses authenticated access, server-only credentials, Meta webhook signature verification, idempotent event handling, audit records and transport encryption provided by the hosting, database and Meta platforms. No website statement should be read as ISO, SOC 2, CERT-In or independent penetration-test certification.'],
  ['Retention and deletion', 'Pilot retention must be defined in the signed pilot schedule. Until a production retention schedule is approved, Aviro will minimize retained data, keep it only for the agreed operational, security and legal purpose, and review it at pilot close. A participating business or authorized person may request access, correction or deletion; legal, security or dispute-preservation requirements may limit immediate deletion.'],
  ['WhatsApp, Meta and subprocessors', 'Delivery depends on Meta and WhatsApp policies, availability and charges. Hosting, database, monitoring and communication providers may process limited data to operate the service. A current subprocessor list and data-location review must be supplied in the private pilot data room before production onboarding.'],
  ['Pilot consent and opt-out', 'A business must approve its use case, customer notice, consent basis and opt-out workflow before launch. XeroWA must stop non-essential follow-up when a valid opt-out is recorded. Public evidence must be aggregated or anonymized and must not expose raw customer or tenant data.'],
  ['AI limitations and human escalation', 'Intent matching, scoring and automation can be incomplete or incorrect. XeroWA is not a substitute for legal, medical, financial or other professional judgment. Ambiguous, sensitive, complaint or high-impact conversations should be escalated to a human operator.'],
  ['Incident reporting', 'Suspected unauthorized access, data disclosure or security incidents should be reported promptly to avritechologies@gmail.com with enough information to investigate, but without sending passwords, access tokens or unnecessary customer data. Aviro will coordinate with the affected business under the applicable agreement and law.'],
  ['Grievance and privacy contact', 'Privacy, deletion and grievance requests may be sent to avritechologies@gmail.com or raised by phone at +91 89894 40019. The requester may be asked to verify identity and authority before account or customer information is disclosed or changed.'],
] as const;

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f3] px-5 py-12 text-[#101916] sm:py-20">
      <article className="mx-auto max-w-4xl rounded-[2rem] border border-[#dce3df] bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-[#07866f]">Back to XeroWA AI</Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[#68746f]">Effective 12 August 2026 · Pre-launch validation/staging</p>
        <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">This policy describes the current pilot-readiness position. A signed pilot or customer agreement, approved retention schedule and verified subprocessor list are required before production processing.</p>

        <div className="mt-10 space-y-8 text-base leading-7 text-[#52605a]">
          {sections.map(([title, text]) => (
            <section key={title}>
              <h2 className="text-xl font-semibold text-[#101916]">{title}</h2>
              <p className="mt-2">{text}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
