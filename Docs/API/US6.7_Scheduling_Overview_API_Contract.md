# US 6.7 – Scheduling Overview Report — API Contract (Interactive, Read‑Only)

Version: 1.0 • Status: Sessions‑only, aligned with Spring Boot (Sep 2025)

This contract supports an interactive but read‑only Scheduling Overview. It uses existing sessions‑only endpoints. No write operations are required (no publish toggles, assignment, or session mutations).

## Conventions
- Auth: `Authorization: Bearer <accessToken>` (JWT)
- Wrapper: `{ success: boolean, code: string, data: <payload> }`
- Time: Backend may return `LocalDate` + `LocalTime` or ISO‑8601 with timezone; UI renders in Australia/Melbourne

## Data Models (DTO snapshot)
- List DTO: `AdminSessionsListResponseDTO`
  - `sessions: Item[]`
  - `summary: { totalSessions, fullyStaffed, partiallyStaffed, unstaffed, totalRequiredExaminers }`
  - `outsideAssignmentRange?: boolean`, `message?: string`
- Row DTO: `AdminSessionsListResponseDTO.Item`
  - `id, date(YYYY‑MM‑DD), startTime(HH:mm:ss), endTime(HH:mm:ss), venueId, venueName`
  - `requiredExaminers, capacity, assignedExaminers[{ id, name }]`
  - `enrolledStudents[]?, enrolledGroups[]?` (optional for row expansion)
  - `bookedCount, remainingCapacity, status`
  - `createdAt, lastModified, publishedToExaminer?, publishedToStudent?`
- Calendar DTO: `CalendarResponseDTO`
  - `month: YYYY‑MM`
  - `dates: { [YYYY‑MM‑DD]: { fullyStaffed, partialStaffed, noStaffed, sessions?, bookableSessions?, fullSessions?, items? } }`

## Derived (UI‑only)
- `staffingStatus`: derived from `requiredExaminers` vs `assignedExaminers.length` → `fully | partial | none`
- `bookingRatio`: `bookedCount/capacity`

## Endpoints (GET‑only)

### 1) Assignment calendar aggregate (for calendar coloring and counts)
```
GET /api/admin/sessions/assignments/{assignmentId}/calendar?month=YYYY-MM
→ 200 Result<CalendarResponseDTO>
```
Example (trimmed):
```json
{
  "success": true,
  "code": "200",
  "data": {
    "month": "2025-09",
    "dates": {
      "2025-09-15": { "fullyStaffed": 3, "partialStaffed": 1, "noStaffed": 0 },
      "2025-09-16": { "fullyStaffed": 0, "partialStaffed": 2, "noStaffed": 1 }
    }
  }
}
```

### 2) List sessions by assignment and date (list data source)
```
GET /api/admin/sessions/assignments/{assignmentId}/sessions
    ?date=YYYY-MM-DD
    [&venueId=long]
    [&status=fully|partial|none]
→ 200 Result<AdminSessionsListResponseDTO>
```
Example (trimmed):
```json
{
  "success": true,
  "code": "200",
  "data": {
    "summary": { "totalSessions": 6, "fullyStaffed": 3, "partiallyStaffed": 2, "unstaffed": 1, "totalRequiredExaminers": 12 },
    "sessions": [
      {
        "id": 101,
        "date": "2025-09-15",
        "startTime": "09:00:00",
        "endTime": "09:30:00",
        "venueId": 12,
        "venueName": "ENG 405",
        "requiredExaminers": 2,
        "capacity": 1,
        "assignedExaminers": [{ "id": 501, "name": "Dr. Smith" }],
        "bookedCount": 0,
        "remainingCapacity": 1,
        "status": "OPEN",
        "publishedToExaminer": true,
        "publishedToStudent": false
      }
    ]
  }
}
```

### 3) Assignment publish status (display‑only, optional)
```
GET /api/admin/sessions/assignments/{assignmentId}/publish/status
→ 200 Result<{ publishedToExaminer: boolean, publishedToStudent: boolean }>
```

### 4) Assignment meta (name/semester/window)
```
GET /api/assignments/{assignmentId}
```

## CSV Export (Client‑generated)
- No backend endpoint is required. The frontend builds a CSV from the current list response and the visible columns.
- Encoding: UTF‑8, comma‑separated, header row included.
- Columns (recommended):
  - `assignmentId, sessionId, date, startTime, endTime, venueName, requiredExaminers, assignedExaminerNames, bookedCount, capacity, remainingCapacity, publishedToExaminer, publishedToStudent, staffingStatus`
- Example header + one row:
```
assignmentId,sessionId,date,startTime,endTime,venueName,requiredExaminers,assignedExaminerNames,bookedCount,capacity,remainingCapacity,publishedToExaminer,publishedToStudent,staffingStatus
42,101,2025-09-15,09:00,09:30,ENG 405,2,"Dr. Smith; Dr. Lee",0,1,1,true,false,partial
```

## Errors & Edges
- Invalid `assignmentId` or forbidden → `403/404` wrapper; UI shows read‑only error card.
- If date is outside the assignment window, server may return `outsideAssignmentRange=true` and a `message`; UI shows an empty state.

## Security & Roles
- Endpoints limited to Course Admin role with access to the target assignment.
