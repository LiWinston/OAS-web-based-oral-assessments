# Admin Review Results — User Flow (with Mixed Rubric)  
Date: 2025-10-10  
Owners: Admin Results Squad (FE/BE)  

## 0) Context & Objectives
- Source context: PRD (Docs/Requirement/Product Requirements Document.md), Client Minutes (2025-09-25), current FE/BE implementations.
- Target: Enable Admin to review multi‑examiner results per assessment target (student or group), support Mixed Rubric (Group/Individual criteria), release with independent toggles (Marks/Comments), Reopen that does NOT cancel release, and a bulk “Combine All” to persist Final=Average.
- Database constraint: submissionId is bound to a single examiner. FE will render one examiner per submissionId; BE shall provide “siblings” = all submissionIds for the same assessment target (sessionId + kind + entityId).

Glossary
- submissionId: One examiner’s submission row for a given session + subjectType(kind) + entityId.
- siblings: All submissionIds for the same assessment target (same sessionId, kind, entityId) — one per examiner.
- kind: GROUP | INDIVIDUAL (aka subjectType).

## 1) Pages & Entry
- Results List: `/admin/courses/[courseId]/assignments/[assignmentId]/results`
  - Shows per assessment target (student or group) one row: Average, Final, Release chips, Session window, Action → Detail.
  - Mixed assignments: List shows one row for the group target; individual breakdown is inside Detail (with Student Switcher).
- Results Detail: `/admin/courses/[courseId]/assignments/[assignmentId]/results/[submissionId]`
  - Anchored by a single submissionId.
  - First step: resolve siblings (all submissionIds for the same target) and optional group members.
  - Then fetch each submissionId detail (one per examiner) concurrently and render examiner cards.

## 2) Detail Page — Data Loading Sequence
1) Input: courseId = subjectId, assignmentId, anchor submissionId.
2) GET siblings(submissionId) → returns { assignmentId, sessionId, kind, entityId, submissionIds[], examiners[], members?[] }.
3) For each submissionId in submissionIds[], GET submission detail (single examiner record) → render one ExaminerPanel each.
4) Compute/Display:
   - Average: computed across SUBMITTED examiner totals.
   - Final: manual override when exists; else equals Average.
   - Release chips: two independent chips → Marks Released, Comments Released.

## 3) Mixed Rubric (Group/Individual) — UI
- Rubric content is partitioned by appliesTo/type:
  - Group criteria section: shows each examiner’s group‑level rubric items.
  - Individual criteria section: includes a Student Switcher to choose a member; shows each examiner’s individual rubric items for the selected student.
- Behavior:
  - If no members[] provided, hide Student Switcher; still show group criteria.
  - Switch student affects only the Individual section; Group section remains constant.

## 4) Actions & Semantics
### Review (Reopen)
- Per‑examiner action: sets that examiner’s submission status to REOPENED.
- Does NOT cancel release chips (Marks/Comments) — silent change. After examiner resubmits, student results auto‑reflect the latest without another admin release.

### Release
- Dialog with two independent toggles: releaseMarks, releaseComments, plus optional notify.
- Student visibility rules:
  - releaseMarks=false → mask grades (percentage/points/letter) from all student result endpoints.
  - releaseComments=false → mask examiner comments (criterion + overall) from student endpoints.
  - They are independent; any combination is valid.

### Combine All (bulk)
- List‑level action to persist Final=Average as a manual override for all matched assessments (filtered scope).
- Stored as “manual override”; subsequent examiner score changes do not alter Final unless override is changed/cleared.

## 5) Error & Edge Cases
- siblings empty → show informational state “No examiner submissions yet”.
- Examiner statuses: DRAFT/SUBMITTED/REOPENED — Average uses SUBMITTED only.
- Mixed without individualWeight/groupWeight: UI still partitions by criterion appliesTo (if present); Switcher shown only if members[].
- Reopen after release: release chips unchanged; only examiner’s status changes.

## 6) Frontend Implementation Checklist

Services (services/adminResultsService.js)
- + getSiblings(subjectId, assignmentId, submissionId)
  - GET `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}/siblings`
