# API Contracts — Admin Review Results (Mixed Rubric, siblings, release toggles)
Date: 2025-10-10

## 0) Overview
- Purpose: Support FE rendering “one examiner per submissionId” via siblings discovery; add separate release toggles (marks/comments); Reopen without un‑releasing; bulk Combine All to persist Final=Average.
- Constraints: submissionId is per‑examiner row; avoid schema changes. Student results endpoints must mask fields per release toggles.

## 1) Conventions
- Auth: `Authorization: Bearer <JWT>`
- Wrapper: `{ success: boolean, code: string, data: any }`
- Time: ISO‑8601 with timezone
- IDs: assignmentId, sessionId, submissionId, examinerId, entityId (studentId/groupId)
- Status: Assessment `DRAFT | SUBMITTED | REOPENED`; Release chips: Marks Released, Comments Released

## 2) Models (simplified)
```ts
type Kind = 'GROUP' | 'INDIVIDUAL';

type SiblingsResponse = {
  assignmentId: number;
  sessionId: number;
  kind: Kind;
  entityId: number;
  submissionIds: number[]; // one per examiner
  examiners?: Array<{ submissionId: number; examinerId: number; name?: string; status?: string }>;
  members?: Array<{ studentId: number; name?: string }>; // when kind=GROUP
};

type ExaminerSubmissionDetail = {
  submissionId: number;
  examinerId: number;
  name?: string;
  assessmentStatus: 'DRAFT' | 'SUBMITTED' | 'REOPENED';
  submittedAt?: string;
  examinerScorePct1dp?: number; // total percentage 0..100
  items: Array<{
    criterionId: string;
    levelId?: string;
    points?: number;
    comments?: Array<{ source: 'predefined' | 'custom'; text: string; predefinedId?: string }>
  }>;
  overallFeedback?: string;
  notes?: string; // admin-visible
};
```

## 3) Endpoints (Admin scope)

### 3.1 Get siblings by anchor submissionId
GET `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}/siblings`

Response
```json
{ "success": true, "code": "OK", "data": {
  "assignmentId": 101,
  "sessionId": 90011,
  "kind": "GROUP",
  "entityId": 200045,
  "submissionIds": [712345, 712346],
  "examiners": [
    { "submissionId": 712345, "examinerId": 44, "name": "Dr. Smith", "status": "SUBMITTED" },
    { "submissionId": 712346, "examinerId": 45, "name": "Prof. Lee", "status": "DRAFT" }
  ],
  "members": [ { "studentId": 300001, "name": "Alice" }, { "studentId": 300002, "name": "Bob" } ]
} }
```

Extended example (3 examiners, one REOPENED)
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

Notes
- Implement by grouping assessment_submission rows on (assignmentId, sessionId, kind, entityId).
- Avoids schema changes; examiner names via join when feasible.

### 3.2 Get single examiner submission detail (by submissionId)
GET `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/submissions/{submissionId}`

Response
```json
{ "success": true, "code": "OK", "data": {
  "submissionId": 712345,
  "examinerId": 44,
  "name": "Dr. Smith",
  "assessmentStatus": "SUBMITTED",
  "submittedAt": "2025-04-14T10:41:00+10:00",
  "examinerScorePct1dp": 83.0,
  "items": [{ "criterionId": "C1", "levelId": "L3", "points": 18,
               "comments": [{ "source": "predefined", "text": "Strong structure" }] }],
  "overallFeedback": "Good structuring of arguments.",
  "notes": "Time management could improve."
} }
```

