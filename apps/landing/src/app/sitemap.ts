import type { MetadataRoute } from 'next';

const baseUrl = 'https://landing-iota-lemon.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/innovation', '/evidence', '/pilot', '/grant-readiness', '/privacy', '/terms'];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date('2026-08-12T00:00:00.000Z'),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/evidence' ? 0.9 : 0.7,
  }));
}
