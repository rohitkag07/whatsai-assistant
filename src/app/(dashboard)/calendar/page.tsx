import { redirect } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { CalendarView } from '@/components/whatsai/CalendarView';
import { SiteVisitScheduler } from '@/components/whatsai/SiteVisitScheduler';
import { requireBusinessAccess } from '@/lib/auth/session';
import { loadCalendarData } from '@/lib/calendar-data';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const session = await requireBusinessAccess();
  if (!session.activeBusinessId) redirect('/admin');
  const data = await loadCalendarData(session.activeBusinessId);
  return <div className="space-y-6"><PageHeader title="Calendar" description="Appointments and real-estate site visits booked by XeroWA AI on WhatsApp." actions={<div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-full bg-[#e7fce3] px-3 py-1.5 text-xs font-semibold text-[#075e54] sm:flex"><CalendarDays className="h-4 w-4" />Owner schedule</div><SiteVisitScheduler candidates={data.candidates} /></div>} /><CalendarView initialData={data} /></div>;
}
