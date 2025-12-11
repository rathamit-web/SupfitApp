import { useQuery } from '@tanstack/react-query';
import { fetchFollowers } from '@/lib/mockApi';

export function useFollowers(page: number, pageSize: number = 6) {
  return useQuery({
    queryKey: ['followers', page, pageSize],
    queryFn: () => fetchFollowers(page, pageSize),
    keepPreviousData: true,
  });
}
