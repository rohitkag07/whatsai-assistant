import 'server-only';

import { serviceClientOrNull } from '@/lib/sales-server';
import type { Appointment, ConversationContact } from '@/types/database';

export type CalendarAppointment = Pick<Appointment, 'id' | 'thread_id' | 'contact_id' | 'title' | 'appointment_type' | 'scheduled_at' | 'status' | 'notes'> & {
  contactName: string;
  phone: string;
};

export type CalendarData = {
  appointments: CalendarAppointment[];
  candidates: Array<{
    contactId: string;
    leadId: string;
    name: string;
    phone: string;
  }>;
  source: 'supabase' | 'error';
  error: string | null;
};

export async function loadCalendarData(businessId: string): Promise<CalendarData> {
  const client = serviceClientOrNull();
  if (!client) {
    return {
      source: 'error',
      error: 'Supabase is not configured. Live appointments could not be loaded.',
      appointments: [],
      candidates: [],
    };
  }

  const [appointmentsResult, contactsResult] = await Promise.all([
    (client.from('appointments') as any).select('id,thread_id,contact_id,title,appointment_type,scheduled_at,status,notes').eq('business_id', businessId).order('scheduled_at', { ascending: true }).limit(500),
    (client.from('conversation_contacts') as any).select('id,lead_id,name,phone').eq('business_id', businessId).limit(500),
  ]);
  if (appointmentsResult.error) return { source: 'error', error: appointmentsResult.error.message, appointments: [], candidates: [] };

  const contactRows = (contactsResult.data ?? []) as Pick<ConversationContact, 'id' | 'lead_id' | 'name' | 'phone'>[];
  const contacts = new Map(contactRows.map((contact) => [contact.id, contact]));
  return {
    source: 'supabase',
    error: null,
    appointments: ((appointmentsResult.data ?? []) as Appointment[]).map((appointment) => ({
      ...appointment,
      contactName: contacts.get(appointment.contact_id)?.name ?? 'WhatsApp contact',
      phone: contacts.get(appointment.contact_id)?.phone ?? 'Phone unavailable',
    })),
    candidates: contactRows
      .filter((contact): contact is typeof contact & { lead_id: string } => Boolean(contact.lead_id))
      .map((contact) => ({
        contactId: contact.id,
        leadId: contact.lead_id,
        name: contact.name ?? `Lead ${contact.phone.slice(-4)}`,
        phone: contact.phone,
      })),
  };
}
