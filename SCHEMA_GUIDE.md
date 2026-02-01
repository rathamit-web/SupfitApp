# Supfit Mobile App: Schema Guide (Enterprise-Grade)
## Retention Enforcement

Supfit enforces data retention for health_vitals, audit_logs, and analytics_events using scheduled purge jobs (pg_cron, pgAgent, or Supabase Edge Functions). Records older than 7 years are deleted monthly, except those under legal hold (where applicable).

**Example SQL:**
- `DELETE FROM audit_logs WHERE created_at < (now() - interval '7 years') AND legal_hold = false;`
- `DELETE FROM analytics_events WHERE occurred_at < (now() - interval '7 years');`
- For health_vitals, add legal_hold logic if column is present.

## Analytics Event Extensibility

The `analytics_events` table now includes:
- `event_subtype` (text): Custom event taxonomy (e.g., 'cardio', 'profile_picture', 'referral').
- `event_tags` (text[]): Segmentation tags (e.g., ['mobile', 'web', 'A/B', 'premium']).

These columns support richer analytics, future-proofing, and custom segmentation for business intelligence and experimentation.

## pgTAP Test Coverage

Automated pgTAP tests validate:
- All enums and types
- Key constraints (FKs, CHECKs)
- Triggers (updated_at, block delete if legal_hold)
- RLS policies
- Partitioning for retention
- Analytics extensibility columns

Run with: `pg_prove test/pgtap_schema_tests.sql`

## Rationale

- Retention jobs ensure compliance with GDPR, HIPAA, and SOC2.
- Analytics extensibility enables rapid experimentation and segmentation.
- Automated tests ensure schema integrity and enterprise readiness.
## Analytics & Reporting Needs (Up Front)
- User growth, retention, and engagement (users, profiles)
- Consent analytics (user_consent)
- Auth provider distribution (auth_providers)
- Minor/guardian consent tracking

| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | uuid      | User ID (auth)             | Hidden          | PK, unique         | uuid      |                  |                  |
| created_at    | timestamptz | Account creation time   | Hidden          | Default now()      |           |                  | Audit trail      |
| updated_at    | timestamptz | Last update time        | Hidden          | Auto-updated       |           |                  | Audit trail      |
| is_active     | boolean   | Account active status      | Toggle          | Default true       |           |                  |                  |
| is_minor      | boolean   | Is user a minor (<18)      | Checkbox        | Default false      |           |                  | Guardian consent |

**Commentary:**
- Strong typing, privacy-first (PII encrypted at rest/in transit).
- `is_minor` enables conditional logic for guardian consent.
- RLS: Users only see their own row.
- Indexed for email lookup and analytics.

---

## 2. user_profiles
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
| bio           | text      | User bio                   | Text area       | Optional           |           |                  |                  |
| height_cm     | numeric   | Height (cm)                | Number input    | Optional           |           |                  |                  |
| weight_kg     | numeric   | Weight (kg)                | Number input    | Optional           |           |                  |                  |
| units         | units_enum | Measurement units         | Select          | Required           | enum      |                  |                  |
| guardian_name | text      | Guardian name (if minor)   | Text input      | Required if minor  |           | is_minor         | COPPA, GDPR      |
| guardian_email| text      | Guardian email (if minor)  | Email input     | Required if minor  |           | is_minor         | COPPA, GDPR      |
| created_at    | timestamptz | Profile creation time   | Hidden          | Default now()      |           |                  | Audit trail      |
| updated_at    | timestamptz | Last update time        | Hidden          | Auto-updated       |           |                  | Audit trail      |

**Commentary:**
- Guardian fields enforced via constraint if `is_minor`.
- Enums for gender/units for type safety.
- RLS: Users only see their own profile.
- Indexed for analytics (dob, gender).
## 3. auth_providers
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | serial    | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| provider      | text      | Auth provider              | Select          | Required           |           |                  |                  |
| provider_uid  | text      | Provider user ID           | Hidden          | Required           |           |                  |                  |
| created_at    | timestamptz | Linked time             | Hidden          | Default now()      |           |                  | Audit trail      |

**Commentary:**
- External auth preferred (OAuth, Supabase).
- Indexed for provider_uid lookup and analytics.
- RLS: Users only see their own providers.

| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
| id            | serial    | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| consent_version | int     | Consent version            | Hidden          | Default 1          |           |                  | Versioning       |

