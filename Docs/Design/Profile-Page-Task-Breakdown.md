# Profile Page Task Breakdown & Mini-Prompts

## Backend

### ✓ Task 1: Implement profile endpoints (Delivered)
- **Notes**: `/api/profile/me`, `/profile`, `/profile/preferences` live with completeness logic and preference persistence. Follow-up: add integration tests + audit logging.
- **Mini-Prompt (verification/tests)**: “Write integration tests covering profile GET/PUT flows, including completeness recalculation and preference updates.”

### ✓ Task 2: Password change endpoint (Delivered)
- **Notes**: `/api/auth/change-password` enforces strength policy, rejects reused passwords, revokes refresh tokens.
- **Mini-Prompt (tests)**: “Cover change-password error states (invalid current, weak password, same-as-old) and ensure tokens are revoked.”

### ✓ Task 3: Role widget data services (Delivered)
- **Notes**: `ProfileWidgetService` + SQL projections supply student/examiner sessions, admin course/task KPIs, super-admin metrics.
- **Mini-Prompt (follow-up)**: “Add mapper/service tests for widget queries and extend coverage for group bookings/mixed assignments.”

### ✓ Task 4: Data model adjustments (Delivered)
- **Notes**: `user_profile`, `user_notification_preferences` tables seeded; DTOs/mappers in place.
- **Mini-Prompt (migration docs)**: “Document schema changes for deployment pipelines and ensure migration/rollback steps are captured.”

## Frontend

### Task 5: Shared profile component library
- **Description**: Create shared components (`ProfileHeader`, `ProfileInfoCard`, `NotificationPreferencesCard`, `SecurityCard`, `RoleWidgetGrid`) under `components/profile/`.
- **Mini-Prompt**: “Build the reusable profile components specified in the spec. Ensure accessibility, dark mode support, and integrate with Shadcn primitives.”

### Task 6: Role widget implementations
- **Description**: Implement widgets keyed by backend payload (`student.nextSession`, `student.recentSessions`, `examiner.*`, `admin.managedCourses`, `admin.pendingTasks`, `superadmin.*`).
- **Mini-Prompt**: “Map each role widget key to a dedicated component, render payload data (session timelines, KPI tiles), handle empty/skeleton states, and wire deep links.”

### Task 7: State & service layer updates
- **Description**: Extend `profileService`, React Query hooks, and Zustand integration for live profile updates and query invalidation.
- **Mini-Prompt**: “Update the profile API client to return `widgets[]`, implement optimistic mutations, invalidate `['profile','me']` on save, and surface toasts for success/error.”

### Task 8: Routing & feature flag rollout
- **Description**: Refactor per-role profile routes to use new shared components, add `profile_page_v2` feature flag, maintain fallback.
- **Mini-Prompt**: “Refactor `/student|examiner|admin|superadmin/profile` to load the shared profile experience behind `profile_page_v2`, preserving legacy view for rollback.”

## UI/UX Design

### Task 9: Figma mockups & component specs
- **Description**: Produce detailed Figma frames (light/dark, responsive) with widget key annotations.
- **Mini-Prompt**: “Create Figma mockups for Profile Page v2 covering desktop/tablet/mobile, documenting widget key→component mapping and interaction states.”

### Task 10: Asset preparation
- **Description**: Export icon assets, placeholder illustrations, and theme tokens, deliver via shared repository.
- **Mini-Prompt**: “Prepare export assets (SVG icons, PNG placeholders, design tokens JSON) for dev handoff; keep naming consistent with the UI design doc.”

## QA & Documentation

### Task 11: Automated test coverage
- **Description**: Author backend integration tests and frontend RTL/Cypress coverage for profile journeys and widgets.
- **Mini-Prompt**: “Add automated tests covering profile endpoints, change-password flows, and front-end widget rendering (student/examiner/admin/super-admin).”

### Task 12: Release checklist & docs
- **Description**: Update README/CHANGELOG, draft rollout checklist, coordinate feature flag removal plan.
- **Mini-Prompt**: “Document the Profile Page v2 rollout: update README, write a release checklist, and outline steps for enabling/disabling the feature flag post-QA.”
