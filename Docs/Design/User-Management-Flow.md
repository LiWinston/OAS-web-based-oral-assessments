# OAS User Management — Centralized Flow and Frontend Plan

This document specifies the centralized User Management experience for Course Administrators, reachable from the always-visible sidebar entry at `/admin/users`. It defines the end-to-end frontend flow for managing Students and Examiners within a selected Course → Assignment scope, consistent with the project requirement that CSV import occurs at the assignment level.

Scope for this iteration: Manual Add and Remove only (no deactivate/reactivate). Removing a user from an assignment also cancels their bookings (students) or clears their assigned time slots (examiners).

API alignment update
- Endpoints align with the backend assignment‑centric design:
  - List/Add: `GET|POST /api/assignments/{assignmentId}/members` (query: `role`, `q`, `pageNum`, `pageSize`)
  - Remove: `DELETE /api/assignments/{assignmentId}/members/{assignmentUserId}`
  - Standard response wrapper `{ success, code, data }` with list payload `{ pageNum, pageSize, total, data: [...] }`.

## 1) Goals and Scope

- Centralize user management at `/admin/users` with quick Course → Assignment scoping.
- Support manual Add and Remove for Students and Examiners within the selected assignment.
- Keep cross-assignment actions out of scope (no move/copy between assignments).
- Surface CSV import from this centralized screen but do not redesign CSV behavior.

Out of scope in this iteration

- Deactivate/Reactivate status toggles.
- Cross-assignment operations.
- Advanced auditing/analytics (beyond success toasts and basic summaries).

## 2) High-level Flow

1. Course Admin opens sidebar → Users (`/admin/users`).
2. Select Course, then Assignment (stored as current context). Persist last-used context in local storage.
3. Manage users for the assignment via two tabs: Students | Examiners.
4. Actions available:
   - Add user (single): add Student/Examiner by email, with optional name/IDs and optional group if the assignment requires it.
   - Remove user (single or bulk): removes the user(s) from the assignment. Backend must cancel any future bookings (students) and clear examiner time slots as part of removal.

## 3) Information Architecture and Navigation

- Entry: `/admin/users` (always visible in Admin sidebar).
- URL params: `?courseId=<id>&assignmentId=<id>&role=STUDENT|EXAMINER&search=<q>` (frontend state only; API does not require `courseId` for assignment‑scoped endpoints).
- Two-pane layout (recommended):
  - Left pane: Scope selector (Courses → Assignments, searchable).
  - Right pane: User Management for the selected assignment.
- Deep links: Other pages (e.g., assignment config) can link into `/admin/users?courseId=..&assignmentId=..` to open in-context.
- Persistence: Last `{courseId, assignmentId}` are remembered locally and restored on next visit.

## 4) Screen Details

### 4.1 Landing (no scope selected)

- Course selector: search + list using `courseService.getCourses()`.
- After selecting a course: assignment selector using `assignmentService.getAssignments(courseId)`.
- Recent contexts: quick-access chips for last few assignments.
- Empty state: prompts admin to select Course → Assignment.

### 4.2 Users Center (scope selected)

- Header: "User Management" with breadcrumb `OAS → Users → [Course] → [Assignment]` and a "Switch scope" action.
- Scope bar: Course and Assignment dropdowns, last CSV import info, and a button to "Upload CSV" (uses existing assignment CSV upload endpoint).
- Tabs: Students | Examiners (with counts).
- Toolbar: search box (name/email), bulk-select, and action buttons: "Add User", "Remove" (enabled when rows selected), "Upload CSV".
- Table columns (both tabs):
  - Name, Email, Role (implicit by tab), Group (if applicable), Bookings/Assignments (counts), Added On.
  - Row actions: Remove (single), View details (read-only modal with fields we don’t allow editing at assignment level).
- Empty state:
  - Students tab: "No students yet" with CTAs to Add User or Upload CSV.
  - Examiners tab: similar messaging.

## 5) Supported Actions

### 5.1 Add User (manual)

