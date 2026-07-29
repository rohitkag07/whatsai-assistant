import type { Metadata } from 'next';
import { Noto_Sans_Devanagari } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

const noto = Noto_Sans_Devanagari({
  subsets: ['devanagari', 'latin'],
  variable: '--font-hindi',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://landing-iota-lemon.vercel.app'),
  title: { default: 'XeroWA AI', template: '%s | XeroWA AI' },
  description:
    'XeroWA — The 24/7 WhatsApp AI & Lead Intelligence Platform.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'XeroWA AI',
    description: 'Turn Every WhatsApp Inbound into Revenue — 24/7.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${noto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
