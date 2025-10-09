# Examiner Mixed Rubric Integration

_Author: Codex Frontend Team_
_Last updated: 2025-10-05_

This document consolidates project context, current implementation details, backend contracts, and the agreed frontend workplan so that any teammate can pick up the mixed-rubric workstream without re-reading the entire conversation history.

---

## 1. Project Background
- Repository: `OAS-web-based-oral-assessments`
- Domains: Course admin builds rubrics and schedules; examiners score oral assessments.
- Recent requirement (owner: Kern): **rubric flexibility** – regardless of assignment type (`individual`, `group`, `mixed`), admins may configure any mix of **individual** and **group** criteria, with arbitrary weights and a selectable display basis (percentage vs points). Examiners must see and score every configured criterion bucket accordingly.

---

## 2. Admin Rubric Configuration (Already Updated)
**Primary file:** `frontend/app/admin/courses/[courseId]/assignments/[assignmentId]/rubric/page.jsx`

### 2.1 Key Enhancements Delivered
- Recognise backend payloads with:
  - `rubricMetaInfo.weightBasis`
  - `rubricMetaInfo.individualWeight` / `groupWeight`
  - `rubricMetaInfo.individualRubrics[]` / `groupRubrics[]`
- UI additions:
  - Weight distribution inputs (individual vs group) with validation against weight basis (100% or total points).
  - Preview panel shows bucket totals & status chips (green/amber) depending on alignment.
- Save logic (`frontend/services/rubricService.js`):
  - Builds assignment payload containing `rubricMetaInfo` plus bucketed rubrics.
  - Still emits flattened `rubricsInfo` for downstream backwards-compatibility.
- Validation: ensures percentage sums hit 100 or sums match `totalPoints`; warns when bucket weights do not align with configured totals.

### 2.2 Files Impacted by Admin Work
- `frontend/app/admin/.../rubric/page.jsx`
- `frontend/services/rubricService.js`
- `frontend/components/admin/rubric/RubricPreview.jsx`

These changes are already merged on branch `dev` (see `git diff dev origin/dev` for context if needed).

---

## 3. Examiner Assessment Flow – Current Behaviour

### 3.1 UI/Route Structure
| Route | Responsibility |
|-------|----------------|
| `/examiner/assessment` | List examiner’s assignments (timeslot overview). |
| `/examiner/assessment/[assignmentId]` | Show timeslots for selected assignment. |
| `/examiner/assessment/[assignmentId]/[sessionId]` | Show participants (students/groups) within a timeslot. |
| `/examiner/assessment/[assignmentId]/[sessionId]/[submissionId]` | Marking workspace (rubric table, comments, submit). |

### 3.2 Data Fetch Hooks & Services
- `hooks/examiner/assessment/useMarkingSessionQuery.js`
- `hooks/examiner/assessment/useAssessmentDraft.js`
- `hooks/examiner/assessment/useAssessmentValidation.js`
- `services/examinerAssessmentService.real.js`
- `services/examinerSessionService.js`

### 3.3 Current Data Flow (before refactor)
1. **Schedule queries** use `/api/examiners/{examinerId}/schedule` and `/api/sessions/students/detailed` to list assignments, timeslots, and participants.
2. **Marking context** is derived via `useMarkingSessionQuery`:
   - Existing submission (`submissionId` ≠ `new`): GET `/api/examiner/assessments/{submissionId}` returning `AssessmentSubmissionDTO` with `rubricMetaSnapshot`, `rubricsInfoSnapshot`, `scoresJson` (legacy flattened format).
   - New submission: GET `/api/assignments/{assignmentId}` (assignmentService) and parse `rubricsInfo` only.
3. **Rubric handling**: All flows currently assume a single flattened list of criteria. Assignment type (`group` vs `individual`) drives UI toggles; mixed buckets are not recognised.
4. **Scoring payload**: `buildAssessmentPayload` emits `entities` (group or per student). `examinerAssessmentService` converts these to `scores` arrays keyed purely by description; no `individualScores` are emitted. Multiple submissions per session are used to cover each student.

### 3.4 Pain Points / Gaps
- Mixed rubrics from backend are ignored (only `rubricsInfo` considered).
- Assignment type is forced from subject type, so validation/totals cannot detect mixed compositions.
- Totals/validation rely on assignment type (binary) rather than per-criterion metadata.
- Save/submit endpoints still use old schema (no `individualScores`).

---

## 4. Backend Contracts (Reference)
**Swagger dump:** `Docs/API/backend_api_swagger_summary.txt`

### 4.1 Examiner Assessment Endpoints
| Verb & Path | Summary |
|-------------|---------|
| `GET /api/examiner/assessments/{submissionId}` | Returns `AssessmentSubmissionDTO`. Fields of interest: `rubricMetaSnapshot`, `rubricsInfoSnapshot`, `scoresJson`. |
| `POST /api/examiner/assessments/draft/save` | Saves/updates draft. Supports mixed payload with group `scores[]` and per-student `individualScores[]`. Partial drafts allowed. |
| `POST /api/examiner/assessments/submit` | Final submission. Must include all required rubric scores. |
| `POST /api/examiner/assessments/list` / `page` / `summary` | Listing APIs (not altered in this workstream). |

