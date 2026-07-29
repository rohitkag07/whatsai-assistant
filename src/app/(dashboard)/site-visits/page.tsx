import { redirect } from 'next/navigation';

export const metadata = { title: 'Appointments' };

export default function SiteVisitsPage() {
  redirect('/calendar');
}
