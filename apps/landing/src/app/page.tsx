import type { Metadata } from 'next';
import { WhatsAiLanding } from '@/components/marketing/WhatsAiLanding';

export const metadata: Metadata = {
  title: 'XeroWA AI | Turn Every WhatsApp Inbound into Revenue — 24/7',
  description:
    'XeroWA — The 24/7 WhatsApp AI & Lead Intelligence Platform. Send approved replies, capture leads, share media, and hand hot conversations to your team.',
};

export default function HomePage() {
  return <WhatsAiLanding />;
}
