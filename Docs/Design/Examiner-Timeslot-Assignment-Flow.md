## Sessions-Only Minimal Update (Examiner)

This addendum makes the smallest possible changes to shift from TimeSlot to Session:

- Selection list: show sessions (not timeslots) for the chosen date. Each selected session counts as 1 toward the examiner’s max sessions.
- Fully staffed sessions are not selectable (no over‑cover); show reason.
- Conflict detection moves to session granularity (time overlap across assigned and newly selected sessions).
- Submit remains a single bulk action. Backend validates: membership → overlap → max sessions → session coverage. Atomic all‑or‑nothing.
- Withdrawal: no time‑based cutoff needed. Keep existing “blocked if students booked” if currently enforced.
- UI layout remains Calendar + List. Only item labeling changes from “timeslot” to “session”.

All other steps and UX patterns remain the same.

Backend changes summary for this flow
- Replace Timeslot with Session in examiner-facing APIs.
- Fully staffed sessions are disabled for self-assignment (no over-cover).
- Bulk submit uses `POST /api/assignments/{assignmentId}/sessions/assign?examinerId=...` with `{ sessionIds: [...] }`.
- Withdraw uses `DELETE /api/assignments/{assignmentId}/sessions/{sessionId}/unassign?examinerId=...`.
- List uses `GET /api/assignments/{assignmentId}/sessions?examinerId=...&date=YYYY-MM-DD&status=available|all`.

UI data requirements per session row
- `sessionId`, `start`, `end`, `venue.name`
- `coverage.assigned`, `coverage.required` → derive fully staffed state
- Optional: `studentCapacity.bookedCount` and `studentCapacity.capacity` for context
- `availability.canSelect` and `availability.reason` for disabled states

---

## Examiner Timeslot Assignment — End-to-End Flow (MVP)

This document details the examiner self‑assignment flow for MVP, aligned with the PRD and frontend architecture. It mirrors the structure and fidelity of other design docs while staying focused on what’s necessary for this flow.

### 1) Goals and Scope
- Allow examiners to discover assignments that need coverage, self‑assign to non‑overlapping timeslots up to a configured maximum, and manage their schedule.
- Keep the system consistent with PRD: students only see slots when fully staffed; server is the source of truth; MVP avoids real‑time infrastructure.

### 2) Scope & Principles
- Backend authority: Eligibility, limits, capacity, overlap, and deadlines are enforced server‑side; UI mirrors rules for instant feedback.
- Max sessions only (MVP): No minimum selection requirement.
- Visibility rule: Students can see/book only slots with required examiners assigned.
- Freshness: Polling every 30s on selection pages (no websockets in MVP).

### 3) Key Concepts
- Timeslot: Admin‑defined block with date/time and venue, containing `sessionCount` (e.g., 60 minutes containing four 15‑minute sessions).
- Session: Unit for examiner max counting. Total selected/assigned sessions = sum of `sessionCount` across chosen slots.
- Required examiners: Minimum number per slot for it to be available to students.

### 4) User Journey
4.1 Discover assignments to help
- Entry: Examiner dashboard → “Assessments to Assign Time Slot”.
- Content per assignment: name, course, assessment type, assignment window, availableTimeslots, earliest/latest timeslot, and examiner capacity (current vs max sessions).
- Action: “Select Time Slots” → selection page for that assignment.

4.2 Select available timeslots
- Context: Assignment info, examiner capacity (current vs max sessions), optional signup deadline.
- Layout: Calendar (highlights days with availability) + timeslot list for selected date.
- Timeslot row: start/end (with timezone), venue, sessionCount, staffing status (current/required), select state if: not full, within capacity, and not overlapping with already selected or already assigned slots.
- Behavior: Selecting a slot increases “Selected sessions” by its sessionCount; fully staffed or conflicting slots are disabled with reasons.

4.3 Confirm and submit
- Summary: Table of selected slots (date, time, venue, sessionCount) + total sessions.
- Submit: One bulk request with selected `slotIds`. Server validates auth → eligibility → optional deadline → overlap → max sessions → slot capacity. Success updates dashboard counts; failures list per‑slot reasons for quick retry.

4.4 Manage schedule
- View: "My Schedule" shows assigned slots by assignment/date, including staffing (current/required), bookings (`isBooked`, `bookingCount`), and withdrawal eligibility.
- Withdraw (MVP): Allowed only when no students have booked sessions in that timeslot. Blocked once students book or session has started. Provide clear reason if blocked.

### 5) System Rules (MVP)
- Max sessions per assignment only (no minimum). Enforced server‑side; mirrored client‑side for feedback.
- Overlap prevention: UI blocks selecting overlapping slots (with current selection and existing schedule); server re‑validates on submit and may reject overlaps.
- Capacity: Server prevents exceeding slot’s required examiners on submit; UI shows disabled/full state.
- Timezone: UI displays localized times; server returns ISO timestamps with timezone.

### 6) Error Handling & Edge Cases
- Slot filled mid‑selection → inline error on that slot; refresh timeslot list.
- Max exceeded → disable submission client‑side; server returns `LIMIT_EXCEEDED` if attempted.
- Deadline passed (signup/withdrawal) → UI disables actions; server returns `DEADLINE_PASSED`.
- Not eligible → `FORBIDDEN` when examiner isn’t a member of the assignment.
- Time conflict → UI prevents selection with clear message; server can return `TIME_CONFLICT`.

### 7) Technical Implementation (Frontend)
- Next.js 15 + React Query; `refetchInterval=30000` on selection pages.
- Axios service layer; consistent response wrappers + stable error codes → toast/banners.
- Remove any “min selection” gating found in prototypes.
- Overlap detection: compare `start/end` windows for selected slots vs schedule API results.

### 8) Accessibility & UX
- Keyboard/ARIA for calendar and list; clear disabled states with reasons (e.g., “Full”, “Time conflict”, “Reached max”).
- Confirmation dialogs with concise summaries; inline errors map to specific slots.

### 9) Success Metrics
- < 5 minutes to complete discovery → selection → confirmation.
- No double‑booking/over‑assignment via server validation.
- Availability changes reflected within 30 seconds while on page.

### 10) Decisions Summary (MVP)
- Sorting/filters: date sort only (`date_asc|date_desc`). No urgency/status flags.
- Overlap conflicts: MVP‑safe — UI blocks, server validates; future: buffers/cross‑assignment logic.
- Withdrawal constraints: Default behavior allows withdrawal only when no students have booked sessions in that timeslot. No time-based deadlines in MVP.
- Schedule visibility: Show staffing status and booking counts on “My Schedule”.

### 11) Future Enhancements
- Configurable buffers between sessions; cross‑assignment conflict detection; smart alternatives when conflicts occur.
- Websocket push for instant updates.
- More filters/sorts (venue, day parts) if scale requires.
