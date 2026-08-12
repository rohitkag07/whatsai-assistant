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
    'Controlled WhatsApp workflows for structured leads, follow-ups, appointments and owner escalation.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'XeroWA AI',
    description: 'Turn WhatsApp enquiries into structured leads and follow-ups.',
    type: 'website',
    locale: 'en_IN',
    url: 'https://landing-iota-lemon.vercel.app',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://landing-iota-lemon.vercel.app/#organization',
        name: 'AVIRO TECHNOLOGIES PRIVATE LIMITED',
        email: 'avritechologies@gmail.com',
        telephone: '+91-89894-40019',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Indore',
          addressRegion: 'Madhya Pradesh',
          addressCountry: 'IN',
        },
      },
      {
        '@type': ['Product', 'SoftwareApplication'],
        '@id': 'https://landing-iota-lemon.vercel.app/#product',
        name: 'XeroWA AI',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'Controlled WhatsApp workflows for structured leads, follow-ups, appointments and owner escalation.',
        brand: { '@id': 'https://landing-iota-lemon.vercel.app/#organization' },
        provider: { '@id': 'https://landing-iota-lemon.vercel.app/#organization' },
      },
    ],
  };

  return (
    <html lang="en" className={`${GeistSans.variable} ${noto.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
