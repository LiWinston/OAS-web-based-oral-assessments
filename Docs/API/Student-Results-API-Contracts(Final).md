# Student Results API — Contracts (Rebuild 2025)

Version: 3.0 • Status: Ready for implementation (Oct 2025)

---

## Overview
This revision replaces the fragmented "My Results" endpoints with a student-facing contract that delivers **only final, released assessment data**. It aligns with the rebuilt user flow and removes exposure of raw examiner submissions.

### Key Changes vs v2.1
- 🧾 **Single-detail payload**: `/result` now returns the rubric, feedback, and final totals together. The old `/rubric`, `/rubric/scale`, and `/feedback` endpoints are retired.
- 🎯 **Final-only values**: per-criterion scores are the admin-approved aggregate (e.g., averaged across released submissions). No per-examiner arrays are returned.
- 🗂️ **Rubric sections**: Supports mixed assignments by splitting `GROUP` and `INDIVIDUAL` sections inside one response.
- 💬 **Combined comments**: Backend pre-concatenates examiner comments in the required format (“Examiner A: …”). The frontend renders them as-is.
- 🛡️ **Strict release gate**: Responses are available only when the assignment has been released to students.

### Conventions
- **Auth**: `Authorization: Bearer <accessToken>` (JWT)
- **Wrapper**: `{ "success": boolean, "code": string, "data"?: any, "message"?: string }`
- **Time values**: ISO-8601 with timezone (e.g., `2025-10-14T02:30:00Z`)
- **IDs**: All route parameters remain numeric IDs (`studentId`, `assignmentId`)
- **Assignment fields**: `assignment.type` stays lower-case (`"individual" | "group" | "mixed"`), and `assignment.status` mirrors Admin Review Results values (`"RELEASED"`, `"IN_PROGRESS"`, etc.).

---

## Shared Data Models

```ts
// Summary list item
interface StudentResultOverviewItem {
  assignmentId: number;
  assignmentName: string;
  courseCode: string;
  courseName: string;
  semester: string;               // e.g., "Semester 2 2025"
  assignmentType: "individual" | "group" | "mixed"; // mirrors assignment.type returned to examiners
  status: "RELEASED" | "IN_PROGRESS" | string;        // mirror of assignment.status
  resultsReleased: boolean;       // mirrors assignment.resultsReleased
  hasMixedRubric: boolean;
  releasedAt: string;             // ISO datetime when results were released (assignment.resultsReleasedAt)
  assessedOn: string | null;      // latest submission contributing to final result
  finalScore: {
    grade: string;               // backend-grade mapping (HD/DI or A/B etc.)
    percentage: number;          // 0–100, rounded to 1 decimal
    totalPoints: number;         // final total points shown to students
    maxPoints: number;           // denominator
  };
}

interface StudentResultOverviewDTO {
  pageNum: number;
  pageSize: number;
  total: number;
  data: StudentResultOverviewItem[];
}

// Detail payload
interface StudentResultDetailDTO {
  assignment: {
    assignmentId: number;
    assignmentName: string;
    courseCode: string;
    courseName: string;
    semester: string;
    type: "individual" | "group" | "mixed";
    status: "RELEASED" | string;
    resultsReleased: boolean;
    resultsReleasedAt: string;
  };
  release: {
    released: boolean;               // mirrors Admin release response
    notifiedStudents?: number;       // carried over from Admin release service when available
    releasedAt: string;              // same as assignment.resultsReleasedAt
    finalisedBy?: number | null;
    finalisedByName?: string | null;
  };
  session?: {
    sessionId: number;
    sessionLabel: string;
    startsAt: string;
    endsAt: string | null;
  };
  finalScore: {
    grade: string;
    percentage: number;
    totalPoints: number;
    maxPoints: number;
  };
  rubric: {
    sections: RubricSection[];
    aggregate: {
      totalPoints: number;
      maxPoints: number;
      percentage: number;
    };
    definition: RubricDefinition;   // mirrors rubricMetaInfo/rubricsInfo from assignment service
  };
  feedback: {
    overallCommentsCombined: string;      // newline-delimited string as specified
    overallCommentsByExaminer: Array<{
      examinerId: number;
      examinerName: string;
      comment: string;
    }>;
    strengthsCombined?: string | null;    // optional newline list
    improvementsCombined?: string | null; // optional newline list
  };
}

interface RubricSection {
  sectionType: "GROUP" | "INDIVIDUAL";
  displayName: string;               // e.g., "Group Rubric"
  weightShare?: number | null;       // percent of total (0-100) if applicable
  totalPoints: number;
  maxPoints: number;
  criteria: RubricCriterion[];
}

interface RubricCriterion {
  criterionId: string | number;
  name: string;
  description?: string | null;
  weight?: number | null;            // percent of section
  maxPoints: number;
  finalPoints: number;               // admin-approved aggregate for students
  percentage: number;                // derived = finalPoints / maxPoints * 100
  finalLevelLabel?: string | null;   // optional rubric level label (e.g., "Very Good")
  commentsCombined: string | null;   // newline string – “Examiner A: ...\nExaminer B: ...”
  commentsByExaminer: Array<{
    examinerId: number;
    examinerName: string;
    comment: string;
  }>;
}

interface RubricDefinition {
  meta: {
    name: string;
    description: string | null;
    totalPoints: number;
    weightBasis: "percentage" | "points";
    individualWeight?: number | null;
    groupWeight?: number | null;
  };
  individualRubrics?: Array<RubricMetaCriterion>;
  groupRubrics?: Array<RubricMetaCriterion>;
}

interface RubricMetaCriterion {
  description: string;
  weight: number;
  scaleType: "points" | "descriptive";
  performanceLevel: Array<{
    description: string;
    startPoint: number;
    endPoint: number;
    preDefinedComment: string[];
  }>;
}
```

