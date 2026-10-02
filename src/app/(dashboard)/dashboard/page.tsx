import { firstRunEntry } from '@/components/first-run/FirstRunEntry';
import { redirect } from 'next/navigation';
import { controlEntry } from '@/components/control/ControlEntry';
import { DashboardHome } from '@/components/whatsai/DashboardHome';
import { requireBusinessAccess } from '@/lib/auth/session';
import { loadWhatsAiInboxData } from '@/lib/whatsai-data';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await requireBusinessAccess();
  if (!session.activeBusinessId) redirect('/admin');
  const readiness = await firstRunEntry(session);
  const control = await controlEntry(session, 'today');
  if (control) return <>{readiness}{control}</>;
  const data = await loadWhatsAiInboxData({ businessId: session.activeBusinessId });
  return <>{readiness}<DashboardHome data={data} /></>;
}
