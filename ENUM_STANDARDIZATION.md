# Enum Standardization Reference

**Date**: February 7, 2026  
**Status**: Implementation Ready  
**Migration File**: `supabase/migrations/2026-02-07_standardize_enums.sql`

---

## Executive Summary

This document standardizes all PostgreSQL enums across the SupfitApp codebase to eliminate conflicts, improve consistency, and simplify new feature development.

**Key Changes:**
- ✅ Consolidated 18+ conflicting enum definitions into 7 standardized ones
- ✅ Eliminated redundant legacy enums (coach_status, client_status, payment_status duplicates)
- ✅ Created unified `user_role_enum`, `subscription_status_enum`, `payment_status_enum`, `entity_status_enum`, `visibility_enum`
- ✅ Maintained backward compatibility with existing professional type and billing cycle enums

---

## Standardized Enum Catalog

### 1. ROLE ENUMS

#### `user_role_enum` (Unified, New)
**Purpose:** Primary user classification across the entire platform  
**Values:** 
- `'individual'` — Client/end-user
- `'coach'` — Professional fitness coach
- `'dietician'` — Professional nutrition specialist
- `'admin'` — System administrator

**Usage:** 
```sql
ALTER TABLE users ADD COLUMN role user_role_enum NOT NULL DEFAULT 'individual';
```

**Replaces:** 
- `user_role` (legacy, inconsistent values)
- TEXT CHECK constraints using `'user'|'coach'|'dietician'|'admin'`

---

#### `professional_type_enum` (Existing, Reaffirmed)
**Purpose:** Designate which professional package type an owner creates  
**Values:**
- `'coach'` — Fitness coaching packages
- `'dietician'` — Nutrition/diet packages

**Usage:**
```sql
CREATE TABLE professional_packages (
  ...
  professional_type professional_type_enum NOT NULL,
  ...
);
```

**Relationship to user_role_enum:**
- When a user has `role = 'coach'`, they can create packages with `professional_type = 'coach'`
- An admin with proper credentials could create either type

---

### 2. STATUS ENUMS

#### `subscription_status_enum` (Unified, Replaces Multiple)
**Purpose:** Lifecycle states for all subscription types  
**Values:**
- `'draft'` — Not yet active (being composed or awaiting payment)
- `'active'` — Currently valid and usable
- `'paused'` — Temporarily suspended (typically by client)
- `'cancelled'` — Terminated by client request
- `'expired'` — Ended by time or policy expiration

**Usage:**
```sql
-- For professional package subscriptions
CREATE TABLE professional_package_subscriptions (
  ...
  status subscription_status_enum NOT NULL DEFAULT 'active',
  ...
);

-- For coach plan subscriptions
CREATE TABLE coach_client_subscriptions (
  ...
  status subscription_status_enum NOT NULL DEFAULT 'draft',
  ...
);
```

**Replaces:**
- `subscription_status` (legacy: 'active','expired','unpaid')
- `subscription_status_enum` (partial 2026-02-01 version)
- Any custom status fields for subscriptions

---

#### `payment_status_enum` (Unified, Replaces Multiple)
**Purpose:** Transaction state for all payment schemes  
**Values:**
- `'pending'` — Awaiting confirmation or processing
- `'completed'` — Successfully processed (funds received)
- `'failed'` — Transaction rejected or declined
- `'refunded'` — Original payment reversed/returned

**Usage:**
```sql
CREATE TABLE payments (
  ...
  status payment_status_enum NOT NULL DEFAULT 'pending',
  ...
);

CREATE TABLE coach_payments (
  ...
  status payment_status_enum NOT NULL DEFAULT 'pending',
  ...
);
```

**Replaces:**
- `payment_status` (legacy: 'paid','unpaid','failed')
- `payment_status` (2026 coach_status: 'pending','completed','failed','refunded')
- TEXT CHECK constraints on payment states

---

#### `entity_status_enum` (New Unified, Replaces _status Duplicates)
**Purpose:** Describe operational state of coaches, clients, or other entities  
**Values:**
- `'active'` — Entity is operational
- `'inactive'` — Entity is dormant or suspended
- `'pending'` — Entity awaiting approval or confirmation

