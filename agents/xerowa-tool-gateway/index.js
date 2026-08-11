/**
 * xerowa-tool-gateway — Centralized external-API executor (Codex-aligned)
 * -----------------------------------------------------------------------------
 * Single index.js, x-agent-secret auth, GET /health + /health/dependencies.
 * Provides shared outbound integrations so agents never call Meta directly:
 *
 *   /whatsapp/send/{text,document,image,buttons}
 *   /meta/{instagram,facebook}
 *
 * External calls degrade gracefully when credentials are absent so the
 * pipeline stays testable in dev.
 */
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { buildWhatsAppMediaPayload } from './whatsapp-media.js';
import { buildButtonMessage, buildListMessage, buildTemplateMessage } from './whatsapp-interactive.js';

const PORT         = Number(process.env.PORT) || 8081;
const AGENT_SECRET = process.env.AGENT_SECRET || '';
const WHATSAPP_GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v22.0';
const META_BASE    = `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}`;

const app = express();
app.use(express.json({ limit: '8mb' }));

let _supabase = null;
function supabase() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
  if (!url || !key) return null;
  _supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _supabase;
}

function log(level, event, extra = {}) {
  console.log(JSON.stringify({
    level,
    event,
    service: 'xerowa-tool-gateway',
    time: new Date().toISOString(),
    ...extra,
  }));
}

function requireSecret(req, res, next) {
  if (!AGENT_SECRET) return next();
  if (req.header('x-agent-secret') !== AGENT_SECRET && req.header('x-agent-token') !== AGENT_SECRET) {
    return res.status(401).json({ ok: false, error: 'invalid agent secret' });
  }
  next();
}
const safe = (res, fn) => Promise.resolve().then(fn).then((r) => res.json(r)).catch((e) => {
  log('error', 'request_failed', { error: e.message });
  res.status(500).json({ ok: false, error: e.message });
});

// ---------------------------------------------------------------------------
// HEALTH
// ---------------------------------------------------------------------------
const startedAt = Date.now();
app.get('/health', (_req, res) => res.json({
  ok: true,
  service: 'xerowa-tool-gateway',
  status: 'ok',
  supabase: Boolean(supabase()),
  whatsapp: {
    configured: Boolean((process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID) && (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN)),
    graph_version: WHATSAPP_GRAPH_VERSION,
  },
  uptime_s: Math.round((Date.now() - startedAt) / 1000),
}));
app.get('/health/dependencies', (_req, res) => res.json({
  service: 'xerowa-tool-gateway',
  whatsapp: Boolean((process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID) && (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN)),
  meta:     Boolean(process.env.META_ACCESS_TOKEN),
}));

app.use(requireSecret);

// ---------------------------------------------------------------------------
// WHATSAPP
// ---------------------------------------------------------------------------
async function incrementBusinessUsage(businessId, field, amount = 1) {
  const sb = supabase();
  if (!sb || !businessId || !['messages_in', 'messages_out', 'handoffs', 'qual_answers'].includes(field)) return;

  const today = new Date().toISOString().split('T')[0];
  try {
    await sb.from('business_usage').upsert({
      business_id: businessId,
      date: today,
    }, { onConflict: 'business_id,date' });

    const { data, error } = await sb
      .from('business_usage')
      .select(field)
      .eq('business_id', businessId)
      .eq('date', today)
      .maybeSingle();

    if (error) throw error;

    const current = Number(data?.[field] ?? 0);
    const update = {};
    update[field] = current + amount;

    const { error: updateError } = await sb
      .from('business_usage')
      .update(update)
      .eq('business_id', businessId)
      .eq('date', today);

    if (updateError) throw updateError;
    log('info', 'usage_incremented', { businessId, field, amount });
  } catch (error) {
    log('warn', 'usage_increment_failed', { businessId, field, error: error.message });
  }
}

function logMetaError(response, payload, context = {}) {
  if (response.status === 401 || payload?.error?.type === 'OAuthException') {
    log('error', 'whatsapp_token_error', {
      status: response.status,
      code: payload?.error?.code ?? null,
      type: payload?.error?.type ?? null,
      message: payload?.error?.message ?? response.statusText,
      ...context,
    });
    return;
  }

  log('warn', 'whatsapp_send_failed', {
    status: response.status,
    code: payload?.error?.code ?? null,
    type: payload?.error?.type ?? null,
    message: payload?.error?.message ?? response.statusText,
    ...context,
  });
}

