# Course API Documentation

## Overview
This document describes the Course management API endpoints for the OAS (Oral Assessment System) backend. The Course API provides functionality for managing academic courses/subjects with embedded academic year and semester information.

## Base URL
```
/api/courses
```

## Authentication
All endpoints require authentication. Users must have appropriate roles:
- `ADMIN` or `SUPER_ADMIN`: Full access to all operations
- `TEACHER`: Can view and manage courses they administer
- `STUDENT`: Read-only access to courses they are enrolled in

## Data Models

### Course Request Models

#### CourseQueryRequestDTO
```json
{
  "pageNum": "Integer (Page number, default: 1, minimum: 1)",
  "pageSize": "Integer (Page size, default: 10, minimum: 1)", 
  "year": "Integer (Academic year filter, optional)",
  "semester": "String (Semester filter, optional)",
  "status": "String (Course status filter, optional)",
  "courseCode": "String (Course code filter, optional)",
  "adminUserId": "Long (Admin user ID filter, optional)"
}
```

#### CourseCreateRequestDTO
```json
{
  "courseCode": "String (Required, not blank) - Course code (e.g., 'SWEN90017')",
  "courseName": "String (Required, not blank) - Course name",
  "description": "String (Optional) - Course description", 
  "academicYear": "Integer (Required, not null) - Academic year (e.g., 2024, 2025)",
  "semester": "String (Required, not blank) - Semester ('1', '2', 'summer')",
  "adminUserId": "Long (Required, not null) - Administrator user ID",
  "status": "String (Optional, default: 'active') - Course status"
}
```

#### CourseUpdateRequestDTO
```json
{
  "courseCode": "String (Required, not blank) - Course code",
  "courseName": "String (Required, not blank) - Course name", 
  "description": "String (Optional) - Course description",
  "academicYear": "Integer (Required, not null) - Academic year",
  "semester": "String (Required, not blank) - Semester",
  "adminUserId": "Long (Required, not null) - Administrator user ID",
  "status": "String (Optional) - Course status",
  "isActive": "Boolean (Optional) - Whether the course is active"
}
```

### Course Response Models

#### CourseResponseDTO
```json
{
  "id": "Long - Course ID (Primary Key)",
  "courseCode": "String - Course code (e.g., 'SWEN90017')",
  "courseName": "String - Course name",
  "description": "String - Course description",
  "academicYear": "Integer - Academic year (e.g., 2024, 2025)", 
  "semester": "String - Semester ('1', '2', 'summer')",
  "adminUserId": "Long - Administrator user ID",
  "isActive": "Boolean - Whether the course is active",
  "status": "String - Course status (active, archived, etc.)",
  "students": "Integer - Number of enrolled students",
  "assignments": "Integer - Number of assignments",
  "createTime": "DateTime - Creation timestamp",
  "creator": "Long - Creator user ID",
  "updateTime": "DateTime - Last update timestamp", 
  "updater": "Long - Last updater user ID"
}
```

#### CourseListResponseDTO
```json
{
  "data": "Array<CourseResponseDTO> - List of courses",
  "success": "Boolean - Success flag (always true)", 
  "total": "Long - Total number of records",
  "current": "Long - Current page number",
  "size": "Long - Page size"
}
```

#### CourseStatsResponseDTO
```json
{
  "success": "Boolean - Success flag (always true)",
  "data": {
    "totalCourses": "Integer - Total number of courses",
    "activeCourses": "Integer - Number of active courses",
    "totalStudents": "Integer - Total number of students",
    "totalAssignments": "Integer - Total number of assignments", 
    "currentSemester": "String - Current semester information"
  }
}
```

### Course Status Values
- `active`: Course is currently active
- `archived`: Course has been archived
- `inactive`: Course is temporarily inactive

### Semester Values
- `1`: Semester 1
- `2`: Semester 2  
- `summer`: Summer term

## API Endpoints

### 1. Get Courses with Pagination and Filters
**GET** `/api/courses`

**Query Parameters:** All parameters from CourseQueryRequestDTO can be passed as query parameters

**Request Example:**
```
GET /api/courses?pageNum=1&pageSize=10&year=2025&semester=1&status=active
```

**Response:**
```json
{
  "success": true,
  "code": "200",
  "result": {
    "data": [
      {
        "id": 1,
        "courseCode": "SWEN90017",
        "courseName": "Software Engineering Project Management",
        "description": "Master-level software engineering project management course",
        "academicYear": 2025,
        "semester": "1",
        "adminUserId": 1,
        "isActive": true,
        "status": "active",
        "students": 25,
        "assignments": 3,
        "createTime": "2024-01-10T10:00:00",
        "creator": 1,
        "updateTime": "2024-01-10T10:00:00",
        "updater": 1
      }
    ],
    "success": true,
    "total": 1,
    "current": 1,
    "size": 10
  }
}
```

