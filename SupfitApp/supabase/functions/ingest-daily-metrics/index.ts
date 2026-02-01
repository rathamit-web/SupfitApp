// Supabase Edge Function: Ingest derived Daily Metrics
// Deploy: supabase functions deploy ingest-daily-metrics
// Stores daily totals only and writes an MCP envelope row for governance.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

type IngestDailyMetricsRequest = {
  metricDate: string; // YYYY-MM-DD
  steps?: number | null;
  caloriesKcal?: number | null;
  avgHrBpm?: number | null;
  sleepMinutes?: number | null;
  gymMinutes?: number | null;
  badmintonMinutes?: number | null;
  swimMinutes?: number | null;
  source?: string;
  confidence?: number;
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
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeInt(value: unknown, field: string): number | null {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return Math.round(num);
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

  let body: IngestDailyMetricsRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  if (!body?.metricDate || !validateDate(body.metricDate)) {
    return jsonResponse(400, { error: 'metricDate must be YYYY-MM-DD' });
  }

  let steps: number | null = null;
  let caloriesKcal: number | null = null;
  let avgHrBpm: number | null = null;
  let sleepMinutes: number | null = null;
  let gymMinutes: number | null = null;
  let badmintonMinutes: number | null = null;
  let swimMinutes: number | null = null;

  try {
    steps = normalizeInt(body.steps, 'steps');
    caloriesKcal = normalizeInt(body.caloriesKcal, 'caloriesKcal');
    avgHrBpm = normalizeInt(body.avgHrBpm, 'avgHrBpm');
    sleepMinutes = normalizeInt(body.sleepMinutes, 'sleepMinutes');
    gymMinutes = normalizeInt(body.gymMinutes, 'gymMinutes');
    badmintonMinutes = normalizeInt(body.badmintonMinutes, 'badmintonMinutes');
    swimMinutes = normalizeInt(body.swimMinutes, 'swimMinutes');
  } catch (e: any) {
    return jsonResponse(400, { error: e?.message || 'Invalid metric values' });
  }

  const source = (body.source || 'unknown').slice(0, 64);
  const confidence =
    typeof body.confidence === 'number' && Number.isFinite(body.confidence)
      ? Math.min(100, Math.max(0, Math.floor(body.confidence)))
      : 100;

  const payloadForHash = {
    ownerId: user.id,
    metricDate: body.metricDate,
    steps,
    caloriesKcal,
    avgHrBpm,
    sleepMinutes,
    gymMinutes,
    badmintonMinutes,
    swimMinutes,
    source,
    confidence,
  };

  const requestHash = await sha256Hex(JSON.stringify(payloadForHash));

  // 0) Enforce consent (defense-in-depth; DB trigger also enforces)
  const { data: consentRow, error: consentError } = await supabaseAdmin
    .from('consents')
    .select('id, granted, revoked_at, expires_at')
    .eq('owner_id', user.id)
    .eq('scope', 'daily_metrics')
    .eq('purpose', 'daily_metrics_ingest')
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
    return jsonResponse(403, { error: 'Consent required for daily_metrics_ingest' });
  }

  // 1) Upsert derived daily totals
  const { data: upserted, error: upsertError } = await supabaseAdmin
    .from('daily_metrics')
    .upsert(
      {
        owner_id: user.id,
        metric_date: body.metricDate,
        steps,
        calories_kcal: caloriesKcal,
        avg_hr_bpm: avgHrBpm,
        sleep_minutes: sleepMinutes,
        gym_minutes: gymMinutes,
        badminton_minutes: badmintonMinutes,
        swim_minutes: swimMinutes,
        source,
        confidence,
        computed_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id,metric_date' },
    )
    .select(
      'id, owner_id, metric_date, steps, calories_kcal, avg_hr_bpm, sleep_minutes, gym_minutes, badminton_minutes, swim_minutes, source, confidence, computed_at, updated_at',
    )
    .single();

  if (upsertError) {
    const message = typeof upsertError?.message === 'string' ? upsertError.message : '';
    if (message.toLowerCase().includes('consent required')) {
      return jsonResponse(403, { error: 'Consent required for daily_metrics_ingest' });
    }
    console.error('daily_metrics upsert error', upsertError);
    return jsonResponse(500, { error: 'Failed to store daily metrics' });
  }

  // 2) Create MCP envelope (service-role only table)
  const envelope = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    ownerId: user.id,
    purpose: 'daily_metrics_ingest',
    subject: {
      table: 'daily_metrics',
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
    purpose: 'daily_metrics_ingest',
    subject_table: 'daily_metrics',
    subject_key: upserted.id,
    request_hash: requestHash,
    envelope,
  });

  if (envelopeError) {
    console.error('mcp_envelopes insert error', envelopeError);
    const { error: rollbackError } = await supabaseAdmin.from('daily_metrics').delete().eq('id', upserted.id);
    if (rollbackError) {
      console.error('daily_metrics rollback delete error', rollbackError);
    }
    return jsonResponse(500, { error: 'Failed to store MCP envelope' });
  }

  return jsonResponse(200, { ok: true, dailyMetrics: upserted });
});