async function metaSend(payload, context = {}) {
  const pid = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
  if (!pid || !token) throw new Error('WhatsApp credentials missing');
  const res = await fetch(`${META_BASE}/${pid}/messages`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    logMetaError(res, json, context);
    throw new Error(`WhatsApp send failed: ${json?.error?.message ?? res.statusText}`);
  }
  await incrementBusinessUsage(context.businessId, 'messages_out');
  log('info', 'whatsapp_send_succeeded', { to: payload?.to ? `***${String(payload.to).slice(-4)}` : null, type: payload?.type, businessId: context.businessId ?? null });
  return { ok: true, wa_message_id: json?.messages?.[0]?.id ?? null, status: 'sent' };
}
function usageContext(req) {
  return { businessId: req.body.business_id || req.body.businessId || req.body.builder_id || req.body.builderId || null };
}

app.post('/whatsapp/send', (req, res) => safe(res, () => {
  const type = req.body.type || 'text';
  if (type !== 'text') throw new Error('Use /whatsapp/send/document, /image, or /buttons for non-text messages');
  return metaSend({ messaging_product: 'whatsapp', to: req.body.to, type: 'text', text: { body: req.body.body || req.body.text, preview_url: req.body.preview_url ?? true } }, usageContext(req));
}));
app.post('/whatsapp/send/text',     (req, res) => safe(res, () => metaSend({ messaging_product: 'whatsapp', to: req.body.to, type: 'text', text: { body: req.body.body, preview_url: true } }, usageContext(req))));
app.post('/whatsapp/send/document', (req, res) => safe(res, () => metaSend({ messaging_product: 'whatsapp', to: req.body.to, type: 'document', document: { link: req.body.url, filename: req.body.filename, caption: req.body.caption } }, usageContext(req))));
app.post('/whatsapp/send/image',    (req, res) => safe(res, () => metaSend({ messaging_product: 'whatsapp', to: req.body.to, type: 'image', image: { link: req.body.url, caption: req.body.caption } }, usageContext(req))));
app.post('/whatsapp/send/video',    (req, res) => safe(res, () => metaSend({ messaging_product: 'whatsapp', to: req.body.to, type: 'video', video: { link: req.body.url, caption: req.body.caption } }, usageContext(req))));
app.post('/whatsapp/send/media',    (req, res) => safe(res, () => {
  const trustedHost = safeUrlHost(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  return metaSend(buildWhatsAppMediaPayload(req.body, { trustedHost }), usageContext(req));
}));
app.post('/whatsapp/send/buttons',  (req, res) => safe(res, () => metaSend(buildButtonMessage(req.body), usageContext(req))));
app.post('/whatsapp/send/list',     (req, res) => safe(res, () => metaSend(buildListMessage(req.body), usageContext(req))));
app.post('/whatsapp/send/template', (req, res) => safe(res, () => metaSend(buildTemplateMessage(req.body), usageContext(req))));

function safeUrlHost(value) {
  try { return new URL(value).hostname; } catch { return ''; }
}

// ---------------------------------------------------------------------------
// META publish (Instagram + Facebook)
// ---------------------------------------------------------------------------
async function metaGraph(path, body) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN not set');
  const params = new URLSearchParams({ access_token: token, ...Object.fromEntries(Object.entries(body ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])) });
  const res = await fetch(`${META_BASE}${path}?${params}`, { method: 'POST' });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `meta ${path}`);
  return json;
}
app.post('/meta/instagram', (req, res) => safe(res, async () => {
  const { igUserId, mediaUrl, caption, mediaType = 'IMAGE' } = req.body ?? {};
  if (!igUserId) throw new Error('igUserId required');
  const body = mediaType === 'VIDEO' ? { video_url: mediaUrl, caption, media_type: 'REELS' } : { image_url: mediaUrl, caption };
  const { id: creation_id } = await metaGraph(`/${igUserId}/media`, body);
  const { id: ig_post_id } = await metaGraph(`/${igUserId}/media_publish`, { creation_id });
  return { ok: true, ig_post_id, creation_id };
}));
app.post('/meta/facebook', (req, res) => safe(res, async () => {
  const { pageId, mediaUrl, caption, mediaType = 'photo' } = req.body ?? {};
  if (!pageId) throw new Error('pageId required');
  const endpoint = mediaType === 'video' ? 'videos' : 'photos';
  const body = mediaType === 'video' ? { file_url: mediaUrl, description: caption } : { url: mediaUrl, caption };
  const { id, post_id } = await metaGraph(`/${pageId}/${endpoint}`, body);
  return { ok: true, fb_post_id: post_id ?? id };
}));
app.use((err, _req, res, _next) => res.status(500).json({ ok: false, error: err?.message ?? 'internal error' }));
app.listen(PORT, () => console.log(JSON.stringify({ service: 'xerowa-tool-gateway', msg: 'listening', port: PORT })));
