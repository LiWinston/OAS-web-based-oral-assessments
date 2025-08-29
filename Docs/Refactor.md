# OAS — Course Admin Timeslot Management

**Refactor Plan (Software Architecture & Frontend Perspective)**

> Scope: Review and refactor the Course Admin _Schedule Wizard_ (`/admin/.../assignments/[assignmentId]/schedule`) and _Timeslot Management_ (`/admin/.../assignments/[assignmentId]/timeslots`) using modular design, KISS, and SOLID. Keep the current UI baseline but align flows with the PRD, the user-flow spec, and the backend API contract. Mock services must be used initially and later swappable with the Spring Boot APIs.

---

## 1) Context & Alignment

### 1.1 Product & flows (what the UI must do)

- The Course Admin workflow is a **3-step wizard**: (1) Session Config → (2) Create Time Slots → (3) Examiner session limits; and then **Timeslot Management** & **Release**. This includes end-time calculations and conflict checks, examiner capacity validation, and a calendar/month view for status by date.&#x20;
- Time calculations: `endTime = startTime + (Sessions × SessionLength) + ((Sessions - 1) × GapTime)`. Duplicate slots increment date by 1 day by default.&#x20;
- Endpoints to support the flow: `GET/PUT session-config`, `POST timeslots/batch` at the end of step 2, `PUT examiners/session-limits` for step 3; later `GET calendar`, `GET timeslots`, `PUT timeslots/{id}`, `DELETE timeslots`, `POST timeslots/{id}/duplicate`, `POST schedule/release`.&#x20;

### 1.2 Frontend architecture constraints (how the UI should be built)

- **Separated frontend/backend** with **Next.js 15** (App Router) for UI, Spring Boot for REST APIs. **Axios** through a **centralized service layer**. **Zustand** for client UI/auth state, **React Query** for server state, **mock integration** to swap real/mocked services. &#x20;
- Folder structure already places schedule wizard and timeslot management under `/admin/courses/[courseId]/assignments/[assignmentId]/...`, and the project already documents **mock/real service swapping** and **domain service modules**. &#x20;

---

## 2) What’s in the current code (quick audit)

### 2.1 Schedule Wizard `page.jsx` (Step 1–3)

- Collects session config, builds time slots client-side, then sets examiner limits; **no API calls** are made on Next/Done/Complete (pure local state).&#x20;
- `getTotalAssignedSessions()` sums **examiners’ maxSessions** (not the real capacity mapping) — placeholder logic.&#x20;
- Time calculations are local; **no conflicts** or backend validation. Navigation simply routes to `/timeslots` on “Complete Setup”.&#x20;

### 2.2 Timeslot Management `page.jsx`

- Calendar scaffold uses constants: `currentMonth = 'August 2025'`, and **hard-codes “today” as the 12th**. Should be dynamic and backed by `GET /calendar`.&#x20;
- `to24Hour` conversion and `determineStatus` are inline helpers (duplicable elsewhere).&#x20;
- Add/edit/duplicate/delete are **local-only**; modal returns data and state is updated in memory; **no API** or mock service used in this page yet.&#x20;

### 2.3 Modals

- `AddTimeSlotModal` computes end time with **hard-coded** `sessionLength=30` and `gapTime=5`, ignoring the wizard’s Step 1 values; these should come from session-config (or a hook).&#x20;
- `EditTimeSlotModal` is a thin wrapper over the same component (good KISS).&#x20;

### 2.4 Styling

- The UI uses **global classes** for `.oas-schedule`, `.dashboard-card`, calendar-day, action buttons, pills, etc.; these are defined in **`globals.css` (the block around \~922–1931)** and used consistently across both pages. Keep them, but deduplicate and prefer Tailwind utilities where feasible.&#x20;

### 2.5 Duplication

- Two similar copies of the schedule wizard `page.jsx` exist (duplicate content). Consolidate into one source of truth. &#x20;

---

## 3) Gaps vs. PRD / Flow / API

