import { SystemState } from '@/components/system/SystemState';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AdminClientDetail } from '@/components/admin/AdminClientDetail';
import { AdminClientViewButton } from '@/components/admin/AdminClientViewButton';
import { AdminPageHeader, AdminStatusBadge } from '@/components/admin/AdminPrimitives';
import { Button } from '@/components/ui/button';
import { requirePlatformRole } from '@/lib/auth/session';
import { loadAdminClientDetail } from '@/lib/admin-data';

export const dynamic = 'force-dynamic';

export default async function AdminClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformRole(['admin', 'dev']);
  const { id } = await params;
  const detail = await loadAdminClientDetail(id).catch(() => undefined);
  if (detail === undefined) return <div className="space-y-5"><AdminPageHeader eyebrow="Client operations" title="Client details unavailable" description="The source could not be read. No client status or membership is assumed." /><SystemState kind="error" /><Button asChild variant="outline"><Link href="/admin/clients">Back to clients</Link></Button></div>;
  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Button asChild variant="ghost" className="-ml-3 text-[#52615c]">
        <Link href="/admin/clients"><ArrowLeft className="mr-2 h-4 w-4" />Back to clients</Link>
      </Button>
      <AdminPageHeader
        eyebrow="Client operations"
        title={detail.business.name}
        description={`${detail.business.category.replaceAll('_', ' ')} in ${detail.business.city || 'location not set'}. Manage identity, channels, replies, access, and runtime controls from one tenant-safe workspace.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge status={detail.business.status} />
            <AdminClientViewButton businessId={detail.business.id} />
          </div>
        }
      />
      <AdminClientDetail detail={detail} />
    </div>
  );
}
