import { DashboardShell } from '@/components/shared/DashboardShell';
import { requirePlatformRole } from '@/lib/auth/session';

export const metadata = { title: 'XeroWA Admin' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformRole(['admin', 'dev']);
  return <DashboardShell navMode="admin">{children}</DashboardShell>;
}
