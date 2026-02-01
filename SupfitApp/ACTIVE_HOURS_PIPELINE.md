# Daily Active Hours (Option A: Derived-only)

This repo now includes the first vertical slice for **Daily Active Hours**:

- DB table: `public.active_hours` (stores **daily totals only**, no raw samples)
- Edge Function: `ingest-active-hours` (auth-required, service-role write)
- UI: [SupfitApp/src/screens/IndividualUserHome.tsx](src/screens/IndividualUserHome.tsx) reads today’s row and shows it in the **Active Hours** stat

## Data model

### `public.active_hours`
- `owner_id` (uuid) — user (matches `auth.uid()`; FK to `auth.users(id)`)
- `active_date` (date) — the day the total applies to
- `minutes_active` (int) — derived total minutes
- `source` (text) — e.g. `healthkit`, `google_fit`, `wearable`, `manual`
- `confidence` (0–100)

We also store **governance records** (MCP envelopes) for each upsert.

### Consent (required)
Active Hours ingestion is **consent-gated**.

- `public.consents` — owner-scoped consent records
- `public.active_hours` has a DB trigger that blocks insert/update unless there is an active consent row:
  - `scope = 'active_hours'`
  - `purpose = 'active_hours_ingest'`
  - `granted = true`, `revoked_at IS NULL`, and `expires_at` is null or in the future

RLS:
- User can `SELECT/INSERT/UPDATE` own rows
- Coach can `SELECT` a client’s rows if there is an assignment in `coach_clients` → `coaches`

## Edge Function

### `ingest-active-hours`
Location: `supabase/functions/ingest-active-hours/index.ts`

Request (POST JSON):
```json
{
  "activeDate": "2026-01-22",
  "minutesActive": 390,
  "source": "healthkit",
  "confidence": 92
}
```

Behavior:
- Validates auth token
- Upserts `(owner_id, active_date)` into `public.active_hours`
- Writes an MCP envelope row to `public.mcp_envelopes` (required; ingestion fails if envelope can’t be stored)

### `set-active-hours-consent`
Location: `supabase/functions/set-active-hours-consent/index.ts`

Request (POST JSON):
```json
{
  "granted": true,
  "expiresAt": "2026-07-24T12:34:56.000Z",
  "metadata": { "platform": "ios" }
}
```

## How to deploy

From the mobile project folder:
- Apply migrations with your normal Supabase migration workflow.
- Deploy the function:
  - `supabase functions deploy ingest-active-hours`
  - `supabase functions deploy set-active-hours-consent`

Required function env vars:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Next steps (planned)

- Add a revoke/renew consent UI in Settings.
- Add retention enforcement job (delete rows older than ~6 months).
- Add provider connection flow to populate `source_connections` (server-side encryption).
- Add model-gateway function to record `model_access_logs` when a model reads any health-derived data.
