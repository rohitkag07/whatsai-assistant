import { BroadcastCampaigns } from '@/components/whatsai/BroadcastCampaigns';
import { requirePlatformRole } from '@/lib/auth/session';

export const metadata = { title: 'Campaigns' };

export default async function CampaignsPage() {
  await requirePlatformRole(['admin', 'dev']);
  return <BroadcastCampaigns />;
}
