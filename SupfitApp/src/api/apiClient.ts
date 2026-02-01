import type { SupabaseClient } from '@supabase/supabase-js';
import supabaseClient from '../../shared/supabaseClient';

// Centralized API client wrapper.
// IMPORTANT: Use the shared Supabase client so auth/session storage works
// consistently across native (SecureStore) and web (localStorage).
export const supabase: SupabaseClient = supabaseClient;

// Helper for idempotency key
export function withIdempotency(headers: Record<string, string>, key: string) {
  return { ...headers, 'Idempotency-Key': key };
}

// Error normalization
export function normalizeError(error: any) {
  if (!error) return null;
  return {
    code: error.code || 'unknown',
    message: error.message || 'Unknown error',
    field: error.details?.field,
    retryable: error.status === 429 || error.status === 503,
    traceId: error.traceId || undefined,
  };
}
