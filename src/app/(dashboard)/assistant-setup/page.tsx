import { PageHeader } from '@/components/shared/PageHeader';
import { WhatsAiSetupForm } from '@/components/whatsai/WhatsAiSetupForm';
import { requirePlatformRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AssistantSetupPage() {
  await requirePlatformRole(['admin', 'dev']);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistant Setup"
        description="Connect WhatsApp, add your business details, and teach XeroWA AI what to ask."
      />
      <WhatsAiSetupForm />
    </div>
  );
}
