import { PageHeader } from '@/components/shared/PageHeader';
import { KnowledgeWorkspace } from '@/components/whatsai/KnowledgeWorkspace';
import { requireBusinessAccess } from '@/lib/auth/session';
import { isAdminPlatformRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export default async function KnowledgePage() {
  const session = await requireBusinessAccess();

  return <div className="space-y-6"><PageHeader title="Approved Replies" description="Review the answers XeroWA AI can send about your services, prices, policies, and location." /><KnowledgeWorkspace showOkfTools={isAdminPlatformRole(session.platformRole)} /></div>;
}
