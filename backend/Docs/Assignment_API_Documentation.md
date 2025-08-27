# Assignment API Documentation

## Overview
This document describes the Assignment management API endpoints for the OAS (Oral Assessment System) backend.

## Base URL
```
/api/assignments
```

## Authentication
All endpoints require authentication. Users must have appropriate roles:
- `ADMIN` or `SUPER_ADMIN`: Full access to all operations
- `TEACHER`: Can create, update, and manage assignments
- `STUDENT`: Can view assignments (read-only access)

## Data Models

### Assignment Entity
```json
{
  "id": "Long (Primary Key)",
  "subjectId": "Long (Foreign Key to subject table)",
  "name": "String (Assignment name)",
  "description": "String (Assignment description)",
  "type": "String (Assignment type)",
  "startDate": "Date (Start date)",
  "endDate": "Date (End date)",
  "weight": "Double (0.0 to 100.0)",
  "progress": "String (Assignment progress)",
  "status": "String (Assignment status)",
  "rubricMetaInfo": "String (JSON string with rubric meta information)",
  "rubricsInfo": "String (JSON string with rubrics information)",
  "creator": "Long (Creator user ID)",
  "updater": "Long (Updater user ID)",
  "createTime": "DateTime (Create time)",
  "updateTime": "DateTime (Update time)"
}
```

### Assignment Types
- `essay`: Essay assignment
- `presentation`: Presentation assignment
- `report`: Report assignment
- `project`: Project assignment
- `exam`: Exam assignment
- `quiz`: Quiz assignment
- `lab`: Laboratory assignment
- `tutorial`: Tutorial assignment
- `other`: Other type

### Assignment Status
- `draft`: Draft status
- `published`: Published status
- `in_progress`: In progress status
- `submitted`: Submitted status
- `graded`: Graded status
- `archived`: Archived status
- `cancelled`: Cancelled status

### Assignment Progress
- `not_started`: Not started
- `in_progress`: In progress
- `nearly_complete`: Nearly complete
- `completed`: Completed
- `overdue`: Overdue

## API Endpoints

### 1. Get Paginated Assignments
**GET** `/api/assignments`

**Query Parameters:**
- `pageNum` (optional): Page number (default: 1)
- `pageSize` (optional): Page size (default: 10)
- `subjectId` (optional): Filter by subject ID
- `type` (optional): Filter by assignment type
- `status` (optional): Filter by assignment status
- `progress` (optional): Filter by assignment progress

**Response:**
```json
{
  "code": "200",
  "message": "Success",
  "data": {
    "records": [
      {
        "id": 1,
        "subjectId": 1,
        "name": "Final Project Report",
        "description": "Complete project report with analysis and conclusions",
        "type": "project",
        "startDate": "2024-01-15",
        "endDate": "2024-02-15",
        "weight": 30.0,
        "progress": "not_started",
        "status": "draft",
        "rubricMetaInfo": "{\"name\":\"Project Report Rubric\",\"description\":\"Rubric for evaluating project reports\",\"totalPoints\":100}",
        "rubricsInfo": "{\"description\":\"Comprehensive evaluation criteria\",\"weight\":1.0,\"scaleType\":\"numeric\",\"performanceLevels\":{\"excellent\":90,\"good\":80,\"satisfactory\":70,\"needs_improvement\":60}}",
        "creator": 1,
        "updater": null,
        "createTime": "2024-01-10T10:00:00",
        "updateTime": "2024-01-10T10:00:00"
      }
    ],
    "total": 1,
    "current": 1,
    "size": 10
  }
}
```

### 2. Get Assignments by Subject
**GET** `/api/assignments/subject/{subjectId}`

**Path Parameters:**
- `subjectId`: Subject ID

**Response:**
```json
{
  "code": "200",
  "message": "Success",
  "data": [
    {
      "id": 1,
      "subjectId": 1,
      "name": "Final Project Report",
      "type": "project",
      "weight": 30.0,
      "progress": "not_started",
      "status": "draft"
    }
  ]
}
```

### 3. Get Assignment by ID
**GET** `/api/assignments/{id}`

**Path Parameters:**
- `id`: Assignment ID

**Response:**
```json
{
  "code": "200",
  "message": "Success",
  "data": {
    "id": 1,
    "subjectId": 1,
    "name": "Final Project Report",
    "description": "Complete project report with analysis and conclusions",
    "type": "project",
    "startDate": "2024-01-15",
    "endDate": "2024-02-15",
    "weight": 30.0,
    "progress": "not_started",
    "status": "draft",
    "rubricMetaInfo": "{\"name\":\"Project Report Rubric\",\"description\":\"Rubric for evaluating project reports\",\"totalPoints\":100}",
    "rubricsInfo": "{\"description\":\"Comprehensive evaluation criteria\",\"weight\":1.0,\"scaleType\":\"numeric\",\"performanceLevels\":{\"excellent\":90,\"good\":80,\"satisfactory\":70,\"needs_improvement\":60}}",
    "creator": 1,
    "updater": null,
    "createTime": "2024-01-10T10:00:00",
    "updateTime": "2024-01-10T10:00:00"
  }
}
```

### 4. Create Assignment
**POST** `/api/assignments`

