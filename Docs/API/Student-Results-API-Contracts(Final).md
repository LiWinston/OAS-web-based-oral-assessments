# Student Results API — Contracts (Current)

Version: 2.1 • Status: Matches Spring Boot implementation (Oct 2025)

## Conventions

- **Auth**: `Authorization: Bearer <accessToken>` (JWT)
- **Wrapper**: `{ "success": boolean, "code": "OK" | "<ERROR>", "data": <payload>, "message"?: string }`
- **Time**: ISO‑8601 with timezone (backend returns `ZonedDateTime` values)
- **Pagination**: 1-based `pageNum`, integer `pageSize`
- **Sorting**: `date_desc | date_asc | grade_desc | grade_asc`
- **Status filters**: `released` (default, returns only assessments with status `SUBMITTED`) or `all`
- **Semester filter**: `current | all | <display label>` where display label must match `Subject` semester string (e.g. `Semester 2 2025`)
- **Conditional requests**: `If-Modified-Since` header is accepted but currently ignored; backend does not yet emit `Last-Modified`

## Persistence Strategy (Best Practice vs MVP)

- **Best Practice**: when results are released, persist an immutable _Final Rubric Snapshot_ per assessment entity. APIs can then serve the snapshot directly, ensuring auditability and stable student views.
- **Current MVP Behaviour**: endpoints run the aggregation algorithm on demand, combining the latest examiner submissions with any admin overrides. Snapshot storage is deferred to keep implementation lightweight for MVP.

## Data Models (DTO snapshot)

```ts
// Overview list element
interface StudentResultOverviewItem {
  assignmentId: number;
  assignmentName: string;
  courseCode: string;
  courseName: string;
  semester: string; // e.g. "Semester 2 2025"
  assessmentType: "individual" | "group" | "mixed";
  result: {
    resultId: number; // assessment_submission.id
    finalGrade: string; // derived from percentage (HD/D/C etc depending on policy)
    percentage: number; // average total / maxPoints * 100
    totalPoints: number; // averaged across examiners (post-override when applicable)
    maxPoints: number; // rubric total points
    resultStatus: "released" | "pending";
    assessedOn: string | null; // latest submission timestamp
    releasedOn: string | null; // assignment results release timestamp
  };
  hasDetailedFeedback: boolean; // true if any submission contains overallFeedback
}

interface StudentResultOverviewDTO {
  pageNum: number;
  pageSize: number;
  total: number;
  cachingHintSeconds: number | null; // currently 3600
  data: StudentResultOverviewItem[];
}

interface StudentResultSummaryDTO {
  assignment: {
    assignmentId: number;
    assignmentName: string;
    courseCode: string;
    courseName: string;
    assessmentType: "INDIVIDUAL" | "GROUP" | "MIXED";
    semester: string;
  };
  result: {
    resultId: number;
    entity: {
      type: "INDIVIDUAL" | "GROUP";
      groupId?: number;
      groupName?: string;
    } | null;
    finalGrade: string;
    percentage: number;
    totalPoints: number;
    maxPoints: number;
    resultStatus: "released" | "pending";
    assessedOn: string | null;
    releasedOn: string | null;
    aggregationMethod: "average";
    examinerCount: number;
  };
  summary: {
    criteriaCount: number;
    highestCriterion: string | null;
    lowestCriterion: string | null;
    feedbackItemsCount: number;
  };
}

interface StudentRubricBreakdownDTO {
  resultId: number;
  rubricBreakdown: {
    aggregationMethod: "average";
    criteria: Array<{
      criterionId: number;
      name: string;
      description: string;
      scaleType?: "points" | "descriptive"; // this may need to change
      weight: number | null;
      maxPoints: number | null;
      earnedPoints: number;
      examinerScores: Array<{
        examinerId: number;
        examinerName: string; // fallback "Examiner {id}" when lookup fails
        points: number;
        level: string | null;
      }>;
      comments: string[];
    }>;
  };
}

interface StudentRubricScaleDTO {
  criteria: Array<{
    criterionId: number;
    scaleType?: "points" | "descriptive";
    levels: Array<{ label: string; points: number | null }>;
  }>;
}

interface StudentExaminerFeedbackDTO {
  resultId: number;
  examinerFeedback: Array<{
    examinerId: number;
    examinerName: string;
    overallComment: string | null;
    criterionFeedback: Array<{
      criterionId: number;
      criterionName: string;
      comment: string | null;
      strengths: string[];
      improvements: string[];
    }>;
    submittedOn: string | null;
  }>;
  consolidatedFeedback: {
    strengths: string[];
    improvements: string[];
  };
}
```

## 1) List student's assignments with results

**GET** `/api/students/{studentId}/results`

| Query      | Type    | Default     | Notes                                                                           |
| ---------- | ------- | ----------- | ------------------------------------------------------------------------------- |
| `status`   | string  | `released`  | `released` → only submissions with status `SUBMITTED`; `all` → no status filter |
| `semester` | string  | `current`   | `current` treated as no filter. Supply formatted semester string to filter      |
| `pageNum`  | integer | `1`         | 1-based page index                                                              |
| `pageSize` | integer | `20`        |                                                                                 |
| `sort`     | string  | `date_desc` | Accepts `date_desc`, `date_asc`, `grade_desc`, `grade_asc`                      |

**200 OK**

