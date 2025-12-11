import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser } from '@/lib/mockApi';

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => followUser(id),
    retry: 2,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['followers'] });
      const previous = queryClient.getQueriesData<{
        data: Array<{ id: string; [k: string]: any }>;
      }>({ queryKey: ['followers'] });
      // Optimistically mark as followed in all cached pages
      for (const [key, pageData] of previous) {
        if (!pageData) continue;
        const next = {
          ...pageData,
          data: pageData.data.map((f) => (f.id === id ? { ...f, followed: true } : f)),
        } as any;
        queryClient.setQueryData(key as any, next);
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      // Rollback
      if (ctx?.previous) {
        for (const [key, pageData] of ctx.previous) {
          if (!pageData) continue;
          queryClient.setQueryData(key as any, pageData);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
    },
  });
}
