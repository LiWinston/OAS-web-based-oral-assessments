**Student Booking Timeslot — Frontend Implementation Plan**

Version: 1.0 • Status: Proposed • Owner: Frontend • Date: 2025-08-30

**Summary**
- Implements student booking features per PRD, user flow, and final API contracts.
- Aligns with separated FE/BE architecture (Next.js 15 + Spring Boot), React Query for server state, Zustand for auth.
- Mirrors prototypes: booking board, booking detail/reschedule, three-step slot selection.

**Scope & Assumptions**
- Entities: Assignment, Timeslot (examiner assignment lives here), Session (bookable unit), Booking, Venue, Group/Student entity.
- Visibility: Show only sessions under fully staffed timeslots (`currentExaminers >= requiredExaminers`).
- Policies: `reschedulingEnabled`, `bookingDeadline`, `lockoutEnabled` (default true), `lockoutWindowHours` (default 24).
- Constraints: One active booking per entity per assignment; lockout/deadline enforced; reschedule atomic.
- Time: All datetimes ISO‑8601 with timezone; render using local time with clear TZ indicator.
- Preconditions: Schedule released by Course Admin; examiner staffing complete for visible timeslots.

**Routes & Screens**
- `app/student/page.jsx` (Dashboard)
  - Shows assignments needing action; CTA to booking wizard when bookable.
- `app/student/assignments/page.jsx`
  - Lists assignments (bookable | booked | all) with status and policy badges; “Book/Manage” actions.
- `app/student/booking/[assignmentId]/page.jsx`
  - Three‑step wizard: Select Date → Choose Session → Confirm Booking.
- `app/student/booking/[assignmentId]/detail/page.jsx`
  - Current booking details with Cancel and Reschedule; shows policy gates (lockout/deadline) and group banner.
- `app/student/bookings/page.jsx` (optional, phase 2)
  - “My Bookings” board (upcoming/past/cancelled) per prototype; quick links to details/reschedule.

**Component Architecture**
- `components/student/booking/BookingWizard.jsx`: Orchestrates steps; manages local selection state; plugs React Query data.
- `components/student/booking/BookingPolicyBanner.jsx`: Displays `reschedulingEnabled`, `bookingDeadline`, `lockoutEnabled`, `lockoutWindowHours` with icons/tooltips.
- `components/student/booking/Calendar.jsx`: Month view with keyboard support; highlights days with availability from summary days (`daysWithAvailability`).
- `components/student/booking/SessionList.jsx`: Right‑side session list grouped by timeslot; shows venue, staffing chip (e.g., 2/2), remaining sessions; buttons reflect `availability.canBook` and disabled reasons.
- `components/student/booking/GroupBanner.jsx`: Shows “Booking for <group name>” with members for GROUP/MIXED.
- `components/student/booking/BookingSummary.jsx`: Confirmation view with session/timezone/venue and group note; confirm button.
- `components/student/booking/TimezoneBadge.jsx`: Renders timezone info; ensures clarity across DST.
- `components/student/booking/MyBookingsList.jsx` (phase 2): Cards for upcoming/past/cancelled bookings; action chips and links, per prototype.

**Service Layer (API Integration)**
- Create `services/studentBookingService.js` with methods directly mapping to contracts:
  - `getAssignments(studentId, { status, pageNum, pageSize, sort })` → GET `/api/students/{studentId}/assignments`
  - `getAssignmentAvailability(assignmentId, studentId)` → GET `/api/assignments/{assignmentId}/availability?studentId={studentId}`
  - `getSessions(assignmentId, studentId, { date, pageNum, pageSize, includeReasons })` → GET `/api/assignments/{assignmentId}/sessions`
  - `createBooking(assignmentId, payload, idempotencyKey)` → POST `/api/assignments/{assignmentId}/bookings`
  - `getCurrentBooking(studentId, assignmentId)` → GET `/api/students/{studentId}/assignments/{assignmentId}/booking`
  - `rescheduleBooking(assignmentId, bookingId, payload, idempotencyKey)` → POST `/api/assignments/{assignmentId}/bookings/{bookingId}/reschedule`
  - `cancelBooking(assignmentId, bookingId, studentId)` → DELETE `/api/assignments/{assignmentId}/bookings/{bookingId}?studentId={studentId}`
  - `getGroupContext(studentId, assignmentId)` → GET `/api/students/{studentId}/assignments/{assignmentId}/group`
