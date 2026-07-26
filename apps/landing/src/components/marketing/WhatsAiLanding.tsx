'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronRight,
  Menu,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { XeroWaBrandHero, XeroWaTrustStrip } from '@/components/brand/XeroWaBrandHero';

const dashboardHref = 'https://x7-whatsai-dashboard.vercel.app/dashboard';
const setupMessage = encodeURIComponent(
  'Hi Rohit, I want to set up XeroWA AI for my business. Please show me the live workflow.',
);
const setupHref = `https://wa.me/917869161842?text=${setupMessage}`;

const navItems = [
  { label: 'Platform', href: '#platform' },
  { label: 'How it works', href: '#workflow' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Control', href: '#control' },
];

const productCards = [
  {
    index: '01',
    icon: MessageSquareMore,
    title: 'Replies that sound like your business.',
    text: 'Approve the facts, tone, and call-to-action once. XeroWA uses that playbook across English, Hindi, and Hinglish.',
    signal: 'Reply policy',
    value: 'Verified',
    className: 'md:col-span-7',
  },
  {
    index: '02',
    icon: Target,
    title: 'Buying intent becomes visible.',
    text: 'Pricing, demo, urgency, and objection signals become structured lead intelligence—not another unread chat.',
    signal: 'Lead signal',
    value: 'High intent',
    className: 'md:col-span-5',
  },
  {
    index: '03',
    icon: UserRoundCheck,
    title: 'The right human takes over.',
    text: 'Hot conversations arrive with the transcript, intent, score, and recommended next step.',
    signal: 'Handoff',
    value: '< 1 minute',
    className: 'md:col-span-5',
  },
  {
    index: '04',
    icon: BrainCircuit,
    title: 'One intelligence layer, every conversation.',
    text: 'See which questions convert, where prospects hesitate, and what your team should improve next.',
    signal: 'Conversation memory',
    value: 'Always on',
    className: 'md:col-span-7',
  },
];

const workflow = [
  {
    step: '01',
    title: 'Connect your WhatsApp',
    text: 'We connect one business number through WhatsApp Cloud API and keep channel ownership with you.',
  },
  {
    step: '02',
    title: 'Engineer the playbook',
    text: 'Real customer questions become approved reply rules, qualification logic, and escalation boundaries.',
  },
  {
    step: '03',
    title: 'Go live with guardrails',
    text: 'XeroWA responds instantly, captures intent, and asks only the questions your workflow requires.',
  },
  {
    step: '04',
    title: 'Improve from evidence',
    text: 'Use actual conversation patterns—not guesswork—to tune offers, follow-up, and your human sales process.',
  },
];

export function WhatsAiLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMobileCta, setShowMobileCta] = useState(false);

  useEffect(() => {
    const updateMobileCta = () => {
      const pastHero = window.scrollY > Math.min(window.innerHeight * 0.9, 760);
      const beforeFooter = window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 460;
      setShowMobileCta(pastHero && beforeFooter);
    };

    updateMobileCta();
    window.addEventListener('scroll', updateMobileCta, { passive: true });
    window.addEventListener('resize', updateMobileCta);
    return () => {
      window.removeEventListener('scroll', updateMobileCta);
      window.removeEventListener('resize', updateMobileCta);
    };
  }, []);

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-bg-obsidian text-text-platinum">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-brand-sm bg-accent-emerald px-4 py-3 text-sm font-bold text-[#04130f] transition focus:translate-y-0"
      >
        Skip to content
      </a>

      <Header menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((open) => !open)} />

      <div id="main-content">
        <XeroWaBrandHero />
        <XeroWaTrustStrip />
        <PlatformSection />
        <WorkflowSection />
        <ControlSection />
        <FinalCta />
      </div>

      <Footer />

      {showMobileCta && (
        <a
          href={setupHref}
          target="_blank"
          rel="noreferrer"
          className="fixed inset-x-4 bottom-4 z-40 flex min-h-14 items-center justify-center rounded-brand-md bg-accent-emerald px-5 text-sm font-bold text-[#04130f] shadow-glow-emerald sm:hidden"
        >
          Book a live setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      )}
    </main>
  );
}

