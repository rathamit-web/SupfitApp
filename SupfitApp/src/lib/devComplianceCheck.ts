import { supabase } from './supabaseClient';
import { DEFAULT_CONSENT_VERSION, DEFAULT_VITAL_PURPOSE } from '../config/privacy';

/**
 * Developer-only sanity check: create a consent (if missing) and round-trip a health_vitals_raw write/read.
 * Run manually from a dev hook; not wired into UI.
 */
export async function runVitalsAndConsentCheck() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    throw new Error('Auth user not available for compliance check');
  }
  const userId = userData.user.id;

  // Ensure consent exists for the default purpose
  const { error: consentError } = await supabase.from('consents').insert({
    user_id: userId,
    purpose: DEFAULT_VITAL_PURPOSE,
    consent_version: DEFAULT_CONSENT_VERSION,
    policy_url: null,
    language: 'en',
  });
  if (consentError && consentError.code !== '23505') {
    // 23505 would be duplicate constraint if unique exists; otherwise any error should surface
    throw consentError;
  }

  // Insert a test vital
  const { error: vitalsInsertError } = await supabase.from('health_vitals_raw').insert({
    user_id: userId,
    type: 'debug_check',
    value: 1.23,
    unit: 'u',
    purpose: DEFAULT_VITAL_PURPOSE,
    consent_version: DEFAULT_CONSENT_VERSION,
  });
  if (vitalsInsertError) {
    throw vitalsInsertError;
  }

  // Read back
  const { data: vitals, error: vitalsReadError } = await supabase
    .from('health_vitals_raw')
    .select('*')
    .eq('user_id', userId)
    .eq('purpose', DEFAULT_VITAL_PURPOSE)
    .eq('type', 'debug_check')
    .order('ts', { ascending: false })
    .limit(1);

  if (vitalsReadError) {
    throw vitalsReadError;
  }

  return { ok: true, record: vitals?.[0] ?? null };
}
