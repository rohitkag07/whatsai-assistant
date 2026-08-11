import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarCheck2,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Headphones,
  HeartPulse,
  Home,
  Landmark,
  LockKeyhole,
  Menu,
  MessageCircle,
  MessagesSquare,
  MoreHorizontal,
  Phone,
  Play,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  UsersRound,
  Wrench,
  Zap,
} from 'lucide-react';

const outcomes = [
  { value: '< 8 sec', label: 'first reply, every time' },
  { value: '24 × 7', label: 'lead capture coverage' },
  { value: '1 inbox', label: 'for AI + your team' },
  { value: '100%', label: 'owner-approved replies' },
];

const capabilities: Array<{
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  copy: string;
  className: string;
}> = [
  {
    icon: MessagesSquare,
    eyebrow: '01 · Reply',
    title: 'Instant answers that sound like your business.',
    copy: 'XeroWA answers repeat questions in English or Hinglish using only the information you approve.',
    className: 'bg-[#dff8ee]',
  },
  {
    icon: ScanSearch,
    eyebrow: '02 · Qualify',
    title: 'Turn a chat into a useful lead.',
    copy: 'Capture intent, budget, location and timing naturally—without making customers fill another form.',
    className: 'bg-[#f0ecff]',
  },
  {
    icon: CalendarCheck2,
    eyebrow: '03 · Convert',
    title: 'Move every serious enquiry forward.',
    copy: 'Offer the next best step: schedule a visit, request a callback, share a quote, or hand off to a person.',
    className: 'bg-[#fff0ce]',
  },
];

const playbooks: Array<{
  icon: LucideIcon;
  label: string;
  prompt: string;
  action: string;
}> = [
  {
    icon: Home,
    label: 'Real estate',
    prompt: '2 BHK ka budget aur preferred location?',
    action: 'Schedule a site visit',
  },
  {
    icon: HeartPulse,
    label: 'Clinics',
    prompt: 'Consultation kis din convenient rahegi?',
    action: 'Book an appointment',
  },
  {
    icon: Store,
    label: 'Retail',
    prompt: 'Aapko kaunsa model aur quantity chahiye?',
    action: 'Prepare a sales callback',
  },
  {
    icon: Wrench,
    label: 'Local services',
    prompt: 'Issue ka photo aur location share kar dijiye.',
    action: 'Create a service request',
  },
];

const safeguards = [
  {
    icon: BadgeCheck,
    title: 'Approved knowledge only',
    copy: 'You choose every answer, offer, policy and escalation rule.',
  },
  {
    icon: UserRound,
    title: 'Human takeover anytime',
    copy: 'Step into any conversation without losing context or momentum.',
  },
  {
    icon: LockKeyhole,
    title: 'Business-first privacy',
    copy: 'Built around Meta Cloud API with clear access and audit controls.',
  },
];

function XeroMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-10 w-10 place-items-center rounded-[14px] ${
          inverse ? 'bg-[#b9ff66] text-[#0b2c24]' : 'bg-[#0b5d4f] text-white'
        }`}
      >
        <MessageCircle className="h-[21px] w-[21px]" strokeWidth={2.4} />
      </span>
      <span
        className={`text-[21px] font-semibold tracking-[-0.045em] ${
          inverse ? 'text-white' : 'text-[#10201b]'
        }`}
      >
        XeroWA <span className={inverse ? 'text-[#b9ff66]' : 'text-[#0b5d4f]'}>AI</span>
      </span>
    </div>
  );
}

function Pill({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] ${
        dark
          ? 'border-white/15 bg-white/[0.06] text-white/70'
          : 'border-[#cddbd5] bg-white/65 text-[#355048]'
      }`}
    >
      <Check className={`h-3.5 w-3.5 ${dark ? 'text-[#b9ff66]' : 'text-[#0b8f72]'}`} />
      {children}
    </span>
  );
}

