import { ClientOneEvidenceView } from '@/components/evidence/client-one-evidence-view';
import { createClientOneEvidenceProvider } from '@/lib/evidence-provider';

export const metadata = {
  title: 'Client #1 Evidence',
  description: 'Tenant-scoped operating evidence for XeroWA AI Client #1.',
};

export const dynamic = 'force-dynamic';

export default async function ClientOneEvidencePage() {
  const evidence = await createClientOneEvidenceProvider().load();
  return <ClientOneEvidenceView evidence={evidence} />;
}
