# Time Slots and Schedule Management API

This document defines the backend endpoints for the Course Administrator's time slot management and schedule creation workflow. The system supports a 3-step process: session configuration, time slot creation, and examiner assignment limits.

Base URL: `/admin/assignments/{assignmentId}`

## 1) Assignment Session Configuration

**Purpose**: Configure basic session parameters that apply to all time slots in an assignment.

### Get Session Configuration

- **Endpoint**: `GET /admin/assignments/{assignmentId}/session-config`
- **Auth**: Course Admin JWT required
- **Response** (success): `200 OK`
```json
{
  "success": true,
  "data": {
    "assignmentId": "assignment-123",
    "sessionLength": 30,
    "gapTime": 5,
    "examinersPerSession": 2,
    "isConfigured": true,
    "lastModified": "2025-08-26T10:30:00Z"
  }
}
```

### Update Session Configuration

- **Endpoint**: `PUT /admin/assignments/{assignmentId}/session-config`
- **Auth**: Course Admin JWT required
- **Body**:
```json
{
  "sessionLength": 30,
  "gapTime": 5,
  "examinersPerSession": 2
}
```
- **Response** (success): `200 OK`
```json
{
  "success": true,
  "data": {
    "assignmentId": "assignment-123",
    "sessionLength": 30,
    "gapTime": 5,
    "examinersPerSession": 2,
    "isConfigured": true,
    "lastModified": "2025-08-26T10:35:00Z"
  }
}
```

## 2) Time Slot Management

### Get Time Slots

- **Endpoint**: `GET /admin/assignments/{assignmentId}/timeslots`
- **Auth**: Course Admin JWT required
- **Query Parameters**:
  - `date` (optional): Filter by specific date (YYYY-MM-DD format)
  - `status` (optional): Filter by status (`empty`, `partial`, `full`)
- **Response** (success): `200 OK`
```json
{
  "success": true,
  "data": {
    "timeSlots": [
      {
        "id": 1,
        "date": "2025-04-15",
        "startTime": "09:00",
        "endTime": "10:30",
        "venue": "Engineering Building, Room 405",
        "requiredExaminers": 2,
        "sessionCount": 3,
        "status": "full",
        "assignedExaminers": [
          {
            "id": 1,
            "name": "Dr. Emma Thompson",
            "email": "emma.thompson@university.edu"
          },
          {
            "id": 2,
            "name": "Dr. Michael Chen", 
            "email": "michael.chen@university.edu"
          }
        ],
        "sessions": [
          {
            "id": 101,
            "startTime": "09:00",
            "endTime": "09:30",
            "status": "available",
            "bookedBy": null,
            "sessionNumber": 1
          },
          {
            "id": 102,
            "startTime": "09:35",
            "endTime": "10:05",
            "status": "available",
            "bookedBy": null,
            "sessionNumber": 2
          },
          {
            "id": 103,
            "startTime": "10:10",
            "endTime": "10:40",
            "status": "available",
            "bookedBy": null,
            "sessionNumber": 3
          }
        ],
        "bookedSessions": 0,
        "createdAt": "2025-08-26T09:00:00Z",
        "lastModified": "2025-08-26T10:30:00Z"
      }
    ],
    "summary": {
      "totalTimeSlots": 4,
      "totalSessions": 12,
      "fullyStaffed": 2,
      "partiallyStaffed": 1,
      "unstaffed": 1
    }
  }
}
```

### Create Time Slots (Batch)

**Purpose**: Creates multiple time slots when "Done" is clicked in the schedule wizard. Backend automatically generates individual sessions within each time slot based on the session configuration.

