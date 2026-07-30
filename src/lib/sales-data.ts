import type { Booking, Lead, Plot, SiteVisit } from '@/types/database';

export type LeadActivityItem = {
  id: string;
  at: string;
  title: string;
  detail: string;
  tone?: 'neutral' | 'good' | 'alert';
};

export type LeadConversationMessage = {
  id: string;
  at: string;
  direction: 'inbound' | 'outbound';
  channel: 'whatsapp' | 'call' | 'site_visit';
  body: string;
};

export type LeadProfile = {
  leadId: string;
  sourceLabel: string;
  summary: string;
  tags: string[];
  assignedTo: string;
  preferredProjectArea: string;
  preferredPlots: string[];
  nextAction: string;
  whatsapp: LeadConversationMessage[];
  activity: LeadActivityItem[];
};

export type VisitBoardItem = SiteVisit & {
  lead_name: string;
  lead_phone: string;
  project_name: string;
  budget_range: Lead['budget_range'];
};

export type PlotInventoryItem = Plot & {
  lead_name?: string | null;
  token_due?: number | null;
};

export type BookingWorkbenchItem = Booking & {
  buyer_name: string;
  plot_label: string;
  project_name: string;
};

export const legacyProjectDefaults = {
  id: process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID ?? '',
  name: 'Current project',
  city: '',
  location: '',
  priceBand: '',
  paymentVpa: process.env.NEXT_PUBLIC_BOOKING_VPA ?? '',
  paymentName: process.env.NEXT_PUBLIC_BOOKING_PAYEE ?? '',
};

export function leadProfileById(_leadId: string): LeadProfile | null {
  return null;
}

export function leadById(_leadId: string): Lead | null {
  return null;
}

export function plotById(_plotId: string | null | undefined): PlotInventoryItem | null {
  return null;
}

export function availablePlots(): PlotInventoryItem[] {
  return [];
}
