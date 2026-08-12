import type { Metadata } from 'next';
import { WhatsAiLanding } from '@/components/marketing/WhatsAiLanding';

export const metadata: Metadata = {
  title: 'XeroWA AI | Structured WhatsApp Leads and Follow-ups',
  description:
    'A pre-launch, controlled WhatsApp workflow product for approved replies, lead qualification, follow-ups, appointments and owner escalation.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <WhatsAiLanding />;
}
