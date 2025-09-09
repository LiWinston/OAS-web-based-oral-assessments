# Sessions-Only Scheduling — API Changes (Proposal)

Purpose: transition from time slot–based scheduling (timeSlots containing sessions, examiners assigned to timeSlots) to sessions as the primary entity (examiners assigned directly to sessions). This document lists new endpoints, modifications, and deprecations. The existing docs remain unchanged; this file captures what else needs to be created or modified.

Base prefix: `/api/admin/assignments/{assignmentId}` unless noted. Response envelopes follow existing pattern: `{ success, code, data }`.

## 1) Concepts and Entity Changes

- Remove: TimeSlot entity from admin scheduling APIs.
- New primary entity: Session.
  - Core fields: `id`, `date` (YYYY-MM-DD), `startTime` (LocalTime), `endTime` (LocalTime), `venueId`, `requiredExaminers` (per-session), `capacity` (student groups per session, default 1), `assignedExaminers[]`, `bookedCount`, `status` (available/blocked/booked/closed).
  - Concurrency: if `capacity > 1`, multiple student groups can book the same session concurrently; server tracks concurrent bookings via `bookedCount` and enforces `remainingCapacity = capacity - bookedCount`.
- Session generation: replace global Session Config with on-demand batch generation parameters (length, gapTime, startTime, count, venueId, requiredExaminers, capacity).

## 2) New Endpoints (Admin)

### Get Sessions
- `GET /api/admin/assignments/{assignmentId}/sessions`
- Query: `date` (optional, YYYY-MM-DD), `status` (optional: available, blocked, booked, closed), `venueId` (optional)
- Response: `ResultGetSessionsResponseDTO` with `{ sessions: SessionDetailDTO[], summary }`

### Batch Create Sessions (Generator)
- `POST /api/admin/assignments/{assignmentId}/sessions/generate`
- Purpose: generate N contiguous sessions from a start time using `length` and `gapTime`.
- Body `GenerateSessionsRequestDTO`:
```json
{
  "date": "2025-04-15",
  "startTime": "09:00",
  "count": 6,
  "length": 30,
  "gapTime": 5,
  "venueId": 12,
  "requiredExaminers": 2,
  "capacity": 1
}
```
- Response: `ResultBatchCreateSessionsResponseDTO` → `{ createdCount, sessions: SessionDetailDTO[] }`

### Batch Create Sessions (Explicit)
- `POST /api/admin/assignments/{assignmentId}/sessions/batch`
- Purpose: create explicit sessions (no generator logic).
- Body `BatchCreateSessionsRequestDTO`:
```json
{
  "sessions": [
    { "date": "2025-04-15", "startTime": "09:00", "endTime": "09:30", "venueId": 12, "requiredExaminers": 2, "capacity": 1 },
    { "date": "2025-04-15", "startTime": "09:35", "endTime": "10:05", "venueId": 12, "requiredExaminers": 2, "capacity": 1 }
  ]
}
```
- Response: `ResultBatchCreateSessionsResponseDTO`

### Update Session
- `PUT /api/admin/assignments/{assignmentId}/sessions/{sessionId}`
- Body `SessionRequestDTO` (all required unless stated):
```json
{
  "date": "2025-04-15",
  "startTime": "09:00",
  "endTime": "09:30",
  "venueId": 12,
  "requiredExaminers": 2,
  "capacity": 1
}
```
- Response: `ResultSessionResponseDTO` → `{ session: SessionDetailDTO }`

### Delete Sessions (Batch)
- `DELETE /api/admin/assignments/{assignmentId}/sessions`
- Body:
```json
{ "sessionIds": [101, 102, 103] }
```
- Response: `ResultVoid` with deletion summary in `code`/message

### Assign/Unassign Examiners to Sessions (Batch)
- `PUT /api/admin/assignments/{assignmentId}/sessions/examiners`
- Purpose: add/remove/set examiners for multiple sessions at once.
- Body `UpdateSessionsExaminersRequestDTO`:
```json
{
  "sessionIds": [101, 102, 103],
  "examinerIds": [5, 6],
  "action": "add"        
}
```
- `action`: `add` | `remove` | `set`
- Semantics: all-or-nothing. If any conflict (e.g., time overlap, max limit), no changes are applied.
- Response (success): `ResultUpdateSessionsExaminersResponseDTO` → `{ updatedSessionIds: [..] }`
- Error (conflict): `409 Conflict` with body `{ success: false, code: "SESSION_ASSIGNMENT_CONFLICT", data: { conflicts: [ { sessionId, reason } ] } }`

