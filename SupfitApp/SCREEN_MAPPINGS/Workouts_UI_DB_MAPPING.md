# Screen Mapping — Workouts (current state)

This mapping reflects what is currently implemented in code vs what exists in the canonical schema.

## What the code does today
- [SupfitApp/src/screens/WorkoutPlanNative.tsx](../src/screens/WorkoutPlanNative.tsx) stores workout plans in **AsyncStorage** only.
- [SupfitApp/src/screens/IndividualUserHome.tsx](../src/screens/IndividualUserHome.tsx) loads “Recent Workouts” and likes via **`workout_posts` / likes/comments tables** that are *not* present in [schema.sql](../../schema.sql).

## UI → DB Mapping (as implemented)

| Screen / UI Element | Database Table(s) | Operation |
|---|---|---|
| WorkoutPlanNative – load client plan | AsyncStorage (`workoutPlan_${clientId}`) | Select |
| WorkoutPlanNative – save edits | AsyncStorage | Update |
| WorkoutPlanNative – recommend plan | AsyncStorage | Update |
| IndividualUserHome – load workout feed | `workout_posts` | Select |
| IndividualUserHome – like workout post | `workout_posts_likes` + `workout_posts` | Insert/Upsert + Select/Update |
| IndividualUserHome – likes/comments/replies | `workout_likes`, `workout_comments`, `workout_comment_replies` | Select/Insert |

## Canonical schema tables available (but not wired here yet)
From [schema.sql](../../schema.sql):
- `workouts` (user activity logs)
- `workout_sessions` (details per workout)
- `plans` (workout/diet/custom plans)
- `schedules` (scheduled plan items)

## Recommended next wiring (apply IndividualUserHome learnings)
Pick one of these approaches and standardize:

### Option A — Social feed model (posts + likes/comments)
- Add migrations for `workout_posts` + likes/comments/replies tables and their RLS.
- Keep Home feed and engagement features, but make schema authoritative.

### Option B — Activity log model (workouts + sessions)
- Use `workouts` + `workout_sessions` for “Recent Workouts”.
- Likes/comments are out of scope unless you add a “social” layer.

## Wire Up in Code (checklist)
- Decide which schema is the source of truth.
- Implement read path with `enabled: Boolean(userId)`.
- Add RLS policies for any INSERT/UPDATE needed.
- Add runtime validation (Zod) for feed response.

## Validation & Testing
- Ensure IDs are consistent (bigint vs UUID) and reflected in TS/Zod.
- Add at least one SQL/RLS smoke test per write.