- **Endpoint**: `POST /admin/assignments/{assignmentId}/timeslots/batch`
- **Auth**: Course Admin JWT required
- **Body**:
```json
{
  "timeSlots": [
    {
      "date": "2025-04-15",
      "startTime": "09:00",
      "endTime": "10:30",
      "sessionCount": 3,
      "venue": "Engineering Building, Room 405"
    },
    {
      "date": "2025-04-16",
      "startTime": "14:00",
      "endTime": "16:00",
      "sessionCount": 4,
      "venue": "ICT Building, Room 203"
    }
  ]
}
```
- **Response** (success): `201 Created`
```json
{
  "success": true,
  "message": "2 time slots created with 7 sessions generated",
  "data": {
    "timeSlotsCreated": 2,
    "sessionsGenerated": 7,
    "timeSlots": [
      {
        "id": 5,
        "date": "2025-04-15",
        "startTime": "09:00",
        "endTime": "10:30",
        "venue": "Engineering Building, Room 405",
        "requiredExaminers": 2,
        "sessionCount": 3,
        "status": "empty",
        "assignedExaminers": [],
        "sessions": [
          {
            "id": 501,
            "startTime": "09:00",
            "endTime": "09:30",
            "status": "available",
            "sessionNumber": 1
          },
          {
            "id": 502,
            "startTime": "09:35",
            "endTime": "10:05",
            "status": "available",
            "sessionNumber": 2
          },
          {
            "id": 503,
            "startTime": "10:10",
            "endTime": "10:40",
            "status": "available",
            "sessionNumber": 3
          }
        ],
        "createdAt": "2025-08-26T10:45:00Z"
      }
    ]
  }
}
```

### Update Time Slot

- **Endpoint**: `PUT /admin/assignments/{assignmentId}/timeslots/{timeSlotId}`
- **Auth**: Course Admin JWT required
- **Body**: Same as create time slot
- **Response**: Same structure as create time slot with `200 OK`

### Duplicate Time Slot

- **Endpoint**: `POST /admin/assignments/{assignmentId}/timeslots/{timeSlotId}/duplicate`
- **Auth**: Course Admin JWT required
- **Body** (optional):
```json
{
  "date": "2025-04-16",
  "startTime": "14:00",
  "clearExaminers": true
}
```
- **Response**: Same structure as create time slot with `201 Created`

### Delete Time Slot(s)

- **Endpoint**: `DELETE /admin/assignments/{assignmentId}/timeslots`
- **Auth**: Course Admin JWT required
- **Body**:
```json
{
  "timeSlotIds": [1, 2, 3]
}
```
- **Response** (success): `200 OK`
```json
{
  "success": true,
  "message": "3 time slots deleted successfully",
  "deletedIds": [1, 2, 3]
}
```

## 3) Examiner Management

### Get Available Examiners

- **Endpoint**: `GET /admin/assignments/{assignmentId}/examiners`
- **Auth**: Course Admin JWT required
- **Response** (success): `200 OK`
```json
{
  "success": true,
  "data": {
    "examiners": [
      {
        "id": 1,
        "name": "Dr. Emma Thompson",
        "email": "emma.thompson@university.edu",
        "maxSessions": 40,
        "currentAssignments": 6,
        "availability": "available"
      }
    ]
  }
}
```

### Update Examiner Session Limits

- **Endpoint**: `PUT /admin/assignments/{assignmentId}/examiners/session-limits`
- **Auth**: Course Admin JWT required
- **Body**:
```json
{
  "examinerLimits": [
    {
      "examinerId": 1,
      "maxSessions": 40
    },
    {
      "examinerId": 2, 
      "maxSessions": 35
    }
  ]
}
```
- **Response** (success): `200 OK`
```json
{
  "success": true,
  "message": "Session limits updated for 2 examiners"
}
```

### Assign Examiners to Time Slot

**Purpose**: Assigns examiners to a time slot. Examiners are assigned at the time slot level and will be responsible for all sessions within that time slot.

- **Endpoint**: `PUT /admin/assignments/{assignmentId}/timeslots/{timeSlotId}/examiners`
- **Auth**: Course Admin JWT required
- **Body**:
```json
{
  "examinerIds": [1, 2]
}
```
- **Response** (success): `200 OK`
```json
{
  "success": true,
  "message": "Examiners assigned to time slot successfully",
  "data": {
    "id": 1,
    "date": "2025-04-15",
    "startTime": "09:00",
    "endTime": "10:30",
    "venue": "Engineering Building, Room 405",
    "requiredExaminers": 2,
    "sessionCount": 3,
    "status": "full",
    "assignedExaminers": [
      {
        "id": 1,
        "name": "Dr. Emma Thompson",
        "email": "emma.thompson@university.edu"
      },
      {
        "id": 2,
        "name": "Dr. Michael Chen",
        "email": "michael.chen@university.edu"
      }
    ],
    "sessions": [
      {
        "id": 101,
        "startTime": "09:00",
        "endTime": "09:30",
        "status": "available",
        "bookedBy": null,
        "sessionNumber": 1
      },
      {
        "id": 102,
        "startTime": "09:35",
        "endTime": "10:05",
        "status": "available",
        "bookedBy": null,
        "sessionNumber": 2
      },
      {
        "id": 103,
        "startTime": "10:10",
        "endTime": "10:40",
        "status": "available",
        "bookedBy": null,
        "sessionNumber": 3
      }
    ],
    "bookedSessions": 0,
    "lastModified": "2025-08-26T11:15:00Z"
  }
}
```