- Error handling: Map `code` values to user copy: `SESSION_TAKEN`, `ALREADY_BOOKED`, `SLOT_UNSTAFFED`, `LOCKOUT_WINDOW`, `DEADLINE_PASSED`, `FORBIDDEN`, `NOT_FOUND`.
- Idempotency: Include `Idempotency-Key` for POST booking/reschedule. Generate UUID client‑side.
- Conditional requests: Capture `Last-Modified` from session and booking GETs; send `If-Modified-Since`; on `304` keep cache.
- Polling: Respect `pollingHintSeconds` (default 30) with React Query `refetchInterval` when page visible.

**Hooks (React Query)**
- Add `hooks/useStudentBooking.js` exporting:
  - `useStudentAssignments(studentId, status)` — lists assignments and policy summary; staleTime short; refetch on focus.
  - `useAssignmentAvailability(assignmentId, studentId)` — loads policies/summary.
  - `useSessions(assignmentId, studentId, date)` — session list for date; refetchInterval = `pollingHintSeconds * 1000` while visible.
  - `useCurrentBooking(studentId, assignmentId)` — current booking card; conditional request handling.
  - Mutations: `useCreateBooking()`, `useRescheduleBooking()`, `useCancelBooking()` with optimistic UI gates (disable buttons), error toasts, and cache invalidation for sessions, availability, current booking, and assignments.
  - `useGroupContext(studentId, assignmentId)` — shows group banner/members when assessmentType is GROUP/MIXED.
- Query keys: `['student-assignments', studentId, status]`, `['assignment-availability', assignmentId, studentId]`, `['assignment-sessions', assignmentId, studentId, date]`, `['current-booking', assignmentId, studentId]`, `['group-context', assignmentId, studentId]`.

**Wizard Flow Logic**
- Step 1: Load availability → render `Calendar` using `summary.daysWithAvailability`; date selection gates Step 2.
- Step 2: Load `sessions` for date; list grouped by timeslot with staffing, venue; “Book” enabled only when `availability.canBook` and outside lockout/deadline; disabled buttons show tooltip reason from `availability.reason`.
- Step 3: `BookingSummary` confirmation; submit triggers `createBooking()` with idempotency key; on success, route to detail page and show toast; also offer “Add to Calendar” with returned `icsUrl`.
- Reschedule: Pre‑fill with current booking; selecting target session uses `rescheduleBooking()`; atomic behavior handled server‑side; on error keep old booking and show reason.
- Cancel: `cancelBooking()` gated by policy; on success update caches and UI.

**UX Details & Accessibility**
- Buttons disabled with explanatory tooltips: “Slot not staffed”, “Session taken”, “Already booked”, “Within lockout”, “Booking closed”.
- Keyboard navigable calendar; ARIA roles for lists and buttons; announce updates on polling refreshes.
- Group awareness banner on GROUP/MIXED with member list and note “This booking applies to all members”.
- Empty states: Not released; Unstaffed; No sessions available; Deadline passed.

**Error Handling**
- Surface server `code` with friendly copy; always refresh sessions after `409` to reflect race results.
- Global interceptor already handles 401/403; show toast for 403 forbidden with context.
- Network resilience: retry with backoff for GETs; do not retry POST booking/reschedule/cancel.

**Data & Time**
- Always render ISO timestamps in local timezone with `TimezoneBadge`; do not perform DST math client‑side beyond formatting.
- When `pollingHintSeconds` not present, default to 30s; pause polling when tab hidden.

**Alignment With Existing Codebase**
- Service style matches `frontend/services/examinerTimeslotService.js` and `frontend/services/apiClient.js` (return `{ success, code, data }`).
- Server state via React Query; notifications via `components/ui/notification.jsx`.
- Auth via `store/authStore.js` for `studentId` and tokens.

