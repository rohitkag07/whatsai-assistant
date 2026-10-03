import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use for XeroWA AI by AVIRO TECHNOLOGIES PRIVATE LIMITED.',
  alternates: { canonical: '/terms' },
};

const sections = [
  ['Service owner and stage', 'XeroWA AI is a product developed and operated by AVIRO TECHNOLOGIES PRIVATE LIMITED. The current service is in pre-launch validation/staging and is being prepared for assisted pilot validation. Access may be limited, supervised or changed as the product is tested.'],
  ['Service scope', 'XeroWA helps a participating business configure approved WhatsApp replies, recognize configured intents, structure leads and follow-ups, coordinate appointments, escalate conversations to a human and review operational evidence. The exact enabled scope is recorded in the applicable pilot or service order.'],
  ['Business responsibility', 'The participating business is responsible for the legality, accuracy and currency of its replies, offers, media, customer notices, consent basis and operator actions. The business must not configure misleading, discriminatory, unlawful or unsafe communications.'],
  ['Acceptable use', 'Users must not use XeroWA for spam, unlawful surveillance, credential harvesting, prohibited WhatsApp content, high-impact automated decisions without appropriate human review, or attempts to access another tenant, operator or system. Security testing requires prior written authorization.'],
  ['WhatsApp and third parties', 'Use of WhatsApp Cloud API remains subject to Meta terms, messaging policies, template rules, availability and charges. Hosting, database and other third-party services may change or experience outages independently of Aviro.'],
  ['AI and automation limitations', 'Intent matching, scoring and automated workflows may be incomplete, delayed or wrong. XeroWA does not provide legal, medical, financial or other professional advice. Human review is required for ambiguity, complaints, sensitive data and decisions that may materially affect a person.'],
  ['Pilot participation and evidence', 'Pilot scope, duration, support, consent, retention, success measures and exit terms must be agreed in writing. Pilot participation does not guarantee funding, government recognition, commercial results or continued availability. Metrics may be used publicly only in aggregated or anonymized form with the required approval.'],
  ['Fees and cancellation', 'Pre-launch assisted pilot pricing, third-party charges, taxes, payment dates, cancellation and refund terms are confirmed in writing before activation. Published pricing is indicative until accepted in a signed order. Services already delivered are not automatically refundable.'],
  ['Confidentiality and data', 'Each party should protect non-public business, customer, security and product information. Personal data is handled under the Privacy Policy and the signed pilot or service agreement. Users must not send passwords, private keys or access tokens through ordinary support messages.'],
  ['Intellectual property', 'Aviro retains rights in XeroWA software, product design and documentation, subject to third-party licenses. A participating business retains its business content and customer data. No patent, certification or government approval is implied by access to the product.'],
  ['Suspension and termination', 'Aviro may suspend access to protect customers, tenants, the platform or third parties; respond to unlawful use; address non-payment; or comply with a provider or legal requirement. At pilot close, data export and deletion will follow the signed schedule and applicable preservation requirements.'],
  ['Availability and liability', 'The product is provided on a pre-launch basis without a promise of uninterrupted delivery or specific business outcomes. Liability allocation, warranties and remedies for a paid engagement will be stated in the signed agreement to the extent permitted by law.'],
  ['Governing contact and grievances', 'Questions, complaints or legal notices should be sent to AVIRO TECHNOLOGIES PRIVATE LIMITED at avritechologies@gmail.com or +91 89894 40019. Registered-address and jurisdiction details must be confirmed from the company documents in the executed agreement.'],
] as const;

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f3] px-5 py-12 text-[#101916] sm:py-20">
      <article className="mx-auto max-w-4xl rounded-[2rem] border border-[#dce3df] bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-[#07866f]">Back to XeroWA AI</Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Terms of Use</h1>
        <p className="mt-3 text-sm text-[#68746f]">Effective 12 August 2026 · Pre-launch validation/staging</p>
        <div className="mt-10 space-y-8 text-base leading-7 text-[#52605a]">
          {sections.map(([title, text]) => (
            <section key={title}><h2 className="text-xl font-semibold text-[#101916]">{title}</h2><p className="mt-2">{text}</p></section>
          ))}
        </div>
      </article>
    </main>
  );
}
