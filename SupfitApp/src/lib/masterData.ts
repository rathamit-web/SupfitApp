import { supabase } from './supabaseClient';
import type {
  CoachAssignmentInsert,
  CoachAssignmentRow,
  CoachProfileRow,
  CoachProfileUpsert,
  CombinedAssignmentInsert,
  CombinedAssignmentRow,
  DietitianAssignmentInsert,
  DietitianAssignmentRow,
  DietitianProfileRow,
  DietitianProfileUpsert,
  ScopeFlags,
  UserProfileRow,
  UserProfileUpsert,
} from '../types/masterData';

const DEFAULT_SCOPE: ScopeFlags = {
  read_vitals: true,
  read_nutrition: true,
  write_notes: false,
};

const normalizeScope = (scope?: Partial<ScopeFlags>): ScopeFlags => ({
  read_vitals: scope?.read_vitals ?? DEFAULT_SCOPE.read_vitals,
  read_nutrition: scope?.read_nutrition ?? DEFAULT_SCOPE.read_nutrition,
  write_notes: scope?.write_notes ?? DEFAULT_SCOPE.write_notes,
});

// User profile helpers
export async function upsertUserProfile(payload: UserProfileUpsert) {
  return supabase
    .from('user_profile')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .returns<UserProfileRow>()
    .single();
}

export async function fetchUserProfile(userId: string) {
  return supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', userId)
    .returns<UserProfileRow>()
    .single();
}

// Coach profile helpers
export async function upsertCoachProfile(payload: CoachProfileUpsert) {
  return supabase
    .from('coaches')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .returns<CoachProfileRow>()
    .single();
}

export async function fetchCoachProfileByUser(userId: string) {
  return supabase
    .from('coaches')
    .select('*')
    .eq('user_id', userId)
    .returns<CoachProfileRow>()
    .single();
}

// Dietitian profile helpers
export async function upsertDietitianProfile(payload: DietitianProfileUpsert) {
  return supabase
    .from('dietitians')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .returns<DietitianProfileRow>()
    .single();
}

export async function fetchDietitianProfileByUser(userId: string) {
  return supabase
    .from('dietitians')
    .select('*')
    .eq('user_id', userId)
    .returns<DietitianProfileRow>()
    .single();
}

// Assignment helpers (explicit coach/dietitian tables)
export async function assignCoachToClient(params: CoachAssignmentInsert) {
  const scope = normalizeScope(params.scope);
  return supabase
    .from('coach_client_assignments')
    .insert({
      coach_id: params.coach_id,
      client_user_id: params.client_user_id,
      scope,
      expires_at: params.expires_at ?? null,
    })
    .select('*')
    .returns<CoachAssignmentRow>()
    .single();
}

export async function assignDietitianToClient(params: DietitianAssignmentInsert) {
  const scope = normalizeScope(params.scope);
  return supabase
    .from('dietitian_client_assignments')
    .insert({
      dietitian_id: params.dietitian_id,
      client_user_id: params.client_user_id,
      scope,
      expires_at: params.expires_at ?? null,
    })
    .select('*')
    .returns<DietitianAssignmentRow>()
    .single();
}

export async function listCoachAssignments(coachId: string) {
  return supabase
    .from('coach_client_assignments')
    .select('*')
    .eq('coach_id', coachId)
    .returns<CoachAssignmentRow[]>();
}

export async function listDietitianAssignments(dietitianId: string) {
  return supabase
    .from('dietitian_client_assignments')
    .select('*')
    .eq('dietitian_id', dietitianId)
    .returns<DietitianAssignmentRow[]>();
}

// Combined assignments (coach + dietitian)
export async function upsertCombinedAssignment(params: CombinedAssignmentInsert) {
  const scope = normalizeScope(params.scope);
  return supabase
    .from('client_assignments')
    .insert({
      client_user_id: params.client_user_id,
      coach_id: params.coach_id ?? null,
      dietitian_id: params.dietitian_id ?? null,
      purpose: params.purpose,
      scope,
      expires_at: params.expires_at ?? null,
    })
    .select('*')
    .returns<CombinedAssignmentRow>()
    .single();
}

export async function listClientAssignments(clientUserId: string) {
  return supabase
    .from('client_assignments')
    .select('*')
    .eq('client_user_id', clientUserId)
    .returns<CombinedAssignmentRow[]>();
}
