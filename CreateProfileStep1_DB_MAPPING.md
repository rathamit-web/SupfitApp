# CreateProfileStep1 UI-to-Database Mapping (Supfit)

| Screen / UI Element         | Database Table(s)   | Operation                |
|----------------------------|---------------------|--------------------------|
| Full Name (TextInput)      | users, user_profiles| Insert (on submit)       |
| Age (TextInput)            | user_profiles       | Insert                   |
| Gender (Button group)      | user_profiles       | Insert                   |
| Bio (state, next step)     | user_profiles       | Insert                   |
| Avatar (state, next step)  | user_profiles       | Insert                   |
| Next Button                | users, user_profiles| Insert (triggers next step, eventually saves data) |

---

## 1. Data Flow
- User enters name, age, gender, bio, avatar in UI.
- On Next, data is passed to next step; on final submit, frontend sends data to backend API.
- Backend API validates and inserts into users and user_profiles tables (transactional).
- DB enforces constraints (NOT NULL, enum, foreign keys).

## 2. Wire Up in Code
- **Frontend:**
  - Collects form data, validates required fields, disables Next if incomplete.
  - Calls backend API (e.g., POST /api/profile) on final step.
- **Backend:**
  - Receives data, validates (type, required, enum), inserts into users and user_profiles.
  - Uses transaction to ensure both tables are updated atomically.
- **RLS Policies:**
  - Only allow insert/update if auth.uid() matches user being created/updated.

## 3. Validation & Testing
- **Frontend:**
  - Checks required fields (name, age, gender), disables Next if incomplete.
- **Backend:**
  - Validates types, enum values (gender), age range, etc.
- **DB:**
  - Enforces NOT NULL, enum, and foreign key constraints.
- **Testing:**
  - Use sample data, check for constraint violations, test RLS by trying to insert as different users.

---

## Example Insert (SQL)
```sql
-- Insert user
INSERT INTO users (email) VALUES ('user@example.com') RETURNING id;

-- Insert profile
INSERT INTO user_profiles (id, full_name, dob, gender, bio, avatar_url, units)
VALUES ('<user_id>', 'John Doe', '2000-01-01', 'M', 'My bio', 'avatar.png', 'metric');
```

*Note: dob (date of birth) is derived from age in UI; units can default to 'metric'.*
