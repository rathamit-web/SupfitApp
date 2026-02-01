## Best Practice: Role Persistence & Enforcement

### Why Store User Role in the Database?
- **Session continuity:** Role persists across logins, devices, and sessions.
- **Access control:** Backend (not just frontend) enforces feature access (e.g., only coaches can assign plans).
- **Analytics & personalization:** Enables tailored experiences, feeds, and recommendations.
- **Compliance & audit:** Secure, auditable storage of user metadata (role), with encryption and RLS.

### Implementation Pattern
1. **Schema:**
	- Add a `role` column to the `users` table (e.g., ENUM: 'user', 'coach', 'dietician', 'admin').
	- Set role at signup (from Auth context or selection), and persist in DB.
2. **Frontend:**
	- Pass userType/role context during signup.
	- Do not rely solely on frontend state for access control.
3. **Backend:**
	- On signup, store role in `users` table.
	- On login/session restore, fetch role from DB and use for authorization.
	- Enforce RLS policies based on role (e.g., only coaches can assign plans, only users can submit workouts).
4. **RLS Example:**
	- `CREATE POLICY coach_can_assign ON plans FOR INSERT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coach'));`
5. **Compliance:**
	- Encrypt user metadata at rest (if required).
	- Log role changes for audit.

### Example: Role Column in users Table
```sql
ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'coach', 'dietician', 'admin'));
```

### Summary
- Always persist user role in the database for security, compliance, and robust access control.
- Use RLS and backend validation to enforce role-based features.
## Appendix: UI-to-Database Mapping Example (CreateProfileStep1)

| Screen / UI Element         | Database Table(s)   | Operation                |
|----------------------------|---------------------|--------------------------|
| Full Name (TextInput)      | users, user_profiles| Insert (on submit)       |
| Age (TextInput)            | user_profiles       | Insert                   |
| Gender (Button group)      | user_profiles       | Insert                   |
| Bio (state, next step)     | user_profiles       | Insert                   |
| Avatar (state, next step)  | user_profiles       | Insert                   |
| Next Button                | users, user_profiles| Insert (triggers next step, eventually saves data) |

### 1. Data Flow
- User enters name, age, gender, bio, avatar in UI.
- On Next, data is passed to next step; on final submit, frontend sends data to backend API.
- Backend API validates and inserts into users and user_profiles tables (transactional).
- DB enforces constraints (NOT NULL, enum, foreign keys).

### 2. Wire Up in Code
- **Frontend:**
	- Collects form data, validates required fields, disables Next if incomplete.
	- Calls backend API (e.g., POST /api/profile) on final step.
- **Backend:**
	- Receives data, validates (type, required, enum), inserts into users and user_profiles.
	- Uses transaction to ensure both tables are updated atomically.
- **RLS Policies:**
	- Only allow insert/update if auth.uid() matches user being created/updated.

### 3. Validation & Testing
- **Frontend:**
	- Checks required fields (name, age, gender), disables Next if incomplete.
- **Backend:**
	- Validates types, enum values (gender), age range, etc.
- **DB:**
	- Enforces NOT NULL, enum, and foreign key constraints.
- **Testing:**
	- Use sample data, check for constraint violations, test RLS by trying to insert as different users.

---


# Supfit Database Schema: Architecture & Design Summary (Jan 2026)

## 1. Overview & Principles
This document provides a concise, expert-level overview of the Supfit PostgreSQL schema as implemented in `schema.sql`. The schema is designed for extensibility, privacy, compliance, and performance, supporting a modern fitness, coaching, and wellness platform.

---

## 2. Entity-Relationship Diagram (ERD)
*A visual ERD should be maintained separately. Key entities: users, user_profiles, health_vitals, workouts, nutrition_logs, plans, subscriptions, payments, messages, assignments, testimonials, recommendations, audit_logs, analytics_events.*

---

