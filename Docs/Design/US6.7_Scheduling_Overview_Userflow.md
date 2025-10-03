# US 6.7 – Scheduling Overview Report (Course Admin) — User Flow (Interactive, Read‑Only)

Version: 1.0 • Status: Aligned with sessions‑only frontend (Sep 2025) • Scope: Display data only

This document defines the interactive, read‑only user flow for the Scheduling Overview report. The page allows admins to browse and understand staffing and bookings without performing any write actions. The model is sessions‑only (no timeslots).

## Goals & Constraints
- Display‑only: No publish toggles, no examiner assignment, no create/edit/delete.
- Interactive browsing: Calendar selection, filters, sorting, grouping, row expansion, and CSV export of the current view.
- Sessions‑only: All counts and lists are session‑based; no timeslot entity is introduced.
- Timezone: Always render in Australia/Melbourne.

## Information Architecture
- Month Calendar (top)
  - Per‑day aggregates: fullyStaffed, partialStaffed, noStaffed.
  - Clicking a date filters the list below to that specific date.
- Session List (bottom)
  - One row per session. Recommended columns: Date, Start/End, Venue, Required Examiners, Assigned Examiners (names or count), Booked/Capacity, Remaining Capacity, Publish (Examiner/Student badges), Status.
  - Read‑only filters shown as UI controls: Date (from calendar), Venue, Staffing Status (fully/partial/none). No server writes.

## Interactions (Read‑Only)
- Calendar navigation: Previous/next month; select a day to filter the list.
- List sorting: By Start Time (default), Venue, Staffing Status, Booked/Capacity.
- Filters: Venue dropdown, Staffing Status chips; optional text search (client‑side) over Venue and Examiner names.
- Grouping (optional): Toggle “Group by venue” to cluster rows; expands/collapses groups client‑side.
- Row details: Expand to view assigned examiner names and any enrolled groups/students (if provided by API).
- Column visibility: Toggle columns for dense vs compact view (client‑side only).
- Refresh: Manual refresh icon re‑fetches the current date’s list.
- Export CSV: Button exports the current view (respects date, filters, sorts, and visible columns). See CSV section.

## Displayed Data & Derived Fields
- Staffing status (derived):
  - fully = `assignedExaminers.length === requiredExaminers`
  - partial = `assignedExaminers.length > 0 && < requiredExaminers`
  - none = `assignedExaminers.length === 0`
- Booking ratio: Display `bookedCount / capacity`; Remaining = `remainingCapacity`.
- Publish flags: Show `publishedToExaminer` and `publishedToStudent` as badges; no toggles.
- Outside assignment window: If server indicates `outsideAssignmentRange=true`, render an inline notice and show an empty list state.

## States & Accessibility
- Loading: Skeleton rows and subtle “Updating” badge on calendar header.
- Empty: Clear message when no sessions exist for the selected date.
- Error: Friendly message with retry option; never leaves the UI in a broken state.
- Keyboard/ARIA: Calendar cells are focusable and announce date and staffing summary; controls have labels; row expanders are keyboard operable.

## Performance Notes
- Query per selected date keeps payloads small; list rendering is straightforward without virtualisation in typical scales.
- All interactivity (filters, grouping, CSV) is client‑side; no impact on server beyond GET requests.

## CSV Export (Read‑Only)
- Source: Generated on the client from the current list response; no extra backend endpoint required.
- Scope: Exports the current view (date/filters/sort/visible columns).
- Encoding: UTF‑8, comma‑separated, header row included.
- Suggested columns: `assignmentId, sessionId, date, startTime, endTime, venueName, requiredExaminers, assignedExaminerNames, bookedCount, capacity, remainingCapacity, publishedToExaminer, publishedToStudent, staffingStatus`.
- Timezone: All times rendered/serialized as Australia/Melbourne. If backend provides ISO timestamps, format to `HH:mm` for CSV.

## Frontend Alignment
- Calendar component: `frontend/components/admin/schedule/CalendarMonth.jsx` (uses `GET /api/admin/sessions/assignments/{assignmentId}/calendar`).
- List data: `courseAdminSessionService.getSessions(assignmentId, { date })` (calls `GET /api/admin/sessions/assignments/{assignmentId}/sessions`).
- Publish status (display‑only, optional): `getAssignmentPublishStatus` (no toggle).

## Out of Scope (Intentionally Excluded)
- Any publish toggles, examiner assignment or removal, batch actions.
- Create/edit/delete sessions.
- Student visibility logic and readiness checks.