- + getSubmissionDetail(subjectId, assignmentId, submissionId)
  - GET `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/submissions/{submissionId}`
- ~ releaseAssessment(subjectId, assignmentId, submissionId, { releaseMarks, releaseComments, notify })
  - POST `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}/release`
- + combineAll(subjectId, assignmentId, body)
  - POST `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/combine-all`

Hooks (hooks/admin/useAdminResults.js)
- + useSiblingSubmissionIds(subjectId, assignmentId, submissionId)
- + useExaminerSubmission(subjectId, assignmentId, submissionId)
- + useCombineAll(subjectId, assignmentId)
- ~ useReleaseAssessment(...) → accept {releaseMarks, releaseComments}
- Adjust invalidations: per‑submission keys + list keys.

Pages & Components
- Detail page `/results/[submissionId]`:
  - Load siblings → parallel load per‑submission details → render ExaminerPanel for each.
  - Provide RubricSnapshot that can filter by appliesTo.
  - Add Student Switcher for Individual section (from siblings.members).
  - ScoreSummaryPanel: show Average/Final, Overridden badge, two release chips, actions.
  - ReleaseDialog: two checkboxes (Marks/Comments).
- List page `/results`:
  - Add “Combine All” button with confirmation; call combineAll; refetch.

State & Performance
- Use React Query for caching per submissionId; avoid N+1 recomputations; controlled concurrency if needed.

Student Visibility Integration (FYI)
- No FE change here; BE must enforce masking in student result endpoints based on release toggles.

## 7) Non‑Goals / Compatibility
- Old aggregated detail endpoint can remain for transition; FE will prefer siblings + per‑submission detail.
- No DB schema change strictly required; siblings can be derived by grouping existing submissions.

## 8) QA Scenarios
- Reopen after release → chips unchanged; student sees updated marks/comments as they change according to released toggles.
- Marks released, comments not → student sees grades only.
- Comments released, marks not → student sees comments only.
- Mixed rubric with multiple members → Switcher cycles individual criteria views; group criteria stays global.

## Appendix — Sample Responses (for FE integration)

Siblings (anchor submissionId)
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignmentId": 101,
    "sessionId": 90011,
    "kind": "GROUP",
    "entityId": 200045,
    "submissionIds": [712345, 712346, 712347],
    "examiners": [
      { "submissionId": 712345, "examinerId": 44, "name": "Dr. Smith", "status": "SUBMITTED" },
      { "submissionId": 712346, "examinerId": 45, "name": "Prof. Lee", "status": "REOPENED" },
      { "submissionId": 712347, "examinerId": 46, "name": "A/Prof. Nguyen", "status": "DRAFT" }
    ],
    "members": [
      { "studentId": 300001, "name": "Alice Tan" },
      { "studentId": 300002, "name": "Bob Wei" },
      { "studentId": 300003, "name": "Chris Li" }
    ]
  }
}
```

Single examiner submission detail
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "submissionId": 712346,
    "examinerId": 45,
    "name": "Prof. Lee",
    "assessmentStatus": "REOPENED",
    "submittedAt": "2025-04-14T10:55:12+10:00",
    "examinerScorePct1dp": 78.5,
    "items": [
      { "criterionId": "GROUP:Presentation", "levelId": "VG", "points": 32,
        "comments": [
          { "source": "predefined", "text": "Clear slide design" },
          { "source": "custom", "text": "Transition between speakers improved" }
        ]
      },
      { "criterionId": "INDIVIDUAL:Communication#student=300001", "levelId": "G", "points": 18 },
      { "criterionId": "INDIVIDUAL:Communication#student=300002", "levelId": "S", "points": 14 }
    ],
    "overallFeedback": "Solid work overall; individual variance noted.",
    "notes": "Check Q3 handling for Bob; potential rubric clarification."
  }
}
```

Release result (two toggles)
```json
{ "success": true, "code": "OK", "data": { "releasedMarks": true, "releasedComments": false, "notifiedStudents": 1 } }
```