- Guardian consent tracked for minors.
- RLS: Users only see their own consent records.

---

## Design Choices & Rationale
- Explicit FKs with cascade for user-owned data.
- Strong typing (uuid, enums, timestamptz).
- Triggers for auto-updating `updated_at`.
- RLS for privacy and compliance.
- Indexed for analytics and query efficiency.
- Guardian consent enforced for minors (COPPA, GDPR).
- Consent versioning for auditability.

## Validation & Testing Notes
- All constraints and triggers tested via pgTAP.
- RLS policies validated for correct access control.
- Migration strategy: Supabase CLI/Flyway, change log discipline.

## Versioning & Migration
- Schema changes tracked in Git and change log.
- ERD updated with each migration.
- Backward-compatible migrations preferred.

---

**Next Steps:** Proceed to next domain (health_vitals, medical_history, etc.) and repeat the process.

---

## 8. workouts
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| type          | text      | Workout type               | Select          | Required           |           |                  |                  |
| duration_min  | int       | Duration (minutes)         | Number input    | Optional           |           |                  |                  |
| calories      | int       | Calories burned            | Number input    | Optional           |           |                  |                  |
| distance_km   | numeric   | Distance (km)              | Number input    | Optional           |           |                  |                  |
| source        | text      | Data source                | Select          | Required           |           |                  | manual/device    |
| device_id     | text      | Device ID (if device)      | Hidden          | Optional           |           | source=device    |                  |
| started_at    | timestamptz | Start time              | DateTime picker | Required           |           |                  | Audit trail      |
| ended_at      | timestamptz | End time                | DateTime picker | Optional           |           |                  | Audit trail      |
| created_at    | timestamptz | Row creation time       | Hidden          | Default now()      |           |                  | Audit trail      |

**Commentary:**
- Tracks user workouts for health analytics and engagement.
- Device fields conditional on source.
- Indexed for reporting and trend analysis.
- RLS: Users only see their own workouts.

---

## 9. workout_sessions
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| workout_id    | bigint    | FK to workouts.id          | Hidden          | FK, cascade        | bigint    |                  |                  |
| session_type  | text      | Session type               | Select          | Required           |           |                  |                  |
| details       | jsonb     | Session details            | JSON input      | Optional           |           |                  |                  |
| created_at    | timestamptz | Row creation time       | Hidden          | Default now()      |           |                  | Audit trail      |

**Commentary:**
- Tracks workout session breakdowns for analytics and personalization.
- Indexed for reporting and session analysis.
- RLS: Users only see sessions for their own workouts.

---

## 10. nutrition_logs
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| meal_type     | text      | Meal type                  | Select          | Required           |           |                  |                  |
| source        | text      | Data source                | Select          | Required           |           |                  | manual/device    |
| food_items    | jsonb     | Food items                 | JSON input      | Required           |           |                  |                  |
| total_calories| int       | Total calories             | Number input    | Optional           |           |                  |                  |
| logged_at     | timestamptz | Log time                | DateTime picker | Required           |           |                  | Audit trail      |
| created_at    | timestamptz | Row creation time       | Hidden          | Default now()      |           |                  | Audit trail      |

**Commentary:**
- Tracks nutrition for health analytics and diet planning.
- Indexed for reporting and nutrition summaries.
- RLS: Users only see their own logs.

---

## 11. diet_plans
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| plan_name     | text      | Plan name                  | Text input      | Required           |           |                  |                  |
| start_date    | date      | Start date                 | Date picker     | Required           |           |                  |                  |
| end_date      | date      | End date                   | Date picker     | Optional           |           |                  |                  |
| details       | jsonb     | Plan details               | JSON input      | Optional           |           |                  |                  |
| created_by    | uuid      | FK to users.id (coach)     | Hidden          | FK, set null       | uuid      |                  |                  |
| created_at    | timestamptz | Row creation time       | Hidden          | Default now()      |           |                  | Audit trail      |

**Commentary:**
- Tracks diet plans for nutrition analytics and compliance.
- Indexed for reporting and plan analysis.
- RLS: Users only see their own plans.

---

