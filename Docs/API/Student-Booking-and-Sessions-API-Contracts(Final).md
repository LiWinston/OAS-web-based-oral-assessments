# Student Booking — Sessions-Only Minimal Update
This addendum applies minimal changes to use Sessions as the only bookable entity and avoid timeslot-level structures in student APIs.

Endpoint usage (no new concepts added):
- List bookable items by date → `GET /api/assignments/{assignmentId}/sessions?studentId={studentId}&date=YYYY-MM-DD`
  - Return a flat `sessions[]` list for the date. Do not include `timeSlots[]` wrapper.
  - Only include sessions that are actually bookable for the student (backend filters; no extra visibility rules here).
- Create booking → `POST /api/assignments/{assignmentId}/bookings` (unchanged)
- Cancel booking → `DELETE /api/assignments/{assignmentId}/bookings/{sessionId}?studentId={studentId}` (unchanged)
- Reschedule (atomic) → `POST /api/assignments/{assignmentId}/bookings/{sessionId}/reschedule` (unchanged)

Minimal response shape changes:
- Remove any `timeSlots` section from list responses; return `sessions: [ { sessionId, start, end, venue, capacity { bookedCount, capacity } } ]`.
- Coverage and capacity remain read‑only; UI simply shows sessions the student can book.

Backend actions required (precise changes)
- List bookable sessions
  - Path: `GET /api/assignments/{assignmentId}/sessions`
  - Query: `studentId` (required), `date` (YYYY-MM-DD), `pageNum`, `pageSize`, `includeReasons=true|false`
  - Return: `{ success, code, data: { sessions: [ { sessionId, start, end, venue, capacity: { bookedCount, capacity }, availability: { canBook, reason? } } ], pollingHintSeconds? } }`
  - Only return actually bookable sessions when `includeReasons=false` (recommended for student UI). When `includeReasons=true`, include disabled entries with `availability.reason`.

- Create booking
  - Path: `POST /api/assignments/{assignmentId}/bookings`
  - Body (GROUP/MIXED): `{ studentId, sessionId, groupId }` — one booking per group per assignment
  - Body (INDIVIDUAL): `{ studentId, sessionId }`
  - Response: `{ success: true, data: { bookingId, assignmentId, entity, session: { sessionId, start, end, venue } } }`
  - Enforce capacity: block when `bookedCount >= capacity` with `409 SESSION_TAKEN`

- Cancel booking
  - Path: `DELETE /api/assignments/{assignmentId}/bookings/{sessionId}`
  - Query: `studentId` (required)
  - Response: `{ success: true, code: 'OK' }`

- Reschedule booking (atomic)
  - Path: `POST /api/assignments/{assignmentId}/bookings/{sessionId}/reschedule`
  - Body: `{ studentId, targetSessionId }`
  - Behavior: Book target first; only release old on success; otherwise keep old booking
  - Response: `{ success: true, data: { fromSessionId, toSessionId, bookingId } }`

Example: bookable sessions
```
GET /api/assignments/42/sessions?studentId=12345&date=2025-04-15
200 OK
{
  "success": true,
  "code": "OK",
  "data": {
    "sessions": [
      { "sessionId": 90011, "start": "2025-04-15T10:00:00+10:00", "end": "2025-04-15T10:30:00+10:00", "venue": { "venueId": 12, "name": "ENG 405" }, "capacity": { "bookedCount": 0, "capacity": 1 }, "availability": { "canBook": true } }
    ],
    "pollingHintSeconds": 30
  }
}
```

Student availability simplification:
- No additional policy logic needed in the UI. Only render sessions returned by the backend as bookable.

All other sections below remain valid where they reference session fields. Where “timeslot” groupings appear, treat them as deprecated in favor of the flat `sessions[]` list.

---

# Student Booking & Sessions API — Contracts (Final)
Version: 1.0 • Status: Approved (Open Questions 1–10 resolved) • Last updated: 2025‑08‑28

## Conventions
- **Auth**: `Authorization: Bearer <accessToken>` (JWT).
- **Wrapper** (standardized): `{ "success": boolean, "code": "OK" | "<ERROR>", "data": <payload>, "message"?: string }`.
- **Time**: ISO‑8601 with timezone for **all** datetime fields.
- **Idempotency**: `Idempotency-Key` header supported for `POST /bookings` and `POST /reschedule`.
- **Conditional requests**: `Last-Modified` + `If-Modified-Since` on hot lists (sessions; booking).
- **Polling hint**: `pollingHintSeconds: 30` may be returned in availability responses.

