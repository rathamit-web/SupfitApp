export type AuditAction = 'create' | 'update' | 'delete' | 'read';

interface AuditEvent {
  action: AuditAction;
  table: string;
  recordId?: string;
  userId?: string;
  purpose?: string;
  metadata?: Record<string, unknown>;
}
import { supabase } from './supabaseClient';
import { AUDIT_ENABLED } from '../config/privacy';


export async function auditEvent(event: AuditEvent) {
  if (!AUDIT_ENABLED) return;
  // Placeholder: when backend is ready, replace with a Supabase RPC or insert into audit_log.
  // Keeping console logging minimal to avoid leaking sensitive data in production logs.
  // eslint-disable-next-line no-console
  console.log('AUDIT_EVENT', {
    action: event.action,
    table: event.table,
    recordId: event.recordId,
    purpose: event.purpose,
    metadataKeys: event.metadata ? Object.keys(event.metadata) : [],
  });
  try {
    // Immutable append-only insert; assumes RLS/policies are in place post-migration.
    await supabase.from('audit_log').insert({
      action: event.action,
      table_name: event.table,
      record_id: event.recordId,
      user_id: event.userId,
      purpose: event.purpose,
      metadata: event.metadata ?? null,
    });
  } catch (err) {
    // Fallback to minimal log to avoid throwing in user flows.
    // eslint-disable-next-line no-console
    console.log('AUDIT_FALLBACK', {
      action: event.action,
      table: event.table,
      recordId: event.recordId,
    });
  }
}
