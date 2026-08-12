import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';

const evidenceNav = [
  { href: '/innovation', label: 'Innovation' },
  { href: '/evidence', label: 'Evidence' },
  { href: '/pilot', label: 'Pilot' },
  { href: '/grant-readiness', label: 'Grant readiness' },
] as const;

export type ClaimStatus = 'VERIFIED' | 'DEMONSTRATED' | 'PLANNED';

const statusStyles: Record<ClaimStatus, string> = {
  VERIFIED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  DEMONSTRATED: 'border-amber-200 bg-amber-50 text-amber-800',
  PLANNED: 'border-slate-200 bg-slate-100 text-slate-700',
};

export function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

export function EvidencePageShell({
  eyebrow,
  title,
  intro,
  children,
  updated = '12 August 2026',
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  updated?: string;
}) {
  return (
    <main className="min-h-screen bg-[#f6f7f3] text-[#101916]">
      <header className="border-b border-[#dce3df] bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4" aria-label="Evidence centre navigation">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00a884] text-white">
              <MessageCircle className="h-4 w-4" />
            </span>
            XeroWA AI
          </Link>
          <div className="flex flex-wrap gap-1">
            {evidenceNav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-medium text-[#52605a] hover:bg-[#edf2ef] hover:text-[#101916]">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
        <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#07866f]">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to product
        </Link>
        <div className="mt-8 max-w-4xl">
          <p className="text-sm font-semibold text-[#07866f]">{eyebrow}</p>
          <h1 className="mt-4 text-balance text-4xl font-[650] leading-[1.02] tracking-[-0.05em] sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#59655f]">{intro}</p>
          <p className="mt-4 text-xs font-medium text-[#74807a]">Evidence snapshot updated {updated}</p>
        </div>

        <div className="mt-14 space-y-10">{children}</div>
      </div>

      <footer className="border-t border-[#dce3df] bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 text-sm text-[#59655f] md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-semibold text-[#101916]">AVIRO TECHNOLOGIES PRIVATE LIMITED</p>
            <p className="mt-2 max-w-2xl leading-6">XeroWA AI is a product developed by AVIRO TECHNOLOGIES PRIVATE LIMITED, an AI and software company incorporated in Indore, Madhya Pradesh, India.</p>
          </div>
          <div className="grid gap-2 md:text-right">
            <Link href="/privacy" className="hover:text-[#07866f]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#07866f]">Terms of Use</Link>
            <a href="mailto:avritechologies@gmail.com" className="hover:text-[#07866f]">avritechologies@gmail.com</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function EvidenceSection({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[#dce3df] bg-white p-6 shadow-sm sm:p-9">
      <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{title}</h2>
      {intro ? <p className="mt-3 max-w-3xl leading-7 text-[#59655f]">{intro}</p> : null}
      <div className="mt-7">{children}</div>
    </section>
  );
}

export function FactCard({
  label,
  value,
  detail,
  status,
}: {
  label: string;
  value: string;
  detail: string;
  status: ClaimStatus;
}) {
  return (
    <article className="rounded-2xl border border-[#dce3df] bg-[#f8f9f6] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#74807a]">{label}</p>
        <StatusBadge status={status} />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[#59655f]">{detail}</p>
    </article>
  );
}