## 12. plans
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| plan_type     | text      | Plan type                  | Select          | Required           |           |                  |                  |
| name          | text      | Plan name                  | Text input      | Required           |           |                  |                  |
| description   | text      | Plan description           | Text area       | Optional           |           |                  |                  |
| start_date    | date      | Start date                 | Date picker     | Required           |           |                  |                  |
| end_date      | date      | End date                   | Date picker     | Optional           |           |                  |                  |
| created_by    | uuid      | FK to users.id (coach)     | Hidden          | FK, set null       | uuid      |                  |                  |
| created_at    | timestamptz | Row creation time       | Hidden          | Default now()      |           |                  | Audit trail      |

**Commentary:**
- Tracks plans for workouts, nutrition, and hybrid programs.
- Indexed for reporting and plan analytics.
- RLS: Users only see their own plans.

---

## 13. targets
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| target_type   | text      | Target type                | Select          | Required           |           |                  |                  |
| value         | numeric   | Target value               | Number input    | Required           |           |                  |                  |
| unit          | text      | Unit                       | Select          | Required           |           |                  |                  |
| due_date      | date      | Due date                   | Date picker     | Optional           |           |                  |                  |
| created_at    | timestamptz | Row creation time       | Hidden          | Default now()      |           |                  | Audit trail      |

**Commentary:**
- Tracks user targets for health and engagement analytics.
- Indexed for reporting and goal tracking.
- RLS: Users only see their own targets.

---

## 14. schedules
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| plan_id       | bigint    | FK to plans.id             | Hidden          | FK, cascade        | bigint    |                  |                  |
| schedule_type | text      | Schedule type              | Select          | Required           |           |                  |                  |
| scheduled_at  | timestamptz | Scheduled time          | DateTime picker | Required           |           |                  |                  |
| status        | text      | Status                     | Select          | Required           |           |                  |                  |
| created_at    | timestamptz | Row creation time       | Hidden          | Default now()      |           |                  | Audit trail      |

**Commentary:**
- Tracks schedules for plans and sessions.
- Indexed for reporting and schedule analytics.
- RLS: Users only see their own schedules.

---

## Design Choices & Rationale (continued)
- Explicit FKs, strong typing, RLS, and analytics indexes for all domains.
- Device and session breakdowns for AI/ML and personalization.

## Validation & Testing Notes (continued)
- All new tables and constraints tested via pgTAP.
- RLS and session logic validated for correct access control.

---

**Next Steps:** Proceed to next domains (subscriptions, payments, messages, assignments, audit, analytics).

---

## 15. subscriptions
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| type          | text      | Subscription type          | Select          | Required           |           |                  |                  |
| entity_id     | uuid      | FK to org/user             | Hidden          | Optional           | uuid      |                  |                  |
| status        | text      | Status                     | Select          | Required           |           |                  |                  |
| amount        | int       | Amount                     | Number input    | Optional           |           |                  |                  |
| valid_upto    | date      | Valid until                | Date picker     | Optional           |           |                  |                  |
| package_name  | text      | Package name               | Text input      | Optional           |           |                  |                  |
| created_at    | timestamptz | Row creation time       | Hidden          | Default now()      |           |                  | Audit trail      |

**Commentary:**
- Tracks subscriptions for gym, coach, dietician, etc.
- Indexed for reporting and revenue analytics.
- RLS: Users only see their own subscriptions.

---

## 16. payments
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| subscription_id | bigint  | FK to subscriptions.id     | Hidden          | FK, set null       | bigint    |                  |                  |
| amount        | int       | Payment amount             | Number input    | Required           |           |                  |                  |
| payment_date  | timestamptz | Payment time            | DateTime picker | Required           |           |                  | Audit trail      |
| status        | text      | Payment status             | Select          | Required           |           |                  |                  |
| method        | text      | Payment method             | Select          | Optional           |           |                  |                  |
| created_at    | timestamptz | Row creation time       | Hidden          | Default now()      |           |                  | Audit trail      |

**Commentary:**
- Tracks payments for subscriptions and revenue analytics.
- Indexed for reporting and payment KPIs.
- RLS: Users only see their own payments.

---

## 17. messages
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| from_user_id  | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| to_user_id    | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| message       | text      | Message text               | Text area       | Required           |           |                  |                  |
| sent_at       | timestamptz | Sent time               | DateTime picker | Default now()      |           |                  | Audit trail      |
| message_type  | text      | Message type               | Select          | Required           |           |                  | coach, dietician, system |

**Commentary:**
- Tracks messages for user, coach, and dietician communication.
- Indexed for reporting and engagement analytics.
- RLS: Users only see their own messages.

---

