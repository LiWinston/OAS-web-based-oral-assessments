# Examiner Marking Flow Issues (2025-10-04)

## Scope
- Focus on current Individual and Group assessment flows in the examiner marking UI.
- Mixed assessment handling deferred until rubric configuration is finalised (per product decision on 2025-10-04).

## Reference Materials for Onboarding

### Product & Requirements Context
- `Docs/Requirement/Product Requirements Document.md` — master PRD covering personas, examiner flow expectations, rubric behaviour, and marking UX requirements.
- `Docs/Design/Examiner-Assessment-Flow.md` — high-level examiner assessment journey including UI expectations during live marking.
- `Docs/Design/Examiner-Timeslot-Assignment-Flow.md` — examiner scheduling context referenced by the marking UI entry points.
- `Docs/Design/Examiner-MarkingHistory-UserFlow.md` — outlines historical view requirements that influence submission states (draft/submitted).

### Frontend Setup & Architecture
- `frontend/README.md` — stack overview, environment setup, mock vs real API switching, and project conventions.
- `frontend/app/examiner` — Next.js route segment for examiner experiences (dashboard, schedule, assessment, results, support).
- `frontend/app/examiner/assessment/page.jsx` — assignment list entry point.
- `frontend/app/examiner/assessment/[assignmentId]/page.jsx` — session list (timeslot overview).
- `frontend/app/examiner/assessment/[assignmentId]/[sessionId]/page.jsx` — participant list for a session.
- `frontend/app/examiner/assessment/[assignmentId]/[sessionId]/[submissionId]/page.jsx` — main marking interface (individual/group).
- `frontend/components/examiner/assessment/` — shared UI building blocks (`HeaderStatusBar.jsx`, `SessionInfo.jsx`, `RubricTable.jsx`, `StudentSwitcher.jsx`, `SubmitDialog.jsx`, `TotalsPanel.jsx`).
- `frontend/hooks/examiner/assessment/` — data hooks for marking (`useMarkingSessionQuery.js`, `useAssessmentDraft.js`, `useAutoSave.js`).
- `frontend/services/examinerSessionService.js` — session- and assignment-related API calls.
- `frontend/services/examinerAssessmentService.js` & `frontend/services/examinerAssessmentService.real.js` — assessment CRUD service (mock toggle + real implementation template).
- `frontend/utils/assessment.js` — payload builder mapping UI state to backend `scores` structures.
- `frontend/ClienMeetingFeedback.txt` — latest qualitative feedback from stakeholders on marking UX (numeric vs descriptive scales, etc.).
### Backend API References
- `Docs/API/backend_api_swagger_summary.txt` — generated Swagger summary for all REST endpoints (use search for `Examiner Assessments`).
- `Docs/API/Examiner-Assessment-API-Contracts.md` — hand-authored contract for marking endpoints (payload expectations, field descriptions).
- `Docs/API/Examiner-Timeslot-Assignment-Contracts.md` — examiner session assignment API semantics backing the session list.
- `Docs/API/Student-Booking-and-Sessions-API-Contracts(Final).md` — student booking model influences session payload shape.
- `Docs/API/CourseAdmin_Timeslots_Schedule.md` & `Docs/API/CourseAdmin_Sessions_API_Changes.md` — admin-side schedule specs that determine session fields.

### Additional Context
- `Docs/Design/Onboarding-Flow.md` — explains how examiners land in their dashboards after invitation.
- `Docs/Design/Rubric-Mixed-Configuration-Refactor.md` — current state of mixed rubric discussions (flagged for later).
- `Docs/Design/CourseAdmin-Marks-Consolidation-and-Release-UserFlow.md` — downstream release process; clarifies why examiner submissions must be complete.
- `Docs/API/CourseAdmin-Marks-Consolidation-and-Release-API-Contracts.md` — aggregation expectations relevant when multiple examiners mark the same session.
- `Docs/Design/US6.7_Scheduling_Overview_Userflow.md` & `Docs/API/US6.7_Scheduling_Overview_API_Contract.md` — reporting surfaces that consume examiner submission status.

## Current User Flow Snapshot
1. Examiner dashboard (`/examiner/assessment`): loads assignments via `examinerSessionService.getAssignmentsList()`.
2. Assignment detail (`/examiner/assessment/[assignmentId]`): loads sessions with `getExaminerSchedule(examinerId, { assignmentId })`.
3. Session detail (`/examiner/assessment/[assignmentId]/[sessionId]`): loads participants from `getSessionDetailed(sessionId, examinerId)`.
4. Marking interface (`/examiner/assessment/[assignmentId]/[sessionId]/[submissionId]` or `submissionId=new`):
   - Data bootstrap through `useMarkingSessionQuery()`.
   - Draft save via `saveDraftMutation` -> `/api/examiner/assessments/draft/save`.
   - Submit via `submitMutation` -> `/api/examiner/assessments/submit`.

## Backend Endpoints In Play
| Purpose | Service call | Expected endpoint(s) |
| --- | --- | --- |
| Assignment list | `examinerSessionService.getAssignmentsList` | `POST /api/examiners/assignments/list` |
| Session list by assignment | `examinerSessionService.getExaminerSchedule` | `POST /api/examiners/{examinerId}/schedule` (fallback: `POST /api/examiners/{examinerId}/assignments/{assignmentId}/sessions/query`) |
| Session participants | `examinerSessionService.getSessionDetailed` | `POST /api/sessions/students/detailed` |
| Marking context (existing submission) | `examinerAssessmentService.getSessionContext` | `GET /api/examiner/assessments/{submissionId}?examinerId=` |
| Save draft | `examinerAssessmentService.saveDraft` | `POST /api/examiner/assessments/draft/save` |
| Submit | `examinerAssessmentService.submitAssessment` | `POST /api/examiner/assessments/submit` |