| Area                             | Expected                                                  | Current                  | Gap                                                                             |
| -------------------------------- | --------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| Step 1 – Persist session-config  | `PUT /session-config`                                     | Pure local state         | Persist + optimistic update + error handling.                                   |
| Step 2 – Create time slots       | Aggregate locally, then `POST /timeslots/batch` when Done | Adds to local array      | Replace with mutation; add conflict detection UX; align data shape (24h times). |
| End time calc                    | Based on step 1 values                                    | Hard-coded 30/5 in modal | Inject session config into modal; single source of truth.                       |
| Step 3 – Examiner session limits | `PUT /examiners/session-limits`                           | Sums mock `maxSessions`  | Implement mutation + capacity validation UX.                                    |
| Management calendar              | `GET /calendar?month=YYYY-MM`                             | Hard-coded month/today   | Fetch via React Query; compute badges/status.                                   |
| Timeslot CRUD                    | `GET/PUT/DELETE/POST duplicate`                           | Local-only               | Introduce service + optimistic mutations + toasts.                              |
| Status model                     | `empty/partial/full`                                      | Derived locally per page | Centralize helper/mapper consistent with API.                                   |
| Accessibility                    | WCAG, proper ARIA & toasts                                | `alert()/confirm()`      | Replace with global notifications/confirm dialog.                               |

---

## 4) Refactor Objectives (KISS + SOLID)

- **KISS**: Keep layout and visuals identical; move state/IO/logic out of pages into **hooks + services**.
- **S (Single Responsibility)**:

  - Pages = composition & routing.
  - Hooks = data fetching/mutation (React Query).
  - Services = API (real or mock).
  - Components = presentational (forms, list, card, calendar).

- **O (Open/Closed)**: New endpoints or validation added in services/mappers without touching pages.
- **L (Liskov)**: Mock and real services share the same interface.
- **I (Interface Segregation)**: Separate **session-config**, **timeslot**, **calendar**, **examiner-limits** service contracts.
- **D (Dependency Inversion)**: Pages depend on **abstract service** (picked by a small runtime factory reading an env flag).

---

## 5) Target Architecture (Frontend)

```
/app/admin/courses/[courseId]/assignments/[assignmentId]/
  schedule/page.jsx             # uses hooks only
  timeslots/page.jsx            # uses hooks only

/components/admin/schedule/
  SessionConfigStep.jsx
  TimeSlotForm.jsx
  TimeSlotList.jsx
  ExaminerLimitsStep.jsx
  CalendarMonth.jsx
  TimeSlotCard.jsx
  BulkActionsBar.jsx
  StatusPill.jsx
  AddTimeSlotModal.jsx          # (existing) accepts injected config
  EditTimeSlotModal.jsx         # (existing thin wrapper)

/lib/services/
  apiClient.js                  # axios instance + interceptors
  serviceFactory.js             # pick real vs mock
  courseAdminTimeslot.service.js           # interface + re-exports
  courseAdminTimeslot.real.js              # Spring Boot impl
  courseAdminTimeslot.mock.js              # mock impl

/lib/hooks/
  useSessionConfig.js           # GET/PUT session-config (RQ)
  useTimeSlots.js               # GET/POST batch/PUT/DELETE/duplicate (RQ)
  useCalendar.js                # GET calendar (RQ)
  useExaminerLimits.js          # GET/PUT limits (RQ)

/lib/mappers/
  timeslotMappers.js  # to/from API, status mapping, date/time normalization

/lib/utils/
  timeMath.js          # end time, 12h<->24h, ISO helpers
  validation.js        # field & conflict checks
  notifications.js     # toasts/confirm abstraction

/styles/globals.css    # keep classes, dedupe rules in 922–1931 block
```

- This layout mirrors the **service-layer + mock-switching** patterns already described in the README, including Axios client, React Query providers, and role routing. &#x20;

---

## 6) Data Models & Mappers (JS Doc shapes)

> Keep JS (no TS). Use JSDoc typedefs to document shapes & enable editor hints.

