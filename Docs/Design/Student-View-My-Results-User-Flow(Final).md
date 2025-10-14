# Student View My Results — User Flow (Rebuild 2025)

Version: 3.0 • Status: Ready for implementation (Oct 2025) • Owner: Student Experience

---

## Purpose & Scope
- Replace the legacy “My Results” experience with a lean, read-only view that reflects the **final, released** marks after admin moderation.
- Remove historical UI cruft (table/card toggles, share/export buttons, per-examiner breakdowns) and focus on clarity for students.
- Support assignments that ship **one rubric** (individual _or_ group) as well as **mixed rubrics** (both individual and group sections) without exposing examiner-level artefacts.

## Key Principles
- Students only see **final, released** numbers. The guard condition is the same flag used by Admin Review Results: `assignment.resultsReleased === true` (and the Admin release endpoint returns `{ "released": true }`). No draft data, no examiner submissions, no moderation history surfaces to students.
- Per-criterion values are the **admin-approved aggregate** (e.g., average of released submissions, including moderation adjustments). There is exactly **one score per criterion**.
- Qualitative feedback is surfaced as a **single combined comment block**, created by concatenating examiner statements with simple prefixes:
  ```
  Examiner A: …
  Examiner B: …
  Examiner C: …
  ```
- Mixed rubric assignments render two tabs (`Group` / `Individual`) that mirror the examiner UI’s structure, but remain read-only and final.
- Navigation is kept minimal: list of released assignments → pick assignment → view final rubric + feedback. No secondary analytics, no exports.

## Actors & Data Inputs
- **Student**: authenticated user with role `STUDENT`.
- **Backend services**: expose aggregated result payloads scoped by `studentId` and `assignmentId` (see updated API contract).
- **Prerequisite data**: Admin has released results for the assignment (final scores computed, consolidated comments stored).

## High-level Journey
1. **Landing**: Student opens `/student/results`.
2. **Browse released assignments**: Read-only list of assignments with final grade, score, and release metadata.
3. **Inspect a result**: Student selects an assignment to see detailed rubric sections and combined feedback.
4. **Exit**: Student can return to the overview list; there are no edit or download actions.

---

## Detailed Flow

### 0. Preconditions
- Student is authenticated and authorised (`role = STUDENT`).
- Admin Review Results has run `POST /assignments/{id}/results/release` and the service returned `{ "released": true, ... }`, which flips `assignment.resultsReleased` to `true` and sets `assignment.resultsReleasedAt`.
- Backend has computed and stored:
  - Final score per criterion (already moderated/averaged).
  - Final overall totals (points, percentage, grade).
  - Combined examiner comments per criterion and overall.

### 1. Results Overview (`/student/results`)
**Goal**: Show only assignments whose results are released.

UI components:
- **Page title**: “My Results”. No gradient hero, no statistical widgets.
- **Filter strip** (top of list):
  - Semester dropdown (default “All”).
  - Optional search box (assignment or course name).
  - Results count indicator (e.g., “3 released assessments”).
- **Results list** (single-column stack): each item displays:
  - Course code + assignment name + semester.
  - Assessment type badge (`INDIVIDUAL`, `GROUP`, `MIXED`).
  - Final grade + percentage + `releasedOn` date.
  - Optional chip “Includes mixed rubric” when both sections exist.
- **Empty state**: If no released results, show friendly message and a CTA linking to help docs.

Interactions:
1. Page loads → frontend calls `GET /api/students/{studentId}/results` with default filters (`status=released`).
2. Backend returns only released assignments (see contract). Pagination is optional; we expect <= 50 results per student.
3. Student selects an assignment card → navigate to `/student/results/{assignmentId}`.

### 2. Result Details (`/student/results/{assignmentId}`)
**Goal**: Provide final rubric and feedback in a compact, structured layout.

**Header block**
- Breadcrumb: `My Results › <Assignment name>`.
- Assignment context: course name, semester, assessment type badge.
- Final score summary card:
  - Final grade (letter), percentage, total/max points.
  - `releasedAt` timestamp.
  - Optional session info (if provided by backend): session label/date-time.

**Rubric tabs**
- When `rubricMetaInfo` lists both `individualRubrics[]` and `groupRubrics[]` (the same payload examiners consume), render `Tabs` with `Group` and `Individual`. If only one array is present, omit tabs and render a single table.
- Each section shows:
  - Section total (sum of final criterion points) and weight share if applicable.
  - Table columns: `Criterion`, `Weight`, `Final Points / Max`, `Level` (if backend supplies a label), `Comments` (combined string).
  - Comments cell displays the newline-concatenated examiner comments in a single text block.
- No per-examiner score rows, no toggles for level details.

**Overall feedback block**
- Title “Overall Comments”.
- Body text = combined examiner comments (newline-delimited prefixes as described).
- Optional sub-blocks (if provided): `Strengths` and `Improvements`, each containing newline-concatenated items.

**Return control**
- Single “Back to My Results” button at bottom of page. No export/share buttons.

### 3. Error Handling
- **Unreleased / not found**: show inline error card with message “Results for this assignment haven’t been released yet.” and Back button.
- **Access denied**: “You don’t have access to this result.”
- **Network/server error**: Retry button + link back to overview.

---

## Data Requirements From Backend (summary)
- Overview list must be derived from finalised submissions only (no draft aggregator).
- Detail endpoint must include:
  - Assignment metadata (course, semester, assessment type).
  - Release metadata (`resultsReleased` boolean, `resultsReleasedAt`, optional `finalisedBy`).
  - Assignment calculation context from Admin Review Results (`status` should be `"RELEASED"`).
  - Final totals (points, percentage, letter grade).
  - Rubric sections mapped from `rubricMetaInfo` / `rubricsInfo`:
    - `rubricMetaInfo` JSON includes `weightBasis`, `individualWeight`, `groupWeight`, and nested `individualRubrics[]` / `groupRubrics[]` definitions exactly as the examiner service uses (see example payload in Admin service).
    - Each rubric definition provides `description`, `weight`, `scaleType`, and `performanceLevel[]` with optional `preDefinedComment[]`.
    - Student payload must surface the resolved max points per criterion derived from these definitions.
  - For each criterion: optional `finalLevelLabel`, combined comment string, and weight.
  - Combined overall comments + optional grouped highlights.
- No per-examiner arrays or raw submissions leak to student payloads.

## Accessibility & Responsiveness
- All tables must be readable on mobile (stacked layout under 640px – criterion name first, score/weight underneath).
- Combined comment block preserves line breaks (`white-space: pre-line`).
- Tabs must be keyboard navigable and announce which rubric type is active.

## Out of Scope / Follow-ups
- PDF export, share links, and bookmarking are deferred.
- Historical versioning (e.g., showing previous releases) is out of scope for this rebuild.
- If admin reopens moderation after release, backend must regenerate the final aggregates before surfacing them; frontend simply re-fetches.

## Open Implementation Notes
- Ensure caching is aligned with release timings (ETag/Last-Modified once backend supports snapshots).
- When rubric meta lacks explicit max points, backend should supply resolved values to avoid frontend calculation.
- Provide localisation-ready labels for rubric sections (e.g., “Group Rubric”, “Individual Rubric”).
