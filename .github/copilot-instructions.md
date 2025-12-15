
# Supfit AI Coding Agent Instructions

## Project Overview
Supfit is a Vite + React + TypeScript web app for fitness, coaching, and user engagement. It uses shadcn-ui and Tailwind CSS for UI, and is organized for rapid feature development and clear separation of concerns.

## Architecture & Key Patterns
- **Entry Point:** See [src/main.tsx](../src/main.tsx) for app bootstrap and router setup (uses `react-router-dom`).
- **Pages:** Main views are in [src/pages/](../src/pages/) (e.g., `Index.tsx`, `Followers.tsx`). Each is a functional React component.
- **Components:** Shared UI in [src/components/](../src/components/) and [src/components/ui/](../src/components/ui/) (shadcn-ui pattern). Use these for consistent design.
- **Hooks:** Custom hooks in [src/hooks/](../src/hooks/) (e.g., `useFollowers.ts`). Use for data/state logic.
- **Lib:** Utilities and mock API logic in [src/lib/](../src/lib/).
- **Styles:** Global/page styles in [src/styles/](../src/styles/). Tailwind config in [tailwind.config.ts](../tailwind.config.ts).
- **Types:** Use [src/types/](../src/types/) for strict TypeScript typing.
- **State:** Use React hooks for local state; async/data via `@tanstack/react-query`.
- **Theme:** Dark mode via Tailwind's `darkMode: 'class'` and shadcn-ui.

## Developer Workflows
- **Start Dev Server:** `npm run dev` (default port 8080)
- **Build:** `npm run build` or `npm run build:dev`
- **Lint:** `npm run lint` ([eslint.config.js](../eslint.config.js))
- **Preview:** `npm run preview`

## Project-Specific Conventions
- **File Structure:** Follow the existing folder structure. UI components in `ui/`, hooks in `hooks/`, etc.
- **Imports:** Use `@` alias for `src/` (see [vite.config.ts](../vite.config.ts)).
- **Local Storage:** User data (profile image, posts, subscriptions) is persisted in localStorage (see [Index.tsx](../src/pages/Index.tsx)).
- **Icons:** Use `lucide-react` icons as in current pages/components.
- **Subscriptions/Profiles:** Managed via local state and localStorage; see [Index.tsx](../src/pages/Index.tsx).
- **No Automated Tests:** No test setup; manual testing via dev server is standard.

## Integration Points & Dependencies
- **UI:** shadcn-ui (Radix), Tailwind CSS, lucide-react
- **State/Data:** React hooks, TanStack React Query
- **Routing:** react-router-dom
- **Forms:** react-hook-form, zod
- **Charts/Carousel:** embla-carousel-react, recharts

## Examples & Patterns
- **Add a Page:** Create a file in [src/pages/](../src/pages/), export a React component, and add a route in the router.
- **Add UI Element:** Extend [src/components/ui/](../src/components/ui/) using shadcn-ui conventions.
- **Add a Hook:** Place in [src/hooks/](../src/hooks/) and use explicit TypeScript types.
- **Persist Data:** Use localStorage for user-specific data (see [Index.tsx](../src/pages/Index.tsx)).

## References
- [src/pages/Index.tsx](../src/pages/Index.tsx): Main dashboard, localStorage usage
- [vite.config.ts](../vite.config.ts): Alias setup, dev server config
- [tailwind.config.ts](../tailwind.config.ts): Theme/colors
- [package.json](../package.json): Scripts, dependencies
- [README.md](../README.md): Workflow summary

---
**If any conventions or workflows are unclear, ask the user for clarification before making changes.**
