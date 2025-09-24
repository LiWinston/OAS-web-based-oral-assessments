# Student View My Results — User Flow (Current)

Version: 2.1 • Status: Aligned with Spring Boot backend (Oct 2025) • Owner: Student Experience

This document now captures the full lifecycle that leads to a student viewing their released results, including course setup, examiner marking, admin consolidation, and the rubric-aggregation algorithm that determines the final score presented to students. It supersedes earlier drafts that exposed raw examiner rubrics on the student side.

---

## 1. Upstream Lifecycle (Course → Assignment → Assessment → Result)

The data a student eventually sees is produced by the following workflow:

1. **Course Creation (Course Admin)**
   - Course Admin creates a *Course* (`subject`) in the admin portal.
   - Course metadata (code, semester, coordinator) is stored in `subject`.

2. **Assignment Configuration**
   - Within a course, the admin creates one or more *Assignments*.
   - Key inputs: assignment metadata, rubric definition (`rubric_meta_info`, `rubrics_info`), weighting per criterion (or sub-criterion), session duration rules, booking preferences.
   - Students (individuals or groups) are imported via CSV and linked to the assignment.

3. **Session Planning and Booking**
   - Admin defines sessions (slots) with capacity for individuals or groups.
   - Students/group leaders self-book sessions; each booked student/group-instance is treated as an *assessment entity* in later steps.

4. **Examiner Engagement**
   - Examiners self-assign to sessions and conduct assessments.
   - For each student/group within a session, every examiner records a submission (`assessment_submission` row) with rubric-level scores, criterion comments, overall feedback, and total score.
   - `submissionId` uniquely represents an examiner’s marks for a specific assessment entity (student/group) in a session.

5. **Admin Mark Consolidation & Moderation**
   - Admin views each assessment entity with all associated examiner submissions.
   - System aggregates examiner scores criterion by criterion (see section 3) and surfaces discrepancies.
   - Admin may request re-submission from examiners, add notes, or override the final score.
   - Once satisfied, Admin releases results for the assignment (release is idempotent and can be re-opened for further moderation; any change triggers re-aggregation on demand).

6. **Student Result Availability**
   - After release, students can browse `/student/results` and view finalised rubric summaries for their assessments.
   - Students **never** see individual examiner rubrics; only the computed final rubric and examiner-approved feedback are presented.

---

## 2. Student Journey Summary

1. **Navigate to My Results**
   - Student accesses `student/results`. Authentication guard ensures role = `STUDENT`.

2. **Results Overview**
   - Frontend calls `GET /api/students/{studentId}/results` with default filters (`status=released`, `semester=all`, `sort=date_desc`).
   - The list shows every assignment whose results have been released for that student. Columns: course + assignment context, assessed/released dates, final grade badge, final percentage, total/max points, availability of detailed feedback.

3. **Inspect Result Detail**
   - Selecting an assignment loads `/student/results/{assignmentId}`.
   - Frontend fetches the following (all data computed dynamically in backend):
     - `GET /api/students/{studentId}/assignments/{assignmentId}/result`
     - `GET /.../result/rubric` (returns **final** rubric only)
     - `GET /.../result/rubric/scale` (optional; used for Canvas-like grid)
     - `GET /.../result/feedback` (consolidated examiner feedback approved for release)
   - UI sections:
     - Header: course context, assessed/released timestamps, final grade/percentage, summary stats (criteria count, examiner count, feedback count).
     - Tabs: `Overview`, `Rubric Breakdown` (final rubric), `Feedback` (approved examiner feedback only).
     - Actions: back, refresh, export (if enabled), share link.

4. **Post-release Updates**
   - If Admin reopens moderation after release (e.g., overrides score, examiner resubmits), backend re-runs aggregation; student view reflects the latest released state on next fetch. No separate final snapshot is stored; the algorithm runs on demand each time (see section 3.6 for best practice discussion).

---

## 3. Final Rubric Aggregation Algorithm

Goal: produce a single, student-facing rubric that reflects consensus across examiner submissions while handling disagreements, weighting, and admin overrides.

### 3.1 Definitions

