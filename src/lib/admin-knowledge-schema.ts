import { z } from 'zod';

export const adminKnowledgeSchema = z.object({
  business_id: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  type: z.enum([
    'faq',
    'service',
    'pricing',
    'policy',
    'location',
    'offer',
    'document',
    'other',
  ]),
  question: z.string().trim().max(280).nullable().optional(),
  content: z.string().trim().min(2).max(4000),
  keywords: z.array(z.string().trim().min(1).max(80)).min(1).max(30),
  locale: z.enum(['en-IN', 'hi-IN', 'hinglish']).default('hinglish'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});
