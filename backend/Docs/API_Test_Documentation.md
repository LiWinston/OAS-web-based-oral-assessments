# API Test Documentation

## Test Environment

| Tester  | Processor          | RAM   | Java Edition                            | Postman Edition |
| ------- | ------------------ | ----- | --------------------------------------- | --------------- |
| Weiran  | Apple M1 Pro       | 32 GB | corretto-1.8 (java version "1.8.0_462") | 11.58.4         |
| Benyuan | AMD Ryzen 9 5900HX | 32 GB | corretto-1.8 (java version "1.8.0_422") | 11.59.0         |



## Epic 1. CSV IO Support (Canvas Integration)

### 1. [POST] /api/csv/preview

#### Test Case 1: Preview a Valid CSV File

##### Description

Verify that the system successfully previews CSV content when provided with a valid CSV file and a valid `type` parameter.

##### Pre-conditions

The backend server is running and accessible.

The `type` query parameter is set to `student`.

A valid CSV file exists and follows the required template.

##### Input

**Request URL:**

```
POST /api/csv/preview?type=student
```

**Body**:

```
{
  "file": "valid_students.csv"
}
```

##### Expected Output

HTTP status code: `200 OK`

```json
{
    "success": true,
    "code": "200",
    "data": {
        "newStudents": [],
        "existingStudents": [
            {
                "student": "string",
                "id": "string",
                "sisUserId": "string",
                "sisLoginId": "string",
                "section": "Estring",
                "studentId": "string",
                "courseId": null,
                "assignmentId": null
            },
            
        ],
        "totalCount": int,
        "newCount": int,
        "existingCount": int
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 24/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "newStudents": [],
        "existingStudents": [
            {
                "student": "Yun Chen",
                "id": "395809",
                "sisUserId": "1412174",
                "sisLoginId": "yunchen6",
                "section": "Elements of Data Processing (COMP20008_2025_SM1), Lecture 1 (1), Lecture 2 (1), and Tutorial 1 (4)",
                "studentId": "1412174",
                "courseId": null,
                "assignmentId": null
            },
            {
                "student": "Benyuan Wang",
                "id": "395810",
                "sisUserId": "1492846",
                "sisLoginId": "benyuanw",
                "section": "Elements of Data Processing (COMP20008_2025_SM1), Lecture 1 (1), Lecture 2 (1), and Tutorial 1 (4)",
                "studentId": "1492846",
                "courseId": null,
                "assignmentId": null
            }
        ],
        "totalCount": 2,
        "newCount": 0,
        "existingCount": 2
    }
}
```

**Result**:

The system returned the expected response. The CSV content was successfully parsed, and the response structure, status code, and data fields matched the expected output.

**Notes**: 

None.



### 2. [POST] /api/csv/import

#### Test Case 1: Import a Valid CSV File

##### Description

Verify that the system successfully imports a valid CSV file for students and sends activation emails when provided with correct request parameters.

##### Pre-conditions

The backend server is running and accessible.

A valid CSV file exists and follows the required template.

The `type` in `dto` is set to `student`.

The provided `assignmentId` exists in the system.

##### Input

**Request URL:**

```
POST /api/csv/preview?type=student
```

**Body**:

```
{
  "file": "valid_students.csv",
  "dto": {
    "type": "student",
    "assignmentId": 101
  }
}
```

##### Expected Output

HTTP status code: `200 OK`

```json
{
    "success": true,
    "code": "200",
    "data": {}
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 24/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "timestamp": "2025-08-24 16:28:58",
    "status": 500,
    "error": "Internal Server Error",
    "path": "/api/csv/import"
}
```

**Result**:

The test failed. The API returned an internal server error caused by an unhandled `NullPointerException`. The response did not match the expected `200 OK` output structure.

**Notes**: 

None.



## Epic 2. User Authentication and Account Management

### 1. [POST] /login

#### Test Case 1: Login with a Valid Email and Correct Password

##### Description

Verify that the system successfully authenticates a user when correct email and password are provided, and returns valid access and refresh tokens.

##### Pre-conditions

The user account exists in the system.

The password for the account is correct.

The account is active and not disabled or deleted.

##### Input