```js
/**
 * @typedef {Object} SessionConfig
 * @property {string} assignmentId
 * @property {number} sessionLength
 * @property {number} gapTime
 * @property {number} examinersPerSession
 * @property {boolean} isConfigured
 */

/**
 * @typedef {Object} TimeSlot
 * @property {number} id
 * @property {string} date              // YYYY-MM-DD
 * @property {string} startTime         // HH:mm 24h
 * @property {string} endTime           // HH:mm 24h
 * @property {string} venue
 * @property {number} requiredExaminers
 * @property {number} sessionCount
 * @property {"empty"|"partial"|"full"} status
 * @property {Array<{id:number,name:string,email?:string}>} assignedExaminers
 */
```

**Mapper rules**

- Normalize **incoming** API times to 24h strings; **outgoing** from UI convert 12h to 24h.
- `status` mapping centralized: `empty/partial/full` only.&#x20;
- End time always computed using the **current saved session-config** (not hard-coded).&#x20;

---

## 7) Mock Service (drop-in, dev-first)

Create `courseAdminTimeslot.mock.js` that implements the same interface as the real service:

```js
export const courseAdminTimeslotServiceMock = {
  getSessionConfig(assignmentId) {
    /* returns SessionConfig */
  },
  saveSessionConfig(assignmentId, body) {
    /* PUT */
  },

  getCalendar(assignmentId, month /* 'YYYY-MM' */) {
    /* GET /calendar */
  },

  // Step 2 (wizard): batch create on Done
  createTimeSlotsBatch(assignmentId, { timeSlots }) {
    /* POST /timeslots/batch */
  },

  // Management
  getTimeSlots(assignmentId, { date, status }) {
    /* GET /timeslots */
  },
  updateTimeSlot(assignmentId, timeSlotId, body) {
    /* PUT */
  },
  deleteTimeSlots(assignmentId, ids) {
    /* DELETE */
  },
  duplicateTimeSlot(assignmentId, timeSlotId, body) {
    /* POST duplicate */
  },

  // Step 3
  getExaminers(assignmentId) {
    /* GET /examiners */
  },
  updateExaminerLimits(assignmentId, limits) {
    /* PUT /examiners/session-limits */
  },

  // Release
  getScheduleStatus(assignmentId) {
    /* GET /schedule/status */
  },
  releaseSchedule(assignmentId, payload) {
    /* POST /schedule/release */
  },
};
```

- Seed mock responses with **the API examples** (shape, messages, and status strings) so UI integration is parity-correct.&#x20;
- Simulate **validation/conflict** errors (400) for overlaps in same venue; **partial staffing** statuses for some dates to drive the calendar dots.&#x20;
- Use small delays to emulate network; return `{ success, data, message }` consistently per README.&#x20;

Switching between mock/real via `serviceFactory.js` and an env flag (e.g., `NEXT_PUBLIC_USE_MOCKS=true`) aligns with the project’s **“seamless mock integration”** guidance.&#x20;

---

## 8) Hook Contracts (React Query)

- `useSessionConfig(assignmentId)`

  - `queryKey`: `['assignment', assignmentId, 'session-config']`
  - `mutations`: `saveSessionConfig` (optimistic: update local and rollback on error).
  - _Wizard Step 1 “Next”_ → call `saveSessionConfig`.&#x20;

- `useTimeSlots(assignmentId)`

  - `query`: get by date/status; `queryKey`: `['assignment', assignmentId, 'timeslots', filters]`
  - `mutations`: `createTimeSlotsBatch` (wizard Done), `updateTimeSlot`, `deleteTimeSlots`, `duplicateTimeSlot` (optimistic). &#x20;

- `useCalendar(assignmentId, month)`

  - Loads monthly aggregated counts and staffing status; drives left-panel calendar.&#x20;

- `useExaminerLimits(assignmentId)`

  - `getExaminers()` + `updateExaminerLimits()`; includes client-side **total capacity** validation vs total sessions before enabling “Complete Setup”. &#x20;

> These hooks replace all `alert()/confirm()` with the app’s **global notifications** (toasts) and a reusable **ConfirmDialog** component per README UX guidance.&#x20;

---

## 9) Component Refactor (keep baseline UI)

