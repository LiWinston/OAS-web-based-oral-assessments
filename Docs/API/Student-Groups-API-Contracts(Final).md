# Student Groups — API Contracts (Final)

Version: 1.0 • Status: Proposed for Approval • Last updated: 2025‑08‑30

## Conventions

- Auth: `Authorization: Bearer <accessToken>` (JWT)
- Wrapper: `{ success: boolean, code: "OK"|"<ERROR>", data: <payload>, message?: string }`
- Time: All datetimes are ISO‑8601 with explicit timezone
- Conditional requests encouraged on read endpoints: `Last-Modified` + `If-Modified-Since`

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

- FORBIDDEN, NOT_FOUND, NOT_ELIGIBLE

---

## 1) List student’s active groups (assignment‑level)

GET `/api/students/{studentId}/groups?status=active&pageNum=&pageSize=&sort=semester_desc`

- Only current/active assignment groups returned. Past/archived groups are excluded by default.

200 OK

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

304 Not Modified — when `If-Modified-Since` applies.

---

## 2) Get group details (members only)

GET `/api/students/{studentId}/groups/{groupId}`

- Validates membership; 403 if the student is not a member.

200 OK

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

403 FORBIDDEN — not a member. 404 NOT_FOUND — group does not exist or is archived.

---

## Backend/DB Notes

- Group membership is stored per assignment; queries must join via assignment roster.