```json
{
  "email": "alice@student.unimelb.edu.au",
  "password": "password1"
}
```

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "code": "200",
  "data": {
    "userId": 0,
    "username": "string",
    "role": "string",
    "email": "string",
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "string",
    "expiresIn": 0
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 20/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "userId": 2,
        "username": "alice",
        "role": "ROLE_ADMIN",
        "email": "alice@student.unimelb.edu.au",
        "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhbGljZSIsInRva2VuX3R5cGUiOiJhY2Nlc3MiLCJ1c2VyaWQiOjIsImxvZ2luX3VzZXJfa2V5IjoiMGEzNGNmNGUtZjcyNS00MDU0LTgyM2YtMzgzNWQyOWYxZDJiIiwiaWF0IjoxNzU1NjcyODA0LCJleHAiOjE3NTU2NzM3MDR9.ICboqn9PzlzaXeTRYNv8ZE7yDwfF-9ZJB6hqF6mY9CcOC-pVbHCHn2HLy2gRrS-3aNFJTxpBwM_c9GvcHF0y3w",
        "refreshToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhbGljZSIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwidXNlcmlkIjoyLCJpYXQiOjE3NTU2NzI4MDUsImV4cCI6MTc1ODI2NDgwNX0.TeRzbViLjMG9ilxBdaZgZ24eUALAmz0B0ww7H-RlWJORWkQCVfOJZ4JxX5pZUIdVB_SOBFGrHBk0UUjej37uRg",
        "tokenType": "Bearer",
        "expiresIn": 900
    }
}
```

**Result**:

The system successfully authenticated the user with valid credentials. The response returned an HTTP `200 OK` status code and contained the expected fields, including `accessToken`, `refreshToken`, `tokenType`, and `expiresIn`.

**Notes**: 

No unexpected fields or structural deviations were observed in the API response.



#### Test Case 2: Login with an Incorrect Header

##### Description

Verify the system's behavior when a request is made to the `/login` endpoint with an incorrect `Content-Type` header (e.g., `text/plain` instead of `application/json`).

##### Pre-conditions

The backend server is running and accessible.

No special user state is required for this test.

##### Input

**Headers**:

```text
Content-Type: text/plain
```

**Body**:

```json
{
  "email": "alice@student.unimelb.edu.au",
  "password": "password1"
}
```

##### Expected Output

HTTP status code: `400 Bad Request`

```json
{
  "success": false,
  "code": "string",
  "data": {}
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 20/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "timestamp": "2025-08-20 17:00:39",
    "status": 415,
    "error": "Unsupported Media Type",
    "path": "/login"
}
```

**Result**: 

The system returned an HTTP `415 Unsupported Media Type` error instead of the expected `400 Bad Request` response. Additionally, the error response did not follow the API's defined response schema.

**Notes**:

The returned response indicates that Spring Boot’s **default global error handler** intercepted the request rather than the backend’s custom exception handling.

Expected behavior:

- The API should validate the `Content-Type` header and return a structured response using the predefined schema.
- The status code should be `400 Bad Request` instead of `415`, if this aligns with the API specification.



#### Test Case 3: Login with Invalid Credentials

##### Description

Verify the system's behavior when the `/login` endpoint is called with invalid or missing credentials, including nonexistent email, incorrect password, invalid email format, empty fields, or missing fields.

##### Pre-conditions

The backend server is running and accessible.

Some test accounts does not exist in the system, such as `AAAAXXXX@student.unimelb.edu.au`.

No special user state is required for these tests.

##### Input

**Body**:

```json
{
  "email": "AAAAXXXX@student.unimelb.edu.au",
  "password": "password1"
}
```

##### Expected Output

HTTP status code: `400 Bad Request`

```json
{
  "success": false,
  "code": "string",
  "data": {}
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 20/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": false,
    "code": "3001",
    "data": "Invalid username or password"
}
```

**Result**: 

The actual functional output is correct and meets the requirements discussed during the development meeting.
 However, the API information generated by **Swagger** is inconsistent with the actual response.

**Notes**:

Update the **Swagger annotations** to align with the implemented functionality in order to avoid confusion for developers and testers. Inconsistent API documentation may lead to potential development and integration issues.



### 2.  [POST] /logout

#### Test Case 1: Logout Using a Valid Token

##### Description

Verify that the system successfully revokes a valid refresh token for a given user.

##### Pre-conditions

The backend server is running and accessible.

A valid user account exists in the system.

 A valid `refreshToken` has been issued to the user during a previous login session.

##### Input

```json
{
  "userId": 2,
  "refreshToken": "valid-refresh-token"
}
```

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "code": "string",
  "data": "string"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 21/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": "Logout successfully"
}
```

**Result**: **Fail**
 The system succeed to revoke the refresh token. 

**Notes**: None



### 3. [POST] /onboarding/register (placeholder)



## Epic 4. System Setup & Configuration (Course Management)

### 1. [GET] /api/courses

#### Test Case 1: 

##### Description

Verify that the system successfully retrieves a paginated list of courses when valid query parameters are provided.

##### Pre-conditions

The backend server is running and accessible.
 At least one course matching the query parameters exists in the system.

##### Input

**Request URL**:

```
GET /api/courses
```

**Query Parameters**:

```
{
  "pageNum": 1,
  "pageSize": 10,
  "year": 2024,
  "semester": "1",
  "status": "active",
  "courseCode": "SWEN90017",
  "adminUserId": 1
}
```

##### Expected Output

HTTP status code: `200 OK`

