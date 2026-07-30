export type AdminModuleId =
  | 'whatsapp'
  | 'assistant'
  | 'knowledge'
  | 'calendar'
  | 'handoffs'
  | 'followups'
  | 'broadcasts';

export type AdminModuleState = {
  enabled: boolean;
  updated_at: string | null;
  updated_by: string | null;
};

export type AdminModuleDefinition = {
  id: AdminModuleId;
  label: string;
  description: string;
  contract: string;
  enforcement: 'runtime' | 'configuration_only';
  defaultEnabled: boolean;
};

export const ADMIN_MODULES: AdminModuleDefinition[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp channel',
    description: 'Inbound and outbound Meta WhatsApp routing for this business.',
    contract: 'business_channels.status',
    enforcement: 'runtime',
    defaultEnabled: true,
  },
  {
    id: 'assistant',
    label: 'Automated replies',
    description: 'Active deterministic assistant playbooks and keyword replies.',
    contract: 'assistant_playbooks.is_active',
    enforcement: 'runtime',
    defaultEnabled: true,
  },
  {
    id: 'knowledge',
    label: 'Knowledge base',
    description: 'Owner-approved FAQs, policies, offers, and OKF-backed answers.',
    contract: 'assistant_knowledge_items configuration status',
    enforcement: 'configuration_only',
    defaultEnabled: true,
  },
  {
    id: 'calendar',
    label: 'Appointments',
    description: 'Booked callbacks, visits, and follow-up slots.',
    contract: 'appointments configuration status',
    enforcement: 'configuration_only',
    defaultEnabled: true,
  },
  {
    id: 'handoffs',
    label: 'Owner handoffs',
    description: 'Human takeover and urgent owner-action workflow.',
    contract: 'handoff_events configuration status',
    enforcement: 'configuration_only',
    defaultEnabled: true,
  },
  {
    id: 'followups',
    label: 'Follow-up sequence',
    description: 'Durable lead follow-up jobs for active conversations.',
    contract: 'followup_sequences.active',
    enforcement: 'runtime',
    defaultEnabled: true,
  },
  {
    id: 'broadcasts',
    label: 'Broadcasts',
    description: 'Template-based audience campaigns for approved contacts.',
    contract: 'broadcast_campaigns configuration status',
    enforcement: 'configuration_only',
    defaultEnabled: false,
  },
];
