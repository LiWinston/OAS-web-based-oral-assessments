# API Contracts — Admin Results (Simplified, Assessment-centric)

Scope: Course Admin views examiner marks per assessment (called “assessment” in docs; identified by `submissionId` in APIs) and can:
- Review an examiner’s marking (sets that examiner’s status to REOPENED and un-releases the submission if previously released).
- Manually set the submission’s final score at any time.
- Release the submission to students.

Notes
- submissionId is scoped under sessionId. A session can have multiple assessments (one per student/group attending the session).
- No aggregation method selection; backend always uses Average across SUBMITTED examiners to compute the default final score. Admin may override the final score manually at any time.

---

## 1) Conventions

- Auth: `Authorization: Bearer <accessToken>` (JWT).
- Wrapper: `{ success: boolean, code: 'OK' | <ERROR_CODE>, data: <payload> }`.
- Time: ISO‑8601 with timezone.
- IDs:
  - `assignmentId`, `sessionId`, `submissionId`, `examinerId`, `criterionId`, `levelId`.
- Statuses:
  - Examiner assessment: `DRAFT | SUBMITTED | REOPENED`.
  - Publication: `NOT_RELEASED | RELEASED`.

---

## 2) Domain Models (TypeScript)

```ts
type EntityKind = 'GROUP' | 'INDIVIDUAL';

type AssessmentKey = {
  assignmentId: number;
  sessionId: number;
  submissionId: number;
  kind: EntityKind;           // GROUP or INDIVIDUAL
  entityId: number;           // groupId or studentId
};

type AssessmentSummaryDTO = {
  assessment: {
    key: AssessmentKey;
    student?: { id: number; name: string };
    group?: { id: number; name?: string; memberCount?: number };
  };
  session: {
    id: number;
    start: string;
    end: string;
    timezone: string;
    venue?: { venueId: number; name?: string };
  };
  computed: {
    averageScorePct1dp: number | null; // average of SUBMITTED examiners; null if none submitted
    effectiveFinalScorePct1dp: number; // equals manualOverride.value or average
    manualOverride?: { valuePct1dp: number; reason?: string; by: { id: number; name?: string }; at: string };
  };
  releaseStatus: 'NOT_RELEASED' | 'RELEASED';
};

type ExaminerMarkDetail = {
  examinerId: number;
  name: string;
  assessmentStatus: 'DRAFT' | 'SUBMITTED' | 'REOPENED';
  submittedAt?: string;
  examinerScorePct1dp?: number;
  items: Array<{
    criterionId: string;
    levelId: string;
    points?: number;
    comments?: Array<{ source: 'predefined' | 'custom'; text: string; predefinedId?: string }>;
  }>;
  overallFeedback?: string;
  notes?: string; // admin-visible only
};

type RubricMetaInfo = {
  rubricId: number;
  name: string;
  scale?: 'points' | 'weight';
  maxPoints?: number; // when scale = points
};

type RubricCriterion = {
  criterionId: string;
  title: string;
  weightOrPoints: number; // weight% or points depending on scale
  performanceLevels: Array<{ levelId: string; label: string; value: number; description?: string }>;
  subCriteria?: Array<RubricCriterion>; // optional
};

type AssessmentDetailDTO = {
  assessment: AssessmentSummaryDTO['assessment'];
  session: AssessmentSummaryDTO['session'];
  rubric: { rubricMetaInfo: RubricMetaInfo; criteria: RubricCriterion[] };
  examiners: ExaminerMarkDetail[];
  computed: AssessmentSummaryDTO['computed'];
  releaseStatus: 'NOT_RELEASED' | 'RELEASED';
};

type UpdateFinalScoreRequest = { finalScorePct1dp: number; reason?: string };
type ReviewRequest = { reason: string };
type ReleaseRequest = { notify?: boolean };
```

Computation
- Default final = average across all SUBMITTED examiner totals.
- Effective final = manual override when present; otherwise default final.

---

## 3) Endpoints (align with backend naming)

Base navigation
- List courses: `GET /api/courses?pageNum=&pageSize=`
- List assignments by course (subject): `GET /api/assignments/subject/{subjectId}?pageNum=&pageSize=`

Admin results base: `/api/admin/subjects/{subjectId}/assignments/{assignmentId}`

