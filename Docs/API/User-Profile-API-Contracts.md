# User Profile — API Contracts (Unified Across Roles)

Version: 1.0 • Status: Proposed • Last updated: 2025-08-31

## Conventions
- Auth: `Authorization: Bearer <accessToken>` (JWT)
- Wrapper: `{ success: boolean, code: "OK"|"<ERROR>", data: <payload>, message? }`
- Time: ISO‑8601 with timezone

## 1) Get current user profile (role‑aware)
GET `/api/profile/me`

200 OK
```json
{ "success": true, "code": "OK", "data": {
  "user": {
    "userId": 123,
    "email": "user@example.edu",
    "role": "COURSE_ADMIN|EXAMINER|STUDENT|SUPER_ADMIN",
    "name": "Alice Lee",
    "department": "Engineering",
    "phone": "+61 4xx xxx xxx",
    "preferences": {
      "timezone": "Australia/Melbourne",
      "language": "en",
      "notifications": {
        "email": true,
        "desktop": false,
        "assignmentUpdates?": true,
        "examinerUpdates?": true,
        "bookingUpdates?": true,
        "resultUpdates?": true,
        "groupUpdates?": true
      }
    }
  }
}}
```

## 2) Update profile
PUT `/api/profile`

Request
```json
{
  "name": "Alice Lee",
  "phone": "+61 4xx xxx xxx",
  "department": "Engineering"
}
```

200 OK
```json
{ "success": true, "code": "OK", "data": { "updated": true } }
```

Notes
- Fields are optional; server updates provided fields only.
- Role‑specific fields (e.g., `department` for admins) are validated per role.

## 3) Update preferences
PUT `/api/profile/preferences`

Request
```json
{
  "timezone": "Australia/Melbourne",
  "language": "en",
  "notifications": {
    "email": true,
    "desktop": false,
    "assignmentUpdates?": true,
    "examinerUpdates?": true,
    "bookingUpdates?": true,
    "resultUpdates?": true,
    "groupUpdates?": true
  }
}
```

200 OK
```json
{ "success": true, "code": "OK", "data": { "updated": true } }
```

## 4) Change password
POST `/api/auth/change-password`

Request
```json
{ "currentPassword": "old", "newPassword": "strong-new" }
```

200 OK
```json
{ "success": true, "code": "OK", "data": { "message": "Password changed" } }
```

Errors
- 400 `WEAK_PASSWORD` – policy violation
- 401 `INVALID_CREDENTIALS` – current password wrong
- 429 `RATE_LIMITED`

## 5) Role‑specific projections (optional)
GET `/api/profile/admin|examiner|student`

Purpose: return extended role data (e.g., admin managed courses, examiner coverage stats, student group summary). Shape aligns with existing dashboard summaries.

## Security & Access
- Only authenticated users can access/modify their own profile.
- Audit trail for profile and password changes.


