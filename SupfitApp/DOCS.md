# Media Upload Optimization (Coach Recent Training)

## Overview
Coaches can upload large images and videos for the Recent Training section. To ensure fast, reliable delivery and optimal user experience, all uploaded media is optimized on the backend before being served to users.

## Daily Active Hours (Derived-only)
See `ACTIVE_HOURS_PIPELINE.md` for the privacy-first daily totals pipeline (`public.active_hours` + `ingest-active-hours`).

## Backend Optimization Flow
1. **Upload**: User uploads image/video to Supabase Storage (images/videos bucket).
2. **Trigger**: Supabase Edge Function or Storage Function is triggered on upload.
3. **Processing**:
   - **Images**: Compress and resize to max width **1080px** (maintain aspect ratio, use JPEG/WebP for best results).
   - **Videos**: Transcode to max **1080x1920px** (vertical), compress for web/mobile (H.264/MP4 recommended).
4. **Serve**: Only optimized versions are made public and delivered to users.

## Best-Practice Targets
- **Images**: 1080px width, JPEG/WebP, <1MB if possible
- **Videos**: 1080x1920px max, H.264/MP4, <10MB if possible

## Implementation Notes
- Use [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) or [Sharp](https://sharp.pixelplumbing.com/) for image/video processing in Edge Functions.
- Store original uploads in a private bucket; move/copy optimized versions to a public bucket or set public access after processing.
- See Supabase docs: [Storage Functions](https://supabase.com/docs/guides/storage/functions) and [Edge Functions](https://supabase.com/docs/guides/functions).

## Example Edge Function Pseudocode
```js
// On file upload (image or video):
if (file.type.startsWith('image/')) {
  // Resize/compress image to 1080px width
  // Save optimized image to public bucket
}
if (file.type.startsWith('video/')) {
  // Transcode/compress video to 1080x1920px max
  // Save optimized video to public bucket
}
```

## Files Involved
- `src/screens/CoachHomeNative.tsx` (frontend upload logic)
- Supabase Edge Function/Storage Function (backend optimization)

## References
- [Meta/Instagram Media Guidelines](https://help.instagram.com/1631821640426723)
- [Apple Human Interface Guidelines: Media](https://developer.apple.com/design/human-interface-guidelines/media/overview/)
- [Supabase Storage Functions](https://supabase.com/docs/guides/storage/functions)
## Recent Updates (as of Dec 31, 2025)

- **HealthDashboard** now fetches and visualizes real trend data for Blood Pressure and Blood Sugar from Supabase (`manual_vitals` table). Trend analysis is backend-driven and supports weekly, monthly, and yearly aggregation.
- **Manual Vital Entry**: Users can enter Blood Pressure and Blood Sugar manually in the app. These are stored in Supabase and visualized in the dashboard.
- **Error Fixes**: Fixed JSX syntax errors (e.g., unclosed `<View>` in `UserSettingsNative.tsx`) and improved type safety in trend data aggregation.
- **Supabase Integration**: All user-specific health data, profile, and subscriptions are now synced with Supabase for robust backend storage and analytics.
- **Best Practices**: Used upsert for user settings, atomic updates, and local+remote sync patterns. All image/document uploads use Supabase Storage.
- **Coach Rating System** (Jan 10, 2026): Implemented testimonials and rating flow where clients can review coaches. Ratings are stored in database and averaged to display on CoachHome stats.

## Coach Rating & Testimonials System

### Overview
Coaches receive ratings and reviews from their clients/followers through the TestimonialsNative page. The system automatically calculates the average rating and displays it in the CoachHome dashboard.

### Data Flow
1. **Client Reviews** → Clients submit ratings (1-5 stars) and reviews through the app
2. **Storage** → Ratings stored in `client_reviews` table (linked to coach_id and client_user_id)
3. **Calculation** → Average rating calculated and stored in `coaches.average_rating`
4. **Display** → CoachHome fetches and displays average rating in the "Rating" stat card

### Database Schema
```sql
-- Coaches table has these rating-related fields:
coaches.years_experience (integer)  -- Years of coaching experience
coaches.rating (numeric)            -- Initial/manual rating (0-5)
coaches.average_rating (numeric)    -- Calculated from reviews (0-5)
coaches.total_reviews (integer)     -- Count of reviews received
```

### Implementation Details
- **TestimonialsNative Page**: Displays all reviews/ratings received by the coach
- **CoachHome Stats**: Shows `average_rating` (from reviews) or falls back to `rating` (coach-set), default 4.5
- **Rating Priority**: `average_rating` > `rating` > 4.5 (fallback)
- **Active Clients**: Real count from `coach_client_assignments` table
- **Years Experience**: From `coaches.years_experience` column

### Migration
See `database/migrations/005_coach_stats_fields.sql` for the database schema changes.

### Files Involved
- `src/screens/CoachHomeNative.tsx` - Displays stats (fetches average_rating)
- `src/screens/TestimonialsNative.tsx` - Shows reviews to coach
- `database/migrations/005_coach_stats_fields.sql` - Database schema

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

# Retrospective: Lessons Learned on Upload Functionality & Exception Handling

## Why Did It Take So Long?
- **Web vs. Mobile Platform Differences:** Expo ImagePicker behaves differently on web and mobile. On web, file pickers can allow unsupported files, and errors are thrown synchronously, escaping normal try/catch. This is not obvious unless you have deep cross-platform experience.
- **Expo ImagePicker Limitations:** The API’s `mediaTypes` filtering is not enforced at the browser level. Browsers allow users to select any file, and only after selection does the MIME type get checked. This led to uncaught errors when users picked unsupported files.
- **Error Propagation:** Some errors (especially on web) are thrown outside the async promise chain, making them impossible to catch with standard try/catch or `.catch()` handlers. This required a global error handler or ErrorBoundary, which is not a common first step for most React Native devs.
- **Multiple Rounds of Fixes:**
  - Initial attempts focused on file extension and basic try/catch.
  - Later, more robust MIME type validation and user feedback were added.
  - Only after repeated failures was the solution found: use native `<input type="file" accept="...">` on web, and always validate MIME type after selection.
- **UX Consistency:** Ensuring the same user experience and error messaging across web and mobile required several iterations, as each platform has different capabilities and user expectations.

## Best Practices: Did We Follow Them?
- **Strict MIME Type Validation:**
  - Now always checks MIME type, not just file extension, for both images and videos.
- **User-Friendly, Actionable Error Messages:**
  - Alerts and toasts are short, clear, and actionable, matching the tone and clarity of Apple, Meta, and Google standards.
- **Graceful Blocking:**
  - Invalid files are blocked immediately, with no app crash or error screen.
- **Platform-Appropriate File Selection:**
  - Uses `<input type="file" accept="image/*,video/*">` on web, and `ImagePicker.MediaTypeOptions.All` on mobile, matching industry standards.
- **No Uncaught Exceptions:**
  - All errors are now caught and handled gracefully, with no unhandled promise rejections or error boundaries needed for this flow.
- **Consistent UX:**
  - The user always gets a clear, actionable message, and the upload only proceeds if the file is valid.

## Industry Standards Comparison
- **Meta/Instagram:**
  - Always validate MIME type and file size.
  - Use native file pickers with accept filters.
  - Show short, actionable error messages (“Only images and videos allowed.”).
  - Never crash or show stack traces to users.
- **Apple:**
  - Use system pickers and block unsupported files at the picker level.
  - Always provide clear, non-technical feedback.
- **Google:**
  - Use MIME type validation, not just extension.
  - Consistent, friendly error messages.
  - No unhandled exceptions.

**We now match these standards.**
Earlier, we did not—errors could escape, and messages were sometimes technical or inconsistent.

---

## Summary of Lessons Learned
- Understand platform differences early.
- Always validate MIME type, not just extension.
- Use native file input on web for best filtering.
- Handle all errors gracefully and show user-friendly messages.
- Test on all platforms (web, iOS, Android) for consistent UX.
- Follow the shortest, clearest error message style (Meta/Apple/Google).

**Final state:**
The upload flow is now robust, user-friendly, and matches the best practices of leading mobile apps.