```
{
  "success": true,
  "code": "200",
  "data": {
    "data": [
      {
        "id": 1,
        "courseCode": "SWEN90017",
        "courseName": "Software Engineering Project Management",
        "description": "Master-level software engineering project management course",
        "academicYear": 2024,
        "semester": "1",
        "adminUserId": 1,
        "isActive": true,
        "status": "active",
        "students": 25,
        "assignments": 3,
        "createTime": "2025-08-24T07:05:01.515Z",
        "creator": 1,
        "updateTime": "2025-08-24T07:05:01.515Z",
        "updater": 1
      }
    ],
    "success": true,
    "total": 25,
    "current": 1,
    "size": 10
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 24/8/2025

**Tester**: Benyuan

**Actual Output**:

```
{
    "success": true,
    "code": "200",
    "data": {
        "data": [
            {
                "id": 5,
                "courseCode": "COMP90038",
                "courseName": "Algorithms and Complexity",
                "description": "Analysis and design of algorithms, computational complexity theory",
                "academicYear": 2025,
                "semester": "1",
                "adminUserId": 49,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 1,
                "createTime": "2025-08-23T11:50:17",
                "creator": 49,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            },
            {
                "id": 10,
                "courseCode": "SWEN90004",
                "courseName": "Modelling Complex Software Systems",
                "description": "Formal methods and mathematical modeling for complex software systems",
                "academicYear": 2025,
                "semester": "1",
                "adminUserId": 62,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 0,
                "createTime": "2025-08-23T11:50:17",
                "creator": 62,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            },
            {
                "id": 6,
                "courseCode": "SWEN90010",
                "courseName": "High Integrity Systems Engineering",
                "description": "Safety-critical and high-reliability software systems development",
                "academicYear": 2025,
                "semester": "1",
                "adminUserId": 55,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 1,
                "createTime": "2025-08-23T11:50:17",
                "creator": 55,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            },
            {
                "id": 9,
                "courseCode": "COMP90024",
                "courseName": "Cluster and Cloud Computing",
                "description": "Distributed computing, cloud platforms, and scalable system design",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 61,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 1,
                "createTime": "2025-08-23T11:50:17",
                "creator": 61,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            },
            {
                "id": 7,
                "courseCode": "COMP90050",
                "courseName": "Advanced Database Systems",
                "description": "Advanced topics in database design, optimization, and distributed systems",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 55,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 1,
                "createTime": "2025-08-23T11:50:17",
                "creator": 55,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            },
            {
                "id": 11,
                "courseCode": "SWEN90016",
                "courseName": "SPM",
                "description": "SWEN90016",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 0,
                "createTime": "2025-08-23T00:19:35",
                "creator": 1,
                "updateTime": "2025-08-23T00:19:35",
                "updater": null
            },
            {
                "id": 3,
                "courseCode": "COMP90049",
                "courseName": "Knowledge Technologies",
                "description": "Introduction to artificial intelligence and machine learning concepts",
                "academicYear": 2024,
                "semester": "1",
                "adminUserId": 49,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 1,
                "createTime": "2025-08-23T11:50:17",
                "creator": 47,
                "updateTime": "2025-08-23T14:53:24",
                "updater": null
            },
            {
                "id": 1,
                "courseCode": "SWEN90017",
                "courseName": "Software Engineering Project Management",
                "description": "Master-level software engineering project management course",
                "academicYear": 2024,
                "semester": "1",
                "adminUserId": 1,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 4,
                "createTime": "2025-08-23T11:50:17",
                "creator": 1,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            },
            {
                "id": 2,
                "courseCode": "COMP90082",
                "courseName": "Software Project",
                "description": "Industry-based software development project with real clients",
                "academicYear": 2024,
                "semester": "2",
                "adminUserId": 49,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 1,
                "createTime": "2025-08-23T11:50:17",
                "creator": 47,
                "updateTime": "2025-08-23T14:53:24",
                "updater": null
            },
            {
                "id": 4,
                "courseCode": "SWEN90016",
                "courseName": "Software Processes and Management",
                "description": "Software development lifecycle, project management, and quality assurance",
                "academicYear": 2024,
                "semester": "2",
                "adminUserId": 49,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 1,
                "createTime": "2025-08-23T11:50:17",
                "creator": 49,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            },
            {
                "id": 8,
                "courseCode": "SWEN90006",
                "courseName": "Software Modelling and Design",
                "description": "Object-oriented analysis, design patterns, and software architecture",
                "academicYear": 2024,
                "semester": "summer",
                "adminUserId": 61,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 1,
                "createTime": "2025-08-23T11:50:17",
                "creator": 61,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            }
        ],
        "success": true,
        "total": 0,
        "current": 1,
        "size": 10
    }
}
```

**Result**:
 The system returned the expected response. The retrieved course list, pagination details, and status code matched the expected output.

**Notes**: None



### 2. [GET] /api/courses/{courseId}

#### Test Case 1: 

##### Description

Verify that the system successfully retrieves a course by ID when valid query parameters are provided.

##### Pre-conditions

The backend server is running and accessible.

The target course matching the query parameters exists in the system.

##### Input

**Request URL**:

```
GET /api/courses
```

**Query Parameters**:

```
{
  "pageNum": 1,
  "pageSize": 10,
  "year": 2024,
  "semester": "1",
  "status": "active",
  "courseCode": "SWEN90017",
  "adminUserId": 1
}
```

##### Expected Output

HTTP status code: `200 OK`

```
{
  "success": true,
  "code": "200",
  "data": {
        "id": 8,
        "courseCode": "SWEN90006",
        "courseName": "Software Modelling and Design",
        "description": "Object-oriented analysis, design patterns, and software architecture",
        "academicYear": 2024,
        "semester": "summer",
        "adminUserId": 61,
        "isActive": true,
        "status": "active",
        "students": 0,
        "assignments": 1,
        "createTime": "2025-08-23T11:50:17",
        "creator": 61,
        "updateTime": "2025-08-23T14:20:05",
        "updater": null
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 24/8/2025

**Tester**: Benyuan

**Actual Output**:

```
{
    "success": true,
    "code": "200",
    "data": {
        "id": 8,
        "courseCode": "SWEN90006",
        "courseName": "Software Modelling and Design",
        "description": "Object-oriented analysis, design patterns, and software architecture",
        "academicYear": 2024,
        "semester": "summer",
        "adminUserId": 61,
        "isActive": true,
        "status": "active",
        "students": 0,
        "assignments": 1,
        "createTime": "2025-08-23T11:50:17",
        "creator": 61,
        "updateTime": "2025-08-23T14:20:05",
        "updater": null
    }
}
```

**Result**:
 The system returned the expected response. The retrieved course, details, and status code matched the expected output.

**Notes**: None.



### 3. [PUT] /api/courses/{courseId}

#### Test Case 1: 

##### Description

Verify that the system successfully updates an existing course when a valid `courseId` and a correct request body are provided.

##### Pre-conditions

The backend server is running and accessible.

The specified course ID exists in the system.

The user has sufficient permissions to update the course.

##### Input

**Path Parameter**:

```
courseId = 8
```

**Request Body**:

```
{
    "courseCode": "SWEN90006",
    "courseName": "Software Modelling and Design",
    "description": "Object-oriented analysis, design patterns, and software architecture",
    "academicYear": 2025,
    "semester": "summer",
    "adminUserId": 2,
    "isActive": true,
    "status": "active"
}
```

##### Expected Output

HTTP status code: `200 OK`

```
{
    "success": true,
    "code": "200",
    "data": {
        "id": 8,
        "courseCode": "SWEN90006",
        "courseName": "Software Modelling and Design",
        "description": "Object-oriented analysis, design patterns, and software architecture",
        "academicYear": 2025,
        "semester": "summer",
        "adminUserId": 2,
        "isActive": true,
        "status": "active",
        "students": 0,
        "assignments": 1,
        "createTime": "2025-08-23T11:50:17",
        "creator": 61,
        "updateTime": "2025-08-23T14:20:05",
        "updater": null
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 24/8/2025

**Tester**: Benyuan

**Actual Output**:

```
{
    "success": true,
    "code": "200",
    "data": {
        "id": 8,
        "courseCode": "SWEN90006",
        "courseName": "Software Modelling and Design",
        "description": "Object-oriented analysis, design patterns, and software architecture",
        "academicYear": 2025,
        "semester": "summer",
        "adminUserId": 2,
        "isActive": true,
        "status": "active",
        "students": 0,
        "assignments": 1,
        "createTime": "2025-08-23T11:50:17",
        "creator": 61,
        "updateTime": "2025-08-23T14:20:05",
        "updater": null
    }
}
```

**Result**:
 The system returned the expected response. The course data was successfully updated and matched the request body.



### 4. [DELETE] /api/courses/{courseId} (Placeholder)



##### Expected Output

```json

```

##### **Execution History**

###### Test 1

**Execution Date**:

**Tester**:

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "id": 4,
        "courseCode": "SWEN90016",
        "courseName": "Software Processes and Management",
        "description": "Seems like water",
        "academicYear": 2023,
        "semester": "2",
        "adminUserId": 35,
        "isActive": true,
        "status": "active",
        "students": 0,
        "assignments": 0,
        "createTime": null,
        "creator": null,
        "updateTime": null,
        "updater": null
    }
}
```

**Result**: Fail.

**Notes**:



## Epic 9. Super Administrator

### 1. [GET] /api/superadmin/courses/{id}

#### Test Case 1: Successful Retrieval with a Valid ID

##### Description

This is the primary "happy path" test case. Its purpose is to verify that the API correctly retrieves and returns the full details for a specific course when a valid and existing course `id` is provided. The test ensures the API responds with a `200 OK` status code and that the returned JSON object's structure and data types match the defined schema for a course.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```
/api/superadmin/courses/1
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "id": 1,
        "code": "SWEN90017",
        "name": "Software Project 1",
        "description": "hhhh",
        "semester": "semester 1",
        "year": 2025,
        "department": null, // not developed yet
        "venue": null, // not developed yet
        "status": "1",
        "adminId": 1,
        "adminName": "test",
        "adminEmail": "p@x.com",
        "studentsCount": 0, // not developed yet
        "assignmentsCount": 0, // not developed yet
        "createdAt": "2025-08-17T17:52:48",
        "updatedAt": "2025-08-17T17:52:51",
        "assignments": [] // not developed yet
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 19/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "id": 1,
        "code": "SWEN90017",
        "name": "Software Project 1",
        "description": "hhhh",
        "semester": "semester 1",
        "year": 2025,
        "department": null,
        "venue": null,
        "status": "1",
        "adminId": 1,
        "adminName": "test",
        "adminEmail": "p@x.com",
        "studentsCount": null,
        "assignmentsCount": null,
        "createdAt": "2025-08-17T17:52:48",
        "updatedAt": "2025-08-17T17:52:51",
        "assignments": []
    }
}
```

**Result**: Pass

**Notes**: Field `department`, `venue`, `studentsCount`, `assignmentsCount`, and `assignments` are all set to null or an empty set, as the functions to retrieve these fields have not been developed yet.



#### Test Case 2: Request with an Invalid ID Format

##### Description

This is a negative test case focused on input validation. It checks how the API handles a request where the course `id` in the path is in an invalid format (e.g., a string of letters like 'abc' instead of the expected integer). The test verifies that the API gracefully rejects the malformed request, returning a `400 Bad Request` status code and a consistent error structure, thereby preventing unexpected server-side errors.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```
/api/superadmin/courses/abc
```

##### Expected Output

```json
{
    "timestamp": "", // Execution time
    "status": 400,
    "error": "Bad Request",
    "path": "/api/superadmin/courses/abc"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 19/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "timestamp": "2025-08-19 22:44:48",
    "status": 400,
    "error": "Bad Request",
    "path": "/api/superadmin/courses/abc"
}
```

**Result**: Pass

**Notes**: The Swagger API documentation differs from the actual output.



#### Test Case 3: Request for a Non-Existent Resource

##### Description

This negative test case checks the API's behaviour when a client requests a resource that does not exist. It uses a syntactically valid `id` (an integer), but one that has no corresponding course in the database. This test ensures the API provides a clear and correct error response, signalling that the resource could not be found. The expected response is a `4021 Course not found`.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```
/api/superadmin/courses/100
```

##### Expected Output

```json
{
    "success": false,
    "code": "4021",
    "data": "Course not found"
}
```

##### Execution History

###### Test 1

**Execution Date**: 19/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "4021",
    "data": "Course not found"
}
```

