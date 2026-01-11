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

# Rich Media Display: Meta, Apple & Google Standards

## 1. Aspect Ratio Handling
- **Facebook/Instagram:** Normalize to common ratios (1:1 square, 4:5 portrait, 16:9 landscape).
- **Apple/Meta:** Maintain original aspect ratio but crop/letterbox intelligently.
- **Best Practice:**
  - Use `object-fit: cover` for images (web).
  - Use `resizeMode="cover"` in React Native.
  - This ensures the media fills the placeholder without distortion.

## 2. Responsive Scaling
- Media should adapt to container size across devices.
- Use flex layouts or percentage widths (e.g., `width: 100%`).
- Avoid fixed pixel dimensions unless necessary.

## 3. Cropping vs Letterboxing
- **Cover (crop):** Fills the placeholder, may cut edges.
- **Contain (letterbox):** Shows full media, may leave empty space.
- **Standard:** Social apps prefer cover for a rich, immersive look.

## 4. Video Fit
- Use `object-fit: cover` or `resizeMode="cover"` for video players.
- Ensure autoplay previews are cropped consistently.

## 5. Accessibility & UX
- Always provide alt text or captions.
- Ensure focus indicators are visible.
- Avoid hiding focusable elements with `aria-hidden`.

## Best Practice Summary
- Use “cover” fit for immersive look (like Instagram).
- Maintain aspect ratio to avoid distortion.
- Responsive containers for cross-device consistency.
- Graceful fallback: If media fails, show a placeholder icon.
- Accessibility compliance: Provide alt text, captions, and avoid focus traps.

