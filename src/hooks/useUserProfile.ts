import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from '@/lib/mockApi';

export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
  });
}
