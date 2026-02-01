# Screen Mapping — Profile (CreateProfileStep1–3 + later edits)

This mapping covers the onboarding profile creation flow implemented in:
- [SupfitApp/src/screens/CreateProfileStep1.tsx](../src/screens/CreateProfileStep1.tsx)
- [SupfitApp/src/screens/CreateProfileStep2.tsx](../src/screens/CreateProfileStep2.tsx)
- [SupfitApp/src/screens/CreateProfileStep3.tsx](../src/screens/CreateProfileStep3.tsx)

…and acknowledges ongoing profile edits from:
- [SupfitApp/src/screens/IndividualUserHome.tsx](../src/screens/IndividualUserHome.tsx)

## UI → DB Mapping

| Screen / UI Element | Database Table(s) | Operation (Insert, Update, Select, Delete) |
|---|---|---|
| CreateProfileStep1 – name/age/gender/bio/avatar inputs | (local state only) | — |
| CreateProfileStep2 – height/weight + units | (local state only) | — |
| CreateProfileStep3 – consent checkbox | `user_consent` | Insert |
| CreateProfileStep3 – guardian consent for minors | `user_consent` (+ `users` minor flags if implemented) | Insert |
| CreateProfileStep3 – write profile row | `user_profiles` | Upsert (Insert/Update) |
| IndividualUserHome – edit name/bio | `user_profiles` | Update |
| IndividualUserHome – upload avatar | Supabase Storage bucket `Avatars` | Insert (upload), Select (public URL) |

## Dataflows
- **Read:**
  - Profile completeness is checked in Auth by selecting `user_profiles`.
- **Write (onboarding):**
  - Gather inputs across Step1→Step2→Step3 via route params.
  - On Step3, get `auth.uid()` via `supabase.auth.getUser()`.
  - Insert consent into `user_consent` (best-effort).
  - Upsert `user_profiles` using the authenticated user id.
- **Write (post-onboarding edits):**
  - Update `user_profiles` fields (name/bio), and upload avatar to Storage then store URL.

## Wire Up in Code
- **Frontend:**
  - `supabase.auth.getUser()` to resolve the authenticated UUID.
  - `supabase.from('user_consent').insert({ user_id, consent_form_id, consent_value, guardian_signed })`
  - `supabase.from('user_profiles').upsert(profilePayload)`
  - `supabase.from('user_profiles').update(...).eq('id', auth.uid())` (home edit)
  - Storage: `supabase.storage.from('Avatars').upload(...)` then `getPublicUrl(...)`

- **Backend objects required (from schema):**
  - `user_profiles` (exists in [schema.sql](../../schema.sql))
  - `user_consent` (expected per schema; confirm its table + RLS)

- **RLS policies needed (critical):**
  - `user_profiles`:
    - SELECT: user can read own row.
    - INSERT/UPDATE: user can create/update own row (required for onboarding + edits).
  - `user_consent`:
    - INSERT: user can insert their own consent rows.

## Validation & Testing
- **Validation already in UI:** required fields enforced for Step1/Step2.
- **High-value improvements based on IndividualUserHome learnings:**
  - Convert "Age" to DOB deterministically and validate: if you store `dob` as NOT NULL, don’t send `null`.
  - Enforce enums:
    - `gender_enum` expects `('M','F','Other')` per schema.
    - `units_enum` expects `('metric','imperial')`.
  - Add Zod schema for the `user_profiles` payload to prevent type drift.

- **Testing checklist:**
  - New user: can upsert into `user_profiles` under RLS.
  - Existing user: can update `full_name`/`bio`.
  - Negative test: cannot update another user’s profile.
  - Consent insert path works or fails gracefully.

## Gaps / Risks
- [schema.sql](../../schema.sql) currently shows only a SELECT policy for `user_profiles` (no INSERT/UPDATE). If that reflects production, onboarding writes will fail under RLS.
- Step3 currently logs a lot to console; consider reducing logs once stable.
