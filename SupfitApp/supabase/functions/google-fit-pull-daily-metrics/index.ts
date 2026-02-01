// Supabase Edge Function: Google Fit daily metrics server-pull
// Deploy: supabase functions deploy google-fit-pull-daily-metrics

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const GOOGLE_FIT_CLIENT_ID = Deno.env.get('GOOGLE_FIT_CLIENT_ID');
const GOOGLE_FIT_CLIENT_SECRET = Deno.env.get('GOOGLE_FIT_CLIENT_SECRET');
const GOOGLE_FIT_TOKEN_ENC_KEY = Deno.env.get('GOOGLE_FIT_TOKEN_ENC_KEY');

const DATASET_URL = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function decryptToken(ciphertext: string, keyB64: string): Promise<string> {
  if (!ciphertext.startsWith('v1:')) {
    throw new Error('Unsupported token format');
  }
  const payload = ciphertext.slice(3);
  const combined = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(plaintext);
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: string | null }> {
  if (!GOOGLE_FIT_CLIENT_ID || !GOOGLE_FIT_CLIENT_SECRET) {
    throw new Error('Google Fit client config missing');
  }

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_FIT_CLIENT_ID,
      client_secret: GOOGLE_FIT_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Token refresh failed: ${detail}`);
  }

  const json = await resp.json();
  const accessToken = String(json.access_token || '');
  const expiresIn = Number(json.expires_in || 0);
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
  if (!accessToken) {
    throw new Error('Missing access token');
  }

  return { accessToken, expiresAt };
}

function getLocalDayRangeMillis(date: Date): { startMs: number; endMs: number } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

function getLocalActiveDateString(day: Date): string {
  const yyyy = day.getFullYear();
  const mm = String(day.getMonth() + 1).padStart(2, '0');
  const dd = String(day.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function aggregateGoogleFit(accessToken: string, startMs: number, endMs: number) {
  const body = {
    aggregateBy: [
      { dataTypeName: 'com.google.step_count.delta' },
      { dataTypeName: 'com.google.calories.expended' },
      { dataTypeName: 'com.google.heart_rate.bpm' },
      { dataTypeName: 'com.google.sleep.segment' },
    ],
    bucketByTime: { durationMillis: endMs - startMs },
    startTimeMillis: startMs,
    endTimeMillis: endMs,
  };

  const resp = await fetch(DATASET_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Google Fit aggregate failed: ${detail}`);
  }

  return await resp.json();
}

