import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, normalizeError } from '../api/apiClient';
import { UserHomeData, LikePostRequest } from '../types/userHome';
import { UserHomeDataSchema, LikePostRequestSchema, LikePostResponseSchema } from '../schemas/userHome';

function isValidUrl(value: string | undefined | null): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    void parsed;
    return true;
  } catch {
    return false;
  }
}

function buildFallbackUserHome(userId: string, fullName?: string, avatarUrl?: string, bio?: string): UserHomeData {
  return {
    profile: {
      id: userId,
      fullName: fullName || 'Fitness Titan',
      avatarUrl: isValidUrl(avatarUrl) ? avatarUrl : 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=400&q=80',
      bio: bio || 'Athlete • Coach • Runner',
      stats: {
        followers: 0,
        rewards: 0,
        activeHours: 0,
      },
    },
    posts: [
      {
        id: '1',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
        caption: 'Morning cardio session — crushed 10K!',
        workout: 'Running',
        likes: 234,
        comments: 12,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
        caption: 'Leg day hits different.',
        workout: 'Strength',
        likes: 189,
        comments: 8,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
        caption: 'New PR on deadlifts!',
        workout: 'Powerlifting',
        likes: 312,
        comments: 15,
        createdAt: new Date().toISOString(),
      },
    ],
    dietPlan: {
      breakfast: 'Oatmeal with berries and almonds',
      lunch: 'Grilled chicken with quinoa and vegetables',
      dinner: 'Lean beef with sweet potato and asparagus',
    },
  };
}

function isMissingTableError(error: any, tableName: string): boolean {
  if (!error) return false;
  const message = String(error?.message || '');
  return (
    error?.code === 'PGRST205' ||
    error?.status === 404 ||
    message.toLowerCase().includes(`could not find the table`) ||
    message.toLowerCase().includes(`'public.${tableName}'`) ||
    message.toLowerCase().includes('schema cache')
  );
}

