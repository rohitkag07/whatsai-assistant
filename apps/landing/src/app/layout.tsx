import type { Metadata } from 'next';
import { Noto_Sans_Devanagari, Outfit } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

const noto = Noto_Sans_Devanagari({
  subsets: ['devanagari', 'latin'],
  variable: '--font-hindi',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://landing-iota-lemon.vercel.app'),
  title: { default: 'XeroWA AI', template: '%s | XeroWA AI' },
  description:
    'XeroWA — The 24/7 WhatsApp AI & Lead Intelligence Platform.',
  openGraph: {
    title: 'XeroWA AI',
    description: 'Every message. Revenue ready. The 24/7 WhatsApp AI & Lead Intelligence Platform.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${outfit.variable} ${noto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
