import type { LeadStage, LeadTemperature } from '@/types/database';

/**
 * UI-friendly mappings for pipeline columns, status badges, and colors.
 * Single source of truth for anything rendered as a label or badge.
 */

export const LEAD_STAGE_ORDER: LeadStage[] = [
  'new', 'qualified', 'visit_scheduled', 'visited', 'negotiation', 'booked',
];

export const LEAD_STAGE_LABELS: Record<LeadStage, { hi: string; en: string; color: string }> = {
  new:              { hi: 'नए',           en: 'New',             color: 'bg-blue-100 text-blue-800 border-blue-200' },
  qualified:        { hi: 'क्वालिफाइड',     en: 'Qualified',       color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  visit_scheduled:  { hi: 'विज़िट तय',      en: 'Visit Scheduled', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  visited:          { hi: 'विज़िट हुआ',     en: 'Visited',         color: 'bg-purple-100 text-purple-800 border-purple-200' },
  negotiation:      { hi: 'बातचीत',         en: 'Negotiation',     color: 'bg-orange-100 text-orange-800 border-orange-200' },
  booked:           { hi: 'बुक्ड',          en: 'Booked',          color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  lost:             { hi: 'लॉस्ट',          en: 'Lost',            color: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
};

export const TEMPERATURE_LABELS: Record<LeadTemperature, { hi: string; en: string; dot: string }> = {
  hot:  { hi: 'गरम',     en: 'Hot',  dot: 'bg-red-500'    },
  warm: { hi: 'गुनगुना',  en: 'Warm', dot: 'bg-amber-500'  },
  cold: { hi: 'ठंडा',    en: 'Cold', dot: 'bg-blue-500'   },
};

export const APP_NAME      = 'XeroWA AI';
export const APP_TAGLINE   = 'Controlled WhatsApp workflows for structured leads and follow-ups';
export const APP_COPYRIGHT = `© ${new Date().getFullYear()} AVIRO TECHNOLOGIES PRIVATE LIMITED`;