**Result**: Pass

**Notes**:  Lack of Swagger API documentation.



### 2. [GET] /api/superadmin/admins/{id}

#### Test Case 1: Successful Retrieval with a Valid ID

##### Description

This is the primary "happy path" test case. Its purpose is to verify that the API correctly retrieves and returns the full details for a specific course when a valid and existing course `id` is provided. The test ensures the API responds with a `200 OK` status code and that the returned JSON object's structure and data types match the defined schema for a course.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```
/api/superadmin/admins/35
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "userId": 35,
        "department": "test",
        "invitedAt": "2025-08-16T14:05:04",
        "registeredAt": "2025-08-17T14:05:08",
        "lastLoginAt": "2025-08-19T14:05:32",
        "coursesManaged": 2,
        "studentsManaged": 50,
        "assignmentsCreated": 2,
        "id": "35",
        "email": "test@unimelb.edu.au",
        "name": "testadmin1",
        "status": "ACTIVE",
        "registrationStatus": "INVITED",
        "sisLoginId": "string",
        "token": "1",
        "invitationExpiresAt": "2025-08-19T15:55:42.339Z", // field in the user table
        "courses": [], // not developed yet
        "recentActivity": [] // not developed yet
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 19/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "userId": 35,
        "department": "test",
        "invitedAt": null,
        "registeredAt": null,
        "lastLoginAt": null,
        "coursesManaged": 2,
        "studentsManaged": 50,
        "assignmentsCreated": 2,
        "id": "35",
        "email": "test@unimelb.edu.au",
        "name": "testadmin1",
        "status": "ACTIVE",
        "registrationStatus": "INVITED",
        "sisLoginId": null,
        "token": "1",
        "invitationExpiresAt": null,
        "courses": [],
        "recentActivity": []
    }
}
```

**Result**: Fail

**Notes**: Fields `invitedAt`, `registeredAt`, and `lastLoginAt` are not retrieved. `invitationExpiresAt` is not in the `sys_user` table.



#### Test Case 2: Request with an Invalid ID Format 

##### Description

This is a negative test case focused on input validation. It checks how the API handles a request where the course `id` in the path is in an invalid format (e.g., a string of letters like 'abc' instead of the expected integer). The test verifies that the API gracefully rejects the malformed request, returning a `400 Bad Request` status code and a consistent error structure, thereby preventing unexpected server-side errors.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```
/api/superadmin/admins/abc
```

##### Expected Output

```json
{
    "success": false,
    "code": "400",
    "data": "Invalid admin id"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 19/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "400",
    "data": "Invalid admin id"
}
```

**Result**: Pass.



#### Test Case 3: Request for a Non-Existent Resource

##### Description

This negative test case checks the API's behaviour when a client requests a resource that does not exist. It uses a syntactically valid `id` (an integer), but one that has no corresponding course in the database. This test ensures the API provides a clear and correct error response, signalling that the resource could not be found. Based on the documentation provided, the expected response is a `400 Bad Request`.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```
/api/superadmin/admins/100
```

##### Expected Output

```json
{
    "success": false,
    "code": "400",
    "data": "Invalid admin id"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 19/8/2025

**Tester**:

**Actual Output**:

```json
{
    "success": false,
    "code": "400",
    "data": "Invalid admin id"
}
```

**Result**: Pass.



### 3. [GET] /api/superadmin/admins/check-email/{email}

#### Test Case 1: Check an Existing Email

##### Description

This is a "happy path" test case that verifies the API's primary function when an email address known to already exist in the system is provided. It checks that the API correctly processes the request, responds with a `200 OK` status, and returns a response body indicating the email is taken. 

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```
/api/superadmin/admins/check-email/test@unimelb.edu.au
```

##### Expected Output

```json
{
  "success": true,
  "code": "200",
  "data": {
    "email": "test@unimelb.edu.au",
    "exists": true,
    "isValid": true
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 20/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "email": "test@unimelb.edu.au",
        "exists": true,
        "isValid": true
    }
}
```

**Result**: Pass.



#### Test Case 2: Check a Non-Existent but Valid Email

##### Description

This is the second "happy path" test case. It validates the scenario where the provided email address is in a valid format but does not exist in the system. The API should still return a `200 OK` status to confirm the check was successful, with a response body indicating that the email is available (i.e., does not exist).

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```
/api/superadmin/admins/check-email/faketest@unimelb.edu.au
```

##### Expected Output

```json
{
  "success": true,
  "code": "200",
  "data": {
    "email": "faketest@unimelb.edu.au",
    "exists": false,
    "isValid": true
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 20/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "email": "faketest@unimelb.edu.au",
        "exists": false,
        "isValid": true
    }
}
```

**Result**: Pass.



#### Test Case 3: Check an Invalid Email Format

##### Description

This is the third "happy path" test case focusing on input validation. It sends a request with a string that does not conform to a valid email format (e.g., "invalid-email" or "user@domain"). The purpose is to ensure the API's validation logic correctly identifies the malformed input. The expected code is `200 OK,` and the `isValid` field is set to `false`.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```
/api/superadmin/admins/check-email/123
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "email": "123",
        "exists": false,
        "isValid": false
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 20/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "email": "123",
        "exists": false,
        "isValid": false
    }
}
```

**Result**: Pass.



### 4. [POST] /api/superadmin/courses

#### Test Case 1: Basic Retrieval of Courses

##### Description

This is the primary "happy path" test case. Its purpose is to verify that the API can successfully retrieve a paginated list of courses with a basic request. This test sends a request for the first page with a standard limit, without any filters, to ensure the fundamental listing functionality is working correctly.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```json
{
    "page": 1,
    "limit": 10
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "courses": [
            {
                "id": 5,
                "code": "COMP90038",
                "name": "Algorithms and Complexity",
                "semester": "Semester 1",
                "year": 2025,
                "department": null,  // not developed yet
                "venue": null,  // not developed yet
                "status": "ACTIVE",
                "adminId": 49,
                "adminName": "1",
                "adminEmail": "yanqings1@student.unimelb.edu.au",
                "studentsCount": null,  // not developed yet
                "assignmentsCount": null,  // not developed yet
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 10,
                "code": "SWEN90004",
                "name": "Modelling Complex Software Systems",
                "semester": "Semester 1",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 62,
                "adminName": "aaa",
                "adminEmail": "bob34@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 6,
                "code": "SWEN90010",
                "name": "High Integrity Systems Engineering",
                "semester": "Semester 1",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 55,
                "adminName": "lhc",
                "adminEmail": "jsmith@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 9,
                "code": "COMP90024",
                "name": "Cluster and Cloud Computing",
                "semester": "Semester 2",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 61,
                "adminName": "Haocheng Li",
                "adminEmail": "haochengl4@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 7,
                "code": "COMP90050",
                "name": "Advanced Database Systems",
                "semester": "Semester 2",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 55,
                "adminName": "lhc",
                "adminEmail": "jsmith@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 11,
                "code": "SWEN90016",
                "name": "SPM",
                "semester": "Semester 2",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T00:19:35",
                "updatedAt": "2025-08-23T00:19:35"
            },
            {
                "id": 3,
                "code": "COMP90049",
                "name": "Knowledge Technologies",
                "semester": "Semester 1",
                "year": 2024,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 49,
                "adminName": "1",
                "adminEmail": "yanqings1@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:53:24"
            },
            {
                "id": 1,
                "code": "SWEN90017",
                "name": "Software Engineering Project Management",
                "semester": "Semester 1",
                "year": 2024,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 2,
                "code": "COMP90082",
                "name": "Software Project",
                "semester": "Semester 2",
                "year": 2024,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 49,
                "adminName": "1",
                "adminEmail": "yanqings1@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:53:24"
            },
            {
                "id": 4,
                "code": "SWEN90016",
                "name": "Software Processes and Management",
                "semester": "Semester 2",
                "year": 2024,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 49,
                "adminName": "1",
                "adminEmail": "yanqings1@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 8,
                "code": "SWEN90006",
                "name": "Software Modelling and Design",
                "semester": "Summer Term",
                "year": 2024,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 61,
                "adminName": "Haocheng Li",
                "adminEmail": "haochengl4@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 2,
            "totalItems": 11,
            "itemsPerPage": 10,
            "hasNext": true,
            "hasPrev": false
        }
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 23/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "courses": [
            {
                "id": 5,
                "code": "COMP90038",
                "name": "Algorithms and Complexity",
                "semester": "Semester 1",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 49,
                "adminName": "1",
                "adminEmail": "yanqings1@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 10,
                "code": "SWEN90004",
                "name": "Modelling Complex Software Systems",
                "semester": "Semester 1",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 62,
                "adminName": "aaa",
                "adminEmail": "bob34@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 6,
                "code": "SWEN90010",
                "name": "High Integrity Systems Engineering",
                "semester": "Semester 1",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 55,
                "adminName": "lhc",
                "adminEmail": "jsmith@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 9,
                "code": "COMP90024",
                "name": "Cluster and Cloud Computing",
                "semester": "Semester 2",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 61,
                "adminName": "Haocheng Li",
                "adminEmail": "haochengl4@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 7,
                "code": "COMP90050",
                "name": "Advanced Database Systems",
                "semester": "Semester 2",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 55,
                "adminName": "lhc",
                "adminEmail": "jsmith@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 11,
                "code": "SWEN90016",
                "name": "SPM",
                "semester": "Semester 2",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T00:19:35",
                "updatedAt": "2025-08-23T00:19:35"
            },
            {
                "id": 3,
                "code": "COMP90049",
                "name": "Knowledge Technologies",
                "semester": "Semester 1",
                "year": 2024,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 49,
                "adminName": "1",
                "adminEmail": "yanqings1@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:53:24"
            },
            {
                "id": 1,
                "code": "SWEN90017",
                "name": "Software Engineering Project Management",
                "semester": "Semester 1",
                "year": 2024,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 2,
                "code": "COMP90082",
                "name": "Software Project",
                "semester": "Semester 2",
                "year": 2024,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 49,
                "adminName": "1",
                "adminEmail": "yanqings1@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:53:24"
            },
            {
                "id": 4,
                "code": "SWEN90016",
                "name": "Software Processes and Management",
                "semester": "Semester 2",
                "year": 2024,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 49,
                "adminName": "1",
                "adminEmail": "yanqings1@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            },
            {
                "id": 8,
                "code": "SWEN90006",
                "name": "Software Modelling and Design",
                "semester": "Summer Term",
                "year": 2024,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 61,
                "adminName": "Haocheng Li",
                "adminEmail": "haochengl4@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 0,
            "totalItems": 0,
            "itemsPerPage": 10,
            "hasNext": false,
            "hasPrev": false
        }
    }
}
```

**Result**: Fail.

**Notes**: For the `pagination` part, `totalPages` and `totalItems` returned 0, which is wrong. Seems like this part is wrong in logic. The `courses` returned 11 courses, which is larger than the page limitation of 10.





### 5. [POST] /api/superadmin/admins

#### Test Case 1: Basic Retrieval of Admins

##### Description

This is the fundamental "happy path" test case. Its purpose is to verify that the API can successfully retrieve a paginated list of administrators using only the essential `page` and `limit` parameters. This test ensures the endpoint is functional and returns the expected data structure, including the `admins` array and `pagination` object, without any complex filtering.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```json
{
    "page": 1,
    "limit": 0
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "admins": [
            {
                "userId": 48,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "48",
                "email": "superadmin@example.com",
                "name": "testsuper",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 35,
                "department": "test",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 2,
                "studentsManaged": 50,
                "assignmentsCreated": 2,
                "id": "35",
                "email": "test@unimelb.edu.au",
                "name": "testadmin1",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": "1",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 18,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "18",
                "email": "bob4@student.unimelb.edu.au",
                "name": "bob4",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 17,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "17",
                "email": "alice4@student.unimelb.edu.au",
                "name": "alice4",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 19,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "19",
                "email": "carol4@student.unimelb.edu.au",
                "name": "carol4",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 20,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "20",
                "email": "dave4@student.unimelb.edu.au",
                "name": "dave4",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 21,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "21",
                "email": "eve4@student.unimelb.edu.au",
                "name": "eve4",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 12,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "12",
                "email": "alice3@student.unimelb.edu.au",
                "name": "alice3",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 13,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "13",
                "email": "bob3@student.unimelb.edu.au",
                "name": "bob3",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 14,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "14",
                "email": "carol3@student.unimelb.edu.au",
                "name": "carol3",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 15,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "15",
                "email": "dave3@student.unimelb.edu.au",
                "name": "dave3",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 16,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "16",
                "email": "eve3@student.unimelb.edu.au",
                "name": "eve3",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 7,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "7",
                "email": "alice1@student.unimelb.edu.au",
                "name": "alice1",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 8,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "8",
                "email": "bob2@student.unimelb.edu.au",
                "name": "bob2",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 9,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "9",
                "email": "carol2@student.unimelb.edu.au",
                "name": "carol2",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 10,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "10",
                "email": "dave2@student.unimelb.edu.au",
                "name": "dave2",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 11,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "11",
                "email": "eve2@student.unimelb.edu.au",
                "name": "eve2",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 2,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "2",
                "email": "alice@student.unimelb.edu.au",
                "name": "alice",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 6,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "6",
                "email": "eve@student.unimelb.edu.au",
                "name": "eve",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 5,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "5",
                "email": "dave@student.unimelb.edu.au",
                "name": "dave",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 4,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "4",
                "email": "carol@student.unimelb.edu.au",
                "name": "carol",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 3,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "3",
                "email": "bob@student.unimelb.edu.au",
                "name": "bob",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 1,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "1",
                "email": "p@x.com",
                "name": "test",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 49,
                "department": "1",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "49",
                "email": "yanqings1@student.unimelb.edu.au",
                "name": "1",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": "MSwf5orpAJm066noijtLp0ZWrEQ7uE2TzYs2MPqe9s4",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 55,
                "department": "Computer Science",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "55",
                "email": "jsmith@student.unimelb.edu.au",
                "name": "lhc",
                "status": "ACTIVE",
                "registrationStatus": "REGISTERED",
                "sisLoginId": null,
                "token": "f2vnS7BEyqVB6TTVWxlanAYU1rDWFH0FdOIB0hYeRzw",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 61,
                "department": "Computer Science",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "61",
                "email": "haochengl4@student.unimelb.edu.au",
                "name": "Haocheng Li",
                "status": "ACTIVE",
                "registrationStatus": "REGISTERED",
                "sisLoginId": null,
                "token": "290voAytqjDefYyHOfqfyzsTdm3-o4EqtTUEmvInqB8",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 62,
                "department": "asd",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "62",
                "email": "bob34@student.unimelb.edu.au",
                "name": "aaa",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": "RPI1XDLkCdGveWa5AJboIGYxoZB1bcdlLzrLr1Zyxao",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 66,
                "department": "asd",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "66",
                "email": "bob433@student.unimelb.edu.au",
                "name": "wqseeqweqewq",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": "a-dOY4EhYsbpYRXLJMSfaH_T_DElYH2drVWVoakW61o",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 67,
                "department": "1",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "67",
                "email": "bob4wq@student.unimelb.edu.au",
                "name": "qweqeqweqweqweq",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": "7l0rF8H1FtR-8usmYI1Q8nzS58WYiJbvF5kTMiE4IIA",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 2,
            "totalItems": 18,
            "itemsPerPage": 10,
            "hasNext": true,
            "hasPrev": false
        }
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 23/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "admins": [
            {
                "userId": 48,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "48",
                "email": "superadmin@example.com",
                "name": "testsuper",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 35,
                "department": "test",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 2,
                "studentsManaged": 50,
                "assignmentsCreated": 2,
                "id": "35",
                "email": "test@unimelb.edu.au",
                "name": "testadmin1",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": "1",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 18,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "18",
                "email": "bob4@student.unimelb.edu.au",
                "name": "bob4",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 17,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "17",
                "email": "alice4@student.unimelb.edu.au",
                "name": "alice4",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 19,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "19",
                "email": "carol4@student.unimelb.edu.au",
                "name": "carol4",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 20,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "20",
                "email": "dave4@student.unimelb.edu.au",
                "name": "dave4",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 21,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "21",
                "email": "eve4@student.unimelb.edu.au",
                "name": "eve4",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 12,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "12",
                "email": "alice3@student.unimelb.edu.au",
                "name": "alice3",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 13,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "13",
                "email": "bob3@student.unimelb.edu.au",
                "name": "bob3",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 14,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "14",
                "email": "carol3@student.unimelb.edu.au",
                "name": "carol3",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 15,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "15",
                "email": "dave3@student.unimelb.edu.au",
                "name": "dave3",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 16,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "16",
                "email": "eve3@student.unimelb.edu.au",
                "name": "eve3",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 7,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "7",
                "email": "alice1@student.unimelb.edu.au",
                "name": "alice1",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 8,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "8",
                "email": "bob2@student.unimelb.edu.au",
                "name": "bob2",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 9,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "9",
                "email": "carol2@student.unimelb.edu.au",
                "name": "carol2",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 10,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "10",
                "email": "dave2@student.unimelb.edu.au",
                "name": "dave2",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 11,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "11",
                "email": "eve2@student.unimelb.edu.au",
                "name": "eve2",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 2,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "2",
                "email": "alice@student.unimelb.edu.au",
                "name": "alice",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 6,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "6",
                "email": "eve@student.unimelb.edu.au",
                "name": "eve",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 5,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "5",
                "email": "dave@student.unimelb.edu.au",
                "name": "dave",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 4,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "4",
                "email": "carol@student.unimelb.edu.au",
                "name": "carol",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 3,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "3",
                "email": "bob@student.unimelb.edu.au",
                "name": "bob",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 1,
                "department": null,
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "1",
                "email": "p@x.com",
                "name": "test",
                "status": "ACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 49,
                "department": "1",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "49",
                "email": "yanqings1@student.unimelb.edu.au",
                "name": "1",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": "MSwf5orpAJm066noijtLp0ZWrEQ7uE2TzYs2MPqe9s4",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 55,
                "department": "Computer Science",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "55",
                "email": "jsmith@student.unimelb.edu.au",
                "name": "lhc",
                "status": "ACTIVE",
                "registrationStatus": "REGISTERED",
                "sisLoginId": null,
                "token": "f2vnS7BEyqVB6TTVWxlanAYU1rDWFH0FdOIB0hYeRzw",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 61,
                "department": "Computer Science",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "61",
                "email": "haochengl4@student.unimelb.edu.au",
                "name": "Haocheng Li",
                "status": "ACTIVE",
                "registrationStatus": "REGISTERED",
                "sisLoginId": null,
                "token": "290voAytqjDefYyHOfqfyzsTdm3-o4EqtTUEmvInqB8",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 62,
                "department": "asd",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "62",
                "email": "bob34@student.unimelb.edu.au",
                "name": "aaa",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": "RPI1XDLkCdGveWa5AJboIGYxoZB1bcdlLzrLr1Zyxao",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 66,
                "department": "asd",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "66",
                "email": "bob433@student.unimelb.edu.au",
                "name": "wqseeqweqewq",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": "a-dOY4EhYsbpYRXLJMSfaH_T_DElYH2drVWVoakW61o",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 67,
                "department": "1",
                "invitedAt": null,
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "67",
                "email": "bob4wq@student.unimelb.edu.au",
                "name": "qweqeqweqweqweq",
                "status": "INACTIVE",
                "registrationStatus": "INVITED",
                "sisLoginId": null,
                "token": "7l0rF8H1FtR-8usmYI1Q8nzS58WYiJbvF5kTMiE4IIA",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 0,
            "totalItems": 0,
            "itemsPerPage": 10,
            "hasNext": false,
            "hasPrev": false
        }
    }
}
```

**Result**:  Fail.

**Notes**: The `pagination` is incorrect as shown above. The `admins` return more than the page limitation of 10.



### 6. [POST] /api/superadmin/admins/{id}/status

#### Test Case 1: Successfully Update Status to INACTIVE

##### Description

This is the primary "happy path" test case. Its purpose is to verify that an administrator's status can be successfully updated to `INACTIVE`. The request includes a valid admin `id`, the new `status`, and a `reason` for the change. The test confirms that the API processes the update and returns a `200 OK` status with a response body showing the updated resource's `id`, new `status`, and `updatedAt` timestamp.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database. The input admin ID is valid, and the admin's status is `ACTIVE`.

##### Input

```json
{
    "method": "POST",
    "path": "/api/superadmin/admins/{id}/status",
    "pathParameters": {
      	"id": "55"
    },
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
        "status": "INACTIVE",
        "reason": "Admin is on temporary leave."
    }
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "id": "55",
        "status": "INACTIVE",
        "updatedAt": "2025-08-24T03:32:56.659Z" // the execution time
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 24/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "id": "55",
        "status": "ACTIVE",
        "updatedAt": "2025-08-24T03:32:56.659Z"
    }
}
```

**Result**: Fail.

**Notes**: The `status` was set to be `ACTIVE,` and the status didn't update in the database.



### 7. [POST] /api/superadmin/admins/revoke/{id}

#### Test Case 1: Revoke Admin and Transfer Courses

##### Description

This is the primary "happy path" test case. Its purpose is to verify that an administrator's access can be successfully revoked and their associated courses can be transferred to another admin in a single atomic action. The request includes the ID of the admin to be revoked, a reason, and the ID of the admin who will receive the courses. The test confirms a `200 OK` response showing a `revokedAt` timestamp and the number of courses transferred.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database. The input admin ID is valid and active.

##### Input

```json
{
    "method": "POST",
    "path": "/api/superadmin/admins/revoke/{id}",
    "pathParameters": {
      	"id": "67"
    },
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
        "reason": "Admin has left the institution.",
        "transferCoursesTo": "66"
    }
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "revokedAt": "2025-01-02T10:30:00Z", // the execution time
        "coursesTransferred": 0  // not developed yet, set it to 0
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 24/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "revokedAt": "2025-08-24T03:56:29.202Z",
        "coursesTransferred": 0
    }
}
```

**Result**: Pass.

**Notes**: The database also set the admin status to `INACTIVE` (encoded as 1). However, the `reason` wasn't recorded in the database.



#### Test Case 2: Revoke Admin Without Transferring Courses

##### Description

This test case verifies the scenario where an admin is revoked, but their courses are not transferred to another user. This checks the optional nature of the `transferCoursesTo` parameter. The API should successfully process the revocation, logically setting the admin's status to INACTIVE. The response should reflect that zero courses were transferred.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database. The input admin ID is valid and active.

##### Input

```
{
    "method": "POST",
    "path": "/api/superadmin/admins/revoke/{id}",
    "pathParameters": {
      	"id": "66"
    },
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
      	"reason": "Account retired due to inactivity."
    }
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "revokedAt": "2025-01-02T10:30:00Z", // the execution time
        "coursesTransferred": 0  // not developed yet, set it to 0
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 24/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "revokedAt": "2025-08-24T04:22:20.056Z",
        "coursesTransferred": 0
    }
}
```

**Result**: Pass.

**Notes**: The database also set the admin status to `INACTIVE` (encoded as 1). However, the `reason` wasn't recorded in the database. (Update: Currently, we do not have this requirement.)



#### Test Case 3: Attempt to Revoke a Non-Existent Admin

##### Description

This is a negative test case to check how the API handles a request to revoke an admin that does not exist. It uses a syntactically valid `id` in the URL path that has no corresponding record in the database. The expected behaviour is for the API to return a client error, such as a `404 Not Found`, to indicate the target resource could not be found.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database. The input admin ID is invalid and doesn't exist in the database.

##### Input

```json
{
    "method": "POST",
    "path": "/api/superadmin/admins/revoke/{id}",
    "pathParameters": {
      	"id": "999"
    },
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
      	"reason": "Attempting to revoke a non-existent user."
    }
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "404",
    "data": "Admin not found"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 24/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "404",
    "data": "Admin not found"
}
```

**Result**: Pass.



#### Test Case 4: Attempt to Revoke an Already Inactive Admin

##### Description

This test case checks the business logic and state validation of the API. It attempts to revoke an admin who is already in an `INACTIVE` state (i.e., has already been revoked). A robust system should prevent this redundant action. The test expects the API to respond with a `400 Bad Request` and a clear error message indicating that the user is already inactive.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database. The input admin ID is inactive.

##### Input

```json
{
    "method": "POST",
    "path": "/api/superadmin/admins/revoke/{id}",
    "pathParameters": {
      	"id": "67"
    },
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
      	"reason": "Attempting to revoke again."
    }
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "400",
    "data": "Admin is inactive."
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 24/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "404",
    "data": "Admin not found"
}
```

**Result**: Fail.

**Notes**: Should return with a `400 Bad Request` and a clear error message indicating that the user is already inactive.‘

###### Test 2

**Execution Date**: 24/8/2025 (after hot fix)

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "revokedAt": "2025-08-24T10:22:51.363Z",
        "coursesTransferred": 0
    }
}
```