function MessageBubble({
  children,
  sent = false,
  time,
}: {
  children: React.ReactNode;
  sent?: boolean;
  time: string;
}) {
  return (
    <div
      className={`max-w-[85%] rounded-[18px] px-4 py-3 shadow-[0_8px_24px_rgba(25,47,40,0.08)] ${
        sent
          ? 'ml-auto rounded-tr-[5px] bg-[#d9fdd3]'
          : 'rounded-tl-[5px] bg-white'
      }`}
    >
      <p className="text-[14px] leading-[1.55] text-[#17221e]">{children}</p>
      <div className="mt-1.5 flex items-center justify-end gap-1 text-[9px] font-medium text-[#71817b]">
        {time}
        {sent && <BadgeCheck className="h-3 w-3 text-[#1682a1]" />}
      </div>
    </div>
  );
}

export default function FigmaRedesignPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f5ef] text-[#10201b]">
      <div className="border-b border-[#d7dfda] bg-[#eaf3ee]">
        <div className="mx-auto flex min-h-9 max-w-[1280px] items-center justify-center px-5 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[#355048] sm:text-[11px]">
          <Sparkles className="mr-2 h-3.5 w-3.5 text-[#0b8f72]" />
          Now onboarding service businesses across India
          <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </div>
      </div>

      <header className="relative z-20 border-b border-[#d7dfda] bg-[#f4f5ef]/95">
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <XeroMark />
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-[#53675f] lg:flex">
            <a href="#product" className="hover:text-[#0b5d4f]">
              Product
            </a>
            <a href="#workflow" className="hover:text-[#0b5d4f]">
              Workflow
            </a>
            <a href="#industries" className="hover:text-[#0b5d4f]">
              Industries
            </a>
            <a href="#pricing" className="hover:text-[#0b5d4f]">
              Pricing
            </a>
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="#"
              className="rounded-full px-4 py-2.5 text-[13px] font-semibold text-[#355048]"
            >
              Owner login
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#0b5d4f] px-5 py-3 text-[12px] font-semibold text-white shadow-[0_8px_24px_rgba(11,93,79,0.18)]"
            >
              Book a setup call
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <button
            aria-label="Open menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#cbd7d2] sm:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <section className="relative border-b border-[#d7dfda]">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(16,32,27,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(16,32,27,0.045)_1px,transparent_1px)] [background-size:46px_46px]" />
        <div className="relative mx-auto grid max-w-[1280px] gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c6d6cf] bg-white/80 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#355048] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#11a378] opacity-35" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#11a378]" />
              </span>
              24/7 WhatsApp lead assistant
            </div>
            <h1 className="max-w-[760px] text-balance text-[50px] font-semibold leading-[0.96] tracking-[-0.065em] text-[#10201b] sm:text-[72px] lg:text-[78px]">
              Turn every WhatsApp enquiry into a{' '}
              <span className="relative whitespace-nowrap text-[#0b5d4f]">
                next step.
                <span className="absolute -bottom-1 left-0 h-[7px] w-full rounded-full bg-[#b9ff66]/90" />
              </span>
            </h1>
            <p className="mt-7 max-w-[610px] text-[17px] leading-[1.65] tracking-[-0.015em] text-[#53675f] sm:text-[19px]">
              XeroWA AI answers from your approved playbook, qualifies serious
              leads, and moves them to a booking, callback, quote, or your team.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-full bg-[#0b5d4f] px-7 text-[14px] font-semibold text-white shadow-[0_14px_36px_rgba(11,93,79,0.22)]"
              >
                Book a 15-minute setup call
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#workflow"
                className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-full border border-[#c6d3ce] bg-white/65 px-7 text-[14px] font-semibold text-[#1f3931]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e3eee9]">
                  <Play className="ml-0.5 h-3 w-3 fill-[#0b5d4f] text-[#0b5d4f]" />
                </span>
                See the live workflow
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <Pill>Approved replies only</Pill>
              <Pill>Meta Cloud API</Pill>
              <Pill>Human takeover</Pill>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[590px]">
            <div className="absolute -left-8 top-10 hidden h-32 w-32 rounded-full bg-[#b9ff66]/70 blur-3xl sm:block" />
            <div className="absolute -right-8 bottom-10 h-44 w-44 rounded-full bg-[#6dd6bd]/35 blur-3xl" />
            <div className="relative overflow-hidden rounded-[30px] border border-[#bfd0c8] bg-white p-2 shadow-[0_30px_80px_rgba(22,61,49,0.16)] sm:rounded-[38px] sm:p-3">
              <div className="grid min-h-[590px] overflow-hidden rounded-[24px] bg-[#e9e4db] sm:grid-cols-[156px_1fr] sm:rounded-[30px]">
                <aside className="hidden bg-[#0d2e27] p-4 text-white sm:flex sm:flex-col">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                    <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-[#b9ff66] text-[#0d2e27]">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold">XeroWA</p>
                      <p className="text-[8px] text-white/45">Lead inbox</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    <div className="rounded-xl bg-white/10 px-3 py-3 text-[9px] font-medium text-white">
                      <MessagesSquare className="mb-2 h-3.5 w-3.5 text-[#b9ff66]" />
                      Conversations
                    </div>
                    <div className="rounded-xl px-3 py-3 text-[9px] font-medium text-white/50">
                      <UsersRound className="mb-2 h-3.5 w-3.5" />
                      Leads
                    </div>
                    <div className="rounded-xl px-3 py-3 text-[9px] font-medium text-white/50">
                      <BarChart3 className="mb-2 h-3.5 w-3.5" />
                      Insights
                    </div>
                  </div>
                  <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-white/45">AI status</span>
                      <span className="h-2 w-2 rounded-full bg-[#b9ff66]" />
                    </div>
                    <p className="mt-1 text-[9px] font-medium">Answering now</p>
                  </div>
                </aside>

                <div className="flex min-w-0 flex-col">
                  <div className="flex h-[66px] items-center justify-between border-b border-black/[0.07] bg-[#f8f8f5] px-4 sm:px-5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#cde7dc] text-[11px] font-bold text-[#0b5d4f]">
                        AS
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold">Aarav Sharma</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[8px] text-[#74847e]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#16a37f]" />
                          New property enquiry
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[#53675f]">
                      <Phone className="h-4 w-4" />
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 p-4 sm:p-5">
                    <div className="mx-auto w-fit rounded-full bg-black/[0.07] px-3 py-1 text-[8px] font-semibold uppercase tracking-wider text-[#6a7873]">
                      Today · 10:42 AM
                    </div>
                    <MessageBubble time="10:42 AM">
                      Hi, Vijay Nagar mein 2 BHK ka price kya hai?
                    </MessageBubble>
                    <MessageBubble sent time="10:42 AM">
                      Namaste Aarav 👋 2 BHK homes ₹52L se start hain. Aapka
                      preferred budget aur move-in timeline kya hai?
                    </MessageBubble>
                    <MessageBubble time="10:43 AM">
                      60 lakh tak. Ready possession chahiye.
                    </MessageBubble>
                    <MessageBubble sent time="10:43 AM">
                      Perfect—2 matching options available hain. Kya kal 11 AM
                      site visit convenient rahegi?
                    </MessageBubble>
                    <div className="ml-auto max-w-[85%] rounded-[18px] rounded-tr-[5px] border border-[#b2d8cc] bg-[#effaf6] p-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0b5d4f] text-white">
                          <CalendarCheck2 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[10px] font-semibold">Site visit offered</p>
                          <p className="mt-0.5 text-[8px] text-[#687b74]">
                            Tomorrow · 11:00 AM
                          </p>
                        </div>
                        <ChevronRight className="ml-auto h-4 w-4 text-[#0b5d4f]" />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-black/[0.07] bg-[#f8f8f5] p-3">
                    <div className="flex h-10 items-center rounded-full border border-[#d6ded9] bg-white px-4 text-[9px] text-[#82908a]">
                      Type a message…
                      <span className="ml-auto grid h-7 w-7 place-items-center rounded-full bg-[#0b5d4f] text-white">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-2 flex items-center gap-3 rounded-2xl border border-[#c7d7d0] bg-white px-4 py-3 shadow-[0_14px_34px_rgba(22,61,49,0.13)] sm:-left-7">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e1f8ef] text-[#0b8f72]">
                <Zap className="h-4 w-4 fill-[#0b8f72]" />
              </span>
              <div>
                <p className="text-[9px] font-medium text-[#6b7d76]">Lead qualified</p>
                <p className="mt-0.5 text-[11px] font-semibold">High intent · ₹60L</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d7dfda] bg-white/55">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 divide-x divide-y divide-[#d7dfda] px-5 sm:px-8 lg:grid-cols-4 lg:divide-y-0">
          {outcomes.map((outcome) => (
            <div key={outcome.label} className="px-4 py-8 text-center sm:px-8 sm:py-10">
              <p className="text-[25px] font-semibold tracking-[-0.045em] text-[#0b5d4f] sm:text-[30px]">
                {outcome.value}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#71827b]">
                {outcome.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b8f72]">
                From first hello to real action
              </p>
              <h2 className="mt-4 max-w-[700px] text-balance text-[40px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[56px]">
                One assistant.
                <br />
                Three jobs done.
              </h2>
            </div>
            <p className="max-w-[620px] text-[16px] leading-[1.7] text-[#5b6d66] lg:ml-auto lg:text-[18px]">
              Most WhatsApp leads do not need another dashboard. They need a
              useful reply, one smart question, and a clear next step—before
              they message someone else.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, eyebrow, title, copy, className }) => (
              <article
                key={title}
                className={`${className} flex min-h-[390px] flex-col rounded-[28px] border border-[#cfdbd5] p-7 sm:p-9`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#52675f]">
                    {eyebrow}
                  </p>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/70 text-[#0b5d4f] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-auto pt-16">
                  <h3 className="text-balance text-[28px] font-semibold leading-[1.08] tracking-[-0.045em]">
                    {title}
                  </h3>
                  <p className="mt-4 text-[14px] leading-[1.65] text-[#52675f]">
                    {copy}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-[#0c2d25] px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-20">
            <div className="lg:sticky lg:top-10 lg:self-start">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b9ff66]">
                Your playbook, in motion
              </p>
              <h2 className="mt-5 text-balance text-[42px] font-semibold leading-[1] tracking-[-0.055em] sm:text-[60px]">
                AI that follows your process.{' '}
                <span className="text-white/38">Not its imagination.</span>
              </h2>
              <p className="mt-6 max-w-[520px] text-[16px] leading-[1.7] text-white/58">
                XeroWA stays inside the answers and actions you approve, then
                makes every conversation visible to your team.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                <Pill dark>English + Hinglish</Pill>
                <Pill dark>Owner controlled</Pill>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  number: '01',
                  icon: Clock3,
                  title: 'Reply while intent is hot',
                  copy: 'An enquiry arrives at 11:47 PM. XeroWA greets the customer and answers the first question instantly.',
                  meta: 'Trigger · New inbound message',
                },
                {
                  number: '02',
                  icon: CircleDot,
                  title: 'Ask only what moves the lead forward',
                  copy: 'The assistant collects the few details your sales team actually needs—budget, location, timing, or service type.',
                  meta: 'Action · Qualify with approved questions',
                },
                {
                  number: '03',
                  icon: Headphones,
                  title: 'Hand over with context',
                  copy: 'When the lead is ready—or asks for a person—your team gets the complete conversation and the recommended next action.',
                  meta: 'Outcome · Booking, callback, or human takeover',
                },
              ].map(({ number, icon: Icon, title, copy, meta }) => (
                <article
                  key={number}
                  className="rounded-[26px] border border-white/10 bg-white/[0.055] p-6 sm:p-8"
                >
                  <div className="flex items-start gap-5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#b9ff66] text-[#0c2d25]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold tracking-[0.16em] text-[#b9ff66]">
                          {number}
                        </span>
                        <span className="h-px w-8 bg-white/18" />
                        <span className="text-[9px] font-medium uppercase tracking-[0.13em] text-white/38">
                          {meta}
                        </span>
                      </div>
                      <h3 className="mt-4 text-[25px] font-semibold tracking-[-0.035em] sm:text-[30px]">
                        {title}
                      </h3>
                      <p className="mt-3 text-[14px] leading-[1.7] text-white/55 sm:text-[15px]">
                        {copy}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="industries" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b8f72]">
              Built around the way you sell
            </p>
            <h2 className="mx-auto mt-5 max-w-[820px] text-balance text-[40px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[56px]">
              Start with a proven playbook. Make it yours.
            </h2>
            <p className="mx-auto mt-5 max-w-[660px] text-[16px] leading-[1.7] text-[#5b6d66]">
              We configure XeroWA around your customer questions, lead stages,
              team availability, and the next action that matters.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-[30px] border border-[#cad7d1] bg-white shadow-[0_24px_70px_rgba(20,52,42,0.08)]">
            <div className="grid lg:grid-cols-[.82fr_1.18fr]">
              <div className="border-b border-[#d7dfda] p-4 lg:border-b-0 lg:border-r">
                {playbooks.map(({ icon: Icon, label }, index) => (
                  <div
                    key={label}
                    className={`flex items-center gap-4 rounded-2xl px-4 py-4 ${
                      index === 0
                        ? 'bg-[#e5f5ef] text-[#0b5d4f]'
                        : 'text-[#5a6c65]'
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${
                        index === 0 ? 'bg-white' : 'bg-[#f2f4f1]'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14px] font-semibold">{label}</span>
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </div>
                ))}
              </div>

              <div className="bg-[#f9faf7] p-6 sm:p-10">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b5d4f] text-white">
                    <Home className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0b8f72]">
                      Real estate playbook
                    </p>
                    <p className="mt-1 text-[13px] font-semibold">
                      Enquiry → qualified visit
                    </p>
                  </div>
                </div>
                <div className="mt-8 grid gap-3">
                  {playbooks.slice(0, 3).map((item, index) => (
                    <div
                      key={item.prompt}
                      className="grid gap-3 rounded-2xl border border-[#d6dfda] bg-white p-4 sm:grid-cols-[34px_1fr_auto] sm:items-center"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e6f5ef] text-[10px] font-bold text-[#0b5d4f]">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-[11px] font-medium text-[#73817c]">
                          XeroWA asks
                        </p>
                        <p className="mt-1 text-[13px] font-semibold">
                          {item.prompt}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-[#eff3f0] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.11em] text-[#53665f]">
                        {item.action}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#0c2d25] px-5 py-4 text-white">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.13em] text-white/45">
                      Playbook outcome
                    </p>
                    <p className="mt-1 text-[13px] font-semibold">
                      Sales-ready lead, with context
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#b9ff66] text-[#0c2d25]">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[34px] bg-[#dff8ee]">
          <div className="grid gap-10 p-7 sm:p-12 lg:grid-cols-[1fr_1.08fr] lg:items-center lg:p-16">
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0b5d4f] text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b8f72]">
                Control stays with you
              </p>
              <h2 className="mt-4 max-w-[570px] text-balance text-[40px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[54px]">
                Helpful automation. Clear boundaries.
              </h2>
              <p className="mt-5 max-w-[580px] text-[16px] leading-[1.7] text-[#536b62]">
                Your assistant should behave like a well-trained teammate:
                confident inside the playbook, careful outside it, and always
                ready to bring in a person.
              </p>
            </div>
            <div className="space-y-3">
              {safeguards.map(({ icon: Icon, title, copy }) => (
                <article
                  key={title}
                  className="flex gap-4 rounded-[22px] border border-[#bddbcf] bg-white/72 p-5 sm:p-6"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e6f5ef] text-[#0b5d4f]">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold">{title}</h3>
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-[#62766e]">
                      {copy}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-[#d7dfda] bg-white/55 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[.84fr_1.16fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b8f72]">
              Simple starting plan
            </p>
            <h2 className="mt-5 text-balance text-[42px] font-semibold leading-[1] tracking-[-0.055em] sm:text-[58px]">
              Start useful.
              <br />
              Grow from proof.
            </h2>
            <p className="mt-6 max-w-[480px] text-[16px] leading-[1.7] text-[#5d7068]">
              We configure one focused lead flow first, so your team can see
              real conversations and outcomes before expanding.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['RK', 'AS', 'NK'].map((initials, index) => (
                  <span
                    key={initials}
                    className={`grid h-9 w-9 place-items-center rounded-full border-2 border-[#f4f5ef] text-[9px] font-bold ${
                      index === 0
                        ? 'bg-[#0b5d4f] text-white'
                        : index === 1
                          ? 'bg-[#b9ff66] text-[#0c2d25]'
                          : 'bg-[#d9e3df] text-[#355048]'
                    }`}
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <p className="text-[11px] font-medium leading-[1.45] text-[#65776f]">
                Human-assisted onboarding
                <br />
                for your first playbook
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#b9cec5] bg-[#0c2d25] p-2 shadow-[0_28px_70px_rgba(16,53,43,0.16)]">
            <div className="rounded-[26px] border border-white/10 p-6 text-white sm:p-9">
              <div className="flex flex-col gap-5 border-b border-white/12 pb-7 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="rounded-full bg-[#b9ff66] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#0c2d25]">
                    Founding plan
                  </span>
                  <h3 className="mt-5 text-[27px] font-semibold tracking-[-0.035em]">
                    XeroWA Starter
                  </h3>
                  <p className="mt-1 text-[13px] text-white/48">
                    One business · one focused playbook
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[42px] font-semibold tracking-[-0.055em]">
                    ₹1,499
                  </p>
                  <p className="text-[11px] font-medium text-white/42">per month</p>
                </div>
              </div>

              <div className="grid gap-x-6 gap-y-4 py-7 sm:grid-cols-2">
                {[
                  'Approved AI replies',
                  'Lead qualification flow',
                  'Booking or callback action',
                  'Human takeover',
                  'Owner lead inbox',
                  'English + Hinglish',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-[12px] text-white/72">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#b9ff66]/15 text-[#b9ff66]">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 rounded-2xl bg-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-white/45">One-time setup</p>
                  <p className="mt-1 text-[16px] font-semibold">₹2,999</p>
                </div>
                <p className="max-w-[270px] text-[10px] leading-[1.55] text-white/40">
                  Includes playbook configuration, approved answers, testing,
                  and team handover.
                </p>
              </div>

              <a
                href="#contact"
                className="mt-6 flex min-h-[54px] items-center justify-center gap-3 rounded-full bg-[#b9ff66] px-6 text-[13px] font-bold text-[#0c2d25]"
              >
                Book your setup call
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[36px] bg-[#b9ff66]">
          <div className="relative px-7 py-16 text-center sm:px-14 sm:py-20">
            <div className="absolute left-8 top-8 h-20 w-20 rounded-full border border-[#0c2d25]/15" />
            <div className="absolute bottom-8 right-8 h-12 w-12 rounded-full bg-[#0c2d25]/10" />
            <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-[#235045]">
              Your next enquiry could arrive tonight
            </p>
            <h2 className="relative mx-auto mt-5 max-w-[850px] text-balance text-[43px] font-semibold leading-[.98] tracking-[-0.06em] text-[#0c2d25] sm:text-[66px]">
              Let&apos;s give it a useful answer.
            </h2>
            <p className="relative mx-auto mt-5 max-w-[620px] text-[15px] leading-[1.65] text-[#365e53] sm:text-[17px]">
              In 15 minutes, we&apos;ll map your highest-value WhatsApp enquiry
              and show you exactly where XeroWA can help.
            </p>
            <a
              href="#"
              className="relative mt-8 inline-flex min-h-[56px] items-center justify-center gap-3 rounded-full bg-[#0c2d25] px-8 text-[14px] font-semibold text-white shadow-[0_14px_34px_rgba(12,45,37,0.2)]"
            >
              Book a 15-minute setup call
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="relative mt-4 text-[10px] font-medium uppercase tracking-[0.13em] text-[#4b7167]">
              No sales deck · Bring one real customer question
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-[#0a251f] px-5 py-12 text-white sm:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <XeroMark inverse />
              <p className="mt-5 max-w-[440px] text-[13px] leading-[1.65] text-white/45">
                A practical WhatsApp lead assistant for owner-led Indian
                businesses—built around approved replies and real next steps.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-[12px] font-medium text-white/58">
              <a href="#product">Product</a>
              <a href="#workflow">Workflow</a>
              <a href="#industries">Industries</a>
              <a href="#pricing">Pricing</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-7 text-[10px] font-medium uppercase tracking-[0.12em] text-white/30 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 XeroWA AI · Built in India</p>
            <div className="flex items-center gap-2">
              <Landmark className="h-3.5 w-3.5" />
              Xero Seven · Practical AI systems
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
