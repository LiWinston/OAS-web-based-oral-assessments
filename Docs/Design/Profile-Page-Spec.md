# Profile Page Specification

## 1. Full Context

### 1.1 Project Background
The Oral Assessment System (OAS) simplifies university oral exam workflows by centralising scheduling, execution, and results. The Profile page is not mission-critical but reinforces the product's promise of clarity, efficiency, and trust. A polished profile experience strengthens confidence in platform data, reduces support requests, and encourages role adoption.

### 1.2 Target Users
The profile page is role-aware and must serve all authenticated users:
- **Students**: Need quick access to upcoming bookings, results, and notification settings.
- **Examiners**: Expect visibility into their schedule, marking tasks, and preferences.
- **Course Admins**: Monitor managed courses, respond to pending actions, and manage institutional info.
- **Super Admins**: Oversee approval responsibilities and system status.

### 1.3 Key Goals and Value
- **Clarity**: Provide a cohesive summary of personal information, role responsibilities, and next actions.
- **Trust**: Communicate data accuracy, security, and brand quality.
- **Efficiency**: Streamline account management (details, preferences, security) to reduce support overhead.

## 2. Functional Requirements

### 2.1 Common Core (All Roles)
- View personal information (name, email, avatar placeholder, phone, timezone, language).
- Edit allowed fields with inline validation and optimistic save feedback.
- Configure notification preferences (email, desktop, domain-specific toggles matching backend capabilities).
- Access security controls: change password, view device/last-login summary (placeholder if device tracking not yet built).
- Display profile completeness indicator (computed from presence of phone, timezone, preferences, etc.).
- Show audit metadata: last updated timestamp per card when data is available.

### 2.2 Role-Specific Panels & Data Contracts
- **Students** (`widgets[].key = student.nextSession|student.recentSessions`):
  - Upcoming booking summary with session id, assignment name, start/end, venue.
  - Recent bookings list (max 3) for quick access to results/rescheduling.
  - Quick actions: `Manage Booking`, `View Results`.
- **Examiners** (`widgets[].key = examiner.nextSession|examiner.recentSessions`):
  - Next assigned session with date, venue, assignment metadata.
  - Recent sessions (max 3) for follow-up marking/notes.
  - Availability reminder chip if they have unfulfilled quotas (derived from payload counts – frontend responsibility).
- **Course Admins** (`widgets[].key = admin.managedCourses|admin.pendingTasks`):
  - Managed courses table: subject code/name, status, assignment counts, unstaffed session totals.
  - Pending tasks KPI trio: unstaffed sessions, open sessions without bookings, assignments awaiting publication.
  - Canvas export reminder if outstanding (surface when `assignmentsPending > 0`).
- **Super Admins** (`widgets[].key = superadmin.pendingApprovals|superadmin.systemMetrics`):
  - Pending admin approvals count with quick action.
  - System snapshot metrics: active courses, new users in last 7 days, total users.
  - Quick link to governance documentation.

### 2.3 Accessibility & Compliance
- Keyboard navigable; focus order matches visual hierarchy.
- Screen-reader labels for toggles, avatars, metrics.
- WCAG 2.1 AA color contrast.
- Provide text alternatives for icon-only buttons.

## 3. Non-Functional Requirements
- **Performance**: Render within 1s on broadband using cached profile endpoint; progressively load role widgets (React Query suspense).
- **Security**: All changes require valid JWT; password change handled via `/api/auth/change-password` with policy enforcement and token revocation.
- **Reliability**: Optimistic UI with rollback on error; display toast notifications for success/failure using global system.
- **Scalability**: Components modular for reuse across roles; data fetched via shared profile service.
- **Brand Consistency**: Align typography (Inter), color tokens, and spacing with existing design system.
- **Internationalisation**: Prepare for multi-language (copy in translation keys, date/time formatted via locale-aware utilities).

## 4. Detailed Design Recommendations

### 4.1 Page Layout
- Responsive grid: two-column layout on desktop (8/4 split), stacked on mobile.
- Sticky header with user avatar, role badge, and profile completeness pill.
- Section cards with consistent padding, drop-shadow, rounded corners (Tailwind classes `shadow-lg` and `rounded-xl`).
- Use accordions/tabs for dense settings to avoid scrolling fatigue.