---

## Data Models (excerpt)
- **Assignment**: `{ assignmentId, name, assessmentType: "INDIVIDUAL"|"GROUP"|"MIXED", ... }`
- **Timeslot**: `{ slotId, start, end, timezone, venue, requiredExaminers, currentExaminers }`
- **Session**: `{ sessionId, slotId, start, end, status: "available"|"unavailable", availability: { canBook, reason? } }`
- **Booking**: `{ bookingId, assignmentId, entity: { type: "GROUP"|"STUDENT", groupId?, studentId? }, session: {...} }`
- **Venue**: `{ venueId, name, building?, room? }`

**Reason codes**
- Visibility/validation: `SLOT_UNSTAFFED`, `SESSION_TAKEN`, `ALREADY_BOOKED`, `LOCKOUT_WINDOW`, `DEADLINE_PASSED`, `NOT_ELIGIBLE`

---

## 1) List student’s assignments (header/CTA)
**GET** `/api/students/{studentId}/assignments?status=bookable|booked|all&pageNum=&pageSize=&sort=date_asc|date_desc`

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "pageNum": 0,
    "pageSize": 20,
    "total": 1,
    "data": [{
      "assignmentId": 101,
      "assignmentName": "Oral Exam 1",
      "courseCode": "COMP90082",
      "assessmentType": "GROUP",
      "sessionDurationMinutes": 30,
      "booking": { "hasActiveBooking": false },
      "availability": {
        "released": true,
        "availableSessions": 5,
        "earliestSession": "2025-04-14T09:00:00+10:00",
        "latestSession": "2025-04-16T15:00:00+10:00",
        "reschedulingEnabled": true,
        "bookingDeadline": "2025-04-12T17:00:00+10:00",
        "lockoutEnabled": true,
        "lockoutWindowHours": 24,
        "pollingHintSeconds": 30
      }
    }]
  }
}
```

---

## 2) Assignment availability summary (policies + quick stats)
**GET** `/api/assignments/{assignmentId}/availability?studentId={studentId}`

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignmentId": 101,
    "assessmentType": "GROUP",
    "released": true,
    "visibilityRule": "ONLY_FULLY_STAFFED",
    "reschedulingEnabled": true,
    "bookingDeadline": "2025-04-12T17:00:00+10:00",
    "lockoutEnabled": true,
    "lockoutWindowHours": 24,
    "summary": {
      "totalSlots": 12,
      "totalSessions": 36,
      "availableSessions": 5,
      "daysWithAvailability": ["2025-04-14", "2025-04-16"]
    },
    "pollingHintSeconds": 30
  }
}
```

---

## 3) List **bookable sessions** (grouped by slot/day)
**GET** `/api/assignments/{assignmentId}/sessions?studentId={studentId}&date=YYYY-MM-DD&pageNum=&pageSize=&includeReasons=true`

- **Server filtering**: Exclude any timeslot with `currentExaminers < requiredExaminers`.
- **Include** `availability.reason` for disabled entries when `includeReasons=true`.

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignment": {
      "assignmentId": 101,
      "assignmentName": "Oral Exam 1",
      "assessmentType": "GROUP"
    },
    "calendar": { "date": "2025-04-14" },
    "timeSlots": [{
      "slotId": 5001,
      "start": "2025-04-14T10:00:00+10:00",
      "end": "2025-04-14T11:30:00+10:00",
      "timezone": "Australia/Melbourne",
      "venue": { "venueId": 31, "name": "Engineering", "building": "ENG", "room": "405" },
      "requiredExaminers": 2,
      "currentExaminers": 2,
      "isFullyStaffed": true,
      "sessions": [
        {
          "sessionId": 90011,
          "start": "2025-04-14T10:00:00+10:00",
          "end": "2025-04-14T10:30:00+10:00",
          "status": "available",
          "availability": { "canBook": true }
        },
        {
          "sessionId": 90012,
          "start": "2025-04-14T10:35:00+10:00",
          "end": "2025-04-14T11:05:00+10:00",
          "status": "unavailable",
          "availability": { "canBook": false, "reason": "SESSION_TAKEN" }
        }
      ]
    }]
  }
}
```

**304 Not Modified** — when `If-Modified-Since` indicates no changes.

---

## 4) Create booking (atomic)
**POST** `/api/assignments/{assignmentId}/bookings`  
**Headers**: `Idempotency-Key: <uuid>` (optional)

**Request**
```json
{
  "studentId": 201,
  "sessionId": 90011,
  "groupId": 501  // required for GROUP or MIXED; omitted for INDIVIDUAL
}
```

**Validation order**
Auth & eligibility → schedule released → visibility (slot fully staffed) → **one active booking per entity** → deadline/lockout → session availability (row‑lock) → commit.

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "bookingId": 70001,
    "assignmentId": 101,
    "entity": { "type": "GROUP", "groupId": 501 },
    "session": {
      "sessionId": 90011,
      "slotId": 5001,
      "start": "2025-04-14T10:00:00+10:00",
      "end": "2025-04-14T10:30:00+10:00",
      "timezone": "Australia/Melbourne",
      "venue": { "venueId": 31, "name": "Engineering", "building": "ENG", "room": "405" }
    },
    "notifications": { "emailQueued": true, "icsUrl": "/api/calendar/booking/70001.ics" }
  }
}
```

