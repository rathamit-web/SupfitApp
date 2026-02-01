// Supabase Edge Function: Ingest derived daily Active Hours
// Deploy: supabase functions deploy ingest-active-hours
//
// Option A (privacy-first): stores daily totals only (minutes_active)
// and writes an MCP envelope row for governance.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

type IngestActiveHoursRequest = {
  activeDate: string; // YYYY-MM-DD
  minutesActive: number;
  source?: string; // healthkit | google_fit | wearable | manual | unknown
  confidence?: number; // 0-100
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function validateDate(value: string): boolean {
  // Strict YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse(401, { error: 'Unauthorized' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(500, { error: 'Server misconfigured' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return jsonResponse(401, { error: 'Invalid token' });
  }

  let body: IngestActiveHoursRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  if (!body?.activeDate || !validateDate(body.activeDate)) {
    return jsonResponse(400, { error: 'activeDate must be YYYY-MM-DD' });
  }
  if (typeof body.minutesActive !== 'number' || !Number.isFinite(body.minutesActive) || body.minutesActive < 0) {
    return jsonResponse(400, { error: 'minutesActive must be a non-negative number' });
  }

  const source = (body.source || 'unknown').slice(0, 64);
  const confidence =
    typeof body.confidence === 'number' && Number.isFinite(body.confidence)
      ? Math.min(100, Math.max(0, Math.floor(body.confidence)))
      : 100;

  const payloadForHash = {
    ownerId: user.id,
    activeDate: body.activeDate,
    minutesActive: Math.floor(body.minutesActive),
    source,
    confidence,
  };

  const requestHash = await sha256Hex(JSON.stringify(payloadForHash));

  // 0) Enforce consent (defense-in-depth; DB trigger also enforces)
  const { data: consentRow, error: consentError } = await supabaseAdmin
    .from('consents')
    .select('id, granted, revoked_at, expires_at')
    .eq('owner_id', user.id)
    .eq('scope', 'active_hours')
    .eq('purpose', 'active_hours_ingest')
    .maybeSingle();

  if (consentError) {
    console.error('consents lookup error', consentError);
    return jsonResponse(500, { error: 'Failed to validate consent' });
  }

  const consentGranted =
    !!consentRow &&
    consentRow.granted === true &&
    consentRow.revoked_at == null &&
    (consentRow.expires_at == null || new Date(consentRow.expires_at).getTime() > Date.now());

  if (!consentGranted) {
    return jsonResponse(403, { error: 'Consent required for active_hours_ingest' });
  }

  // 1) Upsert derived daily total
  const { data: upserted, error: upsertError } = await supabaseAdmin
    .from('active_hours')
    .upsert(
      {
        owner_id: user.id,
        active_date: body.activeDate,
        minutes_active: Math.floor(body.minutesActive),
        source,
        confidence,
        computed_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id,active_date' },
    )
    .select('id, owner_id, active_date, minutes_active, source, confidence, computed_at, updated_at')
    .single();

  if (upsertError) {
    const message = typeof upsertError?.message === 'string' ? upsertError.message : '';
    if (message.toLowerCase().includes('consent required')) {
      return jsonResponse(403, { error: 'Consent required for active_hours_ingest' });
    }
    console.error('active_hours upsert error', upsertError);
    return jsonResponse(500, { error: 'Failed to store active hours' });
  }

  // 2) Create MCP envelope (service-role only table)
  const envelope = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    ownerId: user.id,
    purpose: 'active_hours_ingest',
    subject: {
      table: 'active_hours',
      key: upserted.id,
    },
    requestHash,
    dataMinimization: {
      rawSamplesStored: false,
      retentionDays: 183,
    },
    provenance: {
      source,
      confidence,
    },
  };

  const { error: envelopeError } = await supabaseAdmin.from('mcp_envelopes').insert({
    owner_id: user.id,
    purpose: 'active_hours_ingest',
    subject_table: 'active_hours',
    subject_key: upserted.id,
    request_hash: requestHash,
    envelope,
  });

  if (envelopeError) {
    // Strict enforcement: do not persist any health-derived metric without governance envelope.
    console.error('mcp_envelopes insert error', envelopeError);
    const { error: rollbackError } = await supabaseAdmin.from('active_hours').delete().eq('id', upserted.id);
    if (rollbackError) {
      console.error('active_hours rollback delete error', rollbackError);
    }
    return jsonResponse(500, { error: 'Failed to store MCP envelope' });
  }

  return jsonResponse(200, { ok: true, activeHours: upserted });
});
