# Global Search Architecture

_Last updated: 2025-03-21_

## Goals

- Provide a single, role-aware command palette that surfaces navigation shortcuts, entities, and key actions without round-trips to the backend for every keystroke.
- Keep the experience frontend-only while exposing a flexible API so each role (Course Admin, Examiner, Student, etc.) can opt into its own set of search sources.
- Make it straightforward to add new targets (e.g., rubric setup, session scheduling) or additional roles without touching the palette UI.

## Key Building Blocks

| Piece | Responsibility | Location |
| --- | --- | --- |
| `useGlobalSearchStore` | Palette state (open, query, loading, errors, loaded sections) | `frontend/store/globalSearchStore.js` |
| `GlobalSearchPalette` | UI & interaction layer (keyboard shortcuts, filtering, rendering, favourite toggles) | `frontend/components/layout/GlobalSearchPalette.jsx` |
| `GlobalSearchProvider` | Fetch orchestrator; resolves active role, pulls data, hydrates store | `frontend/components/layout/GlobalSearchProvider.jsx` |
| `search/registry` | Registry storing sources per role (`registerSearchSources` / `getSearchSources`) | `frontend/search/registry.js` |
| `search/persistence` | LocalStorage helpers for per-role recents & favourites | `frontend/search/persistence.js` |
| `search/sources/*` | Role-specific source definitions (Quick Links, Courses, etc.) | `frontend/search/sources/` |

## Data Flow

1. **Registration** – Role modules (e.g., `search/sources/courseAdmin.js`) call `registerSearchSources(role, sources)` at import time.
2. **Provider Bootstraps** – `GlobalSearchProvider` (wrapped around admin layout) imports those modules for their side effects, reads the signed-in user’s role from `authStore`, and asks the registry for active sources.
3. **Loading** – Each source exposes a `loader(context)` function. The provider invokes all loaders in parallel via `Promise.allSettled`, supplying a shared `context` that contains `{ user, role, cache }`.
4. **Caching** – Loaders can stash results in `context.cache` (e.g., course list, assignment list) so multiple sources reuse the same data without additional API calls.
5. **Store Update** – Fulfilled loaders are transformed into **sections** (`{ id, label, items, priority, defaultLimit, queryLimit, alwaysVisible }`) and saved to the Zustand store. Partial failures are surfaced as a warning; when any loader fails we keep the cache key unset so the next palette open retries instead of sticking with stale data.
6. **Presentation** – `GlobalSearchPalette` reads sections from the store, filters them against the current query, enforces per-section limits, flattens the result list for keyboard navigation, and renders them grouped by section label.

## Section Structure

Each section in the store follows this shape:

```js
{
  id: 'course-admin.assignment-results',
  label: 'Assignments — Results',
  items: [{ id, title, subtitle, href, keywords }],
  priority: 80,            // higher renders earlier
  defaultLimit: 6,         // max items when query is empty (optional)
  queryLimit: Infinity,    // max items when query is non-empty (optional)
  alwaysVisible: false     // keep section when query=Empty but items=0
}
```

The palette applies `matchItems()` to every section:

- **No query** → show up to `defaultLimit` items (or all if omitted).
- **With query** → filter against `title`, `subtitle`, and `keywords`, then cap at `queryLimit` if provided.
- Sections that filter down to zero items are hidden unless `alwaysVisible === true` *and* the query is blank (e.g., Quick Links).

## Course Admin Source Set

File: `frontend/search/sources/courseAdmin.js`

Source summary:

| Source ID | Label | Purpose | Notes |
| --- | --- | --- | --- |
| `course-admin.favourites` | Favourites | Starred shortcuts pinned across sessions. | Pulled from role/user scoped localStorage; items always marked as favourite. |
| `course-admin.recents` | Recent Searches | Last visited links from the palette. | Updated every time an item is executed; limited to 15 entries. |
| `course-admin.quick-links` | Quick Links | Static shortcuts (Dashboard, Courses, Users, Results, Support, Docs). | `alwaysVisible` so the palette never feels empty on first open. |
| `course-admin.courses` | Courses | All courses managed by the current admin. | Uses `courseService.getAllCourses`, cached; items expose favourite toggle state. |
| `course-admin.assignment-results` | Assignments — Results | Jumps directly into moderation & release screens. | Shares cached assignment payloads; supports favourites. |
| `course-admin.assignment-rubrics` | Assignments — Rubrics | Navigates to rubric setup. | Subtitle hints at rubric status (configured vs. needs setup); supports favourites. |
| `course-admin.assignment-schedules` | Assignments — Sessions | Links to timeslot/session configuration. | Subtitle highlights scheduling context; supports favourites. |

Implementation notes:

- Assignments are fetched for every course returned by `courseService.getAllCourses`. If the backend response becomes very large, consider re-introducing a configurable cap or lazy loading.
- All assignment-derived sections share a cached `courseAssignments` array so we only call the backend once per course.
- Recents and favourites are stored in `localStorage` under `oas-search-{type}:{role}:{userId}`. Loaders pull the persisted lists into dedicated sections while augmenting every item with `allowFavourite`/`isFavourite` metadata so the palette can render star toggles.
- Course Admin assignment loaders enrich subtitles with release status, marking progress, scheduling completeness, urgency, and due-date countdowns so admins can triage before clicking through.
- Real-time status (e.g., number of configured slots) is intentionally omitted for now; add-on loaders can augment `keywords` or `subtitle` later if needed.

## Examiner Source Set

File: `frontend/search/sources/examiner.js`

Source summary:

