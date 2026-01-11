import { supabase } from './supabaseClient';
import { PRIVACY_ACTIONS_ENABLED } from '../config/privacy';

export async function requestDataDeletion(params: {
  userId: string;
  deletionScope: string;
  legalHold?: boolean;
  metadata?: Record<string, unknown>;
}) {
  if (!PRIVACY_ACTIONS_ENABLED) return { skipped: true };
  return supabase.from('data_deletion_requests').insert({
    user_id: params.userId,
    deletion_scope: params.deletionScope,
    legal_hold: params.legalHold ?? false,
    deletion_report: params.metadata ?? null,
  });
}

export async function requestDataExport(params: {
  userId: string;
  exportFormat?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!PRIVACY_ACTIONS_ENABLED) return { skipped: true };
  return supabase.from('data_exports').insert({
    user_id: params.userId,
    export_format: params.exportFormat ?? 'json',
    expires_at: params.expiresAt ?? null,
    status: 'pending',
    metadata: params.metadata ?? null,
  });
}

export async function recordConsent(params: {
  userId: string;
  purpose: string;
  consentVersion: string;
  policyUrl?: string;
  language?: string;
  validityPeriod?: string; // interval string
}) {
  if (!PRIVACY_ACTIONS_ENABLED) return { skipped: true };
  return supabase.from('consents').insert({
    user_id: params.userId,
    purpose: params.purpose,
    consent_version: params.consentVersion,
    policy_url: params.policyUrl ?? null,
    language: params.language ?? 'en',
    validity_period: params.validityPeriod ?? null,
  });
}

export async function withdrawConsent(consentId: string) {
  if (!PRIVACY_ACTIONS_ENABLED) return { skipped: true };
  return supabase.from('consents').update({ withdrawn_at: new Date().toISOString() }).eq('id', consentId);
}
