// DTOs for IndividualUserHome API
export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl: string;
  bio?: string;
  stats: {
    followers: number;
    rewards: number;
    activeHours: number;
  };
}

export interface WorkoutPost {
  id: string;
  image: string;
  caption: string;
  workout: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface DietPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface UserHomeData {
  profile: UserProfile;
  posts: WorkoutPost[];
  dietPlan: DietPlan;
}

export interface LikePostRequest {
  postId: string;
  idempotencyKey: string;
}

export interface LikePostResponse {
  success: boolean;
  likes: number;
}