**Result**: Fail.

**Notes**: Now it always returns a `200 OK` response, which is also wrong.



#### Test Case 5: Attempt to Revoke an Invalid Admin ID

##### Description

This test case focuses on an invalid ID (data type) error thrown exception. Input a string ID (not aligned with the ID data type) and expect a `400 Bad Request` and a clear error message indicating that the input ID is not numerable.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```json
{
    "method": "POST",
    "path": "/api/superadmin/admins/revoke/{id}",
    "pathParameters": {
      	"id": "abc"
    },
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
      	"reason": "Attempting to revoke a string id."
    }
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "400",
    "data": "Invalid admin id"
}
```

##### **Execution History**

###### Test 1

**Execution Date**:

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "400",
    "data": "Invalid admin id"
}
```

**Result**: Pass.



### 8. [POST] /api/superadmin/admins/invite 

#### Test Case 1: Successfully Invite a New Administrator

##### Description

This is the primary "happy path" test case. It verifies that a new administrator can be successfully invited by providing a complete and valid set of user details. The test ensures the API creates a new user record in an "INVITED" state, generates an invitation token, and returns a `200 OK` status with the full details of the newly created invitation.

##### Pre-conditions

The email address `new.jane.smith@unimelb.edu.au` does not exist in the system in any capacity (active, inactive, or invited).

##### Input

```json
{
    "email": "new.jane.smith@unimelb.edu.au",
    "name": "Dr. Jane Smith",
    "department": "Computer Science",
    "message": "Welcome to OAS! You've been invited to manage oral assessments.",
    "id": "A12345",
    "sisUserId": "jsmith",
    "sisLoginId": "jsmith"
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "userId": 0,
        "department": "Computer Science",
        "invitedAt": "2025-08-24T04:54:56.538Z",  // the execution time
        "registeredAt": "2025-08-24T04:54:56.538Z",
        "lastLoginAt": "2025-08-24T04:54:56.538Z",
        "coursesManaged": 0,
        "studentsManaged": 0,
        "assignmentsCreated": 0,
        "id": "jsmith",
        "email": "string",
        "name": "Dr. Jane Smith",
        "status": "ACTIVE",
        "registrationStatus": "string",
        "sisLoginId": "jsmith",
        "token": "string",  // the generated token
        "invitationExpiresAt": "2025-08-24T04:54:56.538Z",  // calculated timestamp
        "courses": [],  // not developed yet
        "recentActivity": []  // not developed yet
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 24/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "409",
    "data": "Email already exists"
}
```

**Result**: Fail.

**Notes**: Should be a `200 OK` response since the email didn't exist in the database.

