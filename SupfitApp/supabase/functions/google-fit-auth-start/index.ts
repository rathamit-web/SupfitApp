// Supabase Edge Function: Google Fit OAuth start
// Deploy: supabase functions deploy google-fit-auth-start

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const GOOGLE_FIT_CLIENT_ID = Deno.env.get('GOOGLE_FIT_CLIENT_ID');
const GOOGLE_FIT_REDIRECT_URL = Deno.env.get('GOOGLE_FIT_REDIRECT_URL');
const GOOGLE_FIT_STATE_SECRET = Deno.env.get('GOOGLE_FIT_STATE_SECRET');

const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
];

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function signState(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const data = encoder.encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const payloadB64 = btoa(JSON.stringify(payload));
  return `${payloadB64}.${sigB64}`;
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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_FIT_CLIENT_ID || !GOOGLE_FIT_REDIRECT_URL || !GOOGLE_FIT_STATE_SECRET) {
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

  const statePayload = {
    uid: user.id,
    exp: Date.now() + 10 * 60 * 1000,
    nonce: crypto.randomUUID(),
  };

  const state = await signState(statePayload, GOOGLE_FIT_STATE_SECRET);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_FIT_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GOOGLE_FIT_REDIRECT_URL);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('scope', GOOGLE_FIT_SCOPES.join(' '));
  authUrl.searchParams.set('state', state);

  return jsonResponse(200, {
    url: authUrl.toString(),
    scope: GOOGLE_FIT_SCOPES,
  });
});