| Source ID | Label | Purpose | Notes |
| --- | --- | --- | --- |
| `examiner.favourites` | Favourites | Starred shortcuts persisted per examiner. | Hydrated from `search/persistence.js`; items always allow favourite toggles. |
| `examiner.recents` | Recent Searches | Jump back to last palette destinations. | Syncs with the palette’s `addRecent` hook after each navigation. |
| `examiner.quick-links` | Quick Links | Dashboard, schedule, marking workspace, etc. | Items expose favourite toggles to pin common areas. |
| `examiner.upcoming-sessions` | Upcoming Sessions | Shows future slots with countdown, staffing, and student load. | `subtitle` highlights session window, examiner coverage, venue, and start countdown. |
| `examiner.marking-sessions` | Sessions Ready to Mark | Links directly into assessment UIs. | Surfaces marking status (draft/submitted/reopened) and booking load. |
| `examiner.assignment-opportunities` | Assignments Needing Coverage | Self-assignment entry points. | Displays remaining examiner capacity, urgency, and signup countdowns. |

## Student Source Set

File: `frontend/search/sources/student.js`

Source summary:

| Source ID | Label | Purpose | Notes |
| --- | --- | --- | --- |
| `student.favourites` | Favourites | Persisted shortcuts the student has starred. | Role/user scoped via `search/persistence.js`. |
| `student.recents` | Recent Searches | Last palette selections. | Updated automatically after navigation. |
| `student.quick-links` | Quick Links | Dashboard, bookings, results, groups, help, etc. | Favourite-capable for quick pinning. |
| `student.upcoming-bookings` | Upcoming Bookings | View upcoming sessions with timing safeguards. | Announces start countdowns, venue, lockout/reschedule status, and booking deadlines. |
| `student.available-assignments` | Available to Book | Quickly book sessions still open. | Highlights remaining capacity, booking deadline, reschedule rules, and countdown to next slot. |
| `student.released-results` | Recently Released Results | Deep link into results detail views. | Shows release date, grade/score, and release status cues. |

## Extending to a New Role

1. **Create a Source Module**
   ```js
   // frontend/search/sources/examiner.js
   import { registerSearchSources } from '../registry';
   import { examinerTimeslotService } from '@/services/examinerTimeslotService';

   const sources = [
     {
       id: 'examiner.quick-links',
       label: 'Quick Links',
       priority: 100,
       loader: async () => examinerQuickLinks,
     },
     {
       id: 'examiner.upcoming-sessions',
       label: 'Upcoming Sessions',
       priority: 90,
       loader: async (ctx) => {
         const sessions = await examinerTimeslotService.getUpcoming(ctx.user.id);
         return sessions.map(toSessionItem);
       },
     },
     // add more sources...
   ];

   registerSearchSources('EXAMINER', sources);
   ```

2. **Import the Module** where the role should have search access (e.g., wrap the examiner layout in `GlobalSearchProvider` and include `import '@/search/sources/examiner';`).

3. **Role-Specific Recent/Favourite Items** – Implement loaders backed by `search/persistence.js`, which already provides helpers used by the Course Admin sources (`getRecents`, `getFavourites`, `toggleFavourite`, etc.). Namespacing follows the pattern `oas-search-{recents|favourites}:{ROLE}:{userId}` so roles never bleed into each other.

4. **Optional** – If a role shares the same shortcuts as Course Admin (e.g., Super Admin), register the same source array for that role, as we do with `registerSearchSources('SUPER_ADMIN', courseAdminSources)`.

## Adding New Course Admin Targets

- **New Assignment Action** (e.g., feedback exports):
  1. Extend `buildAssignmentItems` to generate an additional item.
  2. Add another source definition with its own `id`, `label`, and `loader` that maps to the new item.
- **Brand-new Entity** (e.g., venues): create a dedicated loader and push to `courseAdminSources`. To keep palette size manageable, use `defaultLimit` to constrain non-query results.

## Interaction Notes

- **Keyboard shortcuts** (`⌘/Ctrl + K`, arrow navigation, `Enter`, `Esc`) are handled inside `GlobalSearchPalette`.
- **Routing** – Items require a valid `href`. For Course Admin we normalise base paths to the existing App Router structure (`/admin/courses/[courseId]/assignments/...`).
- **Caching Key** – `GlobalSearchProvider` caches by `role-userId`. Switching users or roles automatically triggers a reload.
- **Favourites Toggle** – When a section item carries `allowFavourite`, the palette renders a star control. Toggling updates localStorage immediately and triggers an in-memory refresh so lists stay in sync without reopening the palette.
- **Cross-role Persistence** – Any role that registers `.favourites` / `.recents` sections automatically opts into persistence. The palette detects those sections at runtime and updates the lists after navigation or star toggles without extra role-specific wiring.

## Deferred Enhancements

- Real-time status badges for rubric/timeslot completion (backend support needed).
- Fuzzy scoring (e.g., Fuse.js) once datasets grow large enough to justify it.
- Debounced refresh or manual refresh trigger inside the palette for admins who expect instant updates after major configuration changes.

## Troubleshooting

- **Empty Palette** – Verify the relevant `search/sources/*.js` module is imported by the layout and `registerSearchSources` is called for the active role.
- **Missing Items** – Check the loader filters (e.g., `MAX_ASSIGNMENT_COURSES`) and ensure backend responses match expected shapes (`id`, `courseId`, etc.).
- **Routing Errors** – Confirm generated `href` values line up with actual App Router routes. The current implementation targets `assignments`, `results`, `rubric`, and `timeslots` pages that already ship with the admin workflow.

With this structure in place, adding Examiner/Student search is a matter of defining their source arrays and wrapping their layouts with the same provider.