- Trigger: "Add User" button opens modal.
- Fields:
  - Role: Student | Examiner (default to current tab).
  - Email: required, validated format.
  - Full name: optional (or required per policy — frontend optional, backend may enforce).
  - Student ID / Staff ID: optional input, displayed according to role.
  - Group (optional): shown only when assignment type requires grouping.
- Behavior:
  - On submit, call `POST /courses/{courseId}/assignments/{assignmentId}/users`.
  - If email exists system-wide, backend links existing user to this assignment (no duplicate). If new, backend creates user and (optionally) sends an invite/notification.
  - Frontend shows success toast and refreshes list.

Dependency (backend):

- Idempotent add by email for the same assignment should either be a no-op or return a clear conflict with a helpful message.

### 5.2 Remove User (manual)

- Trigger: row action (single) or bulk via selection + "Remove" button.
- Confirmation dialog explains:
  - Students: their future bookings for this assignment will be cancelled.
  - Examiners: their assigned time slots for this assignment will be cleared.
- Behavior:
  - On confirm, call `DELETE /assignments/{assignmentId}/users/{assignmentUserId}` for each selected row.
  - Backend must perform cascaded cancellation/unassignment and return a summary per removal.
  - Frontend shows aggregated success summary (e.g., "Removed 3 users. Canceled 2 bookings; unassigned 5 examiner slots").

Dependencies (backend):

- Removal endpoint must cascade to:
  - Cancel future student bookings for this assignment.
  - Unassign examiner from any scheduled slots for this assignment.
  - Return counts for UI summaries: `{ canceledBookings, clearedExaminerSlots }`.
- If removal is blocked (e.g., submitted marks exist and policy disallows removal), return a typed error; frontend will show the message and skip that row.

## 6) States and Error Handling

- Loading: skeleton for table and selectors.
- Empty: as above.
- Errors:
  - Add: duplicate/invalid email → inline message; unexpected → toast.
  - Remove: partial success summary if some rows fail.
  - Scope: if selected course has no assignments → CTA to "Open Assignments" page.
- Optimistic UI: avoid for destructive actions; wait for server confirmation.

## 7) Security and Access

- Route guarded to `COURSE_ADMIN` via middleware, consistent with existing auth.
- All actions are assignment-scoped; email identity is immutable in this screen.
- Audit trail left to backend; frontend displays success toasts and optional mini-summaries.

## 8) Frontend Implementation Plan (Summary)

Routes and entry

- Add `app/admin/users/page.jsx` (central entry). Use search params for `courseId` and `assignmentId`.

Components (new under `components/admin/users/`)

- `ScopeSelector.jsx`: Courses → Assignments picker (can be left pane) with search.
- `UsersToolbar.jsx`: Context info, search, bulk actions, and entry points.
- `UsersTable.jsx`: Virtualized or standard table with selection and row actions.
- `AddUserModal.jsx`: Form for Student/Examiner addition.
- `ConfirmDialog.jsx`: Confirmation for removals.
- `UsersEmptyState.jsx`: Empty views per tab.

Services (frontend)

- `userService.js` (new): list/add/remove assignment users with `USE_MOCK_API` support.

State/Data

- React Query for list and mutations. Cache key: `[assignmentUsers, courseId, assignmentId, role, search]`.
- Local storage: last `{courseId, assignmentId}`.

## 9) URLs and Link Patterns

- Primary: `/admin/users?courseId=1&assignmentId=2&role=STUDENT`.
- Deep link from assignment config: `/admin/users?courseId=<id>&assignmentId=<id>`.
- CSV import remains in assignment context (same APIs as configuration page); this screen surfaces the action for convenience.

## 10) Edge Cases

- Email already in assignment: show friendly message, no duplicate rows.
- Removing user with finalized marks (if backend forbids): show clear error and skip.
- Mixed assignments with groups: show Group column; block removal of last member of a required group if backend policy forbids; otherwise rely on backend for validation.

## 11) QA Checklist

- Add user success for both new and existing email addresses.
- Remove user success with cascaded cancellations/unassignments reported.
- Bulk remove mixed success shows correct partial summary.
- Scope persistence restored on page revisit.
- Role tab switch preserves search and selection state sensibly.
