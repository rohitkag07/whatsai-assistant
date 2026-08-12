'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Candidate = {
  contactId: string;
  leadId: string;
  name: string;
  phone: string;
};

export function SiteVisitScheduler({ candidates }: { candidates: Candidate[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [candidateId, setCandidateId] = useState(candidates[0]?.contactId ?? '');
  const [date, setDate] = useState(defaultDate());
  const [time, setTime] = useState('16:00');
  const [pending, startTransition] = useTransition();
  const selected = useMemo(() => candidates.find((candidate) => candidate.contactId === candidateId) ?? null, [candidateId, candidates]);

  function schedule() {
    if (!selected) return;
    startTransition(async () => {
      const response = await fetch('/api/sales/book-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selected.contactId,
          lead_id: selected.leadId,
          lead_name: selected.name,
          phone: selected.phone,
          scheduled_date: date,
          scheduled_time: time,
          locale: 'hi-en',
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        toast.error(typeof result?.error === 'string' ? result.error : 'Site visit scheduling failed.');
        return;
      }
      toast.success(result.response?.hi || 'Site visit scheduled and confirmation prepared.');
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={!candidates.length}><CalendarPlus className="mr-2 h-4 w-4" />Schedule site visit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule real-estate site visit</DialogTitle>
          <DialogDescription>The appointment stays tenant-scoped, appears in Calendar, creates an owner handoff, and queues visit reminders.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Qualified lead</Label>
            <Select value={candidateId} onValueChange={setCandidateId}>
              <SelectTrigger><SelectValue placeholder="Choose a lead" /></SelectTrigger>
              <SelectContent>{candidates.map((candidate) => <SelectItem key={candidate.contactId} value={candidate.contactId}>{candidate.name} · {candidate.phone}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="site-visit-date">Date</Label><Input id="site-visit-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="site-visit-time">Time</Label><Input id="site-visit-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={schedule} disabled={pending || !selected || !date || !time}>{pending ? 'Scheduling…' : 'Confirm site visit'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function defaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}
