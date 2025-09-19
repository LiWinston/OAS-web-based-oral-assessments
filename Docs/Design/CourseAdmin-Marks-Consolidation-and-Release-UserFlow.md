# Course Admin — Marks Consolidation & Release (US 6.1–6.3)

> **Scope.** Course Admins review examiner submissions, compute the aggregated grade per entity (student or group), and control **immediate** or **scheduled** release of final results to students. The flow reuses the same rubric table UI used by Examiner Marking and Examiner History (read‑only), and it aligns with our standardized API wrapper and role model. fileciteturn1file12 fileciteturn1file5

---

## 1) Goals & Non‑Goals

**Goals**
- Provide a single place for admins to **review examiner submissions**, compute **aggregated marks** using **Average/Maximum/Minimum**, and **release** results either now or at a scheduled time. fileciteturn1file2
- Handle **mixed** assessments (group + individual) with criterion‑level weighting and component weights. fileciteturn1file15
- **Reuse the same rubric table** as Examiner UIs for visual and data consistency (read‑only in admin drill‑down). fileciteturn1file12
- Allow admins to **review** (unify “withdraw/reopen”) a result and **send it back** to specific examiner(s) with a reason; status becomes **REOPENED**, regardless of whether it was previously **SUBMITTED** or **RELEASED**. (This merges the earlier “withdraw” and “reopen” into a single **Review** operation for simplicity.)

**Non‑Goals**
- No advanced analytics beyond what is necessary to finalize and release marks (examiner trends etc. are separate). fileciteturn1file2
- No rubric version snapshotting in this flow (rubric is locked once published by admin, per project decision).

---

## 2) Roles & Permissions

- **Course Admin (assignment owner/coordinator)**: View consolidated marks, choose aggregation method, release/schedule, **review** (reopen) any examiner’s submitted item, and withdraw/unrelease if needed. fileciteturn1file0
- **Examiner**: Sees **their own** assessments and may edit only when **REOPENED** by an Admin. Examiner endpoints/status model remain unchanged. fileciteturn1file11
- **Student**: Sees **released** results only (read‑only). (Interop with Student Results API.) fileciteturn1file9

**Auth & Wrapper** — JWT bearer; standard wrapper `{ success, code, data }` across admin/examiner/student APIs. fileciteturn1file4

---

## 3) Preconditions

- Examiner submissions exist (drafts and/or submitted) for sessions with **active bookings** in the assignment. fileciteturn1file17
- The assignment has a locked rubric (criteria sum to 100%, level ranges non‑overlapping). fileciteturn1file4
- Session roster is resolved via the **session → sessionsStudent** mapping to group/student context; **no standalone assessmentId** is required to render an “assessment”; entity identity = **(sessionId, entityKind, entityId)**. *(Backend format to be finalized, but this flow and the APIs below use the composite key consistently.)*

---

## 4) Key Concepts

- **Entity (admin review unit)**: One row to finalize and release corresponds to a **student** or a **group** within a **session**. We identify it by a composite **EntityKey** = `(assignmentId, sessionId, entityKind, entityId)`. This intentionally avoids reliance on a global `assessmentId`.  
  *Example*: `assignment:101, session:90011, kind:INDIVIDUAL, student:200045`.  
- **Examiner Submission**: Each examiner’s **SUBMITTED** work for the same EntityKey. Admin aggregation runs **across examiners** for that entity. Status model mirrors examiner flow: `DRAFT | SUBMITTED | REOPENED`. fileciteturn1file4
- **Aggregation Method (assignment‑level)**: `average | maximum | minimum` applied to each examiner’s **final entity total**; **mixed** final per student = `groupScore * groupWeight + individualScore(student) * individualWeight`. fileciteturn1file10 fileciteturn1file15
- **Release**: Toggles whether students can see the final, aggregated result. Can be **immediate** or **scheduled**; released results are immutable for students until **review** triggers unrelease. fileciteturn1file9
- **Review (unified operation)**: Admin action that (a) sets `releaseStatus=NOT_RELEASED` for selected entities if they were released, (b) **REOPENs** targeted examiner submission(s) for the entity, and (c) captures an **admin reason** to be surfaced to examiners in their UI. It replaces separate “withdraw” and “reopen”. Display precedence remains **REOPENED > RELEASED > SUBMITTED > DRAFT**. 

- **Admin Override (manual adjustment)**: Admin may set a manual final score override per entity (student/group within a session). When present, the system displays both the computed final and the overridden final; the overridden value is used as the effective final displayed to students upon release. Override requires a reason and is fully audited. Clearing the override reverts the effective score to the computed value.

- **Release Eligibility**: An entity becomes eligible for release only when all assigned examiners for that entity have submitted. Entities with pending submissions show a clear “Awaiting examiner(s)” status and the release action is disabled for them.

- **Divergence Handling**: High examiner‑to‑examiner divergence triggers a warning indicator in the list and detail views but does not block release. Admins may use Review or Override if moderation is needed.

- **Scheduling Semantics**: Scheduled publication uses an absolute, timezone‑aware timestamp. The system triggers release exactly at that instant (no reinterpretation by server timezone or DST shifts).

- **Withdrawn Student UX**: When results are withdrawn/unreleased, the result disappears from the student UI until re‑released (no placeholder message is shown).

- **Access Scope**: Only Course Admins for the assignment can take actions (override, review, release, schedule). Super Admin access is read‑only for oversight in this flow.

- **Deferred (Next Iteration)**: Per‑student mixed finals list view and Canvas CSV export are deferred pending client confirmation. UI affordances may be present, but backend endpoints and computations for these are out of scope for this iteration.fileciteturn1file11

---

## 5) High‑Level Journey

