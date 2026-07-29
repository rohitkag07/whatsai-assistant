import { redirect } from 'next/navigation';
import { defaultLandingForRole } from '@/lib/auth/roles';
import { getAuthSession } from '@/lib/auth/session';

export const metadata = { title: 'Dashboard' };

export default async function HomePage() {
  const session = await getAuthSession();
  redirect(session ? defaultLandingForRole(session.platformRole) : '/login');
}