### 9.1 Schedule Wizard page

- **Before**: One monolithic component with local arrays; duplicate file exists. &#x20;
- **After**:

  - `SessionConfigStep`: reads/writes via `useSessionConfig`.
  - `TimeSlotForm` & `TimeSlotList`: accumulate **draft** slots locally, but clicking **Done** calls `createTimeSlotsBatch()` once (API contract).&#x20;
  - `ExaminerLimitsStep`: loads examiners and mutates limits via hook; validates capacity in real-time.&#x20;
  - On “Complete Setup” → success toast + route to Timeslot Management.

**Fixes/Improvements**

- Remove duplication: keep only one `page.jsx` for the wizard. &#x20;
- Extract **time math** to `/lib/utils/timeMath.js` used by _both_ wizard and modal.
- Replace `alert()` with toasts; replace `confirm()` with ConfirmDialog. (Accessibility)&#x20;

### 9.2 Timeslot Management page

- **CalendarMonth** (left): now consumes `useCalendar`, not a constant month or fixed “today”. &#x20;
- **List & Cards** (right): fetch by selected date; batch bar wired to `deleteTimeSlots`, `duplicateTimeSlot`, and “Notify” (mock).&#x20;
- **Add/Edit** modal:

  - Inject `sessionLength/gapTime` from `useSessionConfig`, not hard-coded `30/5`.&#x20;
  - On Save: use `updateTimeSlot()` for edits; for adds we **append to server** (single `POST` or `POST batch` with one item).&#x20;

- Move `to24Hour`, `determineStatus` to shared utils/mappers.&#x20;

---

## 10) CSS & Styling Plan

- Keep `.oas-schedule` **baseline classes** from `globals.css` (the 922–1931 range covers progress bar, cards, calendar, time-slot elements); do **not** break visual design.&#x20;
- **Deduplicate** repeated blocks in `globals.css` (several utility sections appear twice) and prefer Tailwind utilities where rules are simple (e.g., button hover, small spacing). Keep named classes only for complex composites (calendar grid, action buttons, status pills).&#x20;

---

## 11) Validation & Business Rules (UI)

- **Form validations**: required fields, positive counts, date not in past, standard minute increments; **end time** derived from session config.&#x20;
- **Conflict checks** (mock + UI): warn on overlapping slots for same venue (consistent with backend error 400 payload).&#x20;
- **Status computation**: `assignedExaminers.length` vs `requiredExaminers` → `empty/partial/full` (centralized).&#x20;
- **Capacity check (Step 3)**: sum of examiner limits ≥ total sessions before enabling “Complete Setup”.&#x20;

---

## 12) Step-by-Step Refactor Plan

> Deliver in small, reversible PRs.

1. **Services & Factory**

- Add `courseAdminTimeslot.service.js` (exported interface) + `*.mock.js` using API shapes/examples. Wire `serviceFactory` with `NEXT_PUBLIC_USE_MOCKS`. &#x20;

2. **Utils & Mappers**

- Create `timeMath.js` (12h↔24h, end-time calc using config), `validation.js`, `timeslotMappers.js`. Replace inline helpers in both pages and modal. &#x20;

3. **React Query Hooks**

- Implement `useSessionConfig`, `useTimeSlots`, `useCalendar`, `useExaminerLimits` with cache keys and optimistic updates (toasts on success/error).&#x20;

4. **Wizard Split**

- Split schedule wizard into `SessionConfigStep`, `TimeSlotForm`, `TimeSlotList`, `ExaminerLimitsStep`.
- “Next” on Step 1 → `saveSessionConfig`; “Done” on Step 2 → `createTimeSlotsBatch`.&#x20;

5. **Modal Injection**

- `AddTimeSlotModal` receives `sessionLength` and `gapTime` as props (from `useSessionConfig`). Remove hard-coded 30/5.&#x20;
- On Save: call `updateTimeSlot` or a single-item batch create; normalize date `YYYY-MM-DD` and **24h** times before send.&#x20;

6. **Timeslot Management Page**