**Usage:**
```sql
CREATE TABLE coaches (
  ...
  status entity_status_enum NOT NULL DEFAULT 'pending',
  ...
);

CREATE TABLE coach_clients (
  ...
  status entity_status_enum NOT NULL DEFAULT 'active',
  ...
);
```

**Replaces:**
- `coach_status` (was 'active', 'inactive', 'pending')
- `client_status` (was 'active','inactive','pending')
- Legacy entity status conventions

---

### 3. VISIBILITY ENUMS

#### `visibility_enum` (Unified from package_visibility_enum)
**Purpose:** Control resource discoverability and access  
**Values:**
- `'private'` — Only owner can see
- `'unlisted'` — Specific access via link/direct reference only
- `'public'` — Discoverable by all authenticated users

**Usage:**
```sql
CREATE TABLE professional_packages (
  ...
  visibility visibility_enum NOT NULL DEFAULT 'private',
  ...
);

CREATE TABLE coach_plans (
  ...
  visibility visibility_enum NOT NULL DEFAULT 'private',
  ...
);
```

**Replaces:**
- `package_visibility_enum`

---

### 4. BILLING/CYCLE ENUMS

#### `billing_cycle_enum` (Existing, Reaffirmed - No Change)
**Purpose:** Billing period frequency  
**Values:**
- `'weekly'` — Every 7 days
- `'monthly'` — Every 30/31 days
- `'quarterly'` — Every 90 days
- `'yearly'` — Every 365 days
- `'custom'` — Non-standard period

**Usage:**
```sql
CREATE TABLE professional_packages (
  ...
  billing_cycle billing_cycle_enum NOT NULL DEFAULT 'monthly',
  ...
);
```

**Status:** ✅ Already standardized, no changes needed

---

## Migration & Implementation Guide

### Phase 1: Foundation (Applied First)
✅ Run `2026-02-07_standardize_enums.sql` to create all standardized enums

### Phase 2: New Schemas (Going Forward)
All new tables should use standardized enums:
- Use `user_role_enum` instead of TEXT CHECK constraints
- Use `subscription_status_enum` for all subscriptions
- Use `payment_status_enum` for all payments
- Use `entity_status_enum` for coaches/clients
- Use `visibility_enum` for shared resources

### Phase 3: Legacy Table Migration (Future)
Existing tables need conversion:
```sql
-- Example: Update users table to use user_role_enum
ALTER TABLE users 
  ALTER COLUMN role TYPE user_role_enum USING (role::user_role_enum);
```

---

## Enum Value Compatibility Matrix

| System | user_role_enum | professional_type_enum | subscription_status_enum | payment_status_enum | entity_status_enum | visibility_enum |
|--------|----------------|------------------------|--------------------------|----------------------|-------------------|-----------------|
| Individual User | ✓ individual | N/A | N/A | N/A | N/A | N/A |
| Coach Role | ✓ coach | ✓ coach | N/A | ✓ (for payments) | ✓ active/pending | N/A |
| Dietician Role | ✓ dietician | ✓ dietician | N/A | ✓ (for payments) | ✓ active/pending | N/A |
| Admin User | ✓ admin | N/A | N/A | N/A | N/A | N/A |
| Package | N/A | ✓ required | ✓ draft-active-etc | N/A | N/A | ✓ private-public |
| Subscription | N/A | N/A | ✓ required | ✓ pending-completed | N/A | N/A |
| Payment | N/A | N/A | N/A | ✓ required | N/A | N/A |
| Coach Entity | ✓ coach FK | N/A | N/A | N/A | ✓ active-pending | N/A |
| Client Rel | N/A | N/A | N/A | N/A | ✓ active-inactive | N/A |

---

## Legacy Enum Deprecation Map

