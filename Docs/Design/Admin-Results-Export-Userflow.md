# Admin Results Export – Frontend User Flow

## Purpose

This document describes the course admin experience for exporting released oral-assessment results from OAS. It gives the UI/UX team and frontend engineers shared context for where the new export capability lives, what options are surfaced, and how the flow interacts with existing results-review screens.

## Target Persona

| Persona | Motivation |
| --- | --- |
| **Course Admin** | Needs to download Canvas-compatible CSV files once results are released so they can upload grades back to the LMS or share records offline. |

## Prerequisites & Data Constraints

1. Admin is authenticated and has access to the course + assignment results workflow.
2. Examiner submissions have been reviewed; at least some participants are in `RELEASED` state.
3. Canvas identifiers (`canvas_user_id`, `canvas_group_id`, `SIS ID`, `login_id`) are available for the relevant students/groups; if any identifier is missing, the export flow must surface a non-blocking warning.
4. Feature flag: none. Export is always available when release conditions are met.

## Placement Overview

### Entry Points

1. **Assignment Session List** – `/admin/courses/{courseId}/assignments/{assignmentId}/results`
   - Displays sessions for a single assignment.
   - Provides a secondary action in the page header: `Export CSV` (disabled if no released results exist anywhere in the assignment).

2. **Session Participant Review** – `/admin/courses/{courseId}/assignments/{assignmentId}/results/sessions/{sessionId}`
   - Primary export location.
   - Export button lives in the tools row above the participant list, next to existing filters (status/type/search).
   - Button is enabled only when the current filter context matches at least one released participant.

3. **Participant Detail (Group / Individual)** – `/results/group/{groupId}` and `/results/individual/{studentId}`
   - Optional future enhancement: quick-action menu to export a single row. Current scope focuses on batch export (multiple participants at once).

## Happy Path Flow

1. Admin opens the **Session Participant Review** page.
2. Admin optionally sets filters (release status, participant type, search term).
3. Admin clicks **Export CSV**.
4. A modal appears with:
   - Assignment context summary (course, assignment, session, applied filters).
   - Radio list for `Export format` with three variants:
     1. Individual Results CSV
     2. Group Results CSV
     3. Examiner Results CSV
   - Release guard message: “Only participants whose results have been released will be included.”
   - Optional warning block if filters currently include non-released participants (we auto-adjust to released-only but inform the admin).
5. Admin selects a variant and hits **Download**.
6. Frontend calls the export endpoint with query parameters derived from:
   - `variant`
   - `sessionId`
   - `subjectId`, `assignmentId`
   - Filters (status/type/search) coerced so `releaseStatus=released`
7. Browser initiates file download. Filename pattern: `results-{assignmentNameSlug}-{variant}-{yyyyMMdd}.csv`.
8. Toast notification confirms the export kicked off (`success` or `warning` if file generation failed and backend responded with error message).

## Error & Edge Handling

| Scenario | UX Behaviour |
| --- | --- |
| No participants in released state after filters applied | Export button disabled with tooltip “Export is only available once results are released.” |
| Backend returns 404 / 400 | Modal stays open, show inline error message; admin can retry. |
| Network / timeout | Inline error in modal, allow retry. |
| Canvas identifiers missing | Backend includes warning payload; frontend shows toast “Export succeeded with partial Canvas data. Missing IDs listed in CSV notes.” For MVP we surface warning text in modal before download if backend returns `warnings[]`. |
| Admin cancels | Modal closes, no API call. |

## UI Components & Responsibilities

| Component | Responsibility |
| --- | --- |
| `SessionParticipantsPage` | Hosts export trigger, computes whether export is allowed, passes current filters to modal. `frontend/app/admin/courses/[courseId]/assignments/[assignmentId]/results/sessions/[sessionId]/page.jsx` |
| `AssignmentSessionsPage` | Provides global export entry and summary counts for the assignment. `frontend/app/admin/courses/[courseId]/assignments/[assignmentId]/results/page.jsx` |
| `ExportResultsDialog` *(new)* | Modal with variant selection, context summary, and download CTA. |
| `useExportResults` *(new hook)* | Encapsulates mutation logic, disables button when pending, normalises warnings/errors. |
| `adminResultsService.exportResults` *(new service method)* | Calls backend endpoint with variant & filters, handles blob download. |

## Export Variants – Column Definitions

All CSVs share a leading context section (assignment name, generated-at timestamp) as part of the file header comment if backend supports it; otherwise, context metadata is returned alongside the blob via JSON envelope.

### 1. Individual Results CSV

- Columns (order):
  1. `Student`
  2. `ID` *(Canvas user ID)*
  3. `SIS User ID`
  4. `SIS Login ID`
  5. `Section`
  6. `Student Id` *(internal OAS student ID)*
  7. `{AssignmentName} ({AssignmentId})` *(final released score, 2 decimal places)*

### 2. Group Results CSV

- Columns (order):
  1. `name` *(primary student contact – matches Canvas expectation)*
  2. `canvas_user_id`
  3. `SIS ID`
  4. `login_id`
  5. `Section`
  6. `group_name`
  7. `canvas_group_id`
  8. `{AssignmentName} ({AssignmentId})`

### 3. Examiner Results CSV

- Extends Group CSV columns with examiner & session metadata:
  1. `examiner_name`
  2. `examiner_username`
  3. `exam_date` *(formatted e.g., “Monday 20-10-2025” based on session timezone)*
  4. `exam_time_slot` *(“HH:MM – HH:MM” 24h)
  5. `exam_venue`
  6. `{AssignmentName} ({AssignmentId})`

> **Note:** For mixed assessments, if a group row contains individual member overrides, backend should average final released scores consistently with what students see. Examiner CSV should repeat the final released score (not examiner-specific totals) to avoid Canvas conflicts.

## Analytics & Logging

- Frontend fires an event `results_export_initiated` with properties: `{subjectId, assignmentId, sessionId?, variant, filterStatus, filterType}`.
- On success, log `results_export_completed` with the same properties.
- On failure, log `results_export_failed` with `errorCode` from backend.

## Future Enhancements

1. Single-row export from participant detail page.
2. Bulk export for the entire assignment directly from the session list view (aggregates all sessions).
3. Allow admin to choose alternate column naming or include multiple assignment columns.
4. Surface audit trail entry when an export is generated.

