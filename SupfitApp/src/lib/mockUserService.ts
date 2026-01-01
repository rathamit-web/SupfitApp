// Mock user service for role and profile
export type UserRole = 'user' | 'coach' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

// Simulate fetching user profile (mock)
export async function fetchUserProfile(): Promise<UserProfile> {
  // In real app, fetch from Supabase
  return {
    id: '1',
    name: 'Fitness Titan',
    role: 'user',
    avatarUrl: 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=400&q=80',
  };
}
