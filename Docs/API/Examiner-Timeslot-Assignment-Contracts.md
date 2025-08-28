## Examiner Timeslot Assignment — API Contracts (MVP)

This contract aligns with existing API patterns and wrappers. It includes per‑endpoint requests, responses, and error examples.

### 1) Conventions
- Auth: `Authorization: Bearer <accessToken>` (JWT).
- Paths: plural resources, assignment‑centric where applicable (`/api/examiners/*`, `/api/assignments/*`).
- Wrapper: `{ success: boolean, code: 'OK' | <ERROR_CODE>, data: <payload> }`.
- Pagination: `pageNum`, `pageSize` with list payload `{ pageNum, pageSize, total, data: [] }`.
- Time: ISO 8601 with timezone (e.g., `2025-04-14T10:00:00+10:00`).

### 2) Scope Notes (MVP)
- Enforce maximum sessions per examiner per assignment (no minimum).
- Students see slots only when `currentExaminers >= requiredExaminers`.
- Use polling (≈30s) on selection pages (no websockets in MVP).

### 3) List Assignments Available to Examiner

Endpoint
- `GET /api/examiners/{examinerId}/assignments`

Query
- `courseId?`, `pageNum?`, `pageSize?`, `sort?=date_asc|date_desc`

Response
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "pageNum": 0,
    "pageSize": 20,
    "total": 1,
    "data": [
      {
        "assignmentId": 101,
        "assignmentName": "Mid-Semester Oral Assessment",
        "courseCode": "COMP90082",
        "courseName": "Software Project",
        "assessmentType": "GROUP",
        "sessionDurationMinutes": 30,
        "requiredExaminers": 2,
        "availableTimeslots": 6,
        "earliestTimeslot": "2025-04-14T09:00:00+10:00",
        "latestTimeslot": "2025-04-16T15:00:00+10:00",
        "examinerInfo": {
          "maxSessions": 10,
          "currentAssignedSessions": 3,
          "remainingCapacity": 7
        },
        "signupDeadline": "2025-04-12T17:00:00+10:00"
      }
    ]
  }
}
```

Errors
- `FORBIDDEN` if `examinerId` doesn’t match authenticated user and caller lacks privilege.

### 4) List Timeslots for Selection

Endpoint
- `GET /api/assignments/{assignmentId}/timeslots`

Query
- `examinerId` (required), `date?=YYYY-MM-DD`, `includeFullSlots?=false`, `pageNum?`, `pageSize?`

Response
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignment": {
      "assignmentId": 101,
      "assignmentName": "Mid-Semester Oral Assessment",
      "courseCode": "COMP90082",
      "courseName": "Software Project",
      "assessmentType": "GROUP"
    },
    "examinerInfo": {
      "maxSessions": 10,
      "currentAssignedSessions": 3,
      "remainingCapacity": 7
    },
    "timeSlots": [
      {
        "slotId": 5001,
        "start": "2025-04-14T10:00:00+10:00",
        "end": "2025-04-14T11:00:00+10:00",
        "timezone": "Australia/Melbourne",
        "venue": { "venueId": 31, "name": "Engineering", "building": "ENG", "room": "405" },
        "sessionCount": 2,
        "requiredExaminers": 2,
        "currentExaminers": 1,
        "isFull": false,
        "availability": { "canSelect": true }
      },
      {
        "slotId": 5002,
        "start": "2025-04-14T10:30:00+10:00",
        "end": "2025-04-14T11:30:00+10:00",
        "timezone": "Australia/Melbourne",
        "venue": { "venueId": 31, "name": "Engineering", "building": "ENG", "room": "405" },
        "sessionCount": 1,
        "requiredExaminers": 2,
        "currentExaminers": 2,
        "isFull": true,
        "availability": { "canSelect": false, "reason": "SLOT_FULL" }
      }
    ]
  }
}
```

Notes
- Server may set `availability.reason = "TIME_CONFLICT"` for slots overlapping with the examiner’s existing schedule.

### 5) Assign Examiner to Timeslots (Bulk)

Endpoint
- `POST /api/assignments/{assignmentId}/timeslots/assign`

Request
```json
{
  "examinerId": 601,
  "slotAssignments": [ { "slotId": 5001 }, { "slotId": 5003 } ]
}
```

Validation order
- Auth → eligibility (examiner is a member) → signup deadline (optional) → overlap against existing schedule → max sessions (sum of sessionCount) → per‑slot capacity.

Response (200 OK — partial success supported)
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignmentId": 101,
    "examinerId": 601,
    "assignedSlots": [
      { "slotId": 5001, "start": "2025-04-14T10:00:00+10:00", "end": "2025-04-14T11:00:00+10:00", "sessionCount": 2 }
    ],
    "failedSlots": [
      { "slotId": 5003, "reason": "SLOT_FULL" }
    ],
    "stats": { "addedSessions": 2, "totalAssignedSessions": 5 },
    "partial": true
  }
}
```

Errors
- `400 VALIDATION_ERROR` — malformed body
- `403 FORBIDDEN` — not eligible for assignment
- `409 SLOT_FULL` — all requested slots became full (none assigned)
- `409 TIME_CONFLICT` — all requested slots overlap with existing schedule (none assigned)
- `410 DEADLINE_PASSED` — signup deadline passed
- `422 LIMIT_EXCEEDED` — would exceed max sessions

### 6) Get Examiner Schedule

Endpoint
- `GET /api/examiners/{examinerId}/schedule`

Query
- `assignmentId?`, `date?=YYYY-MM-DD`, `dateFrom?=YYYY-MM-DD`, `dateTo?=YYYY-MM-DD`

Response
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignments": [
      {
        "assignmentId": 101,
        "assignmentName": "Mid-Semester Oral Assessment",
        "courseCode": "COMP90082",
        "courseName": "Software Project",
        "slots": [
          {
            "slotId": 5001,
            "start": "2025-04-14T10:00:00+10:00",
            "end": "2025-04-14T11:00:00+10:00",
            "venue": { "name": "Engineering", "building": "ENG", "room": "405" },
            "sessionCount": 2,
            "requiredExaminers": 2,
            "currentExaminers": 2,
            "isBooked": true,
            "bookingCount": 2,
            "canWithdraw": false,
            "cannotWithdrawReason": "STUDENT_BOOKED"
          }
        ]
      }
    ]
  }
}
```

### 7) Unassign Examiner from Timeslot

Endpoint
- `DELETE /api/assignments/{assignmentId}/timeslots/{slotId}/unassign?examinerId={examinerId}`

Response
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignmentId": 101,
    "slotId": 5001,
    "examinerId": 601,
    "updatedAssignedSessions": 3
  }
}
```

Errors
- `403 FORBIDDEN` — not owner of slot or not assigned
- `404 NOT_FOUND` — slot or assignment not found for this examiner
- `409 STUDENT_BOOKED` — withdrawal blocked because students booked this slot
- `409 SESSION_STARTED` — withdrawal blocked because session has started or passed

### 8) Backend Notes
- Concurrency & locking: Use DB constraints and row‑level locks to avoid race conditions on slot capacity and overlap.
- Overlap check: Compare requested slot windows with examiner’s existing assigned slots (same day and time window intersection).
- Membership: Examiner must be an assignment member to self‑assign.
- Withdrawal rules: Allow withdrawal only when no students have booked sessions in that timeslot. Optionally block withdrawal for sessions that have already started.

### 9) Performance & Freshness
- Paginate long lists with `pageNum` and `pageSize`.
- Include `Last-Modified` and honor `If-Modified-Since` on list endpoints (optional optimization for polling).
