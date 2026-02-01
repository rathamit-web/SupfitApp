# Supfit Screen → DB Wiring Playbook (Post‑Mortem Learnings Applied)

This playbook captures what we learned from stabilizing **IndividualUserHome** and turns it into a repeatable process for wiring other screens (Auth, Profile, Workouts, Subscriptions, Diet, Feedback, etc.) with fewer surprises.

## 0) Success Criteria (Definition of Done)
A screen is "wired" only when all of the following are true:
- **UI→DB mapping exists** (table listing each UI element and its DB tables + operations).
- **Dataflows are defined** (inputs, outputs, ownership, caching, fallbacks).
- **Wire-up is implemented** (frontend calls + backend functions/tables + RLS policies).
- **Validation & testing are covered** (types, defaults, constraints, error states).
- **RLS is proven** (at least one quick check per write path; no hidden forbidden loops).

## 1) The Core Pattern (Avoid 5‑hour loops)
### Step A — Write the contract before coding UI
For each UI element that touches data, answer:
- **Entity + ownership**: who owns the row? (user_id = auth.uid?)
- **Operation**: Select / Insert / Update / Delete
- **Tables/RPCs**: exact name + columns
- **RLS**: what policy enables this operation?
- **Failure mode**: what should the UI do on 403, missing function/table, validation failure?

> If you can’t answer these, you’re not ready to implement.

### Step B — Decide "tables vs RPC" intentionally
- Use **direct table reads** when the query is simple and RLS is straightforward.
- Use **RPC** for complex aggregates, cross-table composition, or performance-sensitive multi-step operations.

Rule: If you use RPC, the function definition and return shape must be versioned in SQL (or at least documented).

### Step C — RLS is part of the API contract
For every table touched by the screen, enumerate policies:
- SELECT policy
- INSERT policy
- UPDATE policy
- DELETE policy

If a UI performs UPDATE but you only have SELECT policy → that’s a guaranteed late-stage failure.

### Step D — One identifier type everywhere
Pick UUID vs bigint per entity.
- DB column type
- TypeScript type
- Zod schema
- Query keys / cache keys

Never mix numeric string IDs with UUID schemas.

### Step E — Observability and backoff
When backend isn’t ready (missing RPC / forbidden), avoid infinite noise:
- Disable retries for expected RLS failures
- Gate calls with `enabled: Boolean(userId)`
- Cache "RPC disabled" state with a TTL
- Prefer local-first UX for likes/comments while backend stabilizes

## 2) Implementation Checklist (Per Screen)
### 2.1 UI→DB Mapping Table
Create a table with:
- Screen / UI Element
- Database Table(s)
- Operation (Insert/Update/Select/Delete)

### 2.2 Dataflows
Write short bullets:
- **Source of truth** (DB vs local)
- **Read path** (what loads on mount)
- **Write path** (what happens on submit/tap)
- **Cache behavior** (React Query keys, invalidation)
- **Fallback** (what shows if blocked)

### 2.3 Wire Up in Code
Document:
- Frontend call sites (`supabase.from(...).select/insert/update`, `supabase.rpc(...)`, storage upload)
- Backend objects (tables, functions)
- Required RLS policies

### 2.4 Validation & Testing
- Runtime schema validation (Zod) for API responses and user input
- Form constraints (required fields, min/max, enum values)
- Quick RLS checks:
  - current user can write own row
  - current user cannot write others

## 3) Templates
### 3.1 Mapping Template (copy/paste)

#### Screen: <Name>

| Screen / UI Element | Database Table(s) | Operation |
|---|---|---|
|  |  |  |

**Dataflows**
- Read:
- Write:
- Cache:
- Fallback:

**Wire Up in Code**
- Frontend:
- Backend (tables/RPC):
- RLS policies needed:

**Validation & Testing**
- Types:
- Defaults:
- Constraints:
- Test checks:

## 4) Anti‑Patterns (from the IndividualUserHome story)
- Coding UI against assumed tables/RPCs without schema/migrations
- Debugging RLS from the UI layer only
- Mixed ID formats (UUID vs numeric) hidden by fallback content
- Retrying forbidden calls on focus/reconnect
- Joining to sensitive tables (like `users`) without explicit RLS
