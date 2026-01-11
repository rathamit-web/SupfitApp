import { useEffect, useState, useCallback } from 'react';
import type {
  CoachAssignmentInsert,
  CoachAssignmentRow,
  CoachProfileRow,
  CombinedAssignmentInsert,
  CombinedAssignmentRow,
  DietitianAssignmentInsert,
  DietitianAssignmentRow,
  DietitianProfileRow,
  UserProfileRow,
} from '../types/masterData';
import {
  assignCoachToClient,
  assignDietitianToClient,
  fetchCoachProfileByUser,
  fetchDietitianProfileByUser,
  fetchUserProfile,
  listClientAssignments,
  listCoachAssignments,
  listDietitianAssignments,
  upsertCombinedAssignment,
  upsertCoachProfile,
  upsertDietitianProfile,
  upsertUserProfile,
} from '../lib/masterData';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const initialState = { data: null, loading: true, error: null } satisfies QueryState<null>;

export function useUserProfile(userId?: string) {
  const [state, setState] = useState<QueryState<UserProfileRow>>(initialState);

  const refresh = useCallback(async () => {
    if (!userId) {
      setState({ data: null, loading: false, error: 'Missing userId' });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    const { data, error } = await fetchUserProfile(userId);
    setState({ data: data ?? null, loading: false, error: error?.message ?? null });
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (payload: Parameters<typeof upsertUserProfile>[0]) => {
      const { data, error } = await upsertUserProfile(payload);
      if (!error) setState({ data, loading: false, error: null });
      return { data, error };
    },
    [],
  );

  return { ...state, refresh, save };
}

export function useCoachProfile(userId?: string) {
  const [state, setState] = useState<QueryState<CoachProfileRow>>(initialState);

  const refresh = useCallback(async () => {
    if (!userId) {
      setState({ data: null, loading: false, error: 'Missing userId' });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    const { data, error } = await fetchCoachProfileByUser(userId);
    setState({ data: data ?? null, loading: false, error: error?.message ?? null });
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (payload: Parameters<typeof upsertCoachProfile>[0]) => {
      const { data, error } = await upsertCoachProfile(payload);
      if (!error) setState({ data, loading: false, error: null });
      return { data, error };
    },
    [],
  );

  return { ...state, refresh, save };
}

export function useDietitianProfile(userId?: string) {
  const [state, setState] = useState<QueryState<DietitianProfileRow>>(initialState);

  const refresh = useCallback(async () => {
    if (!userId) {
      setState({ data: null, loading: false, error: 'Missing userId' });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    const { data, error } = await fetchDietitianProfileByUser(userId);
    setState({ data: data ?? null, loading: false, error: error?.message ?? null });
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (payload: Parameters<typeof upsertDietitianProfile>[0]) => {
      const { data, error } = await upsertDietitianProfile(payload);
      if (!error) setState({ data, loading: false, error: null });
      return { data, error };
    },
    [],
  );

  return { ...state, refresh, save };
}

export function useCoachAssignments(coachId?: string) {
  const [state, setState] = useState<QueryState<CoachAssignmentRow[]>>(initialState);

  const refresh = useCallback(async () => {
    if (!coachId) {
      setState({ data: null, loading: false, error: 'Missing coachId' });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    const { data, error } = await listCoachAssignments(coachId);
    setState({ data: data ?? null, loading: false, error: error?.message ?? null });
  }, [coachId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const assign = useCallback(
    async (params: CoachAssignmentInsert) => {
      const { data, error } = await assignCoachToClient(params);
      if (!error && data) {
        setState((prev) => ({
          data: prev.data ? [...prev.data, data] : [data],
          loading: false,
          error: null,
        }));
      }
      return { data, error };
    },
    [],
  );

  return { ...state, refresh, assign };
}

export function useDietitianAssignments(dietitianId?: string) {
  const [state, setState] = useState<QueryState<DietitianAssignmentRow[]>>(initialState);

  const refresh = useCallback(async () => {
    if (!dietitianId) {
      setState({ data: null, loading: false, error: 'Missing dietitianId' });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    const { data, error } = await listDietitianAssignments(dietitianId);
    setState({ data: data ?? null, loading: false, error: error?.message ?? null });
  }, [dietitianId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const assign = useCallback(
    async (params: DietitianAssignmentInsert) => {
      const { data, error } = await assignDietitianToClient(params);
      if (!error && data) {
        setState((prev) => ({
          data: prev.data ? [...prev.data, data] : [data],
          loading: false,
          error: null,
        }));
      }
      return { data, error };
    },
    [],
  );

  return { ...state, refresh, assign };
}

export function useClientAssignments(clientUserId?: string) {
  const [state, setState] = useState<QueryState<CombinedAssignmentRow[]>>(initialState);

  const refresh = useCallback(async () => {
    if (!clientUserId) {
      setState({ data: null, loading: false, error: 'Missing clientUserId' });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    const { data, error } = await listClientAssignments(clientUserId);
    setState({ data: data ?? null, loading: false, error: error?.message ?? null });
  }, [clientUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const assign = useCallback(
    async (params: CombinedAssignmentInsert) => {
      const { data, error } = await upsertCombinedAssignment(params);
      if (!error && data) {
        setState((prev) => ({
          data: prev.data ? [...prev.data, data] : [data],
          loading: false,
          error: null,
        }));
      }
      return { data, error };
    },
    [],
  );

  return { ...state, refresh, assign };
}
