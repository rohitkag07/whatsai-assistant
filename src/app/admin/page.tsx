import { Activity, Building2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const adminCards = [
  {
    title: 'Client Control Center',
    description: 'All-client list, tenant mapping, and owner/team access controls will live here.',
    icon: Building2,
  },
  {
    title: 'Feature Toggles',
    description: 'Tenant-level WhatsApp, knowledge, broadcasts, follow-up, and handoff switches.',
    icon: SlidersHorizontal,
  },
  {
    title: 'Launch Gates',
    description: 'Client dashboard, admin controls, and dogfood proof status before demo claims.',
    icon: ShieldCheck,
  },
  {
    title: 'Runtime Health',
    description: 'Webhook, Supabase, cron, Meta send, template sync, and failed-send visibility.',
    icon: Activity,
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-[#075e54]">XeroWA operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#111b21]">Admin dashboard</h1>
        <p className="mt-3 text-sm leading-6 text-[#667781]">
          Internal control surface for client management, feature readiness, and launch proof. Detailed controls land in the follow-up PRs after the auth boundary is enforced.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="shadow-none">
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf8f4] text-[#075e54]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <CardDescription className="mt-1 leading-5">{card.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <span className="inline-flex rounded-full border border-[#d8dee4] px-2.5 py-1 text-xs font-medium text-[#667781]">PR 4 control lane</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