## Issues Requiring Fix

### 1. Session context panel never renders
- **Evidence**: `SessionInfo` expects a `sessionContext` prop (`frontend/components/examiner/assessment/SessionInfo.jsx:10-118`), but the page passes separate objects (`frontend/app/examiner/assessment/[assignmentId]/[sessionId]/[submissionId]/page.jsx:279-283`).
- **Impact**: Examiners cannot see timeslot date/time, venue, or participant list once inside the marking UI, conflicting with PRD Examiner Flow step 7 (needs full context during scoring).
- **Fix**: Pass the entire `sessionContext` object (or refactor props to match expectation) and ensure session data from API includes venue and participant info.

### 2. No student switching for individual or mixed assessments
- **Evidence**: `StudentSwitcher` component is imported but never rendered; `useAssessmentDraft` tracks `selectedStudent` yet defaults to the first entry (`frontend/app/examiner/assessment/[assignmentId]/[sessionId]/[submissionId]/page.jsx:13-20`, `frontend/components/examiner/assessment/StudentSwitcher.jsx:1-44`).
- **Impact**: Only the first student receives marks; additional students in the session are ignored, leading to incomplete submissions and inconsistent backend data.
- **Fix**: Render `StudentSwitcher` when `entity.individuals` length > 1, wire events to `setSelectedStudent`, and ensure ratings/comments update per student. Consider a visible summary of completion per student.

### 3. Validation logic ignores unselected students and mixed entities
- **Evidence**: `missingRubricRatings` only checks the currently selected target (`frontend/app/examiner/assessment/[assignmentId]/[sessionId]/[submissionId]/page.jsx:207-218`), but `SubmitDialog` expects `validation.perStudentMissing` and `validation.groupMissing` (`frontend/components/examiner/assessment/SubmitDialog.jsx:31-47`).
- **Impact**: Submissions can proceed with ungraded students, or block correctly completed work depending on selection order. Backend expects all criteria complete per `SubmitAssessmentRequestDTO`.
- **Fix**: Compute validation across group entity and all individuals before enabling submit. Populate `perStudentMissing[]`, `groupMissing`, and `totalMissing` to align with `SubmitDialog` messaging.

### 4. Points-only rubrics cannot capture criterion comments
- **Evidence**: Comment textarea disables when `selectedRatings[criterionId]?.levelId` is falsy (`frontend/components/examiner/assessment/RubricTable.jsx:336-347`). Pure numeric scales do not assign `levelId`, so comment entry is blocked.
- **Impact**: Violates PRD requirement that examiners can leave comments for numeric criteria. Backend `ScoreItem.comment` remains empty even if examiner wants to add feedback.
- **Fix**: Allow comments whenever there is a rating entry (points present), not strictly tied to level selection. Update UI copy accordingly.

### 5. Draft/save round trips lose backend submission identifiers
- **Evidence**: `saveDraftMutation` returns `res?.submissionId`, but `examinerAssessmentService.saveDraft` simply echoes the caller-provided `submissionId` (often "new") (`frontend/app/examiner/.../page.jsx:134-172`, `frontend/services/examinerAssessmentService.real.js:598-607`). Subsequent submit sends `Number("new")` → `NaN` to the backend (`Docs/API/backend_api_swagger_summary.txt:10655-10680`).
- **Impact**: First save never persists the backend-generated submission ID; submit requests violate API contract and fail.
- **Fix**: Capture `response.data.data.submissionId` (or `assessmentId`) from the backend, store in state, and update the URL/state so future saves/submits carry the correct numeric ID.

### 6. Predefined comment loading causes repeated fetches and latency
- **Evidence**: Every level selection triggers `assignmentService.getAssignmentById` to refresh rubric info (`frontend/components/examiner/assessment/RubricTable.jsx:52-128`).
- **Impact**: Noticeable lag on large rubrics; unnecessary API load.
- **Fix**: Preload predefined comments via `useMarkingSessionQuery` or a dedicated React Query cache. `RubricTable` should consume cached data instead of re-fetching per click.

### 7. Status and navigation after draft/submit are confusing
- **Evidence**: `useAssessmentDraft` initialises `isDraft` to `true` and never flips to `false` after submit; save draft immediately navigates back to the session list (`frontend/hooks/examiner/assessment/useAssessmentDraft.js:18-116`, `frontend/app/examiner/.../page.jsx:120-171`).
- **Impact**: Examiners see "Draft" status even post-submit, and are forced out of the page after saving a draft, disrupting workflow.
- **Fix**: Keep examiner on the marking page after draft save (show toast only). After submit, lock inputs, update `isDraft`, and present clear next steps (return to list / next student).

### 8. Endpoint field mapping still uncertain
- **Evidence**: Service layer contains multiple fallbacks and console logs indicating schema uncertainty (`frontend/services/examinerSessionService.js:57-292`, `frontend/services/examinerAssessmentService.real.js:1-780`).
- **Impact**: Fragile parsing makes it easy to regress once backend finalises field names (e.g., `sessionId` vs `slotId`).
- **Fix**: Align service models with Swagger definitions, remove fallback heuristics, and add JSDoc/TSDoc for expected response shapes.

## Mixed Assessment Follow-up
- Mixed rubric and weight handling will be revisited once backend configuration is finalised. Keep this document updated when the mixed contract is stable.

