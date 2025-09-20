# Profile Page Implementation Plan

## 1. Objectives
Translate the Profile Page specification into actionable engineering work across backend and frontend teams, ensuring a consistent, performant, and role-aware experience that amplifies user trust and efficiency.

## 2. Backend Workstream

### 2.1 API Surface _(Status: implemented)_
- **GET `/api/profile/me`** → returns core user profile, preferences, profile completeness, primary role, and role widget payloads (`widgets[]`).
- **PUT `/api/profile`** → partial updates for personal details with validation and completeness recalculation.
- **PUT `/api/profile/preferences`** → persists notification toggles plus timezone/language, keeping audit timestamps in sync.
- **POST `/api/auth/change-password`** → verifies current password, enforces strength policy, rotates tokens via `RefreshTokenMapper`.
- **Role widget aggregation** now sourced via `ProfileWidgetService` using SQL projections:
  - Students: next upcoming session + recent sessions (3) derived from `session_student`/`slot_sessions` joins.
  - Examiners: next assignment and latest sessions from `session_examiners`.
  - Course Admins: managed course summaries + staffing/booking counters.
  - Super Admins: pending approvals and system metrics (active courses, user counts).

### 2.2 Data Model Updates _(Status: implemented)_
- New tables `user_profile`, `user_notification_preferences` with schema + seed data in `oas_log.sql` and `test_data.sql`.
- Entities/mappers created (`UserProfile`, `UserNotificationPreferences`, `ProfileWidgetMapper`).
- DTOs for responses/payloads (`ProfileResponse`, `SessionSummaryDto`, `AdminCourseSummary`, `AdminTaskSummary`, `SuperAdminMetricsSummary`).

### 2.3 Business Logic & Validation _(Status: implemented)_
- `ProfileServiceImpl` handles completeness scoring, timezone/language defaults, optimistic updates, and role resolution.
- Backend password policy centralised in `PasswordPolicyUtils`; change password revokes refresh tokens.
- Notification preference updates honour partial payloads and track `updated_at`.

### 2.4 Security & Observability _(In progress)_
- Role-based guards enforced via controller annotations. Remaining todo: add structured audit logging + metrics counters.

### 2.5 Remaining Backend TODOs
- Add integration/unit tests for new mappers (`ProfileWidgetMapper`) and profile service flows.
- Extend widget aggregation for group bookings and mixed assignments where applicable.
- Capture audit events / metrics once observability stack ready.

## 3. Frontend Workstream (updated post-backend delivery)

### 3.1 Routing & Layout
- Maintain per-role routes (`/student|examiner|admin|superadmin/profile`) but consume shared `ProfilePage` component that reads `widgets[]` from API.
- Header must display profile completeness + CTA derived from widget context (e.g., link to `sessions`, `tasks`).

### 3.2 Components
- `RoleWidgetGrid` should accept normalized widget objects with `{ key, title, description, payload }`:
  - `student.nextSession`/`student.recentSessions` expect session metadata list with `startAt`, `venue`, etc.
  - `examiner.*` similar shape; include countdown/pills.
  - `admin.managedCourses` → table/card summarising courses (fields: `subjectCode`, `assignmentCount`, `unstaffedSessions`).
  - `admin.pendingTasks` → KPI tiles for `unstaffedSessions`, `openSessions`, `assignmentsPending`.
  - `superadmin.*` → metric badges / stat cards.
- Build dedicated widget components to map payloads to visuals (timeline list, KPI grid, etc.).

### 3.3 State & Data Layer
- `profileService.getProfile` must expose widgets alongside user/preferences.
- Implement optimistic update flows for profile + preferences; on change-password call POST `/api/auth/change-password` with toast handling.
- Invalidate React Query keys (`['profile','me']`) after mutations so widgets refresh with new data.

### 3.4 UX Behaviours
- Show skeleton placeholders for each widget card while loading.
- For empty widget payloads, render friendly empty states using description strings supplied by backend.
- CTA buttons should deep-link to existing routes (e.g., `/student/booking`, `/examiner/schedule`, `/admin/courses`).

### 3.5 Accessibility & Internationalisation
- Ensure widget lists are keyboard navigable; provide ARIA labels for KPI counts (“2 unstaffed sessions”).
- Format `startAt` timestamps using locale utilities (respect timezone coming from preferences).

## 4. Integration & Deployment
- Feature-flag (`profile_page_v2`) remains; on fallback use legacy pages without new widgets.
- Update API client typings/interfaces to reflect new schema (including widget DTOs).
- Document new backend endpoints in `frontend/README.md` once UI consumes them.

## 5. Testing Strategy
- **Backend (remaining)**: write mapper/service tests covering new widget queries and password change edge cases.
- **Frontend**: add Jest/RTL tests per widget component; Cypress scenarios verifying student/examiner/admin flows with mocked API responses showing widgets.
- **Accessibility**: run axe-core on each role profile page once widgets integrated.

## 6. Dependencies & Risks
- Widget queries rely on current schema; any future changes to booking/session tables require coordinated updates.
- Group session data support pending; ensure UI gracefully degrades until backend extended.
- High cardinality metrics might need caching later; monitor performance during load tests.

## 7. Timeline Sketch
- Backend polishing/tests: remainder of current sprint.
- Frontend implementation & QA: next sprint, factoring in widget UX build + feature flag rollout.
- Integrated testing & launch: post-frontend QA with telemetry enabled.
