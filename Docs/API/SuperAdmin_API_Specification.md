# SuperAdmin API Specification

## Oral Assessment System (OAS) - Backend Implementation Guide

### Version: 1.0

### Date: 2025-08-02

### Target: Backend Team

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Course Admin Management APIs](#course-admin-management-apis)
3. [System-wide Course Management APIs](#system-wide-course-management-apis)
4. [System Management & Monitoring APIs](#system-management--monitoring-apis)
5. [User Management APIs](#user-management-apis)
6. [Data Models & Schemas](#data-models--schemas)
7. [Error Handling](#error-handling)
8. [Implementation Notes](#implementation-notes)

---

## Authentication & Authorization

### POST /auth/login

Authenticate user and return JWT token.

**Request Body:**

```json
{
  "email": "superadmin@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "superadmin@example.com",
      "name": "Super Administrator",
      "role": "SUPER_ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

### POST /auth/logout

Invalidate current session and tokens.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Course Admin Management APIs

### POST /superadmin/admins/invite

Invite a new Course Administrator to the system.

**Request Body:**

```json
{
  "email": "newadmin@student.unimelb.edu.au",
  "name": "Dr. Jane Smith",
  "department": "Computer Science",
  "message": "Welcome to OAS! You've been invited to manage oral assessments."
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Course Admin invitation sent successfully",
  "data": {
    "id": "uuid",
    "email": "newadmin@student.unimelb.edu.au",
    "name": "Dr. Jane Smith",
    "department": "Computer Science",
    "status": "INVITED",
    "invitedAt": "2025-01-02T10:30:00Z",
    "invitationExpiresAt": "2025-01-09T10:30:00Z",
    "invitationToken": "uuid"
  }
}
```

**Error Responses:**

- `409 Conflict`: Email already exists
- `400 Bad Request`: Invalid email domain (must be @student.unimelb.edu.au)

### GET /superadmin/admins

Retrieve list of all Course Administrators with filtering and pagination.

**Query Parameters:**

- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20, max: 100): Items per page
- `status` (string): Filter by status (INVITED, REGISTERED, ACTIVE, INACTIVE，EXPIRED)
- `department` (string): Filter by department
- `search` (string): Search by name or email
- `sortBy` (string, default: createdAt): Sort field
- `sortOrder` (string, default: desc): Sort order (asc, desc)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "admins": [
      {
        "id": "uuid",
        "email": "admin1@student.unimelb.edu.au",
        "name": "Dr. John Doe",
        "department": "Computer Science",
        "status": "ACTIVE",
        "invitedAt": "2024-12-01T10:00:00Z",
        "registeredAt": "2024-12-02T14:30:00Z",
        "lastLoginAt": "2025-01-01T09:15:00Z",
        "coursesManaged": 3,
        "studentsManaged": 145,
        "assignmentsCreated": 8
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /superadmin/admins/{id}

Get detailed information about a specific Course Administrator.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@student.unimelb.edu.au",
    "name": "Dr. Jane Smith",
    "department": "Computer Science",
    "status": "ACTIVE",
    "invitedAt": "2024-12-01T10:00:00Z",
    "registeredAt": "2024-12-02T14:30:00Z",
    "lastLoginAt": "2025-01-01T09:15:00Z",
    "coursesManaged": 3,
    "studentsManaged": 145,
    "assignmentsCreated": 8,
    "courses": [
      {
        "id": "uuid",
        "code": "COMP90082",
        "name": "Software Project",
        "semester": "Semester 1",
        "year": 2025,
        "studentsCount": 48
      }
    ],
    "recentActivity": [
      {
        "action": "CREATED_ASSIGNMENT",
        "description": "Created assignment 'Final Presentation'",
        "timestamp": "2024-12-30T15:20:00Z"
      }
    ]
  }
}
```

### PATCH /superadmin/admins/{id}/status

Update the status of a Course Administrator.

**Request Body:**

```json
{
  "status": "INACTIVE",
  "reason": "Temporary leave of absence"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Admin status updated successfully",
  "data": {
    "id": "uuid",
    "status": "INACTIVE",
    "updatedAt": "2025-01-02T10:30:00Z"
  }
}
```

### POST /superadmin/admins/{id}/resend-invitation

Resend invitation email to a Course Administrator.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Invitation resent successfully",
  "data": {
    "invitationSentAt": "2025-01-02T10:30:00Z",
    "invitationExpiresAt": "2025-01-09T10:30:00Z"
  }
}
```

### DELETE /superadmin/admins/{id}

Revoke access for a Course Administrator.

**Request Body:**

```json
{
  "reason": "No longer with institution",
  "transferCoursesTo": "uuid" // Optional: transfer courses to another admin
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Admin access revoked successfully",
  "data": {
    "revokedAt": "2025-01-02T10:30:00Z",
    "coursesTransferred": 2
  }
}
```

### GET /superadmin/admins/stats

**Get statistics about Course Administrators.**  
_(The stats API endpoint here will need further discussion)_

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalAdmins": 95,
    "activeAdmins": 87,
    "inactiveAdmins": 5,
    "pendingInvitations": 3,
    "adminsByDepartment": {
      "Computer Science": 25,
      "Engineering": 18,
      "Mathematics": 12,
      "Physics": 8
    },
    "recentInvitations": 7,
    "averageCoursesPerAdmin": 2.3,
    "totalCoursesManaged": 201
  }
}
```

### GET /superadmin/admins/check-email/{email}

Check if an email address is already in use.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "email": "test@student.unimelb.edu.au",
    "exists": false,
    "isValid": true
  }
}
```

---

## System-wide Course Management APIs

### GET /superadmin/courses

Retrieve list of all courses in the system (read-only).

**Query Parameters:**

- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20, max: 100): Items per page
- `status` (string): Filter by status (ACTIVE, INACTIVE, ARCHIVED)
- `department` (string): Filter by department
- `semester` (string): Filter by semester
- `year` (integer): Filter by year
- `search` (string): Search by course code or name
- `adminId` (string): Filter by Course Admin
- `sortBy` (string, default: createdAt): Sort field
- `sortOrder` (string, default: desc): Sort order

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "uuid",
        "code": "COMP90082",
        "name": "Software Project",
        "semester": "Semester 1",
        "year": 2025,
        "department": "Computer Science",
        "venue": "Doug McDonell Building",
        "status": "ACTIVE",
        "adminId": "uuid",
        "adminName": "Dr. John Doe",
        "adminEmail": "admin@student.unimelb.edu.au",
        "studentsCount": 48,
        "assignmentsCount": 2,
        "createdAt": "2024-11-15T10:00:00Z",
        "updatedAt": "2024-12-20T14:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "totalItems": 287,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /superadmin/courses/{id}

Get detailed information about a specific course (read-only).

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "COMP90082",
    "name": "Software Project",
    "description": "Team-based software development project",
    "semester": "Semester 1",
    "year": 2025,
    "department": "Computer Science",
    "venue": "Doug McDonell Building",
    "status": "ACTIVE",
    "adminId": "uuid",
    "adminName": "Dr. John Doe",
    "adminEmail": "admin@student.unimelb.edu.au",
    "studentsCount": 48,
    "assignmentsCount": 2,
    "createdAt": "2024-11-15T10:00:00Z",
    "updatedAt": "2024-12-20T14:30:00Z",
    "assignments": [
      {
        "id": "uuid",
        "name": "Mid-term Presentation",
        "type": "GROUP",
        "status": "COMPLETED",
        "studentsAssessed": 48,
        "completedAt": "2024-12-15T16:00:00Z"
      }
    ]
  }
}
```

## API Endpoint Summary

### Complete SuperAdmin API Endpoints

| Method | Endpoint                                    | Description              | Auth Required | Status     |
| ------ | ------------------------------------------- | ------------------------ | ------------- | ---------- |
| POST   | `/auth/login`                               | User authentication      | No            | Documented |
| POST   | `/auth/logout`                              | Session termination      | Yes           | Documented |
| POST   | `/superadmin/admins/invite`                 | Invite Course Admin      | SUPER_ADMIN   | Documented |
| GET    | `/superadmin/admins`                        | List Course Admins       | SUPER_ADMIN   | Documented |
| GET    | `/superadmin/admins/{id}`                   | Get admin details        | SUPER_ADMIN   | Documented |
| PATCH  | `/superadmin/admins/{id}/status`            | Update admin status      | SUPER_ADMIN   | Documented |
| POST   | `/superadmin/admins/{id}/resend-invitation` | Resend invitation        | SUPER_ADMIN   | Documented |
| DELETE | `/superadmin/admins/{id}`                   | Revoke admin access      | SUPER_ADMIN   | Documented |
| GET    | `/superadmin/admins/stats`                  | Admin statistics         | SUPER_ADMIN   | Documented |
| GET    | `/superadmin/admins/check-email/{email}`    | Check email availability | SUPER_ADMIN   | Documented |
| GET    | `/superadmin/courses`                       | List all courses         | SUPER_ADMIN   | Documented |
| GET    | `/superadmin/courses/{id}`                  | Get course details       | SUPER_ADMIN   | Documented |

### Key Features Documented

#### **Authentication & Authorization**

- JWT-based authentication with login/logout
- Role-based access control for SUPER_ADMIN endpoints

#### **Course Admin Management**

- Complete admin lifecycle: invite → register → activate → manage
- Email validation for @student.unimelb.edu.au domain
- Status management with transitions: INVITED, REGISTERED, ACTIVE, INACTIVE, EXPIRED
- Invitation expiry and resend functionality
- Admin statistics and email availability checking

#### **System-wide Course Management**

- Read-only course overview with comprehensive filtering
- Detailed course information with assignments and activity
- Pagination support for large datasets

### Implementation Notes

#### **Enhanced Status Management**

Your refined specification includes an additional status: **EXPIRED** for admin invitations, which provides better tracking of invitation lifecycle.

#### **Simplified Architecture**

The refined document focuses on the core SuperAdmin functionality while maintaining:

- Consistent JSON response format
- Proper HTTP status codes
- Comprehensive error handling
- Pagination for list endpoints

### Frontend Integration Notes

**Key Integration Points:**

1. **Authentication**: JWT tokens are already handled in the frontend
2. **Error Handling**: Frontend expects the standardized error response format
3. **Pagination**: Frontend components expect the pagination structure defined in this spec
4. **Email Validation**: Frontend validates @student.unimelb.edu.au domain
5. **Status Management**: Frontend tracks admin status transitions (INVITED → REGISTERED → ACTIVE)
