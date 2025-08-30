# Student Results API — Contracts (Final)
Version: 1.0 • Status: Proposed for Approval • Last updated: 2025‑08‑30

## Conventions
- **Auth**: `Authorization: Bearer <accessToken>` (JWT).
- **Wrapper** (standardized): `{ "success": boolean, "code": "OK" | "<ERROR>", "data": <payload>, "message"?: string }`.
- **Time**: ISO‑8601 with timezone for **all** datetime fields.
- **Conditional requests**: `Last-Modified` + `If-Modified-Since` on result lists and details.
- **Caching hint**: `cachingHintSeconds: 3600` may be returned in result responses (results are static once released).

---

## Data Models (excerpt)
- **Assignment**: `{ assignmentId, name, courseCode, courseName, assessmentType: "INDIVIDUAL"|"GROUP"|"MIXED", semester, ... }`
- **Result**: `{ resultId, assignmentId, studentId, groupId?, finalGrade, percentage, totalPoints, maxPoints, resultStatus: "released"|"pending", assessedOn, releasedOn }`
- **RubricCriterion**: `{ criterionId, name, description, weight, maxPoints, earnedPoints, examinerScores[], comments[] }`
- **ExaminerFeedback**: `{ examinerId, examinerName, overallComment, criterionFeedback[], submittedOn }`
- **RubricBreakdown**: `{ criteria: RubricCriterion[], aggregationMethod: "average"|"maximum"|"minimum", finalCalculation }`

**Reason codes**
- Visibility/access: `NOT_RELEASED`, `NOT_ASSESSED`, `FORBIDDEN`, `NOT_FOUND`, `NO_RESULTS_AVAILABLE`

---

## 1) List student's assignments with results (overview)
**GET** `/api/students/{studentId}/results?status=released|all&semester=current|all&pageNum=&pageSize=&sort=date_desc|date_asc|grade_desc`

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "pageNum": 0,
    "pageSize": 20,
    "total": 3,
    "data": [{
      "assignmentId": 101,
      "assignmentName": "Network Security Project",
      "courseCode": "COMP30023",
      "courseName": "Computer Networks",
      "semester": "2024 Semester 2",
      "assessmentType": "GROUP",
      "result": {
        "resultId": 5001,
        "finalGrade": "A",
        "percentage": 92,
        "totalPoints": 92,
        "maxPoints": 100,
        "resultStatus": "released",
        "assessedOn": "2024-10-15T14:30:00+11:00",
        "releasedOn": "2024-10-20T09:00:00+11:00"
      },
      "hasDetailedFeedback": true
    }, {
      "assignmentId": 102,
      "assignmentName": "Oral Presentation",
      "courseCode": "COMP90082",
      "courseName": "Software Project",
      "semester": "2024 Semester 1",
      "assessmentType": "INDIVIDUAL",
      "result": {
        "resultId": 5002,
        "finalGrade": "B+",
        "percentage": 78,
        "totalPoints": 78,
        "maxPoints": 100,
        "resultStatus": "released",
        "assessedOn": "2024-05-20T10:00:00+10:00",
        "releasedOn": "2024-05-25T16:00:00+10:00"
      },
      "hasDetailedFeedback": true
    }],
    "cachingHintSeconds": 3600
  }
}
```

---

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
      "semester": "2024 Semester 2"
    },
    "result": {
      "resultId": 5001,
      "entity": { "type": "GROUP", "groupId": 301, "groupName": "Team Alpha" },
      "finalGrade": "A",
      "percentage": 92,
      "totalPoints": 92,
      "maxPoints": 100,
      "resultStatus": "released",
      "assessedOn": "2024-10-15T14:30:00+11:00",
      "releasedOn": "2024-10-20T09:00:00+11:00",
      "aggregationMethod": "average",
      "examinerCount": 2
    },
    "summary": {
      "criteriaCount": 3,
      "highestCriterion": "Technical Implementation",
      "lowestCriterion": "Documentation",
      "feedbackItemsCount": 5
    }
  }
}
```

**304 Not Modified** — when `If-Modified-Since` indicates no changes.

---

## 3) Get detailed rubric breakdown
**GET** `/api/students/{studentId}/assignments/{assignmentId}/result/rubric`

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "resultId": 5001,
    "rubricBreakdown": {
      "aggregationMethod": "average",
      "criteria": [{
        "criterionId": 1,
        "name": "Technical Implementation",
        "description": "Quality of code and security protocols",
        "weight": 50,
        "maxPoints": 50,
        "earnedPoints": 45,
        "examinerScores": [
          { "examinerId": 201, "examinerName": "Dr. Smith", "points": 46, "level": "Very Good" },
          { "examinerId": 202, "examinerName": "Prof. Johnson", "points": 44, "level": "Good" }
        ],
        "comments": [
          "Excellent implementation of security protocols with robust error handling.",
          "Code structure is well-organized and follows best practices."
        ]
      }, {
        "criterionId": 2,
        "name": "Presentation",
        "description": "Clarity and technical communication",
        "weight": 30,
        "maxPoints": 30,
        "earnedPoints": 28,
        "examinerScores": [
          { "examinerId": 201, "examinerName": "Dr. Smith", "points": 29, "level": "Very Good" },
          { "examinerId": 202, "examinerName": "Prof. Johnson", "points": 27, "level": "Good" }
        ],
        "comments": [
          "Clear presentation with good technical explanations of complex concepts."
        ]
      }]
    }
  }
}
```

---

## 4) Get examiner feedback
**GET** `/api/students/{studentId}/assignments/{assignmentId}/result/feedback`

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "resultId": 5001,
    "examinerFeedback": [{
      "examinerId": 201,
      "examinerName": "Dr. Smith",
      "overallComment": "Excellent work overall. Strong technical implementation with clear presentation.",
      "criterionFeedback": [{
        "criterionId": 1,
        "criterionName": "Technical Implementation",
        "comment": "Excellent implementation of security protocols with robust error handling.",
        "strengths": ["Strong error handling", "Clean code structure"],
        "improvements": []
      }],
      "submittedOn": "2024-10-15T15:00:00+11:00"
    }, {
      "examinerId": 202,
      "examinerName": "Prof. Johnson",
      "overallComment": "Good project with solid technical foundation. Documentation needs improvement.",
      "criterionFeedback": [{
        "criterionId": 3,
        "criterionName": "Documentation",
        "comment": "Documentation could be more detailed, especially regarding the API endpoints.",
        "strengths": ["Good overall structure"],
        "improvements": ["More detailed API documentation", "Complete all sections"]
      }],
      "submittedOn": "2024-10-15T15:30:00+11:00"
    }],
    "consolidatedFeedback": {
      "strengths": [
        "Excellent implementation of security protocols with robust error handling",
        "Clear presentation with good technical explanations"
      ],
      "improvements": [
        "Documentation could be more detailed, especially regarding the API endpoints"
      ]
    }
  }
}
```

---

## Backend/DB Notes
- **Data integrity**: Results are immutable once released; any changes require Course Admin intervention.
- **Aggregation**: Multi-examiner scores aggregated per Course Admin settings (average/max/min).
- **Caching**: Results are static post-release; aggressive caching (1 hour+) recommended.
- **Access control**: Students can only access their own results; group results visible to all group members.
- **Audit trail**: All result access logged for academic integrity monitoring.

---

## HTTP Status & Error Codes
- `200 OK | 304 Not Modified`
- `400 VALIDATION_ERROR`
- `401 UNAUTHENTICATED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `410 NOT_RELEASED`
- `423 NOT_ASSESSED`
