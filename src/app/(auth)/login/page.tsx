import { Suspense } from 'react';
import LegacyLogin from '@/components/auth/LegacyLogin';
import { LoginExperience } from '@/components/auth/LoginExperience';
export default function LoginPage() {
  return process.env.XEROWA_FIRST_RUN_ENABLED === '1'
    ? <Suspense fallback={<p role="status">Opening sign-in…</p>}><LoginExperience /></Suspense>
    : <LegacyLogin />;
}
