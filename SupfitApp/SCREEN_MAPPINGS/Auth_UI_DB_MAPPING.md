# Screen Mapping — Auth

This mapping is generated from the current implementation in [SupfitApp/src/screens/Auth.tsx](../src/screens/Auth.tsx) and the canonical DB schema in [schema.sql](../../schema.sql).

## UI → DB Mapping

| Screen / UI Element | Database Table(s) | Operation (Insert, Update, Select, Delete) |
|---|---|---|
| Auth – Email/password signup/login | Supabase Auth (`auth.users`) | Insert (signup) / Select (login session) |
| Auth – Google OAuth | Supabase Auth | Select (OAuth session) |
| Auth – Apple Sign-In | Supabase Auth | Select (OAuth session) |
| Auth – Fetch user profile after login | `user_profiles` | Select |
| Auth – Log auth errors | `analytics_events` | Insert |

## Dataflows
- **Read:** after login, fetch profile from `user_profiles` by `id = auth.uid()`.
- **Write:**
  - Auth is written via Supabase Auth flows (not your `users` table directly).
  - Error logging inserts into `analytics_events`.
- **Routing decision:** if profile is incomplete (`full_name` or `dob` missing) → navigate to CreateProfile; else navigate to role home.

## Wire Up in Code
- **Frontend:**
  - `supabase.auth.signInWithPassword` / `signUp` (via `useSupabaseAuth`, plus OAuth handlers).
  - `supabase.from('user_profiles').select('*').eq('id', userId).single()`
  - `supabase.from('analytics_events').insert(...)`
- **Backend objects required:**
  - Table: `user_profiles` (exists in schema).
  - Table: `analytics_events` (expected per schema; confirm presence and RLS).
- **RLS policies needed:**
  - `user_profiles`: SELECT policy for the owning user.
  - `analytics_events`: INSERT policy for authenticated users (or for service role only, depending on your design).

## Validation & Testing
- **Validation in UI:** basic email regex; password length (>= 6 for signup).
- **Recommended:**
  - Add Zod schema for `user_profiles` fetch result (at least `id/full_name/dob`).
  - Decide whether `analytics_events` logging should be best-effort client-side (current) vs server-side.
- **Test checks:**
  - Login with confirmed email → profile fetch succeeds.
  - New signup without profile → onboarding route taken.
  - RLS: authenticated user can SELECT their own `user_profiles` row.

## Gaps / Risks (from IndividualUserHome learnings)
- If `analytics_events` doesn’t allow client-side INSERT under RLS, logging will silently fail (currently acceptable).
- Be careful not to depend on the app’s `users` table for auth identity; use `auth.uid()` consistently.
