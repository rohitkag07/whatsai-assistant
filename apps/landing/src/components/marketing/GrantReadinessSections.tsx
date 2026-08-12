import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  FileCheck2,
  GitBranch,
  Languages,
  LockKeyhole,
  MessageSquareText,
  Route,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

const architecture = [
  { icon: MessageSquareText, title: 'Verified ingress', text: 'Meta signature check and tenant routing by WhatsApp phone-number ID.' },
  { icon: Route, title: 'Controlled workflow', text: 'Deterministic state transitions, approved replies, scoring and human escalation.' },
  { icon: Database, title: 'Tenant-scoped records', text: 'Business context, conversations, leads, appointments and evidence in Supabase.' },
  { icon: GitBranch, title: 'Auditable outcome', text: 'Idempotent processing and immutable workflow-transition logs in the prototype schema.' },
] as const;

const expectedOutcomes = [
  'Median first-response time',
  'Qualified lead rate',
  'Follow-up completion rate',
  'Appointment request rate',
  'Owner-handoff time',
  'Delivery and fallback rate',
] as const;

export function GrantReadinessSections() {
  return (
    <>
      <section id="problem" className="bg-white px-4 py-24 sm:px-6 sm:py-32">
        <div className="landing-shell grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-20">
          <div>
            <p className="text-sm font-semibold text-[#07866f]">The Indian SMB problem</p>
            <h2 className="mt-5 text-balance text-4xl font-[650] leading-[1.02] tracking-[-0.045em] sm:text-5xl">
              WhatsApp enquiries are easy to receive and hard to operate consistently.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Manual replies', 'Busy teams repeat answers, miss context and respond inconsistently.'],
              ['Scattered qualification', 'Budget, timing and service needs stay inside unstructured chats.'],
              ['Follow-up gaps', 'No clear owner, deadline or next action means warm enquiries go cold.'],
              ['Limited evidence', 'Owners cannot easily measure response, handoff, appointment or failure outcomes.'],
            ].map(([title, text]) => (
              <article key={title} className="rounded-2xl border border-[#dce3df] bg-[#f6f7f3] p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#59655f]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="innovation" className="px-4 py-24 sm:px-6 sm:py-32">
        <div className="landing-shell">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold text-[#07866f]">Innovation and differentiation</p>
            <h2 className="mt-5 text-balance text-4xl font-[650] leading-[1.02] tracking-[-0.045em] sm:text-5xl">
              The engineering focus is controlled execution, not a generic chatbot wrapper.
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#59655f]">
              XeroWA combines tenant-aware business context, deterministic workflow states, Hinglish intent evaluation, lead scoring, hot-lead SLA escalation and auditable transitions. WhatsApp Cloud API, hosting and database infrastructure remain third-party platform capabilities.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { icon: Languages, title: 'Indian-market language layer', text: 'Synthetic Hinglish evaluation data covers five SMB verticals, spelling variation and intent labels. Real-pilot accuracy is not yet measured.' },
              { icon: LockKeyhole, title: 'Fail-closed actions', text: 'Only approved rules and explicit workflow transitions may trigger replies, appointments, follow-ups or escalation.' },
              { icon: ShieldCheck, title: 'Evidence by design', text: 'Signature, idempotency, tenant, workflow and metric provenance are represented as testable controls.' },
            ].map((item) => (
              <article key={item.title} className="rounded-[1.75rem] border border-[#dce3df] bg-white p-6">
                <item.icon className="h-6 w-6 text-[#07866f]" />
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#59655f]">{item.text}</p>
              </article>
            ))}
          </div>
          <Link href="/innovation" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-[#101916] px-5 text-sm font-semibold text-white hover:bg-[#075e54]">
            Read the innovation note <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      <section id="architecture" className="bg-[#101916] px-4 py-24 text-white sm:px-6 sm:py-32">
        <div className="landing-shell">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold text-[#7ee5c3]">Technical architecture</p>
            <h2 className="mt-5 text-balance text-4xl font-[650] leading-[1.02] tracking-[-0.045em] sm:text-5xl">One controlled path from message to accountable next action.</h2>
          </div>
          <div className="mt-12 grid gap-3 lg:grid-cols-4">
            {architecture.map((item, index) => (
              <article key={item.title} className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-center justify-between">
                  <item.icon className="h-5 w-5 text-[#7ee5c3]" />
                  <span className="font-mono text-xs text-white/35">0{index + 1}</span>
                </div>
                <h3 className="mt-6 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{item.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-white/48">Architecture status: demonstrated in source and automated tests. Production deployment, live tenant isolation and pilot outcomes require separate runtime evidence.</p>
        </div>
      </section>

      <section id="stage" className="px-4 py-24 sm:px-6 sm:py-32">
        <div className="landing-shell grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-[#dce3df] bg-white p-7 sm:p-9">
            <p className="text-sm font-semibold text-[#07866f]">Current product stage</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Pre-launch validation/staging</h2>
            <p className="mt-5 leading-7 text-[#59655f]">Current stage: Pre-launch validation/staging. XeroWA AI is being prepared for assisted pilot validation with selected Indian businesses.</p>
            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">No verified paying customers, pilot results or revenue are claimed on this site. Pilot validation pending.</div>
          </article>
          <article className="rounded-[2rem] border border-[#bfead9] bg-[#eaf9f3] p-7 sm:p-9">
            <p className="text-sm font-semibold text-[#075e54]">Security and tenant isolation</p>
            <div className="mt-5 grid gap-3">
              {[
                'Signed Meta webhook verification',
                'Idempotent inbound event handling',
                'Row-level tenant policies and composite tenant keys',
                'Owner/admin/agent mutation boundaries in the new tenant schema',
                'Immutable workflow-transition audit records',
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-xl bg-white/70 p-3 text-sm font-medium text-[#34534a]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#07866f]" /> {item}
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-[#526b63]">These are prototype controls, not an ISO, SOC 2, CERT-In or penetration-test certification.</p>
          </article>
        </div>
      </section>

      <section id="pilot" className="bg-[#e9ece7] px-4 py-24 sm:px-6 sm:py-32">
        <div className="landing-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold text-[#07866f]">Assisted pilot program</p>
            <h2 className="mt-5 text-balance text-4xl font-[650] leading-[1.02] tracking-[-0.045em] sm:text-5xl">30–60 days. Three to five businesses. Measured without invented success stories.</h2>
            <p className="mt-6 text-lg leading-8 text-[#59655f]">Target verticals include dental clinics, coaching institutes, salons, gyms and local services. Real estate remains a generic tenant vertical, separate from the standalone X7 RealEstate product.</p>
            <Link href="/pilot" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-[#075e54] px-5 text-sm font-semibold text-white hover:bg-[#064f47]">Review pilot methodology <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
          <div className="rounded-[2rem] border border-[#cfd7d2] bg-white p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#74807a]">Expected measurable outcomes</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {expectedOutcomes.map((item) => (
                <div key={item} className="rounded-xl border border-[#dce3df] p-4">
                  <p className="text-sm font-semibold">{item}</p>
                  <p className="mt-2 text-xs font-medium text-amber-700">Not yet measured</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="grant-use" className="px-4 py-24 sm:px-6 sm:py-32">
        <div className="landing-shell overflow-hidden rounded-[2.5rem] bg-[#d9fdd3] p-7 sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-[#075e54]">Grant utilization and milestones</p>
              <h2 className="mt-5 text-balance text-4xl font-[650] leading-[1.02] tracking-[-0.045em] sm:text-5xl">Use funding to produce stronger product and pilot evidence.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#34534a]">The working ₹20 lakh plan prioritizes product hardening, security, pilot onboarding, intent evaluation, infrastructure, local hiring/training, independent review and IP work. No maximum grant amount is treated as a spending target.</p>
            </div>
            <div className="grid gap-3">
              {[
                ['0–3 months', 'Security baseline, measurement contract and pilot onboarding kit'],
                ['4–8 months', 'Three to five assisted pilots with consent and weekly evidence review'],
                ['9–12 months', 'Independent assessment, commercialization gate and verified outcome report'],
              ].map(([period, outcome]) => (
                <div key={period} className="rounded-2xl bg-white/75 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#07866f]">{period}</p>
                  <p className="mt-2 text-sm font-semibold leading-6">{outcome}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="company" className="bg-white px-4 py-24 sm:px-6 sm:py-32">
        <div className="landing-shell grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-[#dce3df] p-7 sm:p-9">
            <UserRoundCheck className="h-7 w-7 text-[#07866f]" />
            <p className="mt-6 text-sm font-semibold text-[#07866f]">Founder and company</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Rohit Kag · Founder &amp; CEO</h2>
            <p className="mt-5 leading-7 text-[#59655f]">AVIRO TECHNOLOGIES PRIVATE LIMITED is the legal applicant named for this grant-readiness project, with its registered location stated as Indore, Madhya Pradesh. Corporate documents remain required in the private data room before formal application.</p>
          </article>
          <article className="rounded-[2rem] border border-[#dce3df] bg-[#101916] p-7 text-white sm:p-9">
            <Building2 className="h-7 w-7 text-[#7ee5c3]" />
            <p className="mt-6 text-sm font-semibold text-[#7ee5c3]">About Aviro Technologies</p>
            <p className="mt-4 text-xl font-semibold leading-8">XeroWA AI is a product developed by AVIRO TECHNOLOGIES PRIVATE LIMITED, an AI and software company incorporated in Indore, Madhya Pradesh, India.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <a href="mailto:avritechologies@gmail.com" className="rounded-xl border border-white/15 px-4 py-3 hover:bg-white/10">avritechologies@gmail.com</a>
              <a href="tel:+918989440019" className="rounded-xl border border-white/15 px-4 py-3 hover:bg-white/10">+91 89894 40019</a>
            </div>
            <Link href="/grant-readiness" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-white px-5 text-sm font-semibold text-[#075e54]">Open readiness centre <FileCheck2 className="ml-2 h-4 w-4" /></Link>
          </article>
        </div>
      </section>
    </>
  );
}
