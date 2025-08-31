# Student View My Results — User Flow (Final)

Version: 1.0 • Status: Proposed for Approval • Owner: Frontend Architecture • Last updated: 2025‑08‑30

## Scope & Baseline

This document specifies the end‑to‑end "My Results" experience for students, aligned with:

- PRD principle: students can view results for all assignments (including past/archived) once results are released by Course Admin.
- Visibility: show all assignments with released results; unreleased results are not displayed.
- Tech baseline: Next.js 15 frontend; Spring Boot backend; standardized API wrapper and time format (ISO‑8601 with timezone).

What this covers

- Results Overview: for each assignment, show the student's final result and grade (all assignments including past/archived).
- Result Details: view detailed rubric breakdown, examiner feedback, and performance analysis.

Out of scope

- Viewing unreleased results (explicitly excluded until Course Admin releases).
- Editing or disputing results from the student side (results are read-only).

---

## What changed since MVP notes

- Included "Past Results" display: Unlike groups feature, results show ALL assignments (active and archived) by design.
- Clarified "assignment‑level" results: each listed result belongs to a specific assignment with clear Course/Assignment context.
- Time format unified to ISO‑8601 with timezone throughout.
- Added rubric breakdown and detailed examiner feedback display.

---

## Roles, Entities & Definitions

- Student: authenticated user viewing their assessment results.
- Assignment: assessment configured by Course Admin; has type INDIVIDUAL | GROUP | MIXED.
- Result (assignment‑level): { resultId, assignmentId, assignmentName, courseCode, semester, finalGrade, totalPoints, rubricBreakdown[], examinerFeedback[] }.
- Rubric Breakdown: detailed scoring per criterion with examiner marks and comments.
- Examiner Feedback: consolidated feedback from all examiners who assessed the student/group.

---

## Preconditions

1. Student is rostered into the assignment (CSV import complete); assessment has been completed.
2. Results have been released by Course Admin (per assignment). Unreleased results are excluded from this feature's view.
3. Assessment data exists with rubric scoring and examiner feedback. Server is source of truth for all result data.

---

## Policies & Constraints

- Visibility
  - Only results for assignments where Course Admin has released results are shown.
  - Result details are available only if the student was assessed (403 otherwise).
  - All assignments (active and archived) with released results are displayed.

- Time & timezone
  - All datetimes are ISO‑8601 with explicit timezone; client renders local time with badge.
- Freshness
  - Results overview and details may use conditional GET (If‑Modified‑Since). Results are static once released; no frequent polling required.
- Data integrity
  - Results are read-only; students cannot modify grades or feedback.
  - Rubric breakdown shows exact examiner scoring and aggregated final marks.

---

## End‑to‑End Journey

### 1) Navigate to My Results

- From Student sidebar or dashboard, click "My Results".

### 2) Results Overview (by Assignment, All Terms)

- Shows the student's results for all assignments with released results (active and archived terms). Each card shows:
  - Course/Assignment: courseCode, assignmentName, semester, assessmentDate.
  - Result: finalGrade, percentage, totalPoints, resultStatus.
  - Primary action: "View Details".
- Results are sorted by assessment date (most recent first), with clear term/semester grouping.
- Empty state: "No results available yet. When your assessments are graded and released, they will appear here."

### 3) Result Details

- Header
  - Left: Assignment title (e.g., "Network Security Project"), courseCode + assignmentName, assessedOn and releasedOn dates.
  - Right: Final grade badge and percentage score with progress bar.
- Sections (single page with clear sections)
  - Rubric Breakdown
    - Table/cards: criterion name, points earned, total points, examiner comments per criterion.
    - Shows individual examiner scores if multiple examiners assessed.
  - Examiner Feedback
    - Consolidated feedback from all examiners with positive highlights and improvement areas.
    - Structured feedback per rubric criterion plus overall comments.
- Empty/edge states are clearly labeled (e.g., "No detailed feedback available").

---

## UX & Accessibility

- Keyboard navigation and ARIA roles for result cards, tabs, and action buttons; rubric table has proper table semantics.
- Clear breadcrumb navigation.
- Empty states for no results and missing feedback components.
- Grade badges with appropriate color coding and accessibility-friendly contrast.
- Responsive design for mobile viewing of results.

---

## Error Handling (User‑facing copy)

- NOT_FOUND — "We couldn't find this result."
- FORBIDDEN — "You don't have access to this result."
- NOT_RELEASED — "Results for this assignment haven't been released yet."
- STALE_DATA — "This information may have changed. Please refresh."
- NO_ASSESSMENT — "You weren't assessed for this assignment."

---

## State & Transitions (High level)

```
NoResults ──→ ResultsOverview (All Released)
              └─[View details]→ ResultDetails
                                  ├─ RubricBreakdown
                                  └─ ExaminerFeedback
```

---

## Telemetry & Success Metrics

- Coverage: % of students with ≥1 released result visible.
- Engagement: Click‑through rate to Result Details.
- Latency: P95 < 300ms for results overview fetch under warm cache.
- Satisfaction: Time spent reviewing detailed feedback (indicates engagement with learning outcomes).

---

## QA Acceptance Criteria (excerpt)

- All assignments with released results appear in My Results (both active and archived).
- Each result card shows correct Course/Assignment context, final grade, and assessment date.
- Result Details displays accurate rubric breakdown with examiner scores and feedback.
- Unreleased results never appear in the student view.
- Grade calculations match Course Admin aggregation settings.