1) **Open Results** → Admin navigates to the assignment’s **Results** page to see a consolidated list by **EntityKey** (one row per student or group per session). fileciteturn1file15  
2) **Choose Aggregation** → A header control sets `average | maximum | minimum` and recomputes live; saved assignment‑wide. fileciteturn1file14  
3) **Review Consolidated Rows** → Each row shows entity identity, session info, count of examiner submissions, aggregated score (1 dp), and a status chip. Filters include status, entity kind, examiner count completeness, date range, and search. fileciteturn1file15  
4) **Drill‑down** → Open a detail page: see per‑examiner submissions, rubric (read‑only via shared **RubricTable**), comments, and any divergence flags. fileciteturn1file14 fileciteturn1file12  
5) **Take Action** →  
   - **Release** now (scope: all or selected entities), or  
   - **Schedule** a release time for the assignment, or  
   - **Review** selected rows: provide a reason and **REOPEN** specific examiner submissions (or all) for that entity, auto‑unreleasing if previously released. fileciteturn1file9 fileciteturn1file13  
6) **After Re‑submission** → Aggregates refresh; admin re‑checks and **releases** again (immediate or scheduled).

---

## 6) Detailed UI Model

### 6.1 Results List (US 6.1)
- **Route**: `/admin/courses/[courseId]/assignments/[assignmentId]/results`.  
- **Columns**: Entity (group or student), Session (date/time, venue, duration), Co‑examiners (names only), Status chip, Examiner count, Aggregated score (% 1 dp).  
- **Actions**: View details; **Review** (opens dialog: examiner(s) to REOPEN, reason textarea); Exclude from upcoming release.  
- **Filters**: `status`, `entityKind`, `examinerComplete`, `date range`, `q`. Pagination 20/page. fileciteturn1file15

### 6.2 Detail Page (US 6.1) — per EntityKey
- **Header**: Entity identity + Session info + current `releaseStatus` and aggregation method.  
- **Tabs**:  
  - **Summary** — aggregation breakdown, examiner submissions list, anomaly flags.  
  - **Rubric (read‑only)** — **reuse** `components/examiner/assessment/RubricTable.jsx` with `disabled={true}` to guarantee UI parity across roles. fileciteturn1file12  
  - **Comments** — combined examiner comments (tagged: predefined/custom, examiner).  
- **Actions**: **Release**, **Review** (REOPEN targeted examiner submissions with reason), **Override Final** (set/clear manual final score with reason, audited), **Withdraw** (if you choose to keep a separate unrelease action). fileciteturn1file14

### 6.3 Release Controls (US 6.2, 6.3)
- **Immediate Release**: bulk or selection; options: notify students, include overall feedback, include rubric breakdown. Require that all assigned examiners have SUBMITTED for each entity; otherwise release is disabled for those rows. fileciteturn1file10  
- **Scheduled Release** (assignment‑level): set time (TZ‑aware), toggle notifications; can update/cancel before it triggers. fileciteturn1file9

---

## 7) States & Transitions

### 7.1 Examiner Submission State (per examiner × EntityKey)
`DRAFT → SUBMITTED → (Admin Review) REOPENED → SUBMITTED …` (versions increment on each resubmission). fileciteturn1file4

### 7.2 Publication State (per EntityKey)
`NOT_RELEASED ↔ RELEASED`. If **Review** is invoked for an entity that is already released, the system **unreleases** it first, then REOPENs examiner submission(s). **Display precedence**: `REOPENED > RELEASED > SUBMITTED > DRAFT`. fileciteturn1file11

---

## 8) Edge Cases & Rules

- **Multiple examiners**: Aggregation runs on **final totals** from each examiner; method = Avg/Max/Min. fileciteturn1file10  
- **Mixed assignments**: Honor `appliesTo` (GROUP/INDIVIDUAL/BOTH) and component weights; per‑student final follows `groupWeight/individualWeight`. fileciteturn1file10  
- **Partial submissions**: Rows where not all assigned examiners have submitted are clearly flagged and are NOT eligible for release until all submissions are in. fileciteturn1file10  
- **Rubric stability**: Rubric is locked after publish; **no snapshot** is needed for admin display. (If you later enable rubric edits mid‑semester, re‑introduce a frozen rubric view.)  
- **Multiple groups per session**: Always identify an entity with `(assignmentId, sessionId, entityKind, entityId)` to avoid ambiguity; avoid relying on a single `assessmentId`.  
- **Timezone & schedule**: Publication timestamps are TZ‑aware and shown localized in UI. fileciteturn1file13  
- **Audit**: Log setAggregation, release/schedule, withdraw, review, and override set/clear (with reason and actor). fileciteturn1file0

---

## 9) Data Visibility & Storage

- **Persistence**: Examiner submissions stored per examiner; admin aggregates stored/cached **per EntityKey** with `aggregationMethod` at assignment level.  
- **Indices**: `(assignmentId, session.start, entityKey)` for list pagination; server should pre‑join totals to avoid N+1. ETags/Last‑Modified for detail reads. fileciteturn1file0  
- **Student results**: Only **RELEASED** items appear via Student Results API; unrelease + review hides results until re‑release. fileciteturn1file9

---

## 10) Frontend Reuse & Routes

- **Rubric table**: reuse `frontend/components/examiner/assessment/RubricTable.jsx` in read‑only.  
- **Totals logic**: mirror `TotalsPanel` math for mixed weighting.  
- **Routes**:  
  - List: `/admin/courses/[courseId]/assignments/[assignmentId]/results`  
  - Detail: `/admin/courses/[courseId]/assignments/[assignmentId]/results/[sessionId]/[kind]/[entityId]`  
These follow the App Router and service patterns described in the repository README. fileciteturn1file12 fileciteturn1file3