- **Assessment Entity**: a student or group within a specific assignment/session.
- **Submission**: an examiner’s scoring record for an assessment entity. Identified by `submissionId`.
- **Criterion**: the atomic scoring item defined in the assignment rubric (can be nested; algorithm operates on leaf criteria).
- **Weight**: each criterion/sub-criterion carries a weighting (`weightPct` or equivalent) that determines its contribution to the total score.
- **Max Points**: derived from rubric definition (either explicit or computed from weight × rubric total points).
- **Performance Levels**: each criterion defines rating tiers with `description`, `startPoint`, `endPoint`, and optional predefined comments; examiners pick a level and record an exact score within the allowed range.

> **Structure example** (truncated from `GET /api/assignments/{id}`)
>
> ```json
> {
>   "rubricMetaInfo": {
>     "name": "Requirements Analysis Rubric",
>     "totalPoints": 100
>   },
>   "rubricsInfo": [
>     {
>       "description": "Communication Skills",
>       "weight": 50.0,
>       "scaleType": "points",
>       "performanceLevel": [
>         { "description": "Excellent", "startPoint": 85, "endPoint": 100 },
>         { "description": "Good", "startPoint": 70, "endPoint": 84 }
>       ]
>     },
>     {
>       "description": "New Criterion",
>       "weight": 50.0,
>       "scaleType": "descriptive",
>       "performanceLevel": [
>         { "description": "Very Good", "startPoint": 80, "endPoint": 89 },
>         { "description": "Needs Improvement", "startPoint": 0, "endPoint": 59 }
>       ]
>     }
>   ]
> }
> ```

The aggregation algorithm treats each entry in `rubricsInfo` as a top-level criterion. If nested criteria are introduced later, the same logic applies to the leaf nodes while weights continue to dictate relative contributions.

### 3.2 Aggregation Pipeline

For each assessment entity:

1. **Collect Submissions**
   - Retrieve all `assessment_submission` rows with `status = SUBMITTED` for the same assignment + subjectId (student or group).
   - Ignore drafts; reopened submissions become SUBMITTED again once examiner resubmits.

2. **Per-Criterion Aggregation**
   - For every leaf criterion `c`:
     - Let `scores = {s_1, s_2, ... s_n}` be the points from each examiner submission.
     - Compute `maxDiff = max(scores) - min(scores)`.
     - Determine threshold `threshold_c = maxPoints_c * 0.05` (5% of that criterion’s maximum). This aligns with the agreed “simple difference > 5%” rule.
     - Cases:
       - **Within tolerance** (`maxDiff ≤ threshold_c`):
         - Final criterion score = arithmetic mean `avg(scores)`.
         - Criterion status = `AGGREGATED`.
       - **Exceeds tolerance** (`maxDiff > threshold_c`):
         - Criterion flagged as `REVIEW_REQUIRED`.
         - Admin must intervene before release (see 3.4).
   - Comments from examiners are retained separately; admin may choose which remarks appear in consolidated feedback.

3. **Weighted Total Calculation**
   - Normalise criterion weights to fractions: `w_c = weight_c / Σ weight`.
   - Compute automatic final score (before override): `autoFinal = Σ (finalCriterionPoints_c × w_c_normalised_multiplier)`.
     - If rubric already uses absolute max points, `w_c_normalised_multiplier` = 1 and weights simply ensure `Σ weight` equals rubric total. Otherwise convert weights into actual point contributions using rubric meta info.

4. **Assessment Status**
   - If any criterion is `REVIEW_REQUIRED`, assessment status = `PENDING_REVIEW`. Admin cannot release until resolved.
   - When all criteria are `AGGREGATED` or explicitly resolved (see below), assessment status = `READY_FOR_RELEASE`.

### 3.3 Final Score Without Override

- When no overrides exist and all criteria are within tolerance, the student-visible final score equals `autoFinal`.
- Final rubric presented to students comprises each criterion’s aggregated score, capped to its max points, plus any consolidated comments approved for release.

### 3.4 Handling Discrepancies (Pending Review)

- For criteria with `REVIEW_REQUIRED`, admin options:
  1. **Request Examiner Re-submission**: reopen relevant submissions; once examiners resubmit, algorithm reruns.
  2. **Manual Resolution**: admin inputs a definitive score for the criterion (and optional reasoning). Criterion status becomes `RESOLVED` and participates in total as that explicit value.