### Formatting Rules
- `commentsCombined` **must** use newline (`\n`) separators and the exact prefix format `Examiner X: …`.
- Backend is responsible for ordering examiners consistently (default: chronological by submission time).
- Percentages should be rounded to one decimal place when returned.

---

## Endpoint 1 — List released results
**GET** `/api/students/{studentId}/results`

Returns all released assignments for a student.

| Query      | Type    | Default     | Notes                                                                     |
|------------|---------|-------------|---------------------------------------------------------------------------|
| `status`   | string  | `released`  | Mirrors current controller (`released` or `all`).                         |
| `semester` | string  | `current`   | `current`, `all`, or exact display string (e.g., `Semester 2 2025`).     |
| `pageNum`  | integer | `1`         | 1-based.                                                                  |
| `pageSize` | integer | `20`        | Recommend allowing up to 100.                                             |
| `sort`     | string  | `date_desc` | Accepts `date_desc`, `date_asc`, `grade_desc`, `grade_asc` (existing set). |

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "pageNum": 1,
    "pageSize": 20,
    "total": 2,
    "data": [
      {
        "assignmentId": 101,
        "assignmentName": "Pitch Presentation",
        "courseCode": "OAS2001",
        "courseName": "Oral Assessment Studio",
        "semester": "Semester 2 2025",
        "assignmentType": "mixed",
        "status": "RELEASED",
        "resultsReleased": true,
        "hasMixedRubric": true,
        "releasedAt": "2025-09-12T01:00:00Z",
        "assessedOn": "2025-09-10T03:45:00Z",
        "finalScore": {
          "grade": "A",
          "percentage": 88.7,
          "totalPoints": 88.7,
          "maxPoints": 100
        }
      }
    ]
  }
}
```

**Error responses**
- `403 / FORBIDDEN` – studentId not the authenticated user.
- `404 / NOT_FOUND` – student record missing.

---

## Endpoint 2 — Fetch final result detail
**GET** `/api/students/{studentId}/assignments/{assignmentId}/result`

Delivers the final rubric, totals, and combined feedback for a released assignment.

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignment": {
      "assignmentId": 101,
      "assignmentName": "Pitch Presentation",
      "courseCode": "OAS2001",
      "courseName": "Oral Assessment Studio",
      "semester": "Semester 2 2025",
      "type": "mixed",
      "status": "RELEASED",
      "resultsReleased": true,
      "resultsReleasedAt": "2025-09-12T01:00:00Z"
    },
    "release": {
      "released": true,
      "notifiedStudents": 1,
      "releasedAt": "2025-09-12T01:00:00Z",
      "finalisedBy": 301,
      "finalisedByName": "Alex Chen"
    },
    "session": {
      "sessionId": 5012,
      "sessionLabel": "Session 3 — 12 Sep",
      "startsAt": "2025-09-10T03:00:00Z",
      "endsAt": "2025-09-10T04:00:00Z"
    },
    "finalScore": {
      "grade": "A",
      "percentage": 88.7,
      "totalPoints": 88.7,
      "maxPoints": 100
    },
    "rubric": {
      "sections": [
        {
          "sectionType": "GROUP",
          "displayName": "Group Rubric",
          "weightShare": 60,
          "totalPoints": 54.5,
          "maxPoints": 60,
          "criteria": [
            {
              "criterionId": "G1",
              "name": "Collaboration",
              "weight": 30,
              "maxPoints": 30,
              "finalPoints": 27,
              "percentage": 90,
              "finalLevelLabel": "Outstanding",
              "commentsCombined": "Examiner A: Excellent coordination.\nExaminer B: Clear ownership across tasks.",
              "commentsByExaminer": [
                { "examinerId": 21, "examinerName": "Examiner A", "comment": "Excellent coordination." },
                { "examinerId": 34, "examinerName": "Examiner B", "comment": "Clear ownership across tasks." }
              ]
            }
          ]
        },
        {
          "sectionType": "INDIVIDUAL",
          "displayName": "Individual Rubric",
          "weightShare": 40,
          "totalPoints": 34.2,
          "maxPoints": 40,
          "criteria": [
            {
              "criterionId": "I1",
              "name": "Delivery",
              "weight": 30,
              "maxPoints": 20,
              "finalPoints": 16.8,
              "percentage": 84,
              "finalLevelLabel": "Very Good",
              "commentsCombined": "Examiner A: Strong vocal control.\nExaminer B: Could slow pace in Q&A.",
              "commentsByExaminer": [
                { "examinerId": 21, "examinerName": "Examiner A", "comment": "Strong vocal control." },
                { "examinerId": 34, "examinerName": "Examiner B", "comment": "Could slow pace in Q&A." }
              ]
            }
          ]
        }
      ],
      "aggregate": {
        "totalPoints": 88.7,
        "maxPoints": 100,
        "percentage": 88.7
      },
      "definition": {
        "meta": {
          "name": "Presentation Assignment Test Rubric",
          "description": "Presentation Assignment Test Rubric desc",
          "totalPoints": 100,
          "weightBasis": "points",
          "individualWeight": 50,
          "groupWeight": 50
        },
        "individualRubrics": [
          {
            "description": "Individual Criterion 1",
            "weight": 12.5,
            "scaleType": "points",
            "performanceLevel": [
              { "description": "Outstanding", "startPoint": 90, "endPoint": 100, "preDefinedComment": [] },
              { "description": "Very Good", "startPoint": 80, "endPoint": 89, "preDefinedComment": ["Test Predefined Comments 1"] }
            ]
          }
        ],
        "groupRubrics": [
          {
            "description": "Group Criterion 1",
            "weight": 25,
            "scaleType": "points",
            "performanceLevel": [
              { "description": "Outstanding", "startPoint": 90, "endPoint": 100, "preDefinedComment": [] },
              { "description": "Satisfactory", "startPoint": 60, "endPoint": 69, "preDefinedComment": ["That's awesome work, Congratulations!"] }
            ]
          }
        ]
      }
    },
    "feedback": {
      "overallCommentsCombined": "Examiner A: Great trajectory this semester.\nExaminer B: Focus on structuring evidence earlier.",
      "overallCommentsByExaminer": [
        { "examinerId": 21, "examinerName": "Examiner A", "comment": "Great trajectory this semester." },
        { "examinerId": 34, "examinerName": "Examiner B", "comment": "Focus on structuring evidence earlier." }
      ],
      "strengthsCombined": "Examiner A: Confident opening.",
      "improvementsCombined": "Examiner B: Practise timing your transitions."
    }
  }
}
```