### 4.2 Draft/Submit Payload Requirements
Sample (provided by backend):
```json
{
  "assignmentId": 101,
  "sessionId": 649,
  "subjectType": "GROUP",
  "subjectId": 301,
  "overallFeedback": "Great team performance...",
  "adminNote": "Team was well-prepared",
  "scores": [ { "description": "Team Collaboration", ... }, ... ],
  "individualScores": [
    {
      "studentId": 2001,
      "individualFeedback": "Alice showed...",
      "scores": [ { "description": "Individual Presentation Clarity", ... }, ... ]
    },
    ...
  ]
}
```
- `scores` → group rubric entries.
- `individualScores` → required when individual rubrics exist; each student must be covered on submit.
- `description` is the matching key (backend guarantees uniqueness per criterion bucket; weight may be used as a secondary guard).
- Draft saves may omit some scores; submit must be complete (backend will reject otherwise).

---

## 5. Frontend Refactor Plan (Examiner Marking)

### 5.1 Objectives
1. Parse rubric definitions from backend `rubricMetaInfo` (individual/group buckets + weights/basis).
2. Render UI sections per bucket (group vs individual), regardless of assignment type label.
3. Allow per-student feedback + scoring when individual rubrics exist.
4. Generate payloads conforming to backend mixed schema (`scores` & `individualScores`).
5. Enforce validation: submit only when every configured criterion (for all buckets) has a score.

### 5.2 Implementation Tasks

#### (A) Session Context & Parsing
- Update `useMarkingSessionQuery` and `examinerAssessmentService.getSessionContext` to:
  - Parse `rubricMetaInfo` JSON (even when delivered as string) and extract:
    - `groupRubrics[]`, `individualRubrics[]`
    - `groupWeight`, `individualWeight`
    - `weightBasis`, `totalPoints`
  - Build a combined `criteria` array with metadata:
    ```js
    {
      criterionId,            // use backend ID if present; else stable synthetic id
      description,
      weight,
      scaleType,
      appliesTo: 'GROUP' | 'INDIVIDUAL',
      levels: [...],          // include min/max points, level descriptions
    }
    ```
  - Determine assignment `hasGroupRubrics`, `hasIndividualRubrics`; label assignment type `'mixed'` if both present (for display only).
  - Store `groupWeight` / `individualWeight` as raw numbers; UI will display as `X pts` or `X%` based on `weightBasis`.

#### (B) UI Rendering
- Marking page (`.../[submissionId]/page.jsx`):
  - Split layout into **Group Rubrics** and **Individual Rubrics** sections.
  - Group section: render `RubricTable` with `appliesTo='GROUP'` criteria; show overall group feedback/notes.
  - Individual section: `StudentSwitcher` remains, but now renders only individual criteria when a student is selected. Add per-student `individualFeedback` textarea.
  - If one bucket is empty, show placeholder text (“No individual criteria configured for this assignment”).
  - Totals panel (`TotalsPanel.jsx`) to display group score, per-student score, final weighted totals, and bucket weights (display using basis-specific label).

#### (C) State & Validation
- `useAssessmentDraft`:
  - Track `groupRatings`, `groupComments`, `overallFeedback`, `privateNotes`.
  - Track `individualRatings[studentId]`, `individualComments[studentId]`, `individualFeedback[studentId]`.
  - Support partial drafts; on load populate existing data by matching criterion description.
- `useAssessmentValidation`:
  - Derive missing counts by scanning criteria per `appliesTo`; ensure all students are included when individual rubrics exist.
  - Expose `totalMissing` for submit button gating and warnings.

#### (D) Payload Construction & Services
- Adjust `buildAssessmentPayload` to include per-student feedback.
- `examinerAssessmentService.saveDraft` / `submitAssessment` (real implementation):
  - Convert group entity ratings → `scores` array (match by `description` + optionally `weight`).
  - Convert student ratings → `individualScores[]`, each with `scores` array and `individualFeedback`.
  - Include `selectedLevel` with `description`, `startPoint`, `endPoint` derived from rubric levels (matching by description or range).
  - Draft request: send whatever data exists (partial). Submit request: ensure all buckets filled (pre-validation prevents incomplete payloads).
- Continue to log or warn if description lookup fails (defensive debug assistance).

#### (E) UX Polish & Messaging
- Submit button disabled with tooltip when criteria incomplete.
- For assignments lacking individual rubrics, hide StudentSwitcher.
- Display weight info header: e.g., `Group: 40 pts • Individual: 60 pts` or `Group: 40% • Individual: 60%`.
- Keep print/save draft actions functional.

---