Naming patterns follow backend practice; GET for reads, POST/PUT for actions. Pagination via `pageNum`, `pageSize` query when using GET.

### 3.1 List courses (paginated)
GET `/api/courses?pageNum=1&pageSize=10`

Response
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "pageNum": 1,
    "pageSize": 10,
    "total": 2,
    "items": [
      { "courseId": 1001, "code": "COMP30022", "name": "IT Project", "semester": "2025S1" },
      { "courseId": 1002, "code": "COMP20007", "name": "Design of Algorithms", "semester": "2025S2" }
    ]
  }
}
```

### 3.2 List assignments for a course (subject)
GET `/api/assignments/subject/{subjectId}?pageNum=1&pageSize=20`

Response
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "pageNum": 1,
    "pageSize": 20,
    "total": 1,
    "items": [
      { "assignmentId": 101, "name": "Oral Exam 1", "type": "individual", "status": "active" }
    ]
  }
}
```

### 3.3 List assessments for an assignment (paginated)
GET `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments?pageNum=1&pageSize=20&q=alice`

Query
- `pageNum`, `pageSize`: pagination
- `q` (optional): free-text filter by student/group name or id
- `sessionId` (optional): filter by a specific session within the assignment

Response
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "pageNum": 1,
    "pageSize": 20,
    "total": 2,
    "items": [
      {
        "assessment": {
          "key": { "assignmentId": 101, "sessionId": 90011, "submissionId": 712345, "kind": "INDIVIDUAL", "entityId": 200045 },
          "student": { "id": 200045, "name": "Alice Tan" }
        },
        "session": { "id": 90011, "start": "2025-04-14T10:00:00+10:00", "end": "2025-04-14T10:30:00+10:00", "timezone": "Australia/Melbourne" },
        "computed": { "averageScorePct1dp": 83.0, "effectiveFinalScorePct1dp": 83.0 },
        "releaseStatus": "NOT_RELEASED"
      }
    ]
  }
}
```

### 3.4 Get assessment detail
GET `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}`

Response (example below in 4.2)

### 3.5 Review an examiner’s marking
POST `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}/examiners/{examinerId}/review`

Request body
```json
{ "reason": "Please expand justification for criterion C2." }
```

Response
```json
{ "success": true, "code": "OK", "data": { "reopened": true, "releaseStatus": "NOT_RELEASED", "notified": true } }
```

Behavior
- Sets the targeted examiner’s assessment status to `REOPENED` (latest submitted copy).
- If the assessment is `RELEASED`, it becomes `NOT_RELEASED` automatically.
- Sends an email notification to the examiner with the provided reason (response `notified=true`).

### 3.6 Set final score (manual override)
PUT `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}/final-score`

Request body
```json
{ "finalScorePct1dp": 85.0, "reason": "Moderation panel decision" }
```

Response
```json
{ "success": true, "code": "OK", "data": /* AssessmentDetailDTO */ }
```

Notes
- Can be called at any time, regardless of current statuses.
- Replaces any existing manual override (idempotent updates by setting a new value).

### 3.7 Release an assessment
POST `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/assessments/{submissionId}/release`

Request body
```json
{ "notify": true }
```

Response
```json
{ "success": true, "code": "OK", "data": { "released": true, "notifiedStudents": 1 } }
```

Validation
- Requires at least one examiner with `SUBMITTED` on this assessment.

---

## 4) Examples

### 4.1 List assessments — example item (paginated)
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "page": 1,
    "pageSize": 20,
    "total": 2,
    "items": [{
      "assessment": {
        "key": { "assignmentId": 101, "sessionId": 90011, "submissionId": 712345, "kind": "INDIVIDUAL", "entityId": 200045 },
        "student": { "id": 200045, "name": "Alice Tan" }
      },
      "session": { "id": 90011, "start": "2025-04-14T10:00:00+10:00", "end": "2025-04-14T10:30:00+10:00", "timezone": "Australia/Melbourne" },
      "computed": { "averageScorePct1dp": 83.0, "effectiveFinalScorePct1dp": 83.0 },
      "releaseStatus": "NOT_RELEASED"
    }]
  }
}
```

