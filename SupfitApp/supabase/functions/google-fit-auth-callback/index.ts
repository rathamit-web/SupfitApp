// Supabase Edge Function: Google Fit OAuth callback
// Deploy: supabase functions deploy google-fit-auth-callback

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const GOOGLE_FIT_CLIENT_ID = Deno.env.get('GOOGLE_FIT_CLIENT_ID');
const GOOGLE_FIT_CLIENT_SECRET = Deno.env.get('GOOGLE_FIT_CLIENT_SECRET');
const GOOGLE_FIT_REDIRECT_URL = Deno.env.get('GOOGLE_FIT_REDIRECT_URL');
const GOOGLE_FIT_STATE_SECRET = Deno.env.get('GOOGLE_FIT_STATE_SECRET');
const GOOGLE_FIT_TOKEN_ENC_KEY = Deno.env.get('GOOGLE_FIT_TOKEN_ENC_KEY');

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function verifyState(state: string, secret: string): Promise<Record<string, unknown> | null> {
  const [payloadB64, sigB64] = state.split('.');
  if (!payloadB64 || !sigB64) return null;

  const payloadJson = atob(payloadB64);
  const payload = JSON.parse(payloadJson);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const data = encoder.encode(payloadJson);
  const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
  const ok = await crypto.subtle.verify('HMAC', key, sigBytes, data);
  if (!ok) return null;
  return payload as Record<string, unknown>;
}

async function encryptToken(plaintext: string, keyB64: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return `v1:${btoa(String.fromCharCode(...combined))}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_FIT_CLIENT_ID || !GOOGLE_FIT_CLIENT_SECRET || !GOOGLE_FIT_REDIRECT_URL || !GOOGLE_FIT_STATE_SECRET || !GOOGLE_FIT_TOKEN_ENC_KEY) {
    return jsonResponse(500, { error: 'Server misconfigured' });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return jsonResponse(400, { error: 'Missing code or state' });
  }

  const payload = await verifyState(state, GOOGLE_FIT_STATE_SECRET);
  if (!payload) {
    return jsonResponse(400, { error: 'Invalid state' });
  }

  const exp = Number(payload.exp ?? 0);
  if (!Number.isFinite(exp) || exp < Date.now()) {
    return jsonResponse(400, { error: 'State expired' });
  }

  const userId = String(payload.uid ?? '');
  if (!userId) {
    return jsonResponse(400, { error: 'Invalid state user' });
  }

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_FIT_CLIENT_ID,
      client_secret: GOOGLE_FIT_CLIENT_SECRET,
      redirect_uri: GOOGLE_FIT_REDIRECT_URL,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResp.ok) {
    const detail = await tokenResp.text();
    return jsonResponse(400, { error: 'Failed to exchange code', detail });
  }

  const tokenJson = await tokenResp.json();
  const accessToken = String(tokenJson.access_token || '');
  const refreshToken = String(tokenJson.refresh_token || '');
  const expiresIn = Number(tokenJson.expires_in || 0);
  const scope = String(tokenJson.scope || '');

  if (!accessToken || !refreshToken) {
    return jsonResponse(400, { error: 'Missing tokens from provider' });
  }

  const accessEnc = await encryptToken(accessToken, GOOGLE_FIT_TOKEN_ENC_KEY);
  const refreshEnc = await encryptToken(refreshToken, GOOGLE_FIT_TOKEN_ENC_KEY);
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
  const scopes = scope ? scope.split(' ') : [];

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await supabaseAdmin
    .from('source_connections')
    .upsert(
      {
        owner_id: userId,
        provider: 'google_fit',
        status: 'connected',
        scopes,
        access_token_encrypted: accessEnc,
        refresh_token_encrypted: refreshEnc,
        expires_at: expiresAt,
      },
      { onConflict: 'owner_id,provider' },
    );

  if (error) {
    console.error('source_connections upsert error', error);
    return jsonResponse(500, { error: 'Failed to store tokens' });
  }

  return jsonResponse(200, { ok: true });
});
