// Feature flags and helpers for purpose-bound vitals and audit logging.
// Migrations are applied; enabling purpose-bound vitals and audit/consent actions.
export const ENABLE_PURPOSED_VITALS = true;
export const DEFAULT_VITAL_PURPOSE = 'health_tracking';
export const DEFAULT_CONSENT_VERSION = 'v1';

export const AUDIT_ENABLED = true;
export const PRIVACY_ACTIONS_ENABLED = true; // data deletion/export/consent helpers

export const buildVitalPayload = (base: Record<string, any>) => {
  if (!ENABLE_PURPOSED_VITALS) return base;
  return {
    ...base,
    purpose: DEFAULT_VITAL_PURPOSE,
    consent_version: DEFAULT_CONSENT_VERSION,
  };
};
