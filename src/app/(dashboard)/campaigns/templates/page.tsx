import { TemplateManager } from '@/components/whatsai/TemplateManager';
import { requirePlatformRole } from '@/lib/auth/session';

export const metadata = { title: 'WhatsApp Templates' };

export default async function WhatsAppTemplatesPage() {
  await requirePlatformRole(['admin', 'dev']);
  return <TemplateManager />;
}