### 2. Get Course by ID
**GET** `/api/courses/{courseId}`

**Path Parameters:**
- `courseId`: Course ID (Long)

**Response:**
```json
{
  "success": true,
  "code": "200", 
  "result": {
    "id": 1,
    "courseCode": "SWEN90017",
    "courseName": "Software Engineering Project Management",
    "description": "Master-level software engineering project management course",
    "academicYear": 2025,
    "semester": "1",
    "adminUserId": 1,
    "isActive": true,
    "status": "active",
    "students": 25,
    "assignments": 3,
    "createTime": "2024-01-10T10:00:00",
    "creator": 1,
    "updateTime": "2024-01-10T10:00:00",
    "updater": 1
  }
}
```

### 3. Create Course
**POST** `/api/courses`

**Request Body:**
```json
{
  "courseCode": "COMP90024",
  "courseName": "Cluster and Cloud Computing", 
  "description": "Advanced course covering distributed computing and cloud architectures",
  "academicYear": 2025,
  "semester": "1",
  "adminUserId": 1,
  "status": "active"
}
```

**Response:** Same as Get Course by ID response format

### 4. Update Course  
**PUT** `/api/courses/{courseId}`

**Path Parameters:**
- `courseId`: Course ID (Long)

**Request Body:** Same as CourseUpdateRequestDTO

**Response:** Same as Get Course by ID response format

### 5. Delete Course
**DELETE** `/api/courses/{courseId}`

**Path Parameters:**
- `courseId`: Course ID (Long)

**Response:**
```json
{
  "success": true,
  "code": "200",
  "result": null
}
```

**Note:** This performs a logical delete and cascades to delete all associated assignments.

### 6. Get Course Statistics
**GET** `/api/courses/stats`

**Authorization:** Requires `ADMIN` or `SUPER_ADMIN` role

**Response:**
```json
{
  "success": true,
  "code": "200",
  "result": {
    "success": true,
    "data": {
      "totalCourses": 15,
      "activeCourses": 12,
      "totalStudents": 350,
      "totalAssignments": 45,
      "currentSemester": "2025 Semester 1"
    }
  }
}
```

## Error Responses

### Common Error Codes
- `4021`: Course not found
- `4022`: Course already exists for this academic year and semester
- `4023`: Invalid administrator for course
- `4025`: Invalid academic year
- `4026`: Invalid semester

### Error Response Format
```json
{
  "success": false,
  "code": "4021",
  "result": "Course not found"
}
```

## Validation Rules

### Course Creation/Update
- `courseCode`: Cannot be blank, must be unique within academic year and semester
- `courseName`: Cannot be blank
- `academicYear`: Must be between 2020 and 2030
- `semester`: Must be one of: "1", "2", "summer"
- `adminUserId`: Must reference an existing user

### Business Rules
- Course code must be unique within the same academic year and semester combination
- Academic year must be within valid range (2020-2030)
- Semester must be a valid semester identifier
- Admin user must exist in the system

## Usage Examples

### Frontend JavaScript Examples

#### Get All Courses
```javascript
// Get courses for current semester
const response = await fetch('/api/courses?year=2025&semester=1', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
const courses = data.result.data;
```

#### Create a New Course
```javascript
const courseData = {
  courseCode: "INFO30005",
  courseName: "Web Information Technologies", 
  description: "Modern web development technologies and frameworks",
  academicYear: 2025,
  semester: "1",
  adminUserId: 1
};

const response = await fetch('/api/courses', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(courseData)
});
const result = await response.json();
```

#### Update Course Status
```javascript
const updateData = {
  courseCode: "INFO30005",
  courseName: "Web Information Technologies",
  academicYear: 2025,
  semester: "1", 
  adminUserId: 1,
  status: "archived",
  isActive: false
};

const response = await fetch(`/api/courses/${courseId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});
```

### Python Examples

#### Get Course Statistics
```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get('http://localhost:8081/api/courses/stats', headers=headers)
stats = response.json()['result']['data']
print(f"Total courses: {stats['totalCourses']}")
```

## Database Schema

The course data is stored in the `subject` table with the following key fields:
- Primary key: `subject_id`
- Unique constraint: `subject_code`, `academic_year`, `semester`
- Indexes on frequently queried fields: `admin_user_id`, `is_active`, `academic_year`, `semester`
- Logical references to user table (no foreign key constraints)

## Performance Notes

- Course statistics endpoint uses optimized SQL aggregation to avoid N+1 query problems
- Assignment counts are calculated in real-time when retrieving course details
- Student counts are placeholders (would require enrollment system implementation)
- All queries use appropriate database indexes for optimal performance

## Security Considerations

- All endpoints require valid JWT authentication
- Role-based access control enforced via `@PreAuthorize` annotations
- Input validation using Bean Validation annotations
- Logical deletes used instead of hard deletes to maintain data integrity