- Replace in-memory array with `useTimeSlots` + server shapes; calendar left panel `useCalendar(month)` (derived from selected month). Remove hard-coded month/today. &#x20;

7. **Notifications & Confirms**

- Swap `alert()/confirm()` calls with global notification system and a reusable confirm modal (consistent UX).&#x20;

8. **CSS cleanup**

- Deduplicate overlapping blocks in `globals.css`; preserve **existing classes and look**.&#x20;

9. **Delete Duplicate File**

- Remove one `schedule/page.jsx` duplicate; keep the refactored one. &#x20;

10. **Release Action**

- Wire “Release Schedule” to `POST /schedule/release` (mock first), show validation summary from `GET /schedule/status` before enabling release.&#x20;

---

## 13) Risk & Rollback

- All IO concentrated in hooks/services → easy to toggle to mock and rollback by flipping `NEXT_PUBLIC_USE_MOCKS`.&#x20;
- UI unchanged visually; QA can compare before/after screenshots.
- Optimistic updates guarded with rollback on error (React Query).

---

## 14) Testing Matrix (high level)

- **Unit**: `timeMath`, `timeslotMappers`, `validation`.
- **Hooks**: happy-path & error-path for each mutation; optimistic update rollback.
- **Accessibility**: keyboard nav in calendar/list; ARIA labels in icons and buttons (replace `alert/confirm`).
- **Flow**:

  - Step 1 save → Step 2 “Done” (batch create) → Step 3 limits save → route to management.
  - Calendar shows correct dots & counts for dates; selecting date filters the list.
  - Add/Edit/Duplicate/Delete reflect immediately (optimistic) and persist (mock/real).
  - Release: status check, then release success with message (mock). &#x20;

---

## 15) Notes on Specific Code Changes

- **Remove hard-coded times** in `AddTimeSlotModal` end-time useMemo; take `sessionLength`/`gapTime` props from `useSessionConfig`.&#x20;
- **Move** `to24Hour` & status logic out of `timeslots/page.jsx` to `timeMath` & `timeslotMappers`.&#x20;
- **Replace** `alert('Time slot added successfully!')` with a toast via `notifications.js`.&#x20;
- **Normalize** dates (`YYYY-MM-DD`) and times (24h) at the boundary (service/mappers), not inside components. Current ad-hoc normalization in `onSave` should move into mappers.&#x20;
- **Keep** `EditTimeSlotModal` as a wrapper (fits KISS).&#x20;

---

## 16) What stays the same (baseline design)

- Pages, panels, section headers, and all **`.oas-schedule`** visual patterns remain (progress bar, cards, calendar layout, list & action buttons).&#x20;
- The wizard’s 3-step UX and the management page structure (calendar left, list right) remain exactly as is.&#x20;

---

## 17) Deliverables Checklist

- [ ] `serviceFactory` + `courseAdminTimeslot.mock/real`
- [ ] `useSessionConfig`, `useTimeSlots`, `useCalendar`, `useExaminerLimits`
- [ ] `timeMath`, `timeslotMappers`, `validation`, `notifications`
- [ ] Refactored **one** `schedule/page.jsx` (remove duplicate) &#x20;
- [ ] Refactored `timeslots/page.jsx` to server-state
- [ ] `AddTimeSlotModal` injected config (no hard-coded 30/5)&#x20;
- [ ] Replace browser dialogs with global toasts/confirm
- [ ] `globals.css` deduped (keep 922–1931 classes intact)&#x20;
- [ ] Tests & QA scenarios documented

---

### Appendix — Why this plan fits OAS

- Uses the **service + mock** strategy already documented for the project (seamless switching) and **React Query** for server state parity with other modules.&#x20;
- Aligns strictly with the **Flow** document (wizard steps, end-time formula, statuses, bulk ops) and **API** (batch create, calendar endpoint, release). &#x20;
- Preserves visual and interaction baseline while bringing **SOLID** structure, making future Spring Boot integration a one-line switch in `serviceFactory`.&#x20;

If you want, I can follow this plan and produce the first two PR-sized changes (services + hooks, then modal injection) directly against your codebase next.