**Errors**
- `409 SESSION_TAKEN`
- `409 ALREADY_BOOKED`
- `409 SLOT_UNSTAFFED`
- `410 DEADLINE_PASSED`
- `423 LOCKOUT_WINDOW`
- `403 FORBIDDEN`

---

## 5) Get current booking (per assignment)
**GET** `/api/students/{studentId}/assignments/{assignmentId}/booking`

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "hasActiveBooking": true,
    "booking": {
      "bookingId": 70001,
      "entity": { "type": "GROUP", "groupId": 501 },
      "session": {
        "sessionId": 90011,
        "slotId": 5001,
        "start": "2025-04-14T10:00:00+10:00",
        "end": "2025-04-14T10:30:00+10:00",
        "timezone": "Australia/Melbourne",
        "venue": { "name": "Engineering", "building": "ENG", "room": "405" }
      },
      "reschedulingEnabled": true,
      "bookingDeadline": "2025-04-12T17:00:00+10:00",
      "lockoutEnabled": true,
      "lockoutWindowHours": 24
    }
  }
}
```

**304 Not Modified** — allow conditional fetch with `If-Modified-Since`.

---

## 6) Reschedule (atomic swap)
**POST** `/api/assignments/{assignmentId}/bookings/{bookingId}/reschedule`  
**Headers**: `Idempotency-Key` (optional)

**Request**
```json
{
  "studentId": 201,
  "targetSessionId": 90021
}
```

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "bookingId": 70001,
    "fromSessionId": 90011,
    "toSessionId": 90021,
    "notifications": { "emailQueued": true, "icsUrl": "/api/calendar/booking/70001.ics" }
  }
}
```

**Errors**: `DEADLINE_PASSED`, `LOCKOUT_WINDOW`, `SESSION_TAKEN`, `SLOT_UNSTAFFED`

---

## 7) Cancel booking
**DELETE** `/api/assignments/{assignmentId}/bookings/{bookingId}?studentId={studentId}`

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": { "bookingId": 70001, "status": "CANCELLED" }
}
```

**Errors**: `DEADLINE_PASSED`, `LOCKOUT_WINDOW` (if policy disallows)

---

## 8) Group context (banner/UX)
**GET** `/api/students/{studentId}/assignments/{assignmentId}/group`

**200 OK**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "groupId": 501,
    "groupName": "Team Alpha",
    "members": [
      { "studentId": 201, "name": "Bob Student", "email": "bob@student.unimelb.edu.au" },
      { "studentId": 202, "name": "Ava Student", "email": "ava@student.unimelb.edu.au" }
    ]
  }
}
```

---

## Backend/DB Notes
- **Atomicity**: Row‑level locks on `Session` prevent double‑booking; unique constraint on `(assignmentId, entityId)` enforces one booking per entity.  
- **Visibility**: Listing excludes unstaffed timeslots; booking endpoint re‑checks staffing at commit.  
- **Time math**: Persist and return ISO datetimes; avoid client side DST arithmetic.  
- **Notifications**: Queue emails on book/reschedule/cancel; include ICS.  
- **Observability**: Emit structured logs for each booking transition with reason codes.

---

## HTTP Status & Error Codes
- `200 OK | 201 Created | 204 No Content | 304 Not Modified`
- `400 VALIDATION_ERROR`
- `401 UNAUTHENTICATED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 SESSION_TAKEN | SLOT_UNSTAFFED | ALREADY_BOOKED | TIME_CONFLICT`
- `410 DEADLINE_PASSED`
- `423 LOCKOUT_WINDOW`
- `429 RATE_LIMITED`