### 4.2 Assessment detail — example (includes rubric JSON and examiner list)
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assessment": {
      "key": { "assignmentId": 101, "sessionId": 90011, "submissionId": 712345, "kind": "INDIVIDUAL", "entityId": 200045 },
      "student": { "id": 200045, "name": "Alice Tan" }
    },
    "session": { "id": 90011, "start": "2025-04-14T10:00:00+10:00", "end": "2025-04-14T10:30:00+10:00", "timezone": "Australia/Melbourne" },
    "rubric": {
      "rubricMetaInfo": { "rubricId": 501, "name": "Oral Exam 1 Rubric", "scale": "points", "maxPoints": 100 },
      "criteria": [{
        "criterionId": "C1",
        "title": "Communication",
        "weightOrPoints": 30,
        "performanceLevels": [
          { "levelId": "L4", "label": "Excellent", "value": 30, "description": "Clear and persuasive" },
          { "levelId": "L3", "label": "Good", "value": 24 }
        ]
      }]
    },
    "examiners": [{
      "examinerId": 44,
      "name": "Dr. Smith",
      "assessmentStatus": "SUBMITTED",
      "submittedAt": "2025-04-14T10:41:00+10:00",
      "items": [{ "criterionId": "C1", "levelId": "L3", "points": 18 }],
      "overallFeedback": "Good structuring of arguments.",
      "notes": "Time management could improve."
    }],
    "computed": { "averageScorePct1dp": 83.0, "effectiveFinalScorePct1dp": 83.0 },
    "releaseStatus": "NOT_RELEASED"
  }
}
```

### 4.3 Review — request
`POST /api/admin/subjects/1001/assignments/101/assessments/712345/examiners/44/review`
```json
{ "reason": "Please expand justification for criterion C2." }
```

### 4.4 Set final score — request
`PUT /api/admin/subjects/1001/assignments/101/assessments/712345/final-score`
```json
{ "finalScorePct1dp": 85.0, "reason": "Moderation panel decision" }
```

### 4.5 Release — request/response
`POST /api/admin/subjects/1001/assignments/101/assessments/712345/release`

### 4.6 Get one examiner’s marking (detail) — example
`GET /api/admin/subjects/1001/assignments/101/assessments/712345/examiners/44`
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "examinerId": 44,
    "name": "Dr. Smith",
    "assessmentStatus": "SUBMITTED",
    "submittedAt": "2025-04-14T10:41:00+10:00",
    "examinerScorePct1dp": 83.0,
    "items": [
      {
        "criterionId": "C1",
        "levelId": "L3",
        "points": 18,
        "comments": [ { "source": "predefined", "text": "Strong structure" } ]
      }
    ],
    "overallFeedback": "Good structuring of arguments.",
    "notes": "Time management could improve."
  }
}
```
```json
{ "notify": true }
```
```json
{ "success": true, "code": "OK", "data": { "released": true, "notifiedStudents": 1 } }
```

---

## 5) Validation Rules

- Authorization: Only Course Admins for the assignment can call these endpoints.
- Existence: `(assignmentId, sessionId, submissionId)` must map to a valid submission and student/group.
- Average computation: uses only `SUBMITTED` examiner marks; if none submitted, average is `null`.
- Manual final score: can be set at any time; replaces any previous override.
- Review semantics: sets selected examiner to `REOPENED` and sets `releaseStatus=NOT_RELEASED` if it was released.
- Release: requires at least one examiner with `SUBMITTED`. Upon release, students see `effectiveFinalScorePct1dp`.

---

## 6) Error Codes (examples)

- `SUBMISSION_NOT_FOUND` — `(assignmentId, sessionId, submissionId)` not found.
- `EXAMINER_NOT_FOUND` — examiner is not associated with the submission.
- `ALREADY_REOPENED` — review called for an examiner already in `REOPENED`.
- `FORBIDDEN` — caller lacks admin rights on assignment.

---

## 7) Performance Notes

- Pagination on list endpoints.
- Index `(assignmentId, session.start, submissionId)`.
- Avoid N+1 by pre-joining examiner totals; stable sorting on `session.start` or `student/group` display name.

---

## 8) Interop

- Examiner UI: `REOPENED` enables editing for the targeted examiner.
- Student UI: only `RELEASED` submissions surface in student results; they see `effectiveFinalScorePct1dp` and released feedback.
