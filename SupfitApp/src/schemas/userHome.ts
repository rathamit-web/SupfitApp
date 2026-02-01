import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  avatarUrl: z.string().url(),
  bio: z.string().optional(),
  stats: z.object({
    followers: z.number().int(),
    rewards: z.number().int(),
    activeHours: z.number(),
  }),
});

export const WorkoutPostSchema = z.object({
  id: z.string().uuid(),
  image: z.string().url(),
  caption: z.string(),
  workout: z.string(),
  likes: z.number().int(),
  comments: z.number().int(),
  createdAt: z.string(),
});

export const DietPlanSchema = z.object({
  breakfast: z.string(),
  lunch: z.string(),
  dinner: z.string(),
});

export const UserHomeDataSchema = z.object({
  profile: UserProfileSchema,
  posts: z.array(WorkoutPostSchema),
  dietPlan: DietPlanSchema,
});

export const LikePostRequestSchema = z.object({
  postId: z.string().uuid(),
  idempotencyKey: z.string(),
});

export const LikePostResponseSchema = z.object({
  success: z.boolean(),
  likes: z.number().int(),
});