### 4.2 Components
- **ProfileHeader**
  - Avatar (initials fallback, future-ready for upload) with gradient ring.
  - Name, role badge, university affiliation.
  - Profile completeness meter with tooltip explaining missing items.
  - Primary action button contextual to role (e.g., `Manage Booking`, `Review Approvals`).

- **InfoCard** (Personal/Institutional)
  - Editable fields with inline labels and helper text.
  - `Edit` toggles switch to form mode; persist on `Save`, revert on `Cancel`.
  - Form states: loading spinner during save, success toast, error inline message.

- **NotificationPreferences**
  - Group toggles by channel (Email/Desktop) and domain (Bookings, Results, Examiner Updates).
  - Provide description text for each toggle to clarify impact.
  - Persist via `/profile/preferences`; show unsaved changes indicator.

- **SecuritySection**
  - Change password form with strength meter, password requirements tooltip (reflect backend policy: ≥8 chars, alphanumeric mix).
  - Display last password update date.
  - Placeholder list for active sessions/devices (future enhancement message if not implemented).

- **RoleWidgets**
  - Render widget cards based on `widgets[]` list. Each widget supplies `key`, `title`, `description`, `payload` for frontend-specific rendering (timeline list, KPI grid, etc.).
  - Students: `UpcomingSessionCard`, `BookingHistoryList` consume session payload fields (`assignmentName`, `startAt`, `venue`).
  - Examiners: `NextSessionCard`, `RecentSessionList` with countdown/badges.
  - Admins: `ManagedCoursesGrid`, `PendingTasksList` displaying courses and KPI summary.
  - Super Admins: `ApprovalQueueWidget` (counts) and `SystemMetricsCard` (stat tiles).

### 4.3 User Flows
- **Edit Personal Info**
  1. User clicks `Edit` in Personal Information card.
  2. Fields become editable; form validates on blur (email format, phone pattern, required fields).
  3. On `Save`, optimistic UI updates, call `profileService.updateProfile`.
  4. Success: toast `Profile updated successfully`; last updated timestamp refreshes.
  5. Failure: revert to previous state, show toast `Update failed` with retry option.

- **Change Password**
  1. User enters current and new password, confirm matches.
  2. Strength meter updates (weak/fair/strong). Enforce minimum 8 chars with alphanumeric policy messaging.
  3. Submit triggers loading state; on success, show toast and clear inputs; on failure, highlight error (invalid current password, weak password, same as old).

- **Update Preferences**
  1. Toggle changes mark section as `Unsaved changes`.
  2. `Save Preferences` button enabled when dirty.
  3. On save, request to `/profile/preferences`; handle success/failure with toasts.

- **Role Widgets Actions**
  - Each CTA button links to existing route (e.g., `/student/booking`, `/examiner/schedule`).
  - Provide skeleton loaders while fetching data; empty state messages if no data.

### 4.4 Data & State Handling
- Use React Query to fetch `/profile/me`; response includes `user`, `preferences`, `widgets`.
- Use Zustand `authStore` to sync updated user details for global header.
- Centralise form state in local component state with diff detection for enabling save actions.
- Format `startAt`/`endAt` using timezone from preferences; handle null payload gracefully.

### 4.5 Visual & Interaction Details
- Color palette: Base on existing theme (`bg-slate-900` for dark mode, `bg-white` for light).
- Spacing: 24px outer padding, 16px internal card spacing.
- Icons: Lucide icons (e.g., `CalendarClock`, `ShieldCheck`, `BellRing`).
- Animations: Subtle `transition-all` on hover for cards, `animate-pulse` for skeletons.
- Dark mode: Ensure cards flip background to `bg-slate-800`, text to `text-slate-100`.

## 5. Dependencies & Assumptions
- Backend endpoints `/profile/me`, `/profile`, `/profile/preferences`, `/auth/change-password` implemented and live.
- Role-specific widget data exposed via `ProfileWidgetService` (see Implementation Plan for query details).
- Design system tokens (colors, typography) accessible via Tailwind config.
- Global notification/toast system already implemented; can be reused.

## 6. Open Questions
- Will profile pictures be uploadable in future? If yes, plan for upload component stub.
- Determine availability of last login/device data for security section.
- Clarify SLA for widget data freshness (polling vs on-demand refresh) once real-time requirements are known.
- Confirm if group bookings should surface distinct widgets when backend support lands.
