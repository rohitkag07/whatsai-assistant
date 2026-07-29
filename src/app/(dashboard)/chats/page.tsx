import { redirect } from 'next/navigation';
import { ChatsInbox } from '@/components/whatsai/ChatsInbox';
import { requireBusinessAccess } from '@/lib/auth/session';
import { loadWhatsAiInboxData } from '@/lib/whatsai-data';

export const dynamic = 'force-dynamic';

interface ChatsPageProps { searchParams?: Promise<{ phone?: string }> }

export default async function ChatsPage({ searchParams }: ChatsPageProps) {
  const params = await searchParams;
  const session = await requireBusinessAccess();
  if (!session.activeBusinessId) redirect('/admin');
  const data = await loadWhatsAiInboxData({ businessId: session.activeBusinessId, selectedPhone: params?.phone ?? null });
  return <ChatsInbox data={data} />;
}