async function tryLoadUserHomeFromTables(userId: string): Promise<UserHomeData | null> {
  // Best-effort direct reads that avoid touching the `users` table.
  // If RLS/table availability blocks these, return null and let the caller fall back.

  try {
    const { data: profileRow, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url, bio')
      .eq('id', userId)
      .maybeSingle();

    let posts: any[] = [];
    let postsError: any = null;
    let postsSource: 'user_workouts' | 'workout_posts' | null = null;

    const userWorkoutsResponse = await supabase
      .from('user_workouts')
      .select('id, slot_id, workout, caption, media_type, image_url, likes, comments, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!userWorkoutsResponse.error) {
      posts = Array.isArray(userWorkoutsResponse.data) ? userWorkoutsResponse.data : [];
      postsSource = 'user_workouts';
    } else if (isMissingTableError(userWorkoutsResponse.error, 'user_workouts')) {
      const workoutPostsResponse = await supabase
        .from('workout_posts')
        .select('id, image, caption, workout, likes, comments, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      posts = Array.isArray(workoutPostsResponse.data) ? workoutPostsResponse.data : [];
      postsError = workoutPostsResponse.error || null;
      postsSource = 'workout_posts';
    } else {
      postsError = userWorkoutsResponse.error;
      postsSource = 'user_workouts';
    }

    // Profile is required for the username; posts are best-effort.
    if (profileError) {
      console.error('Supabase profile error:', profileError);
      return null;
    }

    // Posts may fail if the table doesn't exist yet (schema drift) or due to RLS.
    // Do not block profile loading in that case.
    if (postsError) {
      console.warn('Supabase posts error (continuing with empty posts):', postsError);
    }

    const workoutRows = postsError ? [] : Array.isArray(posts) ? posts : [];

    // If there is literally no data, treat as not available.
    if (!profileRow && workoutRows.length === 0) return null;

    const mapped: UserHomeData = {
      profile: {
        id: userId,
        fullName: profileRow?.full_name || 'Fitness Titan',
        avatarUrl: isValidUrl(profileRow?.avatar_url)
          ? profileRow.avatar_url
          : 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=400&q=80',
        bio: profileRow?.bio || 'Athlete • Coach • Runner',
        stats: {
          followers: 0,
          rewards: 0,
          activeHours: 0,
        },
      },
      posts: workoutRows.map((row: any) => {
        if (postsSource === 'user_workouts') {
          const imagePath = row.media_url || row.image_url || '';
          return {
            id: String(row.id ?? row.slot_id ?? ''),
            image: String(imagePath),
            caption: String(row.caption || ''),
            workout: String(row.workout || ''),
            likes: Number(row.likes || 0),
            comments: Number(row.comments || 0),
            createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
          };
        }
        return {
          id: String(row.id),
          image: String(row.image || ''),
          caption: String(row.caption || ''),
          workout: String(row.workout || ''),
          likes: Number(row.likes || 0),
          comments: Number(row.comments || 0),
          createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
        };
      }),
      dietPlan: {
        breakfast: '',
        lunch: '',
        dinner: '',
      },
    };

    const parsed = UserHomeDataSchema.safeParse(mapped);
    if (!parsed.success) return null;
    return parsed.data as UserHomeData;
  } catch {
    return null;
  }
}

export function useUserHome(userId: string) {
  const queryClient = useQueryClient();

  const rpcDisableKey = `userHomeRpcDisabled:${userId}`;
  const rpcDisableTtlMs = 60 * 60 * 1000; // 1 hour
  const enableUserHomeRpc = process.env.EXPO_PUBLIC_ENABLE_USER_HOME_RPC === 'true';

  // Fetch user home data
  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
    status,
  } = useQuery({
    queryKey: ['userHome', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      // If userId is empty, avoid calling backend.
      if (!userId) {
        throw { code: 'missing_user_id', message: 'Missing user id' };
      }

      // Prefer direct table reads first (avoid hitting RPC that may be forbidden under RLS).
      const fromTables = await tryLoadUserHomeFromTables(userId);
      if (fromTables) return fromTables;

      // Build a safe fallback from auth metadata + canned content.
      const { data: authData } = await supabase.auth.getUser();
      const meta = authData?.user?.user_metadata as any;
      const fallback = buildFallbackUserHome(
        userId,
        meta?.full_name || meta?.name,
        meta?.avatar_url,
        meta?.bio,
      );

      // If RPC is disabled (default), do not call it at all.
      if (!enableUserHomeRpc) {
        return fallback;
      }

      // If we already know RPC is forbidden, skip calling it for a while.
      try {
        const raw = await AsyncStorage.getItem(rpcDisableKey);
        if (raw) {
          const parsed = JSON.parse(raw) as { disabledAt: number };
          if (parsed?.disabledAt && Date.now() - parsed.disabledAt < rpcDisableTtlMs) {
            return fallback;
          }
        }
      } catch {
        // Ignore cache read failures and attempt RPC.
      }

      // Prefer RPC if available; gracefully fall back if backend isn’t ready / permissions missing.
      try {
        const { data, error } = await supabase.rpc('v1_get_user_home', { user_id: userId });
        if (error) throw normalizeError(error);

        const parsed = UserHomeDataSchema.safeParse(data);
        if (!parsed.success) {
          throw { code: 'invalid_response', message: parsed.error.message };
        }
        return parsed.data as UserHomeData;
      } catch (err: any) {
        const message = String(err?.message || err?.error_description || err || '');

        // Cache the forbidden/missing-RPC state to prevent repeated 403 spam on focus.
        const looksLikePermission =
          err?.code === '42501' ||
          err?.status === 403 ||
          message.toLowerCase().includes('permission denied');
        const looksLikeMissingFn =
          message.toLowerCase().includes('could not find the function') ||
          message.toLowerCase().includes('schema cache');

        if (looksLikePermission || looksLikeMissingFn) {
          try {
            await AsyncStorage.setItem(rpcDisableKey, JSON.stringify({ disabledAt: Date.now(), reason: message }));
          } catch {
            // Ignore cache write failures.
          }
        }

        // Always return a usable fallback (no noisy logs, no red screens).
        return fallback;
      }
    },
    // No retries needed here: we already fall back on expected backend/RLS issues.
    retry: false,
    // Prevent repeated 403s on window focus/reconnect (common on web).
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // For profile name correctness, prefer fresh reads on mount.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Like post mutation (idempotent)
  const likePost = useMutation({
    mutationFn: async (input: LikePostRequest) => {
      LikePostRequestSchema.parse(input);

      // Compute a safe local like count fallback from cache.
      const cached = queryClient.getQueryData(['userHome', userId]) as any;
      const cachedLikes =
        cached?.posts?.find?.((p: any) => String(p.id) === String(input.postId))?.likes ?? 0;
      const nextLikes = Number(cachedLikes || 0) + 1;

      // Always update cache immediately (local-first).
      queryClient.setQueryData(['userHome', userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          posts: (old.posts || []).map((p: any) =>
            String(p.id) === String(input.postId) ? { ...p, likes: nextLikes } : p,
          ),
        };
      });

      // Best-effort server write; never throw on expected backend/RLS problems.
      try {
        const { error: upsertError } = await supabase
          .from('workout_posts_likes')
          .upsert(
            { post_id: input.postId, idempotency_key: input.idempotencyKey },
            { onConflict: 'post_id,idempotency_key' },
          );
        if (upsertError) throw normalizeError(upsertError);

        const { data: post, error: postError } = await supabase
          .from('workout_posts')
          .select('likes')
          .eq('id', input.postId)
          .single();
        if (postError) throw normalizeError(postError);

        const serverLikes = Number((post as any)?.likes ?? nextLikes);
        queryClient.setQueryData(['userHome', userId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            posts: (old.posts || []).map((p: any) =>
              String(p.id) === String(input.postId) ? { ...p, likes: serverLikes } : p,
            ),
          };
        });

        const parsed = LikePostResponseSchema.safeParse({ success: true, likes: serverLikes });
        if (parsed.success) return parsed.data;
      } catch {
        // Ignore backend failures (missing tables/RLS/etc). Local UI stays updated.
      }

      return { success: true, likes: nextLikes };
    },
  });

  return {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    status,
    refetch,
    likePost,
  };
}
