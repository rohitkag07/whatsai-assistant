import { DashboardShell } from '@/components/shared/DashboardShell';
import { requireBusinessAccess } from '@/lib/auth/session';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireBusinessAccess();
  return <DashboardShell navMode="client">{children}</DashboardShell>;
}
