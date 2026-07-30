import {
  Activity,
  BookOpen,
  Building2,
  MessageCircle,
  Sparkles,
  Users,
  Webhook,
  Wifi,
} from 'lucide-react';
import { requirePlatformRole } from '@/lib/auth/session';
import { loadAdminOverview } from '@/lib/admin-data';
import {
  AdminMetricCard,
  AdminPageHeader,
  AdminQuickAction,
  AdminSection,
} from '@/components/admin/AdminPrimitives';
import { AdminActivityFeed } from '@/components/admin/AdminActivityFeed';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  await requirePlatformRole(['admin', 'dev']);
  const { stats, activity } = await loadAdminOverview();

  return (
    <div className="mx-auto max-w-[1540px] space-y-6">
      <AdminPageHeader
        eyebrow="Agency operations"
        title="Run every client account from one calm control room."
        description="Monitor live WhatsApp traffic, spot handoffs, and move into any client workspace without losing tenant context."
      />

      <section className="grid grid-flow-dense gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Total clients"
          value={stats.totalClients}
          detail="Business accounts on the platform"
          icon={Users}
        />
        <AdminMetricCard
          label="Live WhatsApp"
          value={stats.liveConnections}
          detail="Connected channels accepting messages"
          icon={Wifi}
        />
        <AdminMetricCard
          label="Messages sent today"
          value={stats.messagesSentToday}
          detail="Outbound replies since midnight IST"
          icon={MessageCircle}
          tone="blue"
        />
        <AdminMetricCard
          label="Hot handoffs"
          value={stats.hotHandoffs}
          detail="Open conversations needing an owner"
          icon={Sparkles}
          tone={stats.hotHandoffs ? 'amber' : 'slate'}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]">
        <AdminSection
          title="Recent activity"
          description="The latest messages across every connected business."
        >
          <AdminActivityFeed activity={activity} />
        </AdminSection>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <AdminSection
            title="Quick actions"
            description="Open the workspace you need next."
          >
            <div className="grid grid-flow-dense gap-3 p-4 sm:grid-cols-2 xl:grid-cols-1">
              <AdminQuickAction
                href="/admin/clients"
                title="Add new client"
                description="Create a business account and assign its owner."
                icon={Building2}
              />
              <AdminQuickAction
                href="/admin/webhooks"
                title="View webhook log"
                description="Inspect inbound events and delivery updates."
                icon={Webhook}
              />
              <AdminQuickAction
                href="/admin/system"
                title="Check system health"
                description="Review environment, services, data, and launch gates."
                icon={Activity}
              />
              <AdminQuickAction
                href="/admin/knowledge"
                title="Manage knowledge"
                description="Review approved replies across client accounts."
                icon={BookOpen}
              />
            </div>
          </AdminSection>
        </aside>
      </div>
    </div>
  );
}
