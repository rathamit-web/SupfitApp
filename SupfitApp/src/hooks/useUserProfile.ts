import { useEffect, useState } from 'react';
import { fetchUserProfile, UserProfile } from '../lib/mockUserService';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile().then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, []);

  return { profile, loading };
}
