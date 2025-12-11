export type UserProfile = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: number;
  workoutsThisWeek: number;
};

export async function fetchUserProfile(): Promise<UserProfile> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 600));
  // Return mock data
  return {
    id: 'u_123',
    name: 'Fitness Titan',
    username: '@fit.titan',
    avatar: 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=200&q=80',
    followers: 12543,
    workoutsThisWeek: 8,
  };
}

export type Follower = {
  id: string;
  name: string;
  username: string;
  avatar: string;
};

const ALL_FOLLOWERS: Follower[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `f_${i + 1}`,
  name: `Follower ${i + 1}`,
  username: `@follower${i + 1}`,
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
}));

export async function fetchFollowers(
  page: number,
  pageSize: number,
): Promise<{
  data: Follower[];
  page: number;
  total: number;
  pageSize: number;
}> {
  await new Promise((r) => setTimeout(r, 400));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    data: ALL_FOLLOWERS.slice(start, end),
    page,
    total: ALL_FOLLOWERS.length,
    pageSize,
  };
}

export async function followUser(followerId: string): Promise<{ ok: boolean }> {
  // Simulate potential transient failure
  await new Promise((r) => setTimeout(r, 300));
  if (Math.random() < 0.3) {
    throw new Error('Network error: please retry');
  }
  return { ok: true };
}
