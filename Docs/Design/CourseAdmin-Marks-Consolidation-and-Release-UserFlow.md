# Course Admin — Results (Simplified User Flow, Assessment-centric)

Scope: For each session, a Course Admin views assessments (each identified by `submissionId`), inspects examiner markings, reopens a specific examiner’s marking when needed, and releases the assessment to students.

Principles

- Keep it simple. No aggregation method selection. Aggregated score = average across SUBMITTED examiners; no additional moderation step.
- Identity: submissionId is nested under sessionId. A single session can have multiple assessments (one per student/group).

---

## 1) Goals

- Let admins quickly find a submission within a session and see all examiners’ markings.
- Provide two admin actions only: Review (per examiner) and Release to students.

Non‑Goals

- No results scheduling. No advanced analytics. No aggregation options.

---

## 2) Roles & Permissions

- Course Admin: view examiner marks, review one examiner (reopen), release to students.
- Examiner: can edit only when their marking is REOPENED by admin; otherwise read-only history for their own marks.
- Student: sees released results only.

---

## 3) Preconditions

- Each booked student/group within a session has a unique `submissionId`.
- Examiner assessments exist as `DRAFT`, `SUBMITTED`, or `REOPENED` for that submission.
- Rubric is locked (read-only in this flow).

---

## 4) Key Concepts

- Assessment (review unit): A student/group within a session, identified by `(assignmentId, sessionId, submissionId)`.
- Examiner Assessment: Each examiner’s marking of an assessment; status `DRAFT | SUBMITTED | REOPENED`.
- Aggregate Score: average of examiner totals for those who are `SUBMITTED`.
- Review action (per examiner): sets examiner status to `REOPENED` and if the assessment was released, sets it back to `NOT_RELEASED`. Sends an email with the admin’s reason (notification required).
- Release action (per assessment): makes results visible to the student; students see the effective final and released feedback.

---

## 5) Happy Path (Per Assessment)

1. Admin opens Results (for a session) → sees a list of assessments (each: identity, session time, aggregated score, release chip). No examiner arrays on this page.
2. Admin drills down to an assessment → sees examiner containers with rubric items, comments, and overall feedback.
3. If an examiner’s reasoning is insufficient → Admin clicks Review on that examiner, writes a reason → examiner status becomes REOPENED; if previously released, assessment becomes NOT_RELEASED. Examiner is notified by email.
4. When ready → Admin clicks Release → assessment is released to the student (requires at least one examiner SUBMITTED).

---

## 6) UI Model

List (Session Results)

- Minimal table: Student/Group, submissionId, Session time, Aggregate score, Release chip, View button.
- Filters: search by name/id; simple status quick filters (Released / Not Released). Optional `sessionId` filter.

Detail (Assessment)

- Header: student/group identity, submissionId, session/time, release chip.
- Examiners section: for each examiner, show status, submittedAt (if any), rubric table (read‑only), comments, overall feedback, notes.
- Rubric section: render rubric JSON from backend (rubricMetaInfo, criteria with performance levels and weighting/points) in a read-only table.
- Actions: Review (per examiner), Release.

Copy & Messaging

- Review confirmation: “Reopen this examiner’s marking? The submission will be unreleased if already visible to students. Reason (required).”
- Aggregate score banner: no override state.
- Release confirmation: “Release to student now?” (optional notify toggle).

---

## 7) Data & Status

- Average uses only SUBMITTED examiner marks. If none submitted yet, the score is shown as “—”.
- Any Review action sets submission’s release status to NOT_RELEASED.

---

## 8) Routes (Next.js App Router)

- List: `/admin/courses/[courseId]/assignments/[assignmentId]/sessions/[sessionId]/results`
- Detail: `/admin/courses/[courseId]/assignments/[assignmentId]/sessions/[sessionId]/results/[submissionId]`

---

## 9) Backend Mapping

- Courses: `GET /api/courses?pageNum=&pageSize=`
- Assignments by course: `GET /api/assignments/subject/{subjectId}?pageNum=&pageSize=`
- Assessments list (assignment): `GET /api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments?pageNum=&pageSize=&q=&sessionId=`
- Assessment detail: `GET /api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}`
- Examiner marking detail: `GET /api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}/examiners/{examinerId}`
- Review (per examiner): `POST /api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}/examiners/{examinerId}/review`
- Release: `POST /api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}/release`

## 10) Frontend Reuse & Routes

Important!!! Reuse the Rubric table **Rubric table**: reuse `frontend/components/examiner/assessment/RubricTable.jsx` for showing the results details