function Header({ menuOpen, onMenuToggle }: { menuOpen: boolean; onMenuToggle: () => void }) {
  return (
    <header className="absolute inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6">
      <nav className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between rounded-brand-md border border-white/[0.09] bg-[#081529]/85 px-3 shadow-obsidian-card backdrop-blur-2xl sm:px-5" aria-label="Primary navigation">
        <a href="#top" className="flex min-h-12 items-center gap-3 rounded-lg px-1" aria-label="XeroWA AI home">
          <Image src="/brand/xerowa-logo-mark.svg" alt="" width={40} height={40} className="h-10 w-10" />
          <span className="leading-none">
            <span className="block font-display text-base font-bold tracking-[-0.03em]">XeroWA <span className="text-accent-emerald">AI</span></span>
            <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.16em] text-text-slate">by Xero Seven AI</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="rounded-lg px-3 py-2.5 text-xs font-semibold text-text-slate transition hover:bg-white/[0.05] hover:text-text-platinum">
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href={dashboardHref} className="hidden min-h-11 items-center px-3 text-xs font-semibold text-text-slate transition hover:text-text-platinum sm:inline-flex">
            Owner login
          </Link>
          <a href={setupHref} target="_blank" rel="noreferrer" className="hidden min-h-11 items-center rounded-lg bg-text-platinum px-4 text-xs font-bold text-bg-obsidian transition hover:bg-accent-emerald sm:inline-flex">
            Book setup
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.035] text-text-platinum lg:hidden"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={onMenuToggle}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mx-auto mt-2 max-w-7xl rounded-brand-md border border-white/[0.1] bg-[#081529] p-3 shadow-obsidian-card lg:hidden">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={onMenuToggle} className="flex min-h-12 items-center justify-between rounded-lg px-4 text-sm font-semibold text-text-slate hover:bg-white/[0.05] hover:text-text-platinum">
              {item.label}
              <ChevronRight className="h-4 w-4" />
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.08] pt-3">
            <Link href={dashboardHref} className="flex min-h-12 items-center justify-center rounded-lg border border-white/[0.1] text-xs font-semibold">Owner login</Link>
            <a href={setupHref} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center rounded-lg bg-accent-emerald text-xs font-bold text-[#04130f]">Book setup</a>
          </div>
        </div>
      )}
    </header>
  );
}

