import type { Metadata } from 'next';
import { WhatsAiLanding } from '@/components/marketing/WhatsAiLanding';

export const metadata: Metadata = {
  title: 'XeroWA AI | Every Message. Revenue Ready.',
  description:
    'XeroWA — The 24/7 WhatsApp AI & Lead Intelligence Platform. Reply instantly, identify buying intent, and hand qualified conversations to your team.',
};

export default function HomePage() {
  return <WhatsAiLanding />;
}