## 4) Schedule Management

### Get Schedule Status

- **Endpoint**: `GET /admin/assignments/{assignmentId}/schedule/status`
- **Auth**: Course Admin JWT required
- **Response** (success): `200 OK`
```json
{
  "success": true,
  "data": {
    "assignmentId": "assignment-123",
    "scheduleStatus": "draft",
    "isReleased": false,
    "releasedAt": null,
    "totalTimeSlots": 4,
    "readyForRelease": true,
    "issues": [],
    "summary": {
      "totalSessions": 12,
      "fullyStaffedSlots": 2,
      "unstaffedSlots": 0,
      "totalExaminers": 6
    }
  }
}
```

### Release Schedule

- **Endpoint**: `POST /admin/assignments/{assignmentId}/schedule/release`
- **Auth**: Course Admin JWT required
- **Body**:
```json
{
  "notifyStudents": true,
  "notifyExaminers": true,
  "releaseMessage": "Assessment schedule is now available for booking."
}
```
- **Response** (success): `200 OK`
```json
{
  "success": true,
  "message": "Schedule released successfully",
  "data": {
    "releasedAt": "2025-08-26T11:00:00Z",
    "notificationsSent": {
      "students": 45,
      "examiners": 6
    }
  }
}
```

## 5) Calendar Integration

### Get Calendar Data

- **Endpoint**: `GET /admin/assignments/{assignmentId}/calendar`
- **Auth**: Course Admin JWT required
- **Query Parameters**:
  - `month`: Format YYYY-MM (e.g., "2025-08")
- **Response** (success): `200 OK`
```json
{
  "success": true,
  "data": {
    "month": "2025-08",
    "dates": {
      "2025-08-15": {
        "timeSlots": 2,
        "status": "full",
        "sessions": 6
      },
      "2025-08-16": {
        "timeSlots": 1,
        "status": "partial", 
        "sessions": 3
      }
    }
  }
}
```

## Error Handling

Common error responses:

- **400 Bad Request**: Validation errors, conflicting time slots
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Time slot conflicts with existing slot",
  "details": {
    "conflictingSlot": {
      "id": 2,
      "date": "2025-04-15",
      "startTime": "09:30"
    }
  }
}
```

- **403 Forbidden**: Insufficient permissions
```json
{
  "success": false,
  "code": "PERMISSION_DENIED", 
  "message": "Course Admin access required"
}
```

- **404 Not Found**: Resource not found
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Time slot not found"
}
```

## Implementation Notes

### Backend Responsibilities

- **Session Configuration**: Persist session parameters and validate constraints
- **Time Slot Management**: Handle batch creation with automatic session generation using stored session config (sessionLength, gapTime)
- **Session Generation**: Automatically create individual sessions within each time slot based on sessionCount and timing parameters
- **Examiner Assignment**: Validate examiner availability and session limits
- **Schedule Release**: Update status, send notifications, and create audit trail
- **Calendar Integration**: Provide aggregated view for calendar display

### Business Rules

- Time slots cannot overlap for the same venue
- Examiners cannot be assigned to overlapping time slots
- Session limits must be respected when auto-assigning examiners  
- Schedule must be marked as "released" before students can book sessions
- Individual sessions are automatically generated within each time slot using stored session configuration
- Session timing calculated as: startTime + (sessionNumber-1) * (sessionLength + gapTime)
- **Examiner Assignment**: Examiners are assigned at time slot level and are responsible for ALL sessions within that time slot
- Individual sessions do NOT have examiner assignments - they inherit from the parent time slot
- Audit trail required for all schedule modifications

### Frontend Integration

- **Step 1**: Frontend updates session configuration via `PUT /session-config`
- **Step 2**: Frontend collects multiple time slot definitions locally, then calls `POST /timeslots/batch` when "Done" is clicked
- **Step 3**: Frontend updates examiner session limits via `PUT /examiners/session-limits`
- **Time Slot Management**: Calendar view fetches data using the calendar endpoint with month parameter
- **Individual Operations**: Real-time validation during time slot creation prevents conflicts
- **Bulk Operations**: Support multi-select functionality in the timeslot management UI