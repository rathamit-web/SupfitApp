# Enum Standardization Quick Reference

## 🎯 When to Use Each Enum

### User & Role Management
```typescript
// User model
interface User {
  role: 'individual' | 'coach' | 'dietician' | 'admin'; // ← Use user_role_enum
}

// Professional designation
interface ProfessionalPackage {
  professional_type: 'coach' | 'dietician'; // ← Use professional_type_enum
}
```

### Subscription & Billing
```typescript
interface Subscription {
  status: 'draft' | 'active' | 'paused' | 'cancelled' | 'expired'; // ← Use subscription_status_enum
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'; // ← Use billing_cycle_enum
}
```

### Payments
```typescript
interface Payment {
  status: 'pending' | 'completed' | 'failed' | 'refunded'; // ← Use payment_status_enum
}
```

### Entity States
```typescript
interface Coach {
  status: 'active' | 'inactive' | 'pending'; // ← Use entity_status_enum
}

interface Client {
  status: 'active' | 'inactive' | 'pending'; // ← Use entity_status_enum
}
```

### Resource Visibility
```typescript
interface Package {
  visibility: 'private' | 'unlisted' | 'public'; // ← Use visibility_enum
}
```

---

## ✅ Standardized Enums (7 Total)

| Enum Name | Purpose | Values |
|-----------|---------|--------|
| `user_role_enum` | User classification | individual, coach, dietician, admin |
| `professional_type_enum` | Professional package type | coach, dietician |
| `subscription_status_enum` | Subscription lifecycle | draft, active, paused, cancelled, expired |
| `payment_status_enum` | Payment transaction state | pending, completed, failed, refunded |
| `entity_status_enum` | Coach/client entity state | active, inactive, pending |
| `visibility_enum` | Resource visibility | private, unlisted, public |
| `billing_cycle_enum` | Billing frequency | weekly, monthly, quarterly, yearly, custom |

---

## 🚫 Deprecated (Do NOT Use)

| Old Enum | Replacement | Reason |
|----------|-------------|--------|
| `user_role` | `user_role_enum` | Legacy enum, inconsistent values |
| `coach_status` | `entity_status_enum` | Replaced with unified entity status |
| `client_status` | `entity_status_enum` | Replaced with unified entity status |
| `payment_status` (legacy) | `payment_status_enum` | Legacy values; use new enum |
| `subscription_status` (legacy) | `subscription_status_enum` | Legacy values; use new enum |
| `package_visibility_enum` | `visibility_enum` | Renamed to be generic |
| `status_enum` | (specific enum for context) | Too generic; use specific status enum |

---

## 💻 SQL Examples

### ✓ CORRECT: Creating a new table
```sql
CREATE TABLE coaches (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  status entity_status_enum NOT NULL DEFAULT 'pending'
);
```

### ✓ CORRECT: Checking enum value in RLS policy
```sql
CREATE POLICY coaches_select_own ON coaches
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'coach'::user_role_enum
    )
  );
```

### ✓ CORRECT: Type casting in queries
```sql
SELECT * FROM payments
WHERE status = 'completed'::payment_status_enum
  AND created_at >= now() - interval '30 days';
```

### ✗ INCORRECT: Hard-coded strings without casting
```sql
WHERE status = 'completed'  -- ✗ Ambiguous; could be any enum or text
```

### ✗ INCORRECT: Using old enum names
```sql
CREATE TABLE (status coach_status NOT NULL);  -- ✗ Deprecated; use entity_status_enum
```

---

## 📋 Migration Checklist

- [ ] Run migration `2026-02-07_standardize_enums.sql` successfully
- [ ] Verify all 7 enums created in database
- [ ] Update users table to use `user_role_enum` (future migration)
- [ ] Update coaches table to use `entity_status_enum` (future migration)
- [ ] Update payments table to use `payment_status_enum` (future migration)
- [ ] Remove use of deprecated `status_enum` from schema.sql
- [ ] Update RLS policies to use standardized enums
- [ ] Test type casting in application code
- [ ] Remove legacy enum definitions from migrations

---

## 🔄 Data Migration Examples

### Coach Status (coach_status → entity_status_enum)
```sql
-- OLD: coach_status enum
ALTER TABLE coaches ALTER COLUMN status TYPE entity_status_enum
USING status::text::entity_status_enum;
```

### Payment Status (payment_status legacy → payment_status_enum)
```sql
-- OLD: payment_status ('paid','unpaid','failed')
-- NEW: payment_status_enum ('pending','completed','failed','refunded')

ALTER TABLE payments ALTER COLUMN status TYPE payment_status_enum
USING CASE
  WHEN status = 'paid' THEN 'completed'::payment_status_enum
  WHEN status = 'unpaid' THEN 'pending'::payment_status_enum
  WHEN status = 'failed' THEN 'failed'::payment_status_enum
END;
```

---

## 🗂️ File Locations

- **Migration:** `/supabase/migrations/2026-02-07_standardize_enums.sql`
- **Reference Guide:** `/ENUM_STANDARDIZATION.md` (this repo)
- **Schema Definition:** `/schema.sql` (will be updated per migration)

---

## ❓ FAQ

**Q: Can I add new values to an existing enum?**  
A: Yes! Use `ALTER TYPE enum_name ADD VALUE 'new_value'`

**Q: What happens to existing data when switching enums?**  
A: Data persists. Use `ALTER TABLE ... ALTER COLUMN ... USING` for safe conversion.

**Q: Can I use enum values in TypeScript/JavaScript?**  
A: Yes, but import types from Supabase or define client-side enums matching server values.

**Q: Why not use TEXT with CHECK constraints?**  
A: Enums are:
- Type-safe (PostgreSQL enforces valid values)
- More efficient (stored as integers)
- Self-documenting in database

---

## 🚀 Getting Started

1. **For New Tables:** Use the standardized enums from the table above
2. **For Existing Tables:** Request a future migration to update schema
3. **For RLS Policies:** Always cast enum values explicitly (e.g., `'coach'::user_role_enum`)
4. **For Validation:** Let PostgreSQL enforce enum constraints; don't replicate in app code

---

**Last Updated:** 2026-02-07  
**Version:** 1.0 (Foundation Release)
