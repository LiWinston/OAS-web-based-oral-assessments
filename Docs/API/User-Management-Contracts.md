# OAS User Management — API Alignment (with Backend Course/Assignment APIs)

This document aligns the User Management API with the backend’s existing patterns for Course and Assignment resources (`/api/courses/*` and `/api/assignments/*`) and their standard response wrappers.

Scope: Centralized user management at `/admin/users`, assignment‑scoped, manual Add and Remove only. Removal must cascade to cancel student bookings and clear examiner time slots.

Key alignment decisions

- Resource path: Use assignment‑centric resource to match implemented patterns.
  - Prefer: `/api/assignments/{assignmentId}/members` (role‑filtered list and create)
  - Delete: `/api/assignments/{assignmentId}/members/{assignmentUserId}`
- Pagination params: `pageNum`, `pageSize` (consistent with course list)
- Response wrapper: `{ success, code, data }` where `data` contains the typed payload.
- Search param: `q` for email/fullName.

## 1) List Assignment Members

Endpoint

- `GET /api/assignments/{assignmentId}/members`

Query Params

- `role` — `ROLE_STUDENT` | `ROLE_EXAMINER` (optional; if omitted, return both with a role field)
- `q` — search (email/fullName, optional)
- `pageNum`, `pageSize` — pagination (optional)

Response (wrapper + typed list)

```json
{
  "success": true,
  "code": "OK",
  "data": {
    "pageNum": 0,
    "pageSize": 25,
    "total": 2,
    "data": [
      {
        "assignmentUserId": 1001,
        "userId": 501,
        "role": "STUDENT",
        "email": "s1@student.edu",
        "fullName": "Student One",
        "groupId": "G-01",
        "bookingsCount": 1,
        "addedAt": "2025-08-01T10:00:00Z"
      },
      {
        "assignmentUserId": 2001,
        "userId": 601,
        "role": "EXAMINER",
        "email": "e1@uni.edu",
        "fullName": "Examiner A",
        "assignedSlotsCount": 3,
        "addedAt": "2025-08-02T11:00:00Z"
      }
    ]
  }
}
```

Backend notes

- Include `bookingsCount` or `assignedSlotsCount` for contextual counts; zero is fine.
- Use assignment‑centric path; `courseId` is not needed if `assignmentId` is globally unique.
- - assignmentUserId: Identifier of the membership record linking a user to a specific
    assignment. It carries assignment-scoped fields (role in this assignment, groupId,
    bookingsCount/assignedSlotsCount, addedAt).
- userId: Global user identifier across the whole system (profile, email, etc.). The same
  userId can appear in many assignments; each membership gets its own assignmentUserId.
- Why both: Deletes and updates at assignment scope act on assignmentUserId (e.g., remove from
  this assignment only), while cross-assignment info or auth relates to userId.

## 2) Add Assignment Member (Manual)

Endpoint

- `POST /api/assignments/{assignmentId}/members`

Request

```json
{
  "role": "ROLE_STUDENT", // or ROLE_EXAMINER
  "email": "user@example.edu",
  "fullName": "Optional Name",
  "studentId": "1234567", // STUDENT optional
  "staffId": "t-42", // EXAMINER optional
  "groupId": "G-01" // optional when assignment uses groups
}
```

Response (wrapper + summary)

```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignmentUserId": 3457,
    "userId": 790,
    "created": true,
    "linked": true,
    "email": "newuser@example.edu",
    "role": "ROLE_EXAMINER",
    "inviteSent": true
  }
}
```

Error (duplicate)

```json
{
  "success": false,
  "code": "ALREADY_IN_ASSIGNMENT",
  "data": { "message": "User already in this assignment" }
}
```

Backend notes

- Idempotent add by email should not duplicate assignment membership.
- If auto‑create is allowed, return `created=true` and (optionally) `inviteSent=true`.

## 3) Remove Assignment Member (Cascade)

Endpoint

- `DELETE /api/assignments/{assignmentId}/members/{assignmentUserId}`

Behavior

- Removes membership and cascades:
  - Students: cancel all future bookings for this assignment
  - Examiners: clear all assigned time slots for this assignment

Response

```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignmentUserId": 3456,
    "role": "STUDENT",
    "canceledBookings": 2,
    "clearedExaminerSlots": 0
  }
}
```

Error (typed)

```json
{
  "success": false,
  "code": "REMOVAL_BLOCKED_BY_MARKS",
  "data": { "message": "User has finalized marks in this assignment" }
}
```

## 4) Contracts and DTOs

- List wrapper: `ResultListResponseDTO` with `{ pageNum, pageSize, total, data: [...] }`
- Member item: `AssignmentMemberResponseDTO` with fields above.
- Add wrapper: `ResultAssignmentMemberCreateResponseDTO` (or reuse `ResultObject` with data payload as above).
- Delete wrapper: `ResultAssignmentMemberRemoveResponseDTO` with cascade summary.

## 5) Security and Access

- All endpoints require authentication; only the `COURSE_ADMIN` for the assignment’s course can add/remove members.
- Server validates assignment ownership against the caller.

## 6) Frontend Consumption

- The frontend normalizes wrappers. It expects `{ success, page, size, total, data }` for lists and reads add/remove `data` payloads for banners and summaries.
- Pagination params sent as `pageNum`/`pageSize`. Search param as `q`.
