import { redirect } from 'next/navigation';
import { DashboardHome } from '@/components/whatsai/DashboardHome';
import { requireBusinessAccess } from '@/lib/auth/session';
import { loadWhatsAiInboxData } from '@/lib/whatsai-data';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await requireBusinessAccess();
  if (!session.activeBusinessId) redirect('/admin');
  const data = await loadWhatsAiInboxData({ businessId: session.activeBusinessId });
  return <DashboardHome data={data} />;
}
