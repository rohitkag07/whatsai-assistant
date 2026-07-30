import { AdminPageHeader } from '@/components/admin/AdminPrimitives';
import { AdminSystemHealth } from '@/components/admin/AdminSystemHealth';
import { requirePlatformRole } from '@/lib/auth/session';
import { getOpsReadiness } from '@/lib/ops-readiness';
import { getWhatsAppHealth } from '@/lib/whatsapp-health';

export const dynamic = 'force-dynamic';

export default async function AdminSystemPage() {
  await requirePlatformRole(['admin', 'dev']);
  const [readiness, whatsapp] = await Promise.all([getOpsReadiness(), getWhatsAppHealth()]);
  return <div className="mx-auto max-w-5xl space-y-5"><AdminPageHeader eyebrow="Production diagnostics" title="System health" description="A credential-safe view of launch gates, environment presence, database access, WhatsApp connectivity, and service reachability." /><AdminSystemHealth readiness={readiness} whatsapp={whatsapp} /></div>;
}
