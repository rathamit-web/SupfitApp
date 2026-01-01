## Recent Updates (as of Dec 31, 2025)

- **HealthDashboard** now fetches and visualizes real trend data for Blood Pressure and Blood Sugar from Supabase (`manual_vitals` table). Trend analysis is backend-driven and supports weekly, monthly, and yearly aggregation.
- **Manual Vital Entry**: Users can enter Blood Pressure and Blood Sugar manually in the app. These are stored in Supabase and visualized in the dashboard.
- **Error Fixes**: Fixed JSX syntax errors (e.g., unclosed `<View>` in `UserSettingsNative.tsx`) and improved type safety in trend data aggregation.
- **Supabase Integration**: All user-specific health data, profile, and subscriptions are now synced with Supabase for robust backend storage and analytics.
- **Best Practices**: Used upsert for user settings, atomic updates, and local+remote sync patterns. All image/document uploads use Supabase Storage.

# Supfit Native App Architecture & Data Integration Guide

## 1. UI/Data Layer Separation
- All data fetching and mutations are handled in hooks or service files (e.g., `src/hooks/useUserProfile.ts`, `src/lib/mockUserService.ts`).
- UI components/pages never call Supabase or data APIs directly; they consume data via hooks/props only.

## 2. Centralized Design Tokens
- All colors, spacing, and typography are defined in a single theme file (see `src/styles/theme.ts`).
- UI components reference these tokens for consistent design.

## 3. Role Management (Industry Standard)
- User role is selected on the Landing page and saved in a React Context (`src/context/UserRoleContext.tsx`).
- The context is provided at the root (`App.tsx`), so role is available throughout the app lifecycle.
- Role is set using `setRole` and can be accessed via the `useUserRole` hook.

## 4. Mock Data First Approach
- Data hooks (e.g., `useUserProfile`) return mock data from service files.
- When ready, swap mock implementations for real Supabase calls in the service layer only—no UI changes required.

## 5. Best Practices
- All business/data logic is outside UI components.
- TypeScript is used for strict typing of all data and context.
- Navigation and context are decoupled from UI rendering.
- Follows Google, Meta, and Apple mobile app architecture standards.

## 6. Example: Role Selection Flow
- User selects a role on the Landing page.
- Role is saved in context and persists for the session.
- All pages can access the current role using `useUserRole()`.

## 7. File Overview
- `src/context/UserRoleContext.tsx`: Role context/provider/hook.
- `src/lib/mockUserService.ts`: Mock user profile and role data.
- `src/hooks/useUserProfile.ts`: Hook to fetch user profile (mock, ready for Supabase).
- `App.tsx`: Wraps app in `UserRoleProvider`.
- `src/screens/Landing.tsx`: Role selection UI, sets role in context.

## 8. Next Steps
- Add more hooks/services for other data (workouts, posts, etc.)
- Gradually replace mock data with Supabase integration in the service layer.
- Document all new patterns and architectural decisions here.

---
_This documentation is updated as new architecture and integration steps are implemented._