**Acceptance Criteria (Frontend)**
- Students never see sessions under unstaffed timeslots; if a staffed timeslot becomes unstaffed with no bookings, sessions disappear on next poll.
- Group/Mixed shows group banner and emails are indicated via `notifications.emailQueued` on success.
- Lockout default 24h enforced; deadline enforced; buttons and actions reflect policy.
- Reschedule behaves atomically; old booking retained on failure with clear message.
- Booking list and detail pages reflect up‑to‑date data within 30s while open.

**Implementation Milestones**
1) Service Layer
   - Add `services/studentBookingService.js` with endpoints, idempotency header, conditional request helpers.
   - Add error code → message map.
2) Hooks
   - Implement `hooks/useStudentBooking.js` for queries/mutations and polling.
3) Booking Wizard UI
   - Add components under `components/student/booking/*` (Wizard, Calendar, SessionList, PolicyBanner, GroupBanner, Summary, TimezoneBadge).
   - Implement `app/student/booking/[assignmentId]/page.jsx` consuming hooks.
4) Booking Detail
   - Implement `app/student/booking/[assignmentId]/detail/page.jsx` with Cancel/Reschedule actions.
5) Dashboard Integration
   - Update `app/student/page.jsx` and `app/student/assignments/page.jsx` to surface booking CTAs (Book/Manage) using `getAssignments`.
6) “My Bookings” Board (Phase 2)
   - Implement `app/student/bookings/page.jsx` and `MyBookingsList.jsx` per prototype.
7) Polish & A11y
   - Tooltips, aria labels, keyboarding; loading/skeleton states; empty states.
8) Observability (optional)
   - Add lightweight client events: view/select/confirm/success for funnel tracking.

**Testing Plan**
- Unit/UI: component rendering, disabled state reasons, calendar navigation, tooltip copy.
- Integration: booking success, `SESSION_TAKEN` conflict, `LOCKOUT_WINDOW`, `DEADLINE_PASSED`, `SLOT_UNSTAFFED` transitions; reschedule atomicity; cancel policy.
- Data freshness: polling updates session availability within 30s; conditional GET honors 304.
- Accessibility: tab order, ARIA roles, screen reader labels; color contrast in dark/light.

**Risks & Mitigations**
- Race conditions on hot sessions → Always refresh after failure; disable button during request; use idempotency keys.
- Timezone confusion → Always show timezone badge and ISO source in tooltip; rely on server for DST math.
- Backend parity gaps → Keep mock fallback pattern (mirroring examiner service) behind a flag for dev.

**Deliverables (Files)**
- Services
  - `frontend/services/studentBookingService.js`
- Hooks
  - `frontend/hooks/useStudentBooking.js`
- Components
  - `frontend/components/student/booking/BookingWizard.jsx`
  - `frontend/components/student/booking/BookingPolicyBanner.jsx`
  - `frontend/components/student/booking/Calendar.jsx`
  - `frontend/components/student/booking/SessionList.jsx`
  - `frontend/components/student/booking/GroupBanner.jsx`
  - `frontend/components/student/booking/BookingSummary.jsx`
  - `frontend/components/student/booking/TimezoneBadge.jsx`
  - `frontend/components/student/booking/MyBookingsList.jsx` (phase 2)
- Pages
  - `frontend/app/student/booking/[assignmentId]/page.jsx`
  - `frontend/app/student/booking/[assignmentId]/detail/page.jsx`
  - `frontend/app/student/bookings/page.jsx` (phase 2)
  - Update `frontend/app/student/page.jsx` and `frontend/app/student/assignments/page.jsx` (CTAs)

**Definition of Done**
- All acceptance criteria satisfied; flows pass manual QA with seeded backend.
- Responsive layouts align with prototypes; dark mode supported.
- Error handling and toasts polished; disabled buttons explain reasons.
- Code follows existing patterns; no dead Next.js API routes used for booking flow.

**Open Questions**
- None (per final docs); if backend deviates on wrapper/headers, adjust service layer accordingly.