**Request Body:**
```json
{
  "subjectId": 1,
  "name": "New Assignment",
  "description": "Assignment description",
  "type": "essay",
  "startDate": "2024-01-15",
  "endDate": "2024-01-30",
  "weight": 25.0,
  "progress": "not_started",
  "status": "draft",
  "rubricMetaInfo": "{\"name\":\"Essay Rubric\",\"description\":\"Rubric for evaluating essays\",\"totalPoints\":80}",
  "rubricsInfo": "{\"description\":\"Essay evaluation criteria\",\"weight\":1.0,\"scaleType\":\"numeric\",\"performanceLevels\":{\"excellent\":72,\"good\":64,\"satisfactory\":56,\"needs_improvement\":48}}"
}
```

**Response:**
```json
{
  "code": "200",
  "message": "Success",
  "data": {
    "id": 2,
    "subjectId": 1,
    "name": "New Assignment",
    "description": "Assignment description",
    "type": "essay",
    "startDate": "2024-01-15",
    "endDate": "2024-01-30",
    "weight": 25.0,
    "progress": "not_started",
    "status": "draft",
    "rubricMetaInfo": "{\"name\":\"Essay Rubric\",\"description\":\"Rubric for evaluating essays\",\"totalPoints\":80}",
    "rubricsInfo": "{\"description\":\"Essay evaluation criteria\",\"weight\":1.0,\"scaleType\":\"numeric\",\"performanceLevels\":{\"excellent\":72,\"good\":64,\"satisfactory\":56,\"needs_improvement\":48}}",
    "creator": 1,
    "updater": null,
    "createTime": "2024-01-10T10:00:00",
    "updateTime": "2024-01-10T10:00:00"
  }
}
```

### 5. Update Assignment
**PUT** `/api/assignments/{id}`

**Path Parameters:**
- `id`: Assignment ID

**Request Body:** Same as Create Assignment

**Response:** Same as Create Assignment

### 6. Delete Assignment
**DELETE** `/api/assignments/{id}`

**Path Parameters:**
- `id`: Assignment ID

**Response:**
```json
{
  "code": "200",
  "message": "Success",
  "data": null
}
```

### 7. Update Assignment Status
**PATCH** `/api/assignments/{id}/status`

**Path Parameters:**
- `id`: Assignment ID

**Query Parameters:**
- `status`: New status value

**Response:** Assignment object with updated status

### 8. Update Assignment Progress
**PATCH** `/api/assignments/{id}/progress`

**Path Parameters:**
- `id`: Assignment ID

**Query Parameters:**
- `progress`: New progress value

**Response:** Assignment object with updated progress

### 9. Get Assignments by Creator
**GET** `/api/assignments/creator/{creatorId}`

**Path Parameters:**
- `creatorId`: Creator user ID

**Response:** List of assignments created by the specified user

### 10. Get Assignment Status Statistics
**GET** `/api/assignments/stats/status`

**Description:** Retrieve statistics about assignment statuses across all subjects

**Response:**
```json
{
  "code": "200",
  "message": "Success",
  "data": {
    "totalCount": 100,
    "statusCounts": {
      "PENDING": 20,
      "IN_PROGRESS": 30,
      "COMPLETED": 40,
      "CANCELLED": 10
    },
    "statusPercentages": {
      "PENDING": 20.0,
      "IN_PROGRESS": 30.0,
      "COMPLETED": 40.0,
      "CANCELLED": 10.0
    }
  }
}
```

**Note:** `statusPercentages` represents the percentage of total assignment weight (not count) for each status. This gives a more accurate representation of the academic impact of assignments in each status.

### 11. Get Assignment Status Statistics by Subject
**GET** `/api/assignments/subject/{subjectId}/stats`

**Path Parameters:**
- `subjectId`: Subject ID

**Description:** Retrieve statistics about assignment statuses for a specific subject

**Response:** Same format as Get Assignment Status Statistics, but filtered by subject

## Error Responses

### Common Error Codes
- `4031`: Assignment not found
- `4032`: Invalid assignment type
- `4033`: Invalid assignment dates
- `4034`: Invalid assignment weight
- `4035`: Invalid assignment status
- `4036`: Invalid assignment progress
- `4037`: Assignment has submissions and cannot be deleted
- `4038`: Assignment already exists for this subject
- `4047`: Total assignment weight for subject cannot exceed 100%

### Error Response Format
```json
{
  "code": "4031",
  "message": "Assignment not found",
  "data": null
}
```

## Validation Rules

### Assignment Creation/Update
- `subjectId`: Must reference an existing subject
- `name`: Cannot be blank
- `type`: Must be a valid assignment type
- `startDate`: Cannot be null
- `endDate`: Cannot be null and must be after startDate
- `weight`: Must be between 0.0 and 100.0
- **Total weight constraint**: The sum of all assignment weights for a subject cannot exceed 100.0

### Rubric Information
- `rubricMetaInfo`: JSON string containing name, description, and totalPoints
- `rubricsInfo`: JSON string containing description, weight, scaleType, and performanceLevels

## Database Schema

The assignment table includes the following fields:
- Primary key: `id`
- Foreign key: `subject_id` (references subject table)
- Indexes on frequently queried fields
- Automatic timestamp management for create/update times
- Cascade delete when subject is deleted

## Sample Data

The system includes sample assignment data for testing purposes, including:
- Final Project Report (30% weight)
- Mid-term Presentation (20% weight)
- Research Essay (25% weight)

Each sample includes realistic rubric information in JSON format.