function PlatformSection() {
  return (
    <section id="platform" className="px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
      <div className="landing-shell">
        <SectionIntro
          kicker="The revenue layer for WhatsApp"
          title="A faster response is useful. A smarter next action changes the business."
          text="XeroWA turns unstructured chats into controlled replies, qualified opportunities, and a sales signal your team can act on."
        />

        <div className="mt-14 grid overflow-hidden rounded-brand-xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-12">
          {productCards.map((card) => (
            <article key={card.index} className={`group min-h-[25rem] bg-bg-obsidian p-6 transition duration-500 hover:bg-surface-card/45 sm:p-8 ${card.className}`}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-slate">{card.index} / Intelligence module</span>
                  <card.icon className="h-5 w-5 text-accent-emerald" />
                </div>
                <h3 className="mt-14 max-w-xl font-display text-3xl font-bold leading-[1] tracking-[-0.045em] sm:text-4xl">{card.title}</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-text-slate">{card.text}</p>
                <div className="mt-auto pt-10">
                  <div className="rounded-brand-md border border-white/[0.08] bg-[#081529] p-4 transition duration-500 group-hover:border-accent-emerald/20 group-hover:shadow-glow-emerald">
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-slate">{card.signal}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-text-platinum">{card.value}</p>
                      <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-accent-emerald">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
                        active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="border-y border-white/[0.07] bg-[#081529] px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
      <div className="landing-shell grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="brand-kicker">From first ping to next action</p>
          <h2 className="mt-5 font-display text-4xl font-bold leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Engineered around your real sales motion.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-8 text-text-slate">
            We begin with the conversations your team already handles. Then we encode the decisions that make those conversations move.
          </p>
          <div className="mt-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-cyan">
            <ShieldCheck className="h-4 w-4" />
            Human-defined guardrails
          </div>
        </div>

        <div className="border-t border-white/[0.08]">
          {workflow.map((item) => (
            <article key={item.step} className="group grid gap-5 border-b border-white/[0.08] py-8 sm:grid-cols-[5rem_1fr] sm:py-10">
              <span className="font-mono text-xs font-bold text-accent-emerald">{item.step}</span>
              <div className="grid gap-4 sm:grid-cols-[0.82fr_1.18fr] sm:items-start">
                <h3 className="font-display text-2xl font-bold tracking-[-0.035em]">{item.title}</h3>
                <p className="text-sm leading-7 text-text-slate">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ControlSection() {
  return (
    <section id="control" className="px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
      <div className="landing-shell overflow-hidden rounded-[2rem] border border-accent-emerald/20 bg-surface-card p-6 shadow-glow-emerald-lg sm:p-10 lg:grid lg:grid-cols-[1.06fr_0.94fr] lg:gap-16 lg:p-16">
        <div>
          <p className="brand-kicker">Control is the product</p>
          <h2 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            AI should accelerate trust, never improvise it.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-text-slate">
            Every customer-facing fact begins with your approved playbook. Every conversation remains visible. Every escalation has a named human owner.
          </p>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-brand-md border border-white/[0.08] bg-white/[0.08] lg:mt-0">
          {[
            ['Exact answers', 'Prices, policies, and promises stay inside approved boundaries.'],
            ['Full history', 'Inbound, automated, and human replies share one timeline.'],
            ['Instant takeover', 'Pause automation and continue in the same conversation.'],
            ['Business isolation', 'Each number keeps its own rules, users, and data.'],
          ].map(([title, text]) => (
            <div key={title} className="flex gap-4 bg-[#0d1e38] p-5">
              <Check className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-accent-emerald p-1 text-[#04130f]" />
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-xs leading-6 text-text-slate">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.07] bg-[#061222] px-4 py-24 text-center sm:px-6 sm:py-32 lg:py-40">
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-emerald/10 blur-[100px]" />
      <div className="landing-shell relative">
        <Image src="/brand/xerowa-logo-mark.svg" alt="" width={64} height={64} className="mx-auto h-16 w-16 animate-soft-float" />
        <h2 className="mx-auto mt-8 max-w-5xl font-display text-5xl font-bold leading-[0.93] tracking-[-0.058em] sm:text-6xl lg:text-7xl">
          Your next WhatsApp lead is already typing.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-slate">
          Bring one real customer question. We will show you the reply, qualification, and handoff workflow live.
        </p>
        <a href={setupHref} target="_blank" rel="noreferrer" className="brand-button-primary group mt-9">
          Build my live workflow
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}

function SectionIntro({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div className="max-w-5xl">
      <p className="brand-kicker">{kicker}</p>
      <h2 className="mt-5 max-w-4xl font-display text-4xl font-bold leading-[0.98] tracking-[-0.052em] sm:text-5xl lg:text-6xl">{title}</h2>
      <p className="mt-6 max-w-2xl text-base leading-8 text-text-slate">{text}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#050f1d] px-4 pb-28 pt-14 sm:px-6 sm:pb-12 sm:pt-16">
      <div className="landing-shell">
        <div className="grid gap-10 border-b border-white/[0.07] pb-12 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <div>
            <Image src="/brand/xerowa-logo-full.svg" alt="XeroWA AI by Xero Seven AI" width={224} height={60} className="h-auto w-56" />
            <p className="mt-5 max-w-sm text-sm leading-6 text-text-slate">
              The 24/7 WhatsApp AI &amp; Lead Intelligence Platform.
            </p>
          </div>
          <FooterColumn title="Product" links={[['Platform', '#platform'], ['Workflow', '#workflow'], ['Pricing', '#pricing'], ['Owner login', dashboardHref]]} />
          <FooterColumn title="Company" links={[['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', 'mailto:rohit@xeroseven.in']]} />
        </div>
        <div className="flex flex-col gap-3 pt-7 font-mono text-[9px] uppercase tracking-[0.12em] text-text-slate/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Xero Seven AI. All rights reserved.</p>
          <p className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-accent-emerald" /> Engineered in India</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-text-platinum">{title}</p>
      <div className="mt-4 grid gap-3 text-sm text-text-slate">
        {links.map(([label, href]) => (
          <a key={label} href={href} className="transition hover:text-accent-emerald">{label}</a>
        ))}
      </div>
    </div>
  );
}