| Old Enum | Old Values | New Enum | New Values | Migration |
|----------|-----------|----------|-----------|-----------|
| user_role | individual, coach, dietician | user_role_enum | individual, coach, dietician, admin | Direct cast ✓ |
| coach_status | active, inactive, pending | entity_status_enum | active, inactive, pending | Direct cast ✓ |
| client_status | active, inactive, pending | entity_status_enum | active, inactive, pending | Direct cast ✓ |
| subscription_status | active, expired, unpaid | subscription_status_enum | draft, active, paused, cancelled, expired | Mapping needed ‼️ |
| payment_status (legacy) | paid, unpaid, failed | payment_status_enum | pending, completed, failed, refunded | Mapping needed ‼️ |
| package_visibility_enum | private, unlisted, public | visibility_enum | private, unlisted, public | Direct cast ✓ |

**‼️ Requires Data Migration:**
- `subscription_status` 'unpaid' → 'draft' or handle as business rule
- `payment_status` 'paid' → 'completed'; 'unpaid' → 'pending'

---

## SQL Usage Examples

### Creating Tables with Standardized Enums
```sql
-- Professional Package (Coach offering)
CREATE TABLE professional_packages (
  id uuid PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES users(id),
  professional_type professional_type_enum NOT NULL,  -- Use professional_type_enum
  ...
  status subscription_status_enum DEFAULT 'draft',    -- Use subscription_status_enum
  visibility visibility_enum DEFAULT 'private',       -- Use visibility_enum
  billing_cycle billing_cycle_enum DEFAULT 'monthly'  -- Use billing_cycle_enum
);

-- Coach Entity
CREATE TABLE coaches (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  status entity_status_enum DEFAULT 'pending'  -- Use entity_status_enum
);

-- Payment Transaction
CREATE TABLE payments (
  id uuid PRIMARY KEY,
  ...
  status payment_status_enum DEFAULT 'pending'  -- Use payment_status_enum
);
```

### RLS Policies Using Standardized Enums
```sql
-- Coaches can manage their own packages
CREATE POLICY prof_packages_owner_manage
  ON professional_packages FOR ALL
  USING (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'coach'::user_role_enum
    )
  );
```

---

## Best Practices

1. **Always Use Type Casting:** When comparing enum values, cast explicitly to avoid ambiguity
   ```sql
   WHERE role = 'coach'::user_role_enum
   ```

2. **Check Constraint Constants:** Do NOT use TEXT CHECK constraints; use enums
   ```sql
   -- ✗ Bad
   CREATE TABLE users (role TEXT CHECK (role IN ('coach', 'dietician')));
   
   -- ✓ Good
   CREATE TABLE users (role user_role_enum NOT NULL);
   ```

3. **Default Values:** Specify sensible defaults for operational fields
   ```sql
   status subscription_status_enum NOT NULL DEFAULT 'draft'
   role user_role_enum NOT NULL DEFAULT 'individual'
   ```

4. **Consistency Across Domains:** Use the same enum for the same concept across all tables
   - All subscriptions use `subscription_status_enum`
   - All payments use `payment_status_enum`
   - Never create domain-specific status enums without team review

---

## Questions & Decisions

### Q: Why not combine all statuses into one generic `status_enum`?
**A:** Generic enums reduce code clarity and invite misuse. Specific enums make RLS policies and business logic explicit and easier to validate.

### Q: Can we add new enum values later?
**A:** Yes! PostgreSQL allows `ALTER TYPE ... ADD VALUE` safely. No table modifications needed.
```sql
ALTER TYPE subscription_status_enum ADD VALUE 'frozen';
```

### Q: What about the 'status_enum' already in schema.sql?
**A:** It's overly broad and conflicts with standardized enums. It should be removed and tables migrated to use specific status enums.

---

## Rollout Timeline

- **2026-02-07:** Create migration with all standardized enums
- **2026-02-14:** Apply migration to development database
- **2026-02-21:** Update production database after QA sign-off
- **2026-03-01:** Deprecated old enums, migrate legacy tables
- **2026-04-01:** Remove deprecated enums from codebase

---

## References

- [PostgreSQL Enum Types](https://www.postgresql.org/docs/current/datatype-enum.html)
- [Supabase Type Definitions](https://supabase.com/docs/guides/database/overview#designing-scalable-schemas)
- [Best Practices for Enum Design](https://wiki.postgresql.org/wiki/Enum_data_type_design)

---

**Reviewed by:** AI Code Agent  
**Updated:** 2026-02-07
