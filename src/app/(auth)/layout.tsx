import { APP_NAME, APP_TAGLINE, APP_COPYRIGHT } from '@/lib/constants';
import '@/components/auth/auth-foundation.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  if (process.env.XEROWA_FIRST_RUN_ENABLED === '1') return <div data-foundation="control" className="fr-auth-layout"><a className="x-skip-link" href="#auth-main">Skip to sign-in</a><aside className="fr-auth-story"><div className="fr-auth-brand">XeroWA<span>WhatsApp Revenue Operations</span></div><div><p className="fr-auth-kicker">Controlled work. Accountable next steps.</p><h2>Enquiry.<br />Qualification.<br />Human handoff.</h2><p>Define how enquiries move through your business. Test a Synthetic workflow before any real messaging.</p><ol><li><strong>01</strong> Configure your offers and boundaries</li><li><strong>02</strong> Review ownership and follow-up rules</li><li><strong>03</strong> Inspect a safely simulated enquiry</li></ol></div><p className="fr-auth-footnote">Setup, approval, connection and activation are separate steps.</p></aside><main id="auth-main" className="fr-auth-main" tabIndex={-1}>{children}</main></div>;
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Marketing rail */}
      <aside className="hidden lg:flex flex-1 flex-col justify-between bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-12 text-white">
        <div>
          <div className="text-2xl font-bold">{APP_NAME}</div>
          <div className="text-sm text-white/70 mt-1">{APP_TAGLINE}</div>
        </div>

        <div className="space-y-5 max-w-md">
          <p className="text-2xl font-semibold leading-snug">
            &ldquo;Indian SMB ka WhatsApp receptionist — ab 24/7 AI handle karta hai.&rdquo;
          </p>
          <p className="text-sm text-white/70">
            Lead qualification, appointment booking, owner handoff, and follow-up automation for WhatsApp-first businesses.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> WhatsApp replies in seconds, even after business hours</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Vertical playbooks for clinic, coaching, gym, real estate, and services</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Hot-lead handoff alerts to the owner or sales team</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Trial console for setup, billing, and proof of results</li>
          </ul>
        </div>

        <div className="text-xs text-white/50">{APP_COPYRIGHT} · XeroWA AI</div>
      </aside>

      {/* Form rail */}
      <main className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