function extractAggregateTotals(payload: any) {
  const buckets = Array.isArray(payload?.bucket) ? payload.bucket : [];
  if (!buckets.length) {
    return { steps: 0, caloriesKcal: 0, avgHrBpm: 0, sleepMinutes: 0 };
  }

  const dataSets = buckets[0]?.dataset ?? [];
  let steps = 0;
  let calories = 0;
  let hrSum = 0;
  let hrCount = 0;
  let sleepMinutes = 0;

  for (const dataset of dataSets) {
    const dataType = dataset?.dataSourceId ?? dataset?.dataSource?.dataType?.name ?? '';
    const points = Array.isArray(dataset?.point) ? dataset.point : [];

    if (dataType.includes('step_count')) {
      for (const point of points) {
        const value = Number(point?.value?.[0]?.intVal ?? point?.value?.[0]?.fpVal ?? 0);
        steps += Number.isFinite(value) ? value : 0;
      }
      continue;
    }

    if (dataType.includes('calories.expended')) {
      for (const point of points) {
        const value = Number(point?.value?.[0]?.fpVal ?? 0);
        calories += Number.isFinite(value) ? value : 0;
      }
      continue;
    }

    if (dataType.includes('heart_rate')) {
      for (const point of points) {
        const value = Number(point?.value?.[0]?.fpVal ?? 0);
        if (Number.isFinite(value) && value > 0) {
          hrSum += value;
          hrCount += 1;
        }
      }
      continue;
    }

    if (dataType.includes('sleep.segment')) {
      for (const point of points) {
        const startNs = Number(point?.startTimeNanos ?? 0);
        const endNs = Number(point?.endTimeNanos ?? 0);
        if (Number.isFinite(startNs) && Number.isFinite(endNs) && endNs > startNs) {
          sleepMinutes += (endNs - startNs) / 1e9 / 60;
        }
      }
    }
  }

  const avgHrBpm = hrCount ? hrSum / hrCount : 0;

  return {
    steps: Math.max(0, Math.round(steps)),
    caloriesKcal: Math.max(0, Math.round(calories)),
    avgHrBpm: Math.max(0, Math.round(avgHrBpm)),
    sleepMinutes: Math.max(0, Math.round(sleepMinutes)),
  };
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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_FIT_TOKEN_ENC_KEY) {
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

  const body = await req.json().catch(() => ({}));
  const dayStr = typeof body?.metricDate === 'string' ? body.metricDate : null;
  const day = dayStr ? new Date(`${dayStr}T00:00:00`) : new Date();
  const metricDate = getLocalActiveDateString(day);

  const { data: consentRow, error: consentError } = await supabaseAdmin
    .from('consents')
    .select('id, granted, revoked_at, expires_at')
    .eq('owner_id', user.id)
    .eq('scope', 'daily_metrics')
    .eq('purpose', 'daily_metrics_ingest')
    .maybeSingle();

  if (consentError) {
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

  const { data: connection, error: connectionError } = await supabaseAdmin
    .from('source_connections')
    .select('access_token_encrypted, refresh_token_encrypted, expires_at, status')
    .eq('owner_id', user.id)
    .eq('provider', 'google_fit')
    .maybeSingle();

  if (connectionError || !connection || connection.status !== 'connected') {
    return jsonResponse(400, { error: 'Google Fit not connected' });
  }

  const refreshTokenEnc = connection.refresh_token_encrypted;
  const accessTokenEnc = connection.access_token_encrypted;

  if (!refreshTokenEnc || !accessTokenEnc) {
    return jsonResponse(400, { error: 'Missing Google Fit tokens' });
  }

  const refreshToken = await decryptToken(refreshTokenEnc, GOOGLE_FIT_TOKEN_ENC_KEY);
  let accessToken = await decryptToken(accessTokenEnc, GOOGLE_FIT_TOKEN_ENC_KEY);

  const expiresAt = connection.expires_at ? Date.parse(connection.expires_at) : 0;
  if (!expiresAt || expiresAt - Date.now() < 60_000) {
    const refreshed = await refreshAccessToken(refreshToken);
    accessToken = refreshed.accessToken;
    const newEnc = await (async () => {
      const keyBytes = Uint8Array.from(atob(GOOGLE_FIT_TOKEN_ENC_KEY), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(accessToken);
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.length);
      return `v1:${btoa(String.fromCharCode(...combined))}`;
    })();

    await supabaseAdmin
      .from('source_connections')
      .update({ access_token_encrypted: newEnc, expires_at: refreshed.expiresAt })
      .eq('owner_id', user.id)
      .eq('provider', 'google_fit');
  }

  const { startMs, endMs } = getLocalDayRangeMillis(day);
  const payload = await aggregateGoogleFit(accessToken, startMs, endMs);
  const { steps, caloriesKcal, avgHrBpm, sleepMinutes } = extractAggregateTotals(payload);

  const requestHash = await sha256Hex(
    JSON.stringify({
      ownerId: user.id,
      metricDate,
      steps,
      caloriesKcal,
      avgHrBpm,
      sleepMinutes,
      source: 'google_fit',
      confidence: 90,
    }),
  );

  const { data: upserted, error: upsertError } = await supabaseAdmin
    .from('daily_metrics')
    .upsert(
      {
        owner_id: user.id,
        metric_date: metricDate,
        steps,
        calories_kcal: caloriesKcal,
        avg_hr_bpm: avgHrBpm,
        sleep_minutes: sleepMinutes,
        gym_minutes: 0,
        badminton_minutes: 0,
        swim_minutes: 0,
        source: 'google_fit',
        confidence: 90,
        computed_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id,metric_date' },
    )
    .select(
      'id, owner_id, metric_date, steps, calories_kcal, avg_hr_bpm, sleep_minutes, gym_minutes, badminton_minutes, swim_minutes, source, confidence, computed_at, updated_at',
    )
    .single();

  if (upsertError) {
    return jsonResponse(500, { error: 'Failed to store daily metrics' });
  }

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
      source: 'google_fit',
      confidence: 90,
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
    await supabaseAdmin.from('daily_metrics').delete().eq('id', upserted.id);
    return jsonResponse(500, { error: 'Failed to store MCP envelope' });
  }

  return jsonResponse(200, { ok: true, dailyMetrics: upserted });
});
