import 'server-only';

import { serviceClientOrNull } from '@/lib/sales-server';
import type { Appointment, ConversationContact } from '@/types/database';

export type CalendarAppointment = Pick<Appointment, 'id' | 'thread_id' | 'contact_id' | 'title' | 'appointment_type' | 'scheduled_at' | 'status' | 'notes'> & {
  contactName: string;
  phone: string;
};

export type CalendarData = {
  appointments: CalendarAppointment[];
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
    };
  }

  const [appointmentsResult, contactsResult] = await Promise.all([
    (client.from('appointments') as any).select('id,thread_id,contact_id,title,appointment_type,scheduled_at,status,notes').eq('business_id', businessId).order('scheduled_at', { ascending: true }).limit(500),
    (client.from('conversation_contacts') as any).select('id,name,phone').eq('business_id', businessId).limit(500),
  ]);
  if (appointmentsResult.error) return { source: 'error', error: appointmentsResult.error.message, appointments: [] };

  const contacts = new Map(((contactsResult.data ?? []) as Pick<ConversationContact, 'id' | 'name' | 'phone'>[]).map((contact) => [contact.id, contact]));
  return {
    source: 'supabase',
    error: null,
    appointments: ((appointmentsResult.data ?? []) as Appointment[]).map((appointment) => ({
      ...appointment,
      contactName: contacts.get(appointment.contact_id)?.name ?? 'WhatsApp contact',
      phone: contacts.get(appointment.contact_id)?.phone ?? 'Phone unavailable',
    })),
  };
}
