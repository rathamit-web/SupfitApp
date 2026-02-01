// Supabase Edge Function: Set consent for derived Active Hours ingestion
// Deploy: supabase functions deploy set-active-hours-consent

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

type SetConsentRequest = {
  granted: boolean;
  expiresAt?: string | null; // ISO timestamp
  metadata?: Record<string, unknown>;
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

  let body: SetConsentRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  if (typeof body?.granted !== 'boolean') {
    return jsonResponse(400, { error: 'granted must be a boolean' });
  }

  const nowIso = new Date().toISOString();
  const expiresAt = typeof body.expiresAt === 'string' ? body.expiresAt : null;
  const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

  const row = {
    owner_id: user.id,
    scope: 'active_hours',
    purpose: 'active_hours_ingest',
    granted: body.granted,
    granted_at: body.granted ? nowIso : null,
    revoked_at: body.granted ? null : nowIso,
    expires_at: expiresAt,
    metadata,
  };

  const { data: upserted, error } = await supabaseAdmin
    .from('consents')
    .upsert(row, { onConflict: 'owner_id,scope,purpose' })
    .select('id, owner_id, scope, purpose, granted, granted_at, revoked_at, expires_at, updated_at')
    .single();

  if (error) {
    console.error('consents upsert error', error);
    return jsonResponse(500, { error: 'Failed to store consent' });
  }

  return jsonResponse(200, { ok: true, consent: upserted });
});
