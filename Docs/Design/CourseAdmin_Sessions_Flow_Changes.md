# Sessions-Only Scheduling — Flow Changes (Proposal)

This document updates the flows defined in `Docs/Design/CourseAdmin_Timeslot-Schedule-Management-Flow.md` for a sessions-only model. It does not modify the original; it describes what needs to change.

## Overview of Changes
- Remove the TimeSlot concept in admin flows; sessions are the only scheduling unit.
- Examiners are assigned directly to sessions (not to time slots).
- Remove the "Session Configuration" step; introduce batch session generation in the wizard.
- Add batch operations on the Sessions page: delete sessions and allocate examiners to selected sessions.
- In the wizard (Schedule page), support selecting multiple draft sessions and deleting them locally (no backend call) before saving.

## Updated Course Administrator Flows

### Wizard: Session Setup

Step 1: Batch Create Sessions (replaces Session Configuration)
- Goal: Quickly produce one or more contiguous sessions for a date and venue.
- Inputs:
  - `date` (required)
  - `startTime` (required)
  - `count` (required)
  - `length` (minutes, required)
  - `gapTime` (minutes, required; can be 0)
  - `venueId` (required)
  - `requiredExaminers` (per session, required)
  - `capacity` (student groups per session, required)
- Actions:
  - Generate sessions → append to a draft list for the day.
  - Repeat as needed for other times/venues/dates.
  - Edit draft items inline (start/end time, venue, capacity, required examiners).
  - Local delete: select one or more draft sessions and remove them (no backend call).
- Validation:
  - No overlaps within the same venue among draft sessions.
  - End time = start time + length per session (gap applies between generated items).
  - Values must be within allowed ranges (length/gap bounds as previously defined).
- Save/Continue:
  - On Continue/Done, persist via API:
    - Either: `POST /sessions/generate` with the current generator parameters, OR
    - `POST /sessions/batch` with the draft sessions materialized.

Step 2: Examiner Session Limits (unchanged in intent)
- Set maximum sessions per examiner at the assignment level.
- Re-validate total capacity across all created sessions.

### Sessions Management Page (formerly Time Slot Management)

Calendar Panel (left)
- Dots and counts reflect session state by date (no time slots).
- Status derives from session-level examiner coverage versus `requiredExaminers`.

Sessions List (right)
- Card fields:
  - Time (start–end), venue, `requiredExaminers`, assigned examiners count, capacity and booked count.
  - Status: fully staffed/partial/unstaffed based on session-level coverage.
- Per-session actions:
  - Edit session
  - Delete session
  - Assign/Remove examiners
- Bulk actions (selection enabled):
  - Delete selected sessions (backend: `DELETE /sessions`)
  - Allocate selected examiners to selected sessions (backend: `PUT /sessions/examiners` with `action: add`)

### Schedule Release and Validation (adjusted)
- Validation operates at session level:
  - Examiner coverage per session ≥ `requiredExaminers`.
  - Venue conflict checks at session granularity.
  - Capacity: sessions expose `remainingCapacity` for visibility to students.
- Two release actions using one endpoint `POST /api/admin/assignments/{assignmentId}/schedule/release`:
  - Release to Examiners (after completing the Schedule wizard): sends schedule to examiners.
  - Release to Students (from the Sessions page): only allowed when all sessions are fully staffed (each session meets required examiner count).

## Examiner Self-Assignment (Conceptual Updates)
- Examiner-facing selection shows sessions needing examiners (not time slots).
- Actions:
  - Assign self to a session (subject to conflicts and max limits).
  - Withdraw from a session before cutoff.
- List/Calendar views show session granularity.

## Student Booking (Capacity)
- Students (or groups) book against sessions.
- Default `capacity` is 1; when `capacity > 1`, multiple groups can book the same session concurrently. UI displays `bookedCount/capacity` and remaining capacity.
- Booking UI and rules remain the same with capacity-aware availability.

## UI Copy and Components to Update
- Rename components/pages from "TimeSlots" to "Sessions" in labels and headings.
- Update pills and summaries to report session counts and staffing state.
- Wizard step names:
  - Step 1: "Batch Create Sessions"
  - Step 2: "Examiner Session Limits"

## Backend Integration Summary (tie-in)
- Use new admin endpoints from `Docs/API/CourseAdmin_Sessions_API_Changes.md`.
- Remove use of `/session-config` and all `/timeslots*` calls in the admin UI.
- Add batch examiner allocation call for selected sessions in the management page.
- Use a single release endpoint `/api/admin/assignments/{assignmentId}/schedule/release` with an `audience` parameter (`examiners` | `students`).
- Enforce precondition for student release: every session is fully staffed.

## Decisions (confirmed)
1. Capacity: default 1; if `capacity > 1`, sessions support concurrent group bookings and show `bookedCount/capacity`.
2. Bulk assign behavior: all-or-nothing — any conflict aborts the operation with an error; no partial application.
3. Migration: no existing data; proceed directly with sessions-only model and updated endpoints.