## 3. Schema Domains & Table Order
Tables are grouped and ordered by domain for clarity and maintainability:
1. Users & Profiles: `users`, `user_profiles`
2. Authentication & Consent: `auth_providers`, `consent_forms`, `user_consent`
3. Health Vitals & Medical History: `health_vitals`, `medical_history`
4. Devices & Integrations: `connected_devices`
5. Workouts & Activity: `workouts`, `workout_sessions`
6. Nutrition & Diet: `nutrition_logs`, `diet_plans`
7. Plans, Targets & Schedules: `plans`, `targets`, `schedules`
8. Subscriptions & Payments: `subscriptions`, `payments`, `revenue_tracker`
9. Messaging & Assignments: `messages`, `assignments`, `testimonials`
10. Recommendations & Personalization: `recommendations`, `health_dashboard_prefs`
11. Audit, Analytics & Compliance: `audit_logs`, `analytics_events`

---

## 4. Table Definitions (Domain Summaries)

### Users & Profiles
- `users`: Core user identity, email, status, minor/guardian logic
- `user_profiles`: Demographics, bio, avatar, physical stats

### Authentication & Consent
- `auth_providers`: External auth linkage
- `consent_forms`, `user_consent`: Regulatory consent tracking

### Health Vitals & Medical History
- `health_vitals`: Partitioned, extensible JSONB for vitals
- `medical_history`: Diagnoses, status, RLS

### Devices & Integrations
- `connected_devices`: Device metadata, sync info

### Workouts & Activity
- `workouts`, `workout_sessions`: Activity, session breakdowns

### Nutrition & Diet
- `nutrition_logs`: Meals, calories, food items (JSONB)
- `diet_plans`: Structured diet plans

### Plans, Targets & Schedules
- `plans`: User plans (workout/diet/custom)
- `targets`: Quantitative goals
- `schedules`: Plan scheduling, status

### Subscriptions & Payments
- `subscriptions`: Service subscriptions, status, packages
- `payments`: Payment records, methods
- `revenue_tracker`: Professional earnings by period

### Messaging & Assignments
- `messages`: User/professional communication
- `assignments`: Coach-client relationships
- `testimonials`: Ratings & reviews for coach/gym/dietician

### Recommendations & Personalization
- `recommendations`: Supplement, workout, diet recommendations
- `health_dashboard_prefs`: User dashboard widget preferences

### Audit, Analytics & Compliance
- `audit_logs`: Partitioned, legal hold, audit trail
- `analytics_events`: Partitioned, extensible for trend/AI/ML

---

## 5. Indexes & Partitioning
- Indexes on all major foreign keys and query fields
- Partitioning for large tables (`health_vitals`, `audit_logs`, `analytics_events`) by date for performance and retention

## 6. RLS & Security
- Row Level Security (RLS) enforced on all user data tables
- Policies for user, professional, and admin access as appropriate

## 7. Compliance, Retention & Legal Hold
- 7-year retention policy with legal hold exceptions
- Triggers to block deletion if `legal_hold` is true
- Consent and guardian logic for minors

## 8. Analytics & AI/ML Readiness
- `analytics_events` and extensible JSONB fields support advanced analytics and future AI/ML features
- Schema is designed for easy integration with BI/ML pipelines

## 9. Validation & Testing
- Data integrity via CHECK, NOT NULL, and foreign key constraints
- Recommended: Use information_schema queries and sample data to validate schema correctness after migration

## 10. Versioning & Migration
- Schema changes should be tracked via migration files (e.g., timestamped .sql scripts)
- Maintain a changelog for all structural updates

## 11. References & Best Practices
- PostgreSQL official documentation: https://www.postgresql.org/docs/
- Supabase best practices: https://supabase.com/docs/guides/database
- Industry standards: GDPR, HIPAA, SOC2, COPPA
- Use of partitioning, RLS, and JSONB for modern SaaS data architectures

---

## How to Use

1. Review `schema.sql` for full DDL.
2. Apply migrations for new tables as needed.
3. Integrate with Supabase or backend API for application access.
4. Update application logic to leverage new features.

---

For full table definitions and constraints, see `schema.sql`.