## 18. assignments
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| coach_id      | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| client_id     | uuid      | FK to users.id             | Hidden          | FK, cascade        | uuid      |                  |                  |
| plan_id       | bigint    | FK to plans.id             | Hidden          | FK, set null       | bigint    |                  |                  |
| assigned_at   | timestamptz | Assigned time           | DateTime picker | Default now()      |           |                  | Audit trail      |
| status        | text      | Assignment status          | Select          | Required           |           |                  | active, completed, revoked |

**Commentary:**
- Tracks assignments for coach-client relationships and plan tracking.
- Indexed for reporting and assignment analytics.
- RLS: Coach or client sees their own assignments.

---

## 19. audit_logs
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, set null       | uuid      |                  |                  |
| action        | text      | Action type                | Select          | Required           |           |                  | create, update, delete |
| entity_type   | text      | Entity type                | Select          | Required           |           |                  |                  |
| entity_id     | text      | Entity ID                  | Hidden          | Required           |           |                  |                  |
| details       | jsonb     | Action details             | JSON input      | Optional           |           |                  |                  |
| created_at    | timestamptz | Log time                | DateTime picker | Default now()      |           |                  | Audit trail, immutable |

**Commentary:**
- Partitioned for scale and compliance.
- Immutable for legal hold and audit.
- Indexed for reporting and compliance analytics.
- RLS: Admins/auditors have read-only access.

---

## 20. analytics_events
| Field         | Type      | Description                | UI Hint         | Validation         | Enum/Type | Conditional Logic | Compliance Notes |
|---------------|-----------|----------------------------|-----------------|--------------------|-----------|------------------|------------------|
| id            | bigserial | Row ID                     | Hidden          | PK                 |           |                  |                  |
| user_id       | uuid      | FK to users.id             | Hidden          | FK, set null       | uuid      |                  |                  |
| event_type    | text      | Event type                 | Select          | Required           |           |                  | login, workout, payment |
| event_data    | jsonb     | Event data                 | JSON input      | Optional           |           |                  |                  |
| occurred_at   | timestamptz | Event time              | DateTime picker | Required           |           |                  | Audit trail      |
| created_at    | timestamptz | Row creation time       | Hidden          | Default now()      |           |                  | Audit trail      |

**Commentary:**
- Partitioned for scale and analytics.
- Indexed for reporting and event taxonomy.
- RLS: Admins/auditors have read-only access.

---

## Design Choices & Rationale (continued)
- Partitioning, legal hold, and compliance for audit and analytics tables.
- RLS for privacy, admin, and audit access.

## Validation & Testing Notes (continued)
- Partitioning, RLS, and immutability tested via pgTAP.
- Audit and analytics event taxonomy validated for reporting.

---

**Schema complete. Ready for review or further iteration.**

---

## Compliance, ERD, Migration & Developer Workflow

### Compliance & Retention
- GDPR, HIPAA, COPPA, SOC2: All PII encrypted at rest/in transit; explicit consent/versioning; legal hold on audit_logs.
- Retention: Health and audit data retained for 7 years (configurable); user-initiated deletion/export with legal hold checks.
- Guardian consent enforced for minors; audit trail for all changes.

### ERD & Relationships
- All relationships are explicit via foreign keys; cascade/set null as appropriate.
- ERD should be generated and updated with each migration (e.g., dbdiagram.io, pgModeler).

### Migration & Versioning
- Use Supabase CLI or Flyway for schema migrations; all changes tracked in Git and change log.
- Backward-compatible migrations preferred; destructive changes require migration plan and data export.

### Developer Workflow
- Git versioning, change log discipline, ERD updates required for all schema changes.
- All constraints, triggers, RLS, and partitioning tested via pgTAP or equivalent.
- Schema guide and .sql kept in sync for review and onboarding.

---

**End of Enterprise Schema Guide.**

---

## Schema Versioning & Migration Workflow

- All schema changes are tracked in Git and reviewed via pull requests.
- Use Supabase CLI or Flyway for migrations; each migration is a separate file with a timestamp and description.
- ERD diagrams are updated with each migration (dbdiagram.io, pgModeler, or similar).
- Backward-compatible migrations are preferred; destructive changes require a migration plan and data export.
- All changes are validated with pgTAP tests (see test/pgtap_schema_tests.sql).
- The Markdown guide and schema.sql must always be kept in sync for onboarding and compliance.

---
