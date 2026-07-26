'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Zap,
} from 'lucide-react';

const DEMO_SCENARIOS = [
  {
    id: 'pricing',
    tab: 'Pricing',
    customer: 'Hi, monthly plan kitne ka hai?',
    reply: 'Plans start at ₹1,499/month. I can share the exact feature comparison — are you handling one WhatsApp number or a team inbox?',
    signal: 'Pricing intent',
    score: '82',
  },
  {
    id: 'demo',
    tab: 'Demo',
    customer: 'Can you show this for my clinic?',
    reply: 'Absolutely. I can set up a 15-minute live workflow using one real clinic enquiry. Would today at 6:30 PM work?',
    signal: 'Demo requested',
    score: '94',
  },
  {
    id: 'handoff',
    tab: 'Handoff',
    customer: 'I need to speak with someone before buying.',
    reply: 'Of course. I have marked this as priority and shared the conversation with Rohit. He will continue here shortly.',
    signal: 'Human takeover',
    score: '97',
  },
] as const;

const STARTER_FEATURES = [
  '1 WhatsApp number',
  'Approved reply playbook',
  'Lead capture dashboard',
  'Hinglish intent matching',
];

const GROWTH_FEATURES = [
  'Everything in Starter',
  'Advanced lead intelligence',
  'Team handoff workflows',
  'Priority setup and support',
];

const setupMessage = encodeURIComponent(
  'Hi Rohit, I want to set up XeroWA AI for my business. Please show me the live workflow.',
);
const setupHref = `https://wa.me/917869161842?text=${setupMessage}`;

export function XeroWaBrandHero() {
  const [activeScenario, setActiveScenario] = useState<(typeof DEMO_SCENARIOS)[number]['id']>('pricing');
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef<number | undefined>(undefined);

  const scenario = useMemo(
    () => DEMO_SCENARIOS.find((item) => item.id === activeScenario) ?? DEMO_SCENARIOS[0],
    [activeScenario],
  );

  useEffect(() => () => window.clearTimeout(typingTimer.current), []);

  const selectScenario = (nextScenario: (typeof DEMO_SCENARIOS)[number]['id']) => {
    window.clearTimeout(typingTimer.current);
    setActiveScenario(nextScenario);
    setTyping(true);
    typingTimer.current = window.setTimeout(() => setTyping(false), 760);
  };

  return (
    <section id="top" className="relative overflow-hidden border-b border-white/[0.07] bg-bg-obsidian px-4 pb-24 pt-36 sm:px-6 sm:pb-32 sm:pt-44 lg:pb-40">
      <div aria-hidden="true" className="landing-grid pointer-events-none absolute inset-0 opacity-80" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-48 top-8 h-[34rem] w-[34rem] rounded-full bg-accent-cyan/[0.075] blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-44 top-24 h-[38rem] w-[38rem] rounded-full bg-accent-emerald/10 blur-[130px]" />

      <div className="landing-shell relative">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="animate-brand-enter">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-emerald/25 bg-accent-emerald/[0.065] px-3 py-1.5">
              <span className="h-1.5 w-1.5 animate-signal-pulse rounded-full bg-accent-emerald shadow-glow-emerald" />
              <span className="brand-kicker">WhatsApp revenue infrastructure</span>
            </div>

            <h1 className="mt-8 max-w-3xl font-display text-[clamp(3.5rem,7vw,7.3rem)] font-bold leading-[0.87] tracking-[-0.067em] text-text-platinum">
              Every message.
              <span className="mt-2 block text-accent-emerald">Revenue ready.</span>
            </h1>

            <p className="mt-8 max-w-xl text-balance text-lg leading-8 text-text-slate sm:text-xl">
              XeroWA AI replies 24/7, identifies buying intent, and moves qualified WhatsApp conversations to your team with the full context intact.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={setupHref} target="_blank" rel="noreferrer" className="brand-button-primary group">
                Book a live setup
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#live-demo" className="brand-button-secondary">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full border border-accent-cyan/30 bg-accent-cyan/10">
                  <Zap className="h-3 w-3 text-accent-cyan" />
                </span>
                Test the reply engine
              </a>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-white/[0.08] border-y border-white/[0.08] py-4">
              <ProofMetric value="< 3 sec" label="reply time" />
              <ProofMetric value="24 / 7" label="availability" />
              <ProofMetric value="100%" label="owner control" />
            </div>
          </div>

          <LiveReplyConsole
            activeScenario={activeScenario}
            onScenarioChange={selectScenario}
            scenario={scenario}
            typing={typing}
          />
        </div>

        <PricingComparison />
      </div>
    </section>
  );
}