### Get Available Examiners (session-aware)
- `GET /api/admin/assignments/{assignmentId}/examiners`
- Query: `sessionId` (optional, replaces `timeSlotId`)
- Response unchanged envelope; server uses `sessionId` for conflict checks.

## 3) Examiner Self-Assignment (Non-Admin) — Session-Based

Prefix: `/api/assignments/{assignmentId}`

- `GET /sessions` — list assignable sessions for an examiner; supports `examinerId` query.
- `POST /sessions/assign` Body: `{ "sessionIds": [..] }` — assign current examiner to sessions (validates conflicts/limits).
- `DELETE /sessions/{sessionId}/unassign?examinerId=...` — withdraw before cutoff.

## 4) Student Booking (Capacity)

- Session now holds `capacity` (number of student groups allowed; default 1) and `bookedCount`.
- Booking endpoints must enforce `remainingCapacity = capacity - bookedCount` and allow concurrent bookings within the same time window when `capacity > 1`.
- Responses should include `bookedCount` (and optionally `remainingCapacity`) so UI can display concurrent occupancy.

## 5) Deprecations and Migrations

Deprecate the following TimeSlot endpoints (keep for a grace period; respond with 410 or map to sessions where feasible):
- `GET /api/admin/assignments/{id}/timeslots`
- `POST /api/admin/assignments/{id}/timeslots/batch`
- `PUT /api/admin/assignments/{id}/timeslots/{timeSlotId}`
- `DELETE /api/admin/assignments/{id}/timeslots`
- `PUT /api/admin/assignments/{id}/timeslots/{timeSlotId}/examiners`
- Examiner routes under `/api/assignments/{id}/timeslots*`

Data migration strategy:
- Not applicable for now (no existing data). Proceed with new session-centric schema and retire TimeSlot structures.

## 6) Schemas (DTOs)

Note: `LocalTime` follows the existing schema with example string rendering (e.g., "09:00").

SessionRequestDTO
```json
{
  "date": "2025-04-15",
  "startTime": "09:00",
  "endTime": "09:30",
  "venueId": 12,
  "requiredExaminers": 2,
  "capacity": 1
}
```

SessionDetailDTO (response)
```json
{
  "id": 101,
  "date": "2025-04-15",
  "startTime": "09:00",
  "endTime": "09:30",
  "venueId": 12,
  "requiredExaminers": 2,
  "capacity": 1,
  "assignedExaminers": [{ "id": 5, "name": "Dr. A" }],
  "bookedCount": 0,
  "remainingCapacity": 1,
  "status": "available",
  "createdAt": "2025-08-26T09:00:00Z",
  "lastModified": "2025-08-26T10:30:00Z"
}
```

GenerateSessionsRequestDTO
```json
{
  "date": "2025-04-15",
  "startTime": "09:00",
  "count": 6,
  "length": 30,
  "gapTime": 5,
  "venueId": 12,
  "requiredExaminers": 2,
  "capacity": 1
}
```

BatchCreateSessionsRequestDTO
```json
{ "sessions": [ SessionRequestDTO, SessionRequestDTO ] }
```

ResultGetSessionsResponseDTO
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "sessions": [ SessionDetailDTO ],
    "summary": { "totalSessions": 12, "fullyStaffed": 2, "partiallyStaffed": 5, "unstaffed": 5 }
  }
}
```

UpdateSessionsExaminersRequestDTO
```json
{ "sessionIds": [101], "examinerIds": [5,6], "action": "add" }
```

## 7) Release & Validation Updates

- Release validation moves from TimeSlot-level to Session-level:
  - Examiner coverage: each session meets `requiredExaminers`.
  - Venue conflicts: no overlapping sessions in same venue.
  - Capacity: sessions expose `remainingCapacity` for student booking visibility.

## 8) Frontend Integration Notes

- Remove use of `/session-config`; wizard uses generator inputs on demand.
- Management UI becomes “Sessions”: list, select, batch delete (backend), and batch assign examiners (new endpoint above).
- Schedule page (wizard) supports local creation and local deletion before submit (no backend calls) — use `POST /sessions/generate` or `POST /sessions/batch` only when completing the step.

## 9) Decisions (confirmed)

- Capacity: default `capacity = 1`; when `capacity > 1`, multiple groups can book concurrently, tracked by `bookedCount` and `remainingCapacity`.
- Batch assign: all-or-nothing — any conflict yields `409` and no updates applied.
- Migration: no existing data; implement session-centric schema and retire TimeSlot.