## 6. Questions Answered / Assumptions
1. **Criterion uniqueness:** backend guarantees `description` uniqueness per bucket (optionally combined with `weight`).
2. **Draft vs submit:** partial drafts allowed; submit must cover all defined criteria.
3. **Legacy data:** database cleared; only new mixed-aware data exists.
4. **Weight units:** treat numbers as-is; UI switches label based on `weightBasis` (points vs percentage). Under the hood the numeric value is unchanged.

---

## 7. File Reference Cheat-Sheet
Use this table to jump into relevant code quickly:

| Purpose | File |
|---------|------|
| Admin rubric builder page | `frontend/app/admin/courses/[courseId]/assignments/[assignmentId]/rubric/page.jsx` |
| Admin rubric save service | `frontend/services/rubricService.js` |
| Examiner assignment list | `frontend/app/examiner/assessment/page.jsx` |
| Examiner timeslot list | `frontend/app/examiner/assessment/[assignmentId]/page.jsx` |
| Examiner timeslot participants | `frontend/app/examiner/assessment/[assignmentId]/[sessionId]/page.jsx` |
| Marking workspace | `frontend/app/examiner/assessment/[assignmentId]/[sessionId]/[submissionId]/page.jsx` |
| Marking context fetch | `hooks/examiner/assessment/useMarkingSessionQuery.js` |
| Draft state manager | `hooks/examiner/assessment/useAssessmentDraft.js` |
| Validation helper | `hooks/examiner/assessment/useAssessmentValidation.js` |
| Rubric table UI | `components/examiner/assessment/RubricTable.jsx` |
| Totals panel UI | `components/examiner/assessment/TotalsPanel.jsx` |
| Examiner assessment service | `services/examinerAssessmentService.real.js` |
| Examiner schedule service | `services/examinerSessionService.js` |
| Backend swagger dump | `Docs/API/backend_api_swagger_summary.txt` |
| Original mixed rubric design doc | `Docs/Design/Rubric-Mixed-Configuration-Refactor.md` |

---

## 8. Next Steps Checklist
1. Update parsing & context builders (hook + service).
2. Refactor marking page layout to render bucketed sections.
3. Extend state/validation hooks for per-bucket data.
4. Update payload builder & real service to emit `scores` + `individualScores`.
5. QA scenarios:
   - Group-only rubric.
   - Individual-only rubric.
   - Mixed rubric with both buckets.
   - Draft save with partial data; submit with complete data.
   - Weight basis toggle (points vs percentage).
   - Predefined comment persistence (ensure no regressions).

---

## 9. UI/UX Blueprint for Examiner Marking

Fully flexible rubric compositions mean the front end must decide layout based purely on the data returned by the backend. The agreed presentation model is:

### 9.1 Two Persistent Buckets
| Bucket | When it appears | Behaviour |
|--------|-----------------|-----------|
| **Group Rubrics** | At least one criterion has `appliesTo='GROUP'`. | Render all group criteria in one card/section. Header shows bucket weight, e.g. `Group Criteria (40 pts)` or `Group Criteria (40%)` depending on `weightBasis`. If empty, show an inline note: “当前作业没有配置任何 Group Criterion”。 |
| **Individual Rubrics** | At least one criterion has `appliesTo='INDIVIDUAL'`. | Render a student selector (`StudentSwitcher`) plus rubric rows filtered to individual criteria. Each student also gets an `Individual Feedback` textarea. If the assignment has no individual criteria, show “当前作业没有配置任何 Individual Criterion”。 |

### 9.2 Summary Banner
- At top of the page display a quick summary, e.g. `本次评分包含：Group Criteria ×3、Individual Criteria ×2｜权重：Group 40 pts • Individual 60 pts`.

### 9.3 Interaction & Guidance
- If both buckets exist, default to expanding both. Student list shows completion counts (e.g. `2/3 criteria complete`).
- Submit button tooltip explains remaining work (e.g. “还有 1 位学生的 individual rubric 未完成”). Draft button stays always enabled.
- If only one bucket exists, collapse/hide the other to reduce clutter.

### 9.4 Component Notes
- `RubricTable` remains reusable but receives an `appliesTo` context so it can display a small badge when desired.
- `StudentSwitcher` retains quick chips; chips can indicate completion state (green when all criteria done, amber otherwise).
- Totals panel summarises group score, per-student scores, and final weighted totals. Weight values are displayed “as-is” with unit based on `weightBasis`.

### 9.5 Validation Behaviour
- Draft saves: permit partial data.
- Submit: requires every group criterion and every per-student criterion to be filled; individual feedback optional unless we decide otherwise later.
- When a bucket is absent, submission validation naturally ignores it.

### 9.6 Edge Cases Handled
- Assignment labelled “group” but only individual rubrics → page shows only the individual section.
- Assignment labelled “individual” but only group rubrics → only group section shown.
- True mixed assignments with one bucket empty (e.g. new assignment not finished) still render gracefully with info text.

Keeping the UI logic data-driven ensures customer’s “Fully flexible” requirement is satisfied regardless of how admin configures the rubric.

Document complete – please keep this file updated as work progresses so everyone stays aligned.
