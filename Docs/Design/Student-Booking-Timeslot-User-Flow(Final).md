# Student Booking Timeslot — User Flow (Final)
Version: 1.0 • Status: Approved by PM (Open Questions 1–10 resolved) • Owner: Frontend Architecture • Last updated: 2025‑08‑28

## Scope & Baseline
This document specifies the **end-to-end student booking flow** for OAS, aligned with:
- PRD baseline (students see only fully-staffed slots; server is source of truth; email notifications).
- Course Admin schedule/management flow (3-step wizard → release with policies).
- Examiner self‑assignment flow (examiners assigned at **timeslot** level; sessions inherit examiners).

**What changed since MVP notes**
- **Time format**: All client-visible time fields are **ISO‑8601 with timezone** (e.g., `2025‑04‑14T10:00:00+10:00`). (Open Q1)
- **Release policies**: Added `reschedulingEnabled`, `bookingDeadline`, `lockoutEnabled` (default **true**), `lockoutWindowHours` (default **24**). (Open Q2, Q3)
- **Visibility**: Students **only** see sessions under **fully staffed** timeslots. If staffing drops (examiner withdraws and no students booked), affected sessions **disappear on next poll**, and booking is blocked. (Open Q10)
- **Entity mapping**: One booking per **entity**. GROUP and MIXED assignments book by **group**; INDIVIDUAL by **student**. UI clearly states “You are booking for **<group name>**.” (Open Q5, Q6)
- **Reschedule**: Atomic swap (never lose the old booking unless the new one is secured). (Open Q8)

---

## Roles, Entities & Definitions
- **Assignment**: The assessment to book.
- **Timeslot**: A block (e.g., 10:00–11:30) with venue and examiner requirement.
- **Session**: Unit students book inside a timeslot (e.g., 3 × 30‑min). **Bookings attach to sessions; examiners attach to the parent timeslot**.
- **Entity**: The booking owner — `GROUP` (for GROUP, MIXED) or `STUDENT` (for INDIVIDUAL).

---

## Preconditions
1) Student is enrolled (assignment roster present).  
2) Schedule has been **released** by the Course Admin with policies:  
   - `reschedulingEnabled` (bool),  
   - `bookingDeadline` (ISO datetime),  
   - `lockoutEnabled` (bool; default **true**),  
   - `lockoutWindowHours` (int; default **24**).  
3) At least one **fully staffed** timeslot exists (timeslot `currentExaminers >= requiredExaminers`).

---

## Policies & Constraints
- **Visibility**: Only sessions under timeslots where `currentExaminers >= requiredExaminers` are listed. If a timeslot loses staffing (and no students booked), its sessions are removed from the student list on the next refresh (polling).  
- **One active booking per entity** (group or student) **per assignment**.  
- **Lockout**: By default (`lockoutEnabled=true`), **no booking or rescheduling** is allowed **within `lockoutWindowHours` (24h)** of a session start. Course Admin can disable lockout at release.  
- **Deadline**: After `bookingDeadline`, **no booking/rescheduling**.  
- **Rescheduling**: Allowed only if `reschedulingEnabled=true`. Operation is **atomic swap**.  
- **Time**: All times are ISO‑8601 with explicit timezone. Client renders in local time with timezone badge.
- **Polling**: Session availability is polled every **30 seconds** (or using conditional requests).

---

## End‑to‑End Journey
### 1) Find the assessment
- Student dashboard lists assignments needing action. Each card shows status: `Book now`, `Booked`, `Results available`, plus policy badges (rescheduling, deadline, lockout). CTA: **“Book your oral exam slot”**.

### 2) Browse availability
- Layout: **Calendar (left)** + **Session list (right)** for the selected date.  
- Grouped by **timeslot**: show venue, examiner staffing chip (e.g., `2/2 examiners`), and remaining capacity (`Y of X sessions available`).  
- Only sessions under **fully staffed** timeslots appear.  
- Polling (≈30s) keeps the list fresh; also refresh on focus/visibility change.

### 3) Select & confirm
- Student clicks **Book** on a specific session row.  
- **Group banner** (GROUP/MIXED): “You are booking on behalf of **<group name>**. This applies to all members.”  
- Confirmation dialog summarizes **date/time, venue, timezone** and policies (lockout/deadline).  
- Submit → atomic `POST /bookings`. Race conditions surface precise reasons (e.g., session just taken).

### 4) Success & manage
- Success toast + **Booking card** shows details, “Add to calendar”, and **Reschedule/Cancel** (if allowed).  
- Email confirmation sent to the student (and group members for GROUP/MIXED).

### 5) Reschedule (if enabled)
- Click **Reschedule** → choose a different **available** session → confirm.  
- Backend performs **atomic swap**: book new session; if successful, releases old; otherwise keeps old. Email update sent.

### 6) Cancel (policy‑controlled)
- If allowed by policy (lockout/ deadline checks), student can cancel → frees session; list refreshes.

### 7) Day‑of & after
- Student attends at the venue. Later, when results are released, they appear under **Results**.

---

## UX & Accessibility
- **Calendar keyboarding**; ARIA labels for session rows and action buttons.  
- **Disabled‑state reasons** on buttons/tooltips:  
  - “Slot not staffed”, “Session taken”, “Already booked”, “Within lockout”, “Booking closed”.  
- **Group awareness**: Prominent group banner and member list; email addresses available to coordinate.  
- **Empty states**:  
  - “No bookable sessions yet — schedule is not released.”  
  - “All sessions are full.”

---

## Error Handling (User‑facing copy)
- **SESSION_TAKEN** — “This session was just booked by someone else.”  
- **ALREADY_BOOKED** — “Your group already has an active booking for this assessment.”  
- **SLOT_UNSTAFFED** — “This time slot no longer has enough examiners.”  
- **LOCKOUT_WINDOW** — “Bookings are closed within the final {hours} hours.”  
- **DEADLINE_PASSED** — “The booking window is closed.”  
- **FORBIDDEN** — “You’re not eligible to book this assessment.”  
- **NOT_FOUND** — “This session is no longer available.”

---

## State & Transitions (High level)
```
Unbooked
  └─[POST book]→ Booked
Booked
  ├─[POST reschedule (atomic)]→ Booked (new session) | Booked (old session retained if new fails)
  └─[DELETE cancel]→ Unbooked
Guards: Visibility (fully staffed), lockout, deadline, one‑booking‑per‑entity
```

---

## Telemetry & Success Metrics
- Booking funnel (view → select → confirm → success).  
- Median booking time < **3 minutes**.  
- Conflict rate (409s) < **1%** of booking attempts.  
- Freshness: changes visible within **30s** while on page.

---

## QA Acceptance Criteria (excerpt)
- Students never see sessions under unstaffed timeslots. If a staffed timeslot becomes unstaffed with **no bookings**, it disappears on next poll.  
- Group/Mixed booking shows the group banner and emails **all** group members on success.  
- Lockout default 24h enforced unless admin disabled at release.  
- Reschedule behaves atomically: old session is retained on failure.
