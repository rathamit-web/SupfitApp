# 🚀 Database Migration - Quick Start

## Status: READY TO APPLY ✅

**Files Created:**
- ✅ `DATABASE_MIGRATION_READY.sql` - Full migration SQL (copy-paste ready)
- ✅ `APPLY_MIGRATION_GUIDE.md` - Detailed step-by-step guide

---

## 3-Minute Quick Start

### Step 1: Get the SQL
**File:** `DATABASE_MIGRATION_READY.sql`
- **Location:** `/workspaces/SupfitApp/SupfitApp/DATABASE_MIGRATION_READY.sql`
- **Content:** Complete SQL migration (112 lines)

### Step 2: Go to Supabase
1. Open: https://console.supabase.com
2. Select: **SupfitApp** project
3. Click: **SQL Editor** (left sidebar)
4. Click: **New query**

### Step 3: Execute
1. **Copy all SQL** from `DATABASE_MIGRATION_READY.sql`
2. **Paste** into Supabase SQL Editor
3. **Click RUN** button
4. **Wait** for success message ✅

### Step 4: Verify (30 seconds)
Run this in a new SQL query:
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_name = 'user_targets' AND table_schema = 'public';
```

Expected result: `1` (table exists)

---

## What Gets Created

| Component | Details |
|-----------|---------|
| **Table** | `user_targets` - Stores daily & milestone targets |
| **Columns** | id, user_id, steps, running, sports, workout, milestone, milestone_month, milestone_year, created_at, updated_at |
| **Constraints** | CHECK constraints for valid ranges (steps: 1000-20000, running: 1-20 km, etc.) |
| **Index** | Fast lookup by user_id |
| **RLS** | 4 policies (SELECT, INSERT, UPDATE, DELETE) - Users only see their own data |
| **Triggers** | Auto-update timestamp, auto-audit logging |
| **Permissions** | Authenticated users can read/write their targets |

---

## Post-Migration Testing

```bash
# 1. Start app
npm run dev

# 2. Navigate to My Targets screen

# 3. Set targets:
#    - Steps: 10000
#    - Running: 10 km
#    - Sports: 60 min
#    - Workout: 60 min

# 4. Click "Save Daily Targets"

# 5. Verify success message

# 6. Close and reopen app

# 7. Verify targets persist from database ✅
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Error: "audit_logs table does not exist" | The trigger references audit_logs. If it doesn't exist, the INSERT will fail silently (by design). You can ignore or create audit_logs separately. |
| Error: "RLS policy already exists" | Safe to ignore. Migration uses IF NOT EXISTS logic. |
| Table not created | Check for permission errors. Ensure you're using a role with admin or DDL permissions. |

---

## Reference Files

- **Migration SQL:** [DATABASE_MIGRATION_READY.sql](DATABASE_MIGRATION_READY.sql)
- **Detailed Guide:** [APPLY_MIGRATION_GUIDE.md](APPLY_MIGRATION_GUIDE.md)
- **Deployment Checklist:** [MY_TARGETS_DEPLOYMENT_CHECKLIST.md](MY_TARGETS_DEPLOYMENT_CHECKLIST.md)
- **Component Code:** [src/screens/MyTargetsNative.tsx](src/screens/MyTargetsNative.tsx)

---

## Success Criteria ✅

After running migration and testing:

- [ ] Table created in Supabase
- [ ] RLS policies enforced
- [ ] Can set and save targets in app
- [ ] Targets persist after app reload
- [ ] Error messages work correctly
- [ ] Offline mode works (if toggled)

---

**Ready?** Open Supabase console and copy-paste the SQL from `DATABASE_MIGRATION_READY.sql`

*Estimated time: 5 minutes*
