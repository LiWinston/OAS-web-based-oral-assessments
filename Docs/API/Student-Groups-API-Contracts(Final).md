# Student Groups — API Contracts (Final)

Version: 1.0 • Status: Proposed for Approval • Last updated: 2025‑08‑30

## Conventions

- Auth: `Authorization: Bearer <accessToken>` (JWT)
- Wrapper: `{ success: boolean, code: "OK"|"<ERROR>", data: <payload>, message?: string }`
- Time: All datetimes are ISO‑8601 with explicit timezone
- Conditional read: servers SHOULD return `Last-Modified`; clients MAY send `If-Modified-Since`.
- Errors: error responses MUST use the same wrapper with `success=false`, `code` in reason codes, and optional `message` for user‑facing copy.

### Common HTTP headers
- Request
  - `Authorization: Bearer <accessToken>`
  - `If-Modified-Since: <http-date>` (optional; for caching)
- Response
  - `Last-Modified: <http-date>` (when applicable)
  - `Cache-Control: private, must-revalidate`

---

## Data Models

- Group (assignment‑level)
  ```json
  {
    "groupId": 501,
    "groupName": "Team Alpha",
    "assignmentId": 101,
    "assignmentName": "Oral Exam 1",
    "courseCode": "COMP90082",
    "semester": "2025 S1",
    "members": [
      {
        "studentId": 201,
        "name": "Bob Student",
        "email": "bob@student.unimelb.edu.au"
      }
    ]
  }
  ```
- GroupSummary (for overview card)
  ```json
  {
    "groupId": 501,
    "groupName": "Team Alpha",
    "assignmentId": 101,
    "assignmentName": "Oral Exam 1",
    "courseCode": "COMP90082",
    "semester": "2025 S1",
    "memberCount": 3,
    "status": "ACTIVE"
  }
  ```

Reason codes (align with Booking)

- `FORBIDDEN` — current user not allowed
- `NOT_FOUND` — resource does not exist or is archived
- `NOT_ELIGIBLE` — assignment is not group‑based (INDIVIDUAL)
- `STALE_DATA` — server detected state changed since last read (optional use)

---

## 1) List student’s active groups (assignment‑level)

GET `/api/students/{studentId}/groups?status=active&pageNum=&pageSize=&sort=semester_desc`

- Purpose: overview for the student’s current groups per assignment.
- Visibility: only current/active assignment groups by default. Past/archived are excluded.

### Path params
- `studentId` (number) — required

### Query params
- `status` = `active` | `all` (default: `active`)
- `pageNum` (number, default: 0)
- `pageSize` (number, default: 20, max: 50)
- `sort` (string, default: `semester_desc`)
  - Allowed values: `semester_desc` | `semester_asc`

### Request headers
- `Authorization`
- `If-Modified-Since` (optional)

### Response headers
- `Last-Modified` (present when result set is stable)

### 200 OK

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
        "groupId": 501,
        "groupName": "Team Alpha",
        "assignmentId": 101,
        "assignmentName": "Oral Exam 1",
        "courseCode": "COMP90082",
        "semester": "2025 S1",
        "memberCount": 3,
        "status": "ACTIVE"
      }
    ]
  }
}
```

### 304 Not Modified
Returned when `If-Modified-Since` is provided and the data is unchanged.

### Error responses
- 403
```json
{ "success": false, "code": "FORBIDDEN", "data": null, "message": "You don’t have access to these groups." }
```
- 404
```json
{ "success": false, "code": "NOT_FOUND", "data": null, "message": "Student not found." }
```
- 200 with empty list (no active groups)
```json
{ "success": true, "code": "OK", "data": { "pageNum":0, "pageSize":20, "total":0, "data": [] } }
```

---

## 2) Get group details (members only)

GET `/api/students/{studentId}/groups/{groupId}`

- Purpose: group members for a specific assignment‑level group.
- Access: validates membership; 403 if requesting student is not a member.

### Path params
- `studentId` (number) — required
- `groupId` (number) — required

### Request headers
- `Authorization`
- `If-Modified-Since` (optional)

### Response headers
- `Last-Modified` (present when resource unchanged)

### 200 OK

```json
{
  "success": true,
  "code": "OK",
  "data": {
    "group": {
      "groupId": 501,
      "groupName": "Team Alpha",
      "assignmentId": 101,
      "assignmentName": "Oral Exam 1",
      "courseCode": "COMP90082",
      "semester": "2025 S1",
      "members": [
        {
          "studentId": 201,
          "name": "Bob Student",
          "email": "bob@student.unimelb.edu.au"
        },
        {
          "studentId": 202,
          "name": "Ava Student",
          "email": "ava@student.unimelb.edu.au"
        }
      ]
    }
  }
}
```

### Error responses
- 403
```json
{ "success": false, "code": "FORBIDDEN", "data": null, "message": "You don’t have access to this group." }
```
- 404
```json
{ "success": false, "code": "NOT_FOUND", "data": null, "message": "We couldn’t find this group." }
```

Notes:
- Servers SHOULD exclude past/archived groups from the overview endpoint by default.
- All date/time fields MUST be ISO‑8601 with timezone.

---

## Backend/DB Notes

- Group membership is stored per assignment; queries must join via assignment roster.

---

## User‑facing error copy (for Frontend)

Frontend copy should align with error codes (consistent with “Student‑View‑My‑Groups‑User‑Flow (Final)”):

- `FORBIDDEN` → "You don’t have access to this group."
- `NOT_FOUND` → "We couldn’t find this group."
- `NOT_ELIGIBLE` → "This assignment doesn’t use group membership."
- `STALE_DATA` → "This information changed. Please refresh."

Notes:
- All error responses MUST use the unified wrapper: `{ success:false, code:<REASON>, data:null, message }`
- Copy SHOULD be localized via i18n as needed.
