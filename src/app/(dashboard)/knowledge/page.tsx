import { PageHeader } from '@/components/shared/PageHeader';
import { KnowledgeWorkspace } from '@/components/whatsai/KnowledgeWorkspace';

export const dynamic = 'force-dynamic';

export default function KnowledgePage() {
  return <div className="space-y-6"><PageHeader title="Approved Replies" description="Review the answers XeroWA AI can send about your services, prices, policies, and location." /><KnowledgeWorkspace /></div>;
}
