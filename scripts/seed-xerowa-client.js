const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILES = [
  '.env.local',
  'agents/xerowa-summoner/.env',
  'agents/xerowa-sales-agent/.env',
  'agents/xerowa-tool-gateway/.env',
];

for (const relativePath of ENV_FILES) {
  loadEnvFile(path.join(ROOT, relativePath));
}

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const businessId =
  process.env.DEFAULT_BUSINESS_ID || '6a427b8d-ec8e-418d-9eea-c8eae278e451';
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ownerEmail = 'kag07rohit@gmail.com';

if (!supabaseUrl || !serviceRoleKey || !phoneNumberId) {
  console.error(
    'Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY, or WHATSAPP_PHONE_NUMBER_ID.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const knowledgeItems = [
  {
    okf_slug: 'pricing',
    title: 'Pricing',
    type: 'pricing',
    question: 'XeroWA AI ki pricing kya hai?',
    keywords: ['price', 'fees', 'kitna', 'cost', 'charges'],
    content:
      'XeroWA AI ka Launch Setup Fee ₹1,999 (one-time) + Monthly ₹999/month hai. Unlimited auto-replies, Hinglish matching, JustDial capture, aur 6-stage CRM sab included hai. 🚀',
  },
  {
    okf_slug: 'demo',
    title: 'Demo',
    type: 'faq',
    question: 'XeroWA AI ka live demo kaise dekhein?',
    keywords: ['demo', 'dekhna', 'dikhao', 'try'],
    content:
      'Live demo dekhne ke liye apna Naame aur Business Category (Gym, Clinic, Real Estate, Coaching) batayein. Hum 15 minute me aapse contact karenge! 📞',
  },
  {
    okf_slug: 'features',
    title: 'Features',
    type: 'service',
    question: 'XeroWA AI kya karta hai?',
    keywords: ['features', 'kya karta hai', 'details'],
    content:
      'XeroWA AI aapke WhatsApp par 24/7 instant Hinglish replies deta hai, PDF brochures bhejta hai, JustDial/Meta leads capture karta hai, aur 3-day auto follow-ups bhejta hai.',
  },
  {
    okf_slug: 'location',
    title: 'Location',
    type: 'location',
    question: 'XeroWA AI ka office kahan hai?',
    keywords: ['location', 'office', 'address', 'kahan'],
    content:
      'XeroWA AI HQ: Indore, Madhya Pradesh. Hum poore India me 100% remote setup & support dete hain.',
  },
  {
    okf_slug: 'comparison',
    title: 'Comparison',
    type: 'faq',
    question: 'XeroWA AI WATI aur Interakt se kaise compare hota hai?',
    keywords: ['interakt', 'wati', 'compare', 'sasta'],
    content:
      'XeroWA AI monthly sirf ₹999 se start hota hai. WATI (₹4,100/mo) aur Interakt (₹2,499/mo) se 4x sasta hai aur Tier-2 Hinglish typos samajhta hai!',
  },
  {
    okf_slug: 'booking',
    title: 'Booking',
    type: 'faq',
    question: 'Discovery call kaise book karein?',
    keywords: ['book', 'meeting', 'call', 'talk'],
    content:
      'Call book karne ke liye apna convenient time batayein. Rohit (Founder) aapse directly 15-min discovery call par baat karenge.',
  },
];

async function main() {
  console.log('Seeding XeroWA AI as Client #1...');

  const existingChannel = await supabase
    .from('business_channels')
    .select('id, phone_number, channel_phone, display_name')
    .or(`phone_number_id.eq.${phoneNumberId},channel_id.eq.${phoneNumberId}`)
    .maybeSingle();
  assertNoError(existingChannel.error, 'read existing WhatsApp channel');

  const metaPhone = await fetchMetaPhoneProfile(phoneNumberId);
  const businessPhone =
    process.env.XEROWA_WHATSAPP_NUMBER ||
    metaPhone?.display_phone_number ||
    existingChannel.data?.phone_number ||
    existingChannel.data?.channel_phone;

  if (!businessPhone) {
    throw new Error(
      'Could not resolve the connected WhatsApp number. Set XEROWA_WHATSAPP_NUMBER and retry.',
    );
  }

  const business = await supabase
    .from('businesses')
    .upsert(
      {
        id: businessId,
        name: 'XeroWA AI',
        phone: businessPhone,
        email: ownerEmail,
        category: 'software_saas',
        city: 'Indore',
        owner_name: 'Rohit Kag',
        owner_phone: businessPhone,
        owner_whatsapp: businessPhone,
        status: 'active',
        plan: 'growth',
        metadata: {
          client_number: 1,
          dogfood_tenant: true,
          parent_company: 'Xero Seven AI',
        },
      },
      { onConflict: 'id' },
    )
    .select('id, name, category, status, plan')
    .single();
  assertNoError(business.error, 'upsert XeroWA AI business');

  const channel = await supabase
    .from('business_channels')
    .upsert(
      {
        business_id: businessId,
        provider: 'meta_whatsapp',
        channel_id: phoneNumberId,
        channel_type: 'whatsapp',
        phone_number_id: phoneNumberId,
        channel_phone: businessPhone,
        phone_number: businessPhone,
        display_name:
          metaPhone?.verified_name ||
          existingChannel.data?.display_name ||
          'XeroWA AI',
        is_primary: true,
        is_active: true,
        status: 'connected',
        last_verified_at: new Date().toISOString(),
        metadata: {
          transport: 'whatsapp_cloud_api',
          official_business_number: true,
        },
      },
      { onConflict: 'provider,channel_id' },
    )
    .select('id, business_id, phone_number_id, status')
    .single();
  assertNoError(channel.error, 'upsert WhatsApp channel');

  const owner = await findAuthUserByEmail(ownerEmail);
  if (!owner) {
    throw new Error(
      `No Supabase Auth user found for ${ownerEmail}. Create the user before seeding membership.`,
    );
  }

  const membership = await supabase
    .from('business_members')
    .upsert(
      {
        business_id: businessId,
        user_id: owner.id,
        display_name: 'Rohit Kag',
        role: 'owner',
        active: true,
      },
      { onConflict: 'business_id,user_id' },
    )
    .select('id, business_id, user_id, role, active')
    .single();
  assertNoError(membership.error, 'upsert owner membership');

  const existingPlaybook = await supabase
    .from('assistant_playbooks')
    .select('id')
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  assertNoError(existingPlaybook.error, 'read current assistant playbook');

  const playbookValues = {
    business_id: businessId,
    name: 'XeroWA AI Approved Replies',
    vertical: 'software_saas',
    system_prompt:
      'Deterministic XeroWA AI receptionist. Send only owner-approved replies.',
    qualification_questions: [
      'What is your name?',
      'Which business category do you run?',
      'What is your preferred time for a 15-minute demo call?',
    ],
    keyword_replies: knowledgeItems.map((item, index) => ({
      id: item.okf_slug,
      label: item.title,
      keywords: item.keywords,
      match_type: 'word',
      reply: item.content,
      priority: 100 - index,
      enabled: true,
      handoff: item.okf_slug === 'booking',
      fuzzy_enabled: true,
      fuzzy_threshold: 0.82,
    })),
    fallback_reply:
      'Thank you for contacting XeroWA AI. Apna naam aur business category share karein; hamari team aapse jaldi contact karegi.',
    handoff_rules: {
      booking_intent: true,
      demo_intent: true,
      notify_owner: ownerEmail,
    },
    is_active: true,
  };

  const playbook = existingPlaybook.data
    ? await supabase
        .from('assistant_playbooks')
        .update(playbookValues)
        .eq('id', existingPlaybook.data.id)
        .select('id, name, is_active')
        .single()
    : await supabase
        .from('assistant_playbooks')
        .insert(playbookValues)
        .select('id, name, is_active')
        .single();
  assertNoError(playbook.error, 'activate XeroWA AI playbook');

  const deactivateOthers = await supabase
    .from('assistant_playbooks')
    .update({ is_active: false })
    .eq('business_id', businessId)
    .neq('id', playbook.data.id);
  assertNoError(deactivateOthers.error, 'deactivate superseded playbooks');

  const now = new Date().toISOString();
  const knowledge = await supabase
    .from('assistant_knowledge_items')
    .upsert(
      knowledgeItems.map((item) => ({
        ...item,
        business_id: businessId,
        playbook_id: playbook.data.id,
        locale: 'hinglish',
        status: 'published',
        source_type: 'manual',
        is_active: true,
        published_at: now,
        last_reviewed_at: now,
        version: 1,
        metadata: { approved_by: ownerEmail, dogfood_seed: true },
      })),
      { onConflict: 'business_id,okf_slug' },
    )
    .select('id, okf_slug, status');
  assertNoError(knowledge.error, 'upsert approved knowledge');

  console.log(`✓ Business: ${business.data.name} (${business.data.id})`);
  console.log(
    `✓ WhatsApp channel: phone_number_id ending ${phoneNumberId.slice(-4)} (${channel.data.status})`,
  );
  console.log(`✓ Owner: ${ownerEmail} (${membership.data.role})`);
  console.log(`✓ Active playbook: ${playbook.data.name}`);
  console.log(`✓ Approved knowledge: ${knowledge.data.length}/6 published`);
  console.log('XeroWA AI Client #1 seed completed successfully.');
}

async function fetchMetaPhoneProfile(id) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) return null;

  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || 'v22.0';
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(id)}?fields=display_phone_number,verified_name`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    console.warn(
      `Meta phone profile lookup returned ${response.status}; preserving the existing channel phone.`,
    );
    return null;
  }
  return response.json();
}

async function findAuthUserByEmail(email) {
  let page = 1;
  while (page <= 20) {
    const result = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    assertNoError(result.error, 'list Supabase Auth users');
    const match = result.data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (result.data.users.length < 100) return null;
    page += 1;
  }
  return null;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');
    if (!process.env[key]) process.env[key] = value;
  }
}

function assertNoError(error, operation) {
  if (error) throw new Error(`Failed to ${operation}: ${error.message}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