```json
{
  "success": true,
  "code": "OK",
  "data": {
    "pageNum": 1,
    "pageSize": 20,
    "total": 2,
    "cachingHintSeconds": 3600,
    "data": [
      {
        "assignmentId": 101,
        "assignmentName": "Network Security Project",
        "courseCode": "COMP30023",
        "courseName": "Computer Networks",
        "semester": "Semester 2 2025",
        "assessmentType": "group",
        "result": {
          "resultId": 7001,
          "finalGrade": "A",
          "percentage": 92.5,
          "totalPoints": 92.5,
          "maxPoints": 100,
          "resultStatus": "released",
          "assessedOn": "2025-08-18T04:10:00Z",
          "releasedOn": "2025-08-20T01:00:00Z"
        },
        "hasDetailedFeedback": true
      }
    ]
  }
}
```

**Empty list** → same payload with `total: 0` and `data: []`.

## 2) Get assignment result summary

**GET** `/api/students/{studentId}/assignments/{assignmentId}/result`

**200 OK**

```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignment": {
      "assignmentId": 101,
      "assignmentName": "Network Security Project",
      "courseCode": "COMP30023",
      "courseName": "Computer Networks",
      "assessmentType": "GROUP",
      "semester": "Semester 2 2025"
    },
    "result": {
      "resultId": 7001,
      "entity": { "type": "GROUP", "groupId": 301, "groupName": "Team Alpha" },
      "finalGrade": "A",
      "percentage": 92.5,
      "totalPoints": 92.5,
      "maxPoints": 100,
      "resultStatus": "released",
      "assessedOn": "2025-08-18T04:10:00Z",
      "releasedOn": "2025-08-20T01:00:00Z",
      "aggregationMethod": "average",
      "examinerCount": 2
    },
    "summary": {
      "criteriaCount": 4,
      "highestCriterion": "Technical Implementation",
      "lowestCriterion": "Documentation",
      "feedbackItemsCount": 2
    }
  }
}
```

## 3) Get detailed rubric breakdown

**GET** `/api/students/{studentId}/assignments/{assignmentId}/result/rubric`

**200 OK**

```json
{
  "success": true,
  "code": "OK",
  "data": {
    "resultId": 7001,
    "rubricBreakdown": {
      "aggregationMethod": "average",
      "criteria": [
        {
          "criterionId": 0,
          "name": "Technical Implementation",
          "description": "Quality of code and security protocols",
          "weight": 0.4,
          "maxPoints": 40,
          "earnedPoints": 38.5,
          "examinerScores": [
            {
              "examinerId": 201,
              "examinerName": "Examiner 201",
              "points": 39,
              "level": "Very Good"
            },
            {
              "examinerId": 202,
              "examinerName": "Examiner 202",
              "points": 38,
              "level": "Good"
            }
          ],
          "comments": [
            "Excellent implementation of security protocols.",
            "Code structure is well organised."
          ]
        }
      ]
    }
  }
}
```

## 4) Get rubric scale

**GET** `/api/students/{studentId}/assignments/{assignmentId}/result/rubric/scale`

**200 OK**

```json
{
  "success": true,
  "code": "OK",
  "data": {
    "criteria": [
      {
        "criterionId": 0,
        "levels": [
          { "label": "Excellent", "points": 10 },
          { "label": "Good", "points": 8 },
          { "label": "Satisfactory", "points": 6 }
        ]
      }
    ]
  }
}
```

**Fallback behaviour**: if backend throws `BusinessException` for missing levels, frontend calls `/result/rubric` and derives default ranges locally.

## 5) Get examiner feedback

**GET** `/api/students/{studentId}/assignments/{assignmentId}/result/feedback`

**200 OK**

```json
{
  "success": true,
  "code": "OK",
  "data": {
    "resultId": 7001,
    "examinerFeedback": [
      {
        "examinerId": 201,
        "examinerName": "Dr. Smith",
        "overallComment": "Excellent work overall.",
        "criterionFeedback": [
          {
            "criterionId": 0,
            "criterionName": "Technical Implementation",
            "comment": "High quality implementation.",
            "strengths": ["Robust security protocols"],
            "improvements": []
          }
        ],
        "submittedOn": "2025-08-18T04:12:00Z"
      }
    ],
    "consolidatedFeedback": {
      "strengths": ["Robust security protocols"],
      "improvements": []
    }
  }
}
```

## Error Handling

| HTTP | `code`            | Scenario                                              | Message (frontend copy)                                  |
| ---- | ----------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| 401  | `UNAUTHENTICATED` | Missing/expired token                                 | “Your session has expired. Please sign in again.”        |
| 403  | `FORBIDDEN`       | Student not permitted to view result                  | “You don't have access to this result.”                  |
| 404  | `NOT_FOUND`       | Assignment/result not found or student not associated | “We couldn't find this result.”                          |
| 410  | `NOT_RELEASED`    | Results not released yet (planned)                    | “Results for this assignment haven't been released yet.” |
| 423  | `NOT_ASSESSED`    | Student not assessed for assignment                   | “You weren't assessed for this assignment.”              |
| 500  | `ERROR`           | Unexpected server failure                             | “Something went wrong. Please try again.”                |

## Additional Notes

- Aggregation method is currently hard-coded to `average` (mean of examiner totals). Admin manual overrides, when present, should be reflected in `totalPoints` and `percentage`; implementation pending.
- `hasDetailedFeedback` only checks for `overallFeedback` on examiner submissions. Criterion-level comments are surfaced separately.
- Release timestamp should map to `assignment.resultsReleasedAt`; existing implementation uses `assignment.releasedAt` and should be corrected.
- `studentResultsService` caches responses in-memory using `If-Modified-Since`; once backend emits `Last-Modified`, 304 handling will become effective.
- Group assignments rely on `assessment_submission` rows for each group enrolment. Ensure group-to-student mapping stays in sync when re-importing CSV data.
- Rubric definitions originate from `rubricsInfo[]` (see assignment payload). Each element maps to a criterion with `weight`, optional `scaleType`, and performance levels; expose these attributes when returning final rubric data so clients can reconcile scores with the original definition.