Extended example (Mixed rubric: group + individual criteria, multiple comments)
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
      { "criterionId": "INDIVIDUAL:Communication#student=300001", "levelId": "G", "points": 18,
        "comments": [ { "source": "custom", "text": "Good articulation, minor hesitations" } ]
      },
      { "criterionId": "INDIVIDUAL:Communication#student=300002", "levelId": "S", "points": 14,
        "comments": [ { "source": "predefined", "text": "Needs more concise answers" } ]
      }
    ],
    "overallFeedback": "Solid work overall; individual variance noted.",
    "notes": "Check Q3 handling for Bob; potential rubric clarification."
  }
}
```

### 3.3 Release with independent toggles
POST `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}/release`

Request
```json
{ "releaseMarks": true, "releaseComments": false, "notify": true }
```

Response
```json
{ "success": true, "code": "OK", "data": { "releasedMarks": true, "releasedComments": false, "notifiedStudents": 1 } }
```

Additional response shapes
```json
// Both released
{ "success": true, "code": "OK", "data": { "releasedMarks": true, "releasedComments": true, "notifiedStudents": 3 } }

// Comments only (no marks)
{ "success": true, "code": "OK", "data": { "releasedMarks": false, "releasedComments": true, "notifiedStudents": 0 } }

// Neither (toggle off) — effectively unsharing; students see nothing
{ "success": true, "code": "OK", "data": { "releasedMarks": false, "releasedComments": false, "notifiedStudents": 0 } }
```

Semantics
- Reopen no longer cancels release; chips stay as set.
- Student endpoints must mask marks when `releasedMarks=false`, and mask comments when `releasedComments=false`.
- Backward compatibility: if only `{ notify }` is provided, treat as both true (or maintain old behavior) — to be chosen and documented in code.

### 3.4 Review (Reopen) without un‑release
POST `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}/examiners/{examinerId}/review`

Request
```json
{ "reason": "Please expand justification..." }
```

Response
```json
{ "success": true, "code": "OK", "data": { "reopened": true, "notified": true } }
```

Change
- Do NOT revert release statuses anymore.
- Examiner’s submission moves to REOPENED; after re‑submit, student data auto‑reflects if released toggles permit.

### 3.5 Combine All (persist Final=Average as manual override)
POST `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/combine-all`

Request (either query or body for filters; example body):
```json
{ "strategy": "average", "scope": "assignment", "dryRun": false }
```

Response
```json
{ "success": true, "code": "OK", "data": {
  "processed": 42,
  "skipped": 3,
  "errors": [{ "key": { "assignmentId":101, "sessionId":90011, "kind":"GROUP", "entityId":200045 }, "reason": "NO_SUBMITTED_EXAMINERS" }]
} }
```

Dry‑run example (no state change)
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "processed": 38,
    "skipped": 7,
    "errors": [
      { "key": { "assignmentId": 101, "sessionId": 90011, "kind": "GROUP", "entityId": 200051 }, "reason": "NO_SUBMITTED_EXAMINERS" }
    ],
    "dryRun": true,
    "preview": [
      { "assignmentId": 101, "sessionId": 90011, "kind": "GROUP", "entityId": 200045, "finalWillSetTo": 82.5 },
      { "assignmentId": 101, "sessionId": 90012, "kind": "INDIVIDUAL", "entityId": 300001, "finalWillSetTo": 74.0 }
    ]
  }
}
```

Semantics
- For each matched assessment target, set manual override = computed average across SUBMITTED; mark effective Final from override.

## 4) Student Results Visibility (masking rules)
- When `releasedMarks=false`: Do not return grade/percentage/points/letter in StudentResult* DTOs (null or omit).
- When `releasedComments=false`: Do not return examiner comments (overall + per criterion) in StudentResult* DTOs (empty/omitted).
- Both flags independent; apply masking consistently across list/summary/breakdown endpoints.

## 5) Optional (List endpoint hint)
- Current list API can remain; optionally, extend `AssessmentKeyDTO` to include `submissionIds?: number[]` for easier jumps, but not required if siblings endpoint exists.

## 6) Backward Compatibility
- Keep existing aggregated detail endpoints during transition.
- Reopen behavior changed (no un‑release). Ensure release endpoint supports both old and new shapes.

## 7) Errors (examples)
- `SUBMISSION_NOT_FOUND`, `EXAMINER_NOT_ASSIGNED_TO_SUBMISSION`, `NO_SUBMITTED_EXAMINERS` (for release/combine), `FORBIDDEN`.