**Error responses**
- `403 / FORBIDDEN`: student not authorised for the assignment.
- `404 / NOT_FOUND`: assignment does not exist or student not enrolled.
- `410 / NOT_RELEASED`: results exist but have not been released (`message`: "Results for this assignment haven't been released yet.").

---

## Behavioural Notes
- **Final aggregation**: Backend should calculate criterion `finalPoints` using the same logic as Admin Review Results (e.g., mean of examiner submissions after moderation/overrides). The value must match what admin released.
- **Mixed rubrics**: Determine `sections` by inspecting rubric meta (`groupRubrics`, `individualRubrics`). If only one block exists, return a single section.
- **Comments**: The backend is responsible for gathering all examiner comments (criterion-level + overall) that admins flagged for release and building both the array and combined string.
- **Caching**: Once immutable snapshots are available, include `Last-Modified` headers. Until then, responses should always reflect the latest released state.
- **Deprecations**: `GET /result/rubric`, `/result/rubric/scale`, and `/result/feedback` are deprecated. Clients should migrate to the unified detail endpoint.

---

## Validation & Testing Checklist
- Verify overview excludes unreleased assignments even if submissions exist.
- Confirm mixed assignments return two sections and that totals add up to `aggregate.totalPoints`.
- Ensure newline formatting survives JSON encoding (front end renders using `white-space: pre-line`).
- Regression tests should cover:
  1. Single examiner vs multiple examiners (averaging logic).
  2. Mixed rubric with missing comments (combined string should omit blank lines).
  3. Access control: student cannot fetch another student’s results.

---

## Future Enhancements (Non-blocking)
- Deliver localisation keys for rubric section titles.
- Include moderation audit metadata (e.g., override reason) when product decides to expose it.
- Introduce ETag/If-None-Match once final snapshotting is implemented.