- After all flagged criteria are resolved, aggregation continues as in 3.2 and 3.3.

### 3.5 Admin Override of Final Score

Admins may override the computed final score (e.g., to apply moderation or policy adjustments).

Given:
- `autoFinal`: weighted sum from aggregation.
- `overrideFinal`: admin-specified final score.
- `weights`: normalised criterion weights (`w_c`).
- `resolvedScores_c`: the criterion points after aggregation/resolution.

Process:
1. Compute override delta `Δ = overrideFinal - autoFinal`.
2. Distribute `Δ` across criteria according to weight fractions to maintain rubric weighting:
   - For each criterion without manual lock:
     - `adjustment_c = Δ × w_c`
     - `newScore_c = resolvedScores_c + adjustment_c`
     - Clamp to `[0, maxPoints_c]` to respect rubric bounds.
3. If clamping occurs, redistribute remaining delta proportionally among unclamped criteria until either all deltas are exhausted or every criterion hits bounds.
4. Mark final rubric as `source = OVERRIDE`, storing metadata (reason, admin user, timestamp). Students only see the final numbers, but admin history shows override context.

> Note: this approach retains rubric weighting while eliminating the need for admins to tweak each criterion manually.

### 3.6 Final Rubric Persistence (Best Practice vs MVP)

- **Best Practice**: when an admin releases results, persist a *Final Rubric Snapshot* per assessment entity (immutable JSON or relational schema). This guarantees auditability, shields students from late changes, enables instant delivery, and avoids recomputing historical results.
- **Current MVP Implementation**: to minimise backend refactors, the system regenerates the final rubric on demand using the latest examiner submissions and any override metadata. Reopening moderation simply triggers another aggregation pass; no snapshot table exists yet.
- Future work should introduce the snapshot mechanism once bandwidth permits.

---

## 4. Student-Facing Behaviour

- **Overview page**: only assignments with `resultsReleased = true` are shown. Unreleased or pending assessments never appear.
- **Rubric Breakdown**: displays the final, aggregated/override-adjusted rubric. Individual examiner rows are *not* exposed.
- **Feedback tab**: shows consolidated strengths/improvements and examiner overall comments that admins approved for release. Criterion-level comments reflect the final rubric resolution.
- **Override indicator** (optional UI affordance): if final score differs from `autoFinal`, a subtle note can inform students the mark was moderated.
- **Error states**: unchanged from previous revision (403 forbidden, 404 not found, 410 not released, 423 not assessed, etc.).

---

## 5. API / Data Considerations

- `/api/students/{studentId}/results` should filter on assignment `resultsReleased = true` server-side (currently TODO).
- Detail endpoints (`result`, `rubric`, `feedback`) must call the aggregation service that implements section 3, ensuring consistent numbers wherever they are surfaced (admin or student view).
- Cached responses: frontend still attaches `If-Modified-Since`, but backend has not yet implemented `Last-Modified`. Once available, results can be cached client-side because post-release updates will change modification timestamps.
- Long-term: once Final Rubric Snapshots are persisted, these endpoints should read from snapshot storage for faster, immutable responses while keeping aggregation logic only for moderation screens.

---

## 6. Known Follow-ups

1. **Backend Alignment**: ensure aggregation service reflects the tolerance rule (5% differential), weight-based override redistribution, and on-demand recalculation.
2. **Admin UI Updates**: expose criterion-level statuses (`AGGREGATED`, `REVIEW_REQUIRED`, `RESOLVED`) and override metadata so admins understand moderation state before release.
3. **API Filtering**: tighten `/results` endpoint to respect release flags without relying on frontend defaults.
4. **Final Snapshot Roadmap**: design storage schema + lifecycle for Final Rubric Snapshots to graduate from MVP behaviour.
5. **Telemetry**: continue measuring overview/detail fetch latency and engagement to validate student experience after algorithm changes.

---

This document now mirrors the full operational flow and clarifies that students see only the final, moderated rubric derived from examiner submissions and admin actions.