function LiveReplyConsole({
  activeScenario,
  onScenarioChange,
  scenario,
  typing,
}: {
  activeScenario: (typeof DEMO_SCENARIOS)[number]['id'];
  onScenarioChange: (scenario: (typeof DEMO_SCENARIOS)[number]['id']) => void;
  scenario: (typeof DEMO_SCENARIOS)[number];
  typing: boolean;
}) {
  return (
    <div id="live-demo" className="animate-brand-enter [animation-delay:140ms]">
      <div className="rounded-[1.75rem] bg-[linear-gradient(120deg,rgba(6,182,212,0.55),rgba(16,185,129,0.75),rgba(6,182,212,0.22))] bg-[length:200%_100%] p-px shadow-obsidian-card animate-border-sweep">
        <div className="overflow-hidden rounded-[calc(1.75rem-1px)] bg-[#081529]">
          <div className="flex min-h-14 items-center justify-between border-b border-white/[0.08] px-4 sm:px-5">
            <div className="flex items-center gap-3">
              <Image src="/brand/xerowa-logo-mark.svg" alt="" width={32} height={32} className="h-8 w-8" />
              <div>
                <p className="font-display text-sm font-semibold text-text-platinum">Live reply intelligence</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-slate">xw-agent / production</p>
              </div>
            </div>
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-emerald">
              <span className="h-1.5 w-1.5 animate-signal-pulse rounded-full bg-accent-emerald" />
              Live
            </span>
          </div>

          <div className="grid min-h-[31rem] sm:grid-cols-[1fr_10rem]">
            <div className="relative flex min-w-0 flex-col border-b border-white/[0.08] p-4 sm:border-b-0 sm:border-r sm:p-5">
              <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
                {DEMO_SCENARIOS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={activeScenario === item.id}
                    onClick={() => onScenarioChange(item.id)}
                    className={`min-h-9 shrink-0 rounded-lg border px-3 font-mono text-[10px] uppercase tracking-[0.12em] transition ${
                      activeScenario === item.id
                        ? 'border-accent-emerald/35 bg-accent-emerald/10 text-accent-emerald'
                        : 'border-white/[0.08] bg-white/[0.025] text-text-slate hover:border-white/20 hover:text-text-platinum'
                    }`}
                  >
                    {item.tab}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex-1 space-y-4">
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-white/[0.08] bg-surface-card px-4 py-3">
                    <p className="text-sm leading-6 text-text-platinum">{scenario.customer}</p>
                    <p className="mt-2 text-right font-mono text-[9px] text-text-slate">10:42 PM</p>
                  </div>
                </div>

                <div className="flex min-h-[10rem] justify-end">
                  {typing ? (
                    <TypingIndicator />
                  ) : (
                    <div className="max-w-[92%] rounded-2xl rounded-tr-sm border border-accent-emerald/20 bg-accent-emerald/[0.09] px-4 py-3 shadow-glow-emerald">
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-accent-emerald" />
                        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent-emerald">Approved AI reply</span>
                      </div>
                      <p className="text-sm leading-6 text-text-platinum">{scenario.reply}</p>
                      <p className="mt-2 flex items-center justify-end gap-1 font-mono text-[9px] text-text-slate">
                        10:42 PM
                        <span aria-label="Delivered and read" className="font-bold tracking-[-0.18em] text-accent-emerald">✓✓</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
                <span className="flex items-center gap-2 text-xs text-text-slate">
                  <ShieldCheck className="h-4 w-4 text-accent-cyan" />
                  Reply policy verified
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-slate">guardrail: on</span>
              </div>
            </div>

            <aside className="grid grid-cols-3 divide-x divide-white/[0.08] bg-white/[0.018] sm:grid-cols-1 sm:grid-rows-3 sm:divide-x-0 sm:divide-y">
              <SignalMetric icon={MessageSquareText} label="Intent" value={scenario.signal} />
              <SignalMetric icon={Zap} label="Lead score" value={`${scenario.score}/100`} accent />
              <SignalMetric icon={Clock3} label="Next step" value={scenario.id === 'handoff' ? 'Owner alert' : 'Qualify'} />
            </aside>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-3 flex w-[88%] items-center justify-between border-x border-b border-white/[0.06] px-4 py-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-slate">WhatsApp Cloud API</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent-emerald">Encrypted channel</span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div aria-label="XeroWA AI is typing" className="self-start rounded-2xl rounded-tr-sm border border-accent-emerald/20 bg-accent-emerald/[0.09] px-4 py-3">
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-accent-emerald">XeroWA is typing</p>
      <div className="flex gap-1.5 py-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-text-slate"
            style={{ animationDelay: `${index * 140}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function SignalMetric({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col justify-center p-3 sm:p-4">
      <Icon className={`h-4 w-4 ${accent ? 'text-accent-emerald' : 'text-accent-cyan'}`} />
      <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.14em] text-text-slate">{label}</p>
      <p className={`mt-1 truncate text-[11px] font-semibold sm:whitespace-normal ${accent ? 'text-accent-emerald' : 'text-text-platinum'}`}>{value}</p>
    </div>
  );
}

function ProofMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-3 first:pl-0 sm:px-5">
      <p className="font-mono text-sm font-bold text-text-platinum sm:text-base">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-text-slate">{label}</p>
    </div>
  );
}

function PricingComparison() {
  return (
    <div id="pricing" className="mt-24 border-t border-white/[0.08] pt-16 sm:mt-32 sm:pt-20">
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
        <div>
          <p className="brand-kicker">Clear plans. Human setup.</p>
          <h2 className="mt-5 max-w-xl font-display text-4xl font-bold leading-[0.98] tracking-[-0.05em] text-text-platinum sm:text-5xl">
            Start lean.
            <span className="block text-text-slate">Scale when it proves itself.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-text-slate">
            Both plans include assisted onboarding. Meta messaging charges, when applicable, are billed separately and confirmed before activation.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-brand-xl border border-white/[0.09] bg-white/[0.025] shadow-obsidian-card md:grid-cols-2">
          <PlanCard
            name="Starter"
            price="₹1,499"
            description="A precise first workflow for one owner-led business."
            features={STARTER_FEATURES}
          />
          <PlanCard
            name="Growth"
            price="₹2,999"
            description="Deeper lead intelligence and faster team handoffs."
            features={GROWTH_FEATURES}
            featured
          />
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  description,
  features,
  featured = false,
}: {
  name: string;
  price: string;
  description: string;
  features: readonly string[];
  featured?: boolean;
}) {
  return (
    <article className={`group relative p-6 transition duration-500 sm:p-7 ${featured ? 'bg-surface-card/70' : 'border-b border-white/[0.08] md:border-b-0 md:border-r'}`}>
      {featured && (
        <span className="absolute right-5 top-5 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-accent-emerald">
          Best for teams
        </span>
      )}
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-slate">{name}</p>
      <div className="mt-5 flex items-end gap-2">
        <p className="font-display text-4xl font-bold tracking-[-0.05em] text-text-platinum">{price}</p>
        <span className="pb-1 text-xs text-text-slate">/ month</span>
      </div>
      <p className="mt-3 max-w-xs text-sm leading-6 text-text-slate">{description}</p>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm text-text-platinum">
            <Check className="h-4 w-4 shrink-0 text-accent-emerald" />
            {feature}
          </li>
        ))}
      </ul>
      <a
        href={setupHref}
        target="_blank"
        rel="noreferrer"
        className={`mt-7 flex min-h-11 items-center justify-between rounded-brand-sm border px-4 text-sm font-semibold transition ${
          featured
            ? 'border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald hover:text-[#04130f]'
            : 'border-white/[0.1] text-text-platinum hover:border-white/25 hover:bg-white/[0.05]'
        }`}
      >
        Choose {name}
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </a>
    </article>
  );
}

export function XeroWaTrustStrip() {
  return (
    <div className="border-y border-white/[0.07] bg-[#081529]">
      <div className="landing-shell grid grid-cols-2 divide-x divide-y divide-white/[0.07] md:grid-cols-4 md:divide-y-0">
        {[
          [ShieldCheck, 'Owner-approved replies'],
          [UsersRound, 'Human takeover'],
          [CircleCheck, 'Hinglish-ready'],
          [Zap, 'Real-time lead scoring'],
        ].map(([Icon, label]) => {
          const TrustIcon = Icon as typeof Zap;
          return (
            <div key={label as string} className="flex min-h-20 items-center gap-3 px-4 text-xs font-semibold text-text-slate sm:px-6">
              <TrustIcon className="h-4 w-4 shrink-0 text-accent-emerald" />
              {label as string}
            </div>
          );
        })}
      </div>
    </div>
  );
}
