export type ScopeFlags = {
  read_vitals: boolean;
  read_nutrition: boolean;
  write_notes: boolean;
};

export interface UserProfileRow {
  user_id: string;
  full_name: string | null;
  region: string | null;
  language: string | null;
  consent_status: string | null;
  preferences: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type UserProfileUpsert = {
  user_id: string;
  full_name?: string | null;
  region?: string | null;
  language?: string | null;
  consent_status?: string | null;
  preferences?: Record<string, unknown> | null;
};

export interface CoachProfileRow {
  id: string;
  user_id: string;
  certifications: Record<string, unknown> | null;
  specialties: string[] | null;
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CoachProfileUpsert = {
  user_id: string;
  certifications?: Record<string, unknown> | null;
  specialties?: string[] | null;
  org_id?: string | null;
};

export interface DietitianProfileRow {
  id: string;
  user_id: string;
  credentials: Record<string, unknown> | null;
  specialties: string[] | null;
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

export type DietitianProfileUpsert = {
  user_id: string;
  credentials?: Record<string, unknown> | null;
  specialties?: string[] | null;
  org_id?: string | null;
};

export interface CoachAssignmentRow {
  id: string;
  coach_id: string;
  client_user_id: string;
  scope: ScopeFlags;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DietitianAssignmentRow {
  id: string;
  dietitian_id: string;
  client_user_id: string;
  scope: ScopeFlags;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CombinedAssignmentRow {
  id: string;
  client_user_id: string;
  coach_id: string | null;
  dietitian_id: string | null;
  purpose: string;
  scope: ScopeFlags;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CoachAssignmentInsert = {
  coach_id: string;
  client_user_id: string;
  scope?: Partial<ScopeFlags>;
  expires_at?: string | null;
};

export type DietitianAssignmentInsert = {
  dietitian_id: string;
  client_user_id: string;
  scope?: Partial<ScopeFlags>;
  expires_at?: string | null;
};

export type CombinedAssignmentInsert = {
  client_user_id: string;
  coach_id?: string | null;
  dietitian_id?: string | null;
  purpose: string;
  scope?: Partial<ScopeFlags>;
  expires_at?: string | null;
};
