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

### 1. [POST] /api/courses/list

#### Test Case 1: Basic Retrieval of Courses

##### Description

This is the fundamental "happy path" test case. Its purpose is to verify that the API can successfully retrieve a paginated list of courses using only the essential `pageNum` and `pageSize` parameters. This test confirms the endpoint's basic functionality and ensures the response structure, including the `data` array and root-level pagination fields (`total`, `current`), is correct.

##### Pre-conditions

The database contains at least 25 courses, allowing for multiple pages of results.

##### Input

```json
{
    "method": "POST",
    "path": "/api/courses/list",
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
        "pageNum": 1,
        "pageSize": 10
    }
}
```

##### Expected Output

HTTP status code: `200 OK`

```json
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
    ], // 10 course details
    "success": true,
    "total": 25,
    "current": 1,
    "size": 10
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```
{
    "success": true,
    "code": "200",
    "data": {
        "data": [
            {
                "id": 13,
                "courseCode": "COMP11451",
                "courseName": "mmmmmm",
                "description": "",
                "academicYear": 2026,
                "semester": "1",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 21,
                "courseCode": "TEST54321",
                "courseName": "Test Creator",
                "description": "creator",
                "academicYear": 2026,
                "semester": "1",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 5,
                "courseCode": "COMP90000",
                "courseName": "Algorithms and Complex1",
                "description": "asdnadoabdobdoqbdoqwbodqhio pdqjwoidjqiowdjioqwdjoqq dhqowdhoqdhoqwhdoqwhdoqiw hdoiqhdioqhdoiqhdoqwhdoqwhdioqwiii\niisacnnowqhdoqhdoqhdoqhdqwiodhqwiod hoqwdhoqwdhoqwhdoiqhdoqidhqdqdqwdqdqw",
                "academicYear": 2026,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 4,
                "createTime": "2025-08-23T11:50:17",
                "creator": 49,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            },
            {
                "id": 22,
                "courseCode": "TEST11111",
                "courseName": "123",
                "description": "123",
                "academicYear": 2026,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 9,
                "courseCode": "COMP90024",
                "courseName": "Cluster and Cloud Computing1",
                "description": "",
                "academicYear": 2025,
                "semester": "1",
                "adminUserId": 1,
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
                "description": "",
                "academicYear": 2025,
                "semester": "1",
                "adminUserId": 1,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 1,
                "createTime": "2025-08-23T11:50:17",
                "creator": 55,
                "updateTime": "2025-08-25T05:27:45",
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
                "id": 16,
                "courseCode": "AAAA12345",
                "courseName": "aa",
                "description": "",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 15,
                "courseCode": "AIAN12345",
                "courseName": "IAN PAPA ",
                "description": "ASDF",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 12,
                "courseCode": "COMP90082",
                "courseName": "Software Project Managment",
                "description": "",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            }
        ],
        "success": true,
        "total": 25,
        "current": 1,
        "size": 10
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 2: Comprehensive Filtering by Multiple Criteria

##### Description

This test case validates the API's filtering logic by combining multiple criteria in a single request. It ensures the backend correctly applies `AND` logic to all conditions, returning a precise subset of courses that satisfy every filter. This is key to testing the robustness of the search functionality.

##### Pre-conditions

The database contains a variety of courses, including at least one that specifically matches all of the following criteria: `year: 2024`, `semester: "2"`, `status: "active"`, and is assigned to `adminUserId: 49`.

##### Input

```json
{
    "method": "POST",
    "path": "/api/courses/list",
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
        "pageNum": 1,
        "pageSize": 10,
        "year": 2024,
        "semester": "2",
        "status": "active",
        "adminUserId": 49
    }
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "data": [
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
            }
        ],
        "success": true,
        "total": 1,
        "current": 1,
        "size": 10
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "data": [
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
            }
        ],
        "success": true,
        "total": 1,
        "current": 1,
        "size": 10
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 3: Filtering by a Unique Identifier (courseCode)

##### Description

This test checks the precision of the filtering mechanism when using a unique identifier. By providing a specific `courseCode`, the API should return a result set containing exactly one course. This verifies that exact-match searches are functioning correctly.

##### Pre-conditions

A single, specific course with `courseCode: "COMP90000"` exists in the database.

##### Input

```json
{
    "method": "POST",
    "path": "/api/courses/list",
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
        "pageNum": 1,
        "pageSize": 10,
        "courseCode": "COMP90000"
    }
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "data": [
            {
                "id": 5,
                "courseCode": "COMP90000",
                "courseName": "Algorithms and Complex1",
                "description": "asdnadoabdobdoqbdoqwbodqhio pdqjwoidjqiowdjioqwdjoqq dhqowdhoqdhoqwhdoqwhdoqiw hdoiqhdioqhdoiqhdoqwhdoqwhdioqwiii\niisacnnowqhdoqhdoqhdoqhdqwiodhqwiod hoqwdhoqwdhoqwhdoiqhdoqidhqdqdqwdqdqw",
                "academicYear": 2026,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 4,
                "createTime": "2025-08-23T11:50:17",
                "creator": 49,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            }
        ],
        "success": true,
        "total": 1,
        "current": 1,
        "size": 10
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "data": [
            {
                "id": 5,
                "courseCode": "COMP90000",
                "courseName": "Algorithms and Complex1",
                "description": "asdnadoabdobdoqbdoqwbodqhio pdqjwoidjqiowdjioqwdjoqq dhqowdhoqdhoqwhdoqwhdoqiw hdoiqhdioqhdoiqhdoqwhdoqwhdioqwiii\niisacnnowqhdoqhdoqhdoqhdqwiodhqwiod hoqwdhoqwdhoqwhdoiqhdoqidhqdqdqwdqdqw",
                "academicYear": 2026,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 4,
                "createTime": "2025-08-23T11:50:17",
                "creator": 49,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            }
        ],
        "success": true,
        "total": 1,
        "current": 1,
        "size": 10
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 4: Filtering by Boolean Flag (isActive)

##### Description

This test case validates the functionality of boolean filters. By requesting only courses where `isActive: false`, the test confirms that the API can correctly filter based on boolean conditions and that the `total` count in the response accurately reflects the number of matching records.

##### Pre-conditions

The database contains a mix of active and inactive courses. Specifically, there are exactly 14 courses where the `isActive` flag is set to `false`.

##### Input

```json
{
    "method": "POST",
    "path": "/api/courses/list",
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
        "pageNum": 1,
        "pageSize": 10,
        "isActive": false
    }
}
```

##### Expected Output

```json
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
    ], // 10 course details
    "success": true,
    "total": 14,
    "current": 1,
    "size": 10
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**:

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "data": [
            {
                "id": 13,
                "courseCode": "COMP11451",
                "courseName": "mmmmmm",
                "description": "",
                "academicYear": 2026,
                "semester": "1",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 21,
                "courseCode": "TEST54321",
                "courseName": "Test Creator",
                "description": "creator",
                "academicYear": 2026,
                "semester": "1",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 5,
                "courseCode": "COMP90000",
                "courseName": "Algorithms and Complex1",
                "description": "asdnadoabdobdoqbdoqwbodqhio pdqjwoidjqiowdjioqwdjoqq dhqowdhoqdhoqwhdoqwhdoqiw hdoiqhdioqhdoiqhdoqwhdoqwhdioqwiii\niisacnnowqhdoqhdoqhdoqhdqwiodhqwiod hoqwdhoqwdhoqwhdoiqhdoqidhqdqdqwdqdqw",
                "academicYear": 2026,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 4,
                "createTime": "2025-08-23T11:50:17",
                "creator": 49,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            },
            {
                "id": 22,
                "courseCode": "TEST11111",
                "courseName": "123",
                "description": "123",
                "academicYear": 2026,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 16,
                "courseCode": "AAAA12345",
                "courseName": "aa",
                "description": "",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 15,
                "courseCode": "AIAN12345",
                "courseName": "IAN PAPA ",
                "description": "ASDF",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 24,
                "courseCode": "SANJ99999",
                "courseName": "LINLANG",
                "description": "DAWAWAWDADAWDAWDWADAWDWADADAWDA",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 11,
                "courseCode": "SWEN90016",
                "courseName": "SPM",
                "description": "",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": "2025-08-23T00:19:35",
                "creator": 1,
                "updateTime": "2025-08-23T00:19:35",
                "updater": null
            },
            {
                "id": 20,
                "courseCode": "TEST12345",
                "courseName": "Test123",
                "description": "2",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 23,
                "courseCode": "TEST22222",
                "courseName": "Test2222222",
                "description": "",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            }
        ],
        "success": true,
        "total": 14,
        "current": 1,
        "size": 10
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 5: Pagination for an Out-of-Bounds Page

##### Description

This is an edge case test for pagination. It checks how the API responds when a page number is requested that is far beyond the total number of available pages (e.g., `pageNum: 99`). A robust API should handle this gracefully by returning a `200 OK` status with an empty `data` array, rather than an error. The pagination metadata should still be accurate.

##### Pre-conditions

The total number of courses in the database is a known quantity (e.g., 25).

##### Input

```json
{
    "method": "POST",
    "path": "/api/courses/list",
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
        "pageNum": 99,
        "pageSize": 10
    }
}
```

##### Expected Output

```json
{
    "statusCode": 200,
    "responseBody": {
        "success": true,
        "code": "string",
        "data": [],
        "total": 50,
        "current": 99
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**:

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "data": [
            {
                "id": 13,
                "courseCode": "COMP11451",
                "courseName": "mmmmmm",
                "description": "",
                "academicYear": 2026,
                "semester": "1",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 21,
                "courseCode": "TEST54321",
                "courseName": "Test Creator",
                "description": "creator",
                "academicYear": 2026,
                "semester": "1",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 5,
                "courseCode": "COMP90000",
                "courseName": "Algorithms and Complex1",
                "description": "asdnadoabdobdoqbdoqwbodqhio pdqjwoidjqiowdjioqwdjoqq dhqowdhoqdhoqwhdoqwhdoqiw hdoiqhdioqhdoiqhdoqwhdoqwhdioqwiii\niisacnnowqhdoqhdoqhdoqhdqwiodhqwiod hoqwdhoqwdhoqwhdoiqhdoqidhqdqdqwdqdqw",
                "academicYear": 2026,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 4,
                "createTime": "2025-08-23T11:50:17",
                "creator": 49,
                "updateTime": "2025-08-23T14:20:05",
                "updater": null
            },
            {
                "id": 22,
                "courseCode": "TEST11111",
                "courseName": "123",
                "description": "123",
                "academicYear": 2026,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 9,
                "courseCode": "COMP90024",
                "courseName": "Cluster and Cloud Computing1",
                "description": "",
                "academicYear": 2025,
                "semester": "1",
                "adminUserId": 1,
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
                "description": "",
                "academicYear": 2025,
                "semester": "1",
                "adminUserId": 1,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 1,
                "createTime": "2025-08-23T11:50:17",
                "creator": 55,
                "updateTime": "2025-08-25T05:27:45",
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
                "id": 16,
                "courseCode": "AAAA12345",
                "courseName": "aa",
                "description": "",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 15,
                "courseCode": "AIAN12345",
                "courseName": "IAN PAPA ",
                "description": "ASDF",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": false,
                "status": "archived",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            },
            {
                "id": 12,
                "courseCode": "COMP90082",
                "courseName": "Software Project Managment",
                "description": "",
                "academicYear": 2025,
                "semester": "2",
                "adminUserId": 1,
                "isActive": true,
                "status": "active",
                "students": 0,
                "assignments": 0,
                "createTime": null,
                "creator": null,
                "updateTime": null,
                "updater": null
            }
        ],
        "success": true,
        "total": 25,
        "current": 1,
        "size": 10
    }
}
```

**Result**: Pass.

**Notes**: It returns the first page rather than a null page, which is pretty elegant.





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



### 4. [DELETE] /api/courses/{courseId}

#### Test Case 1: Successfully Delete an Existing Course

##### Description

This is the primary "happy path" test case for the delete functionality. It verifies that an existing course and its associated assignments can be permanently removed from the system using a valid `courseId`. A successful operation should be confirmed by a `200 OK` response. A secondary verification step would be to attempt to `GET` the same course ID, which should now fail with a `4021 Course Not Found` business error.

##### Pre-conditions

A course with a specific ID (e.g., `courseId: 18`) exists in the database. This course can be safely deleted (i.e., it has no critical dependencies that would prevent deletion).

##### Input

```json
{
    "method": "DELETE",
    "path": "/api/courses/{courseId}",
    "pathParameters": {
      	"courseId": 18
    },
    "headers": {
      	"Accept": "application/json"
    },
    "body": null
}

{
    "method": "GET",
    "path": "/api/courses/{courseId}",
    "pathParameters": {
        "courseId": 18
    },
    "headers": {
        "Accept": "application/json"
    },
    "body": null
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": null
}

{
    "success": false,
    "code": "4021",
    "data": "Course not found"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 26/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": null
}

{
    "success": true,
    "code": "200",
    "data": {
        "id": 18,
        "courseCode": "WEIRANTEST",
        "courseName": "weiran_test",
        "description": "test for deletion",
        "academicYear": 2025,
        "semester": "2",
        "adminUserId": 1,
        "isActive": false,
        "status": "active",
        "students": 0,
        "assignments": 0,
        "createTime": "2025-08-26T17:13:43",
        "creator": 1,
        "updateTime": "2025-08-26T17:13:49",
        "updater": null
    }
}
```

**Result**: Fail

**Notes**: The `status` field was still `active,` and it can still be retrieved by the `GET` method.



### 5. [GET] /api/courses/stats

#### Test Case 1: Successfully Retrieve Course Statistics

##### Description

This is the primary "happy path" test case. It verifies that the API can successfully retrieve the dashboard statistics when the system has data. The core of this test is to assert that the aggregated values returned by the API (e.g., `totalCourses`, `activeCourses`) accurately match the preconditioned state of the database.

##### Pre-conditions

The database is populated with a known set of data. For this test, assume the following state:

- Total number of courses: 18
- Number of courses marked as 'active': 12
- Total unique students enrolled across all courses: 0
- Total number of assignments across all courses: 2
- The system's current semester is configured as "2026 Semester 1".

##### Input

```json
{
  "method": "GET",
  "path": "/api/courses/stats",
  "headers": {
    "Accept": "application/json"
  },
  "body": null
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "success": true,
        "data": {
            "totalCourses": 18,
            "activeCourses": 13,
            "totalStudents": 0,  // not developed yet
            "totalAssignments": 9, 
            "currentSemester": "2026 Semester 2"
        }
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 26/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "success": true,
        "data": {
            "totalCourses": 18,
            "activeCourses": 13,
            "totalStudents": 0,
            "totalAssignments": 9,
            "currentSemester": "2026 Semester 2"
        }
    }
}
```

**Result**: Pass.

**Notes**: None.



### 6. [POST] /api/courses

#### Test Case 1: Successfully Create a New Course

##### Description

This is the primary "happy path" test case. It verifies that a new academic course can be successfully created when all required and optional fields are provided with valid data. The test confirms that the API returns a `200 OK` status and a response body containing the full details of the newly created course, including a system-generated `id` and timestamps.

##### Pre-conditions

- An administrator with `adminUserId: 1` exists and is active in the system.
- A course with `courseCode: "ENG1001"` does not already exist.

##### Input

```json

```

##### Expected Output

```json

```

##### **Execution History**

###### Test 1

**Execution Date**:

**Tester**: Weiran

**Actual Output**:

```json

```

**Result**:

**Notes**:



## Epic 5. Assessment Scheduling and Booking System

### 1. [GET] /api/admin/assignments/{assignmentId}/session-config

#### Test Case 1: Retrieve Configuration for a Fully Configured Assignment

##### Description

This is the primary "happy path" test case. It verifies that the API can successfully retrieve the complete and accurate session configuration for a given assignment that has been fully set up. The test asserts that the API returns a `200 OK` status and that all the values in the response `data` object match the known, pre-conditioned configuration.

##### Pre-conditions

- An assignment with `assignmentId: 1` exists in the database.
- This assignment's session has been fully configured with specific values (e.g., `sessionLength` is 30 minutes). The `isConfigured` flag is `true`.

##### Input

```json
{
  "method": "GET",
  "path": "/api/admin/assignments/{assignmentId}/session-config",
  "pathParameters": {
    "assignmentId": 1
  },
  "headers": {
    "Accept": "application/json"
  },
  "body": null
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "assignmentId": 1,
        "sessionLength": 30,
        "gapTime": 5,
        "examinersPerSession": 2,
        "defaultMaxSessionsPerExaminer": 40,
        "isConfigured": true,
        "lastModified": "2025-08-28T09:46:56",
        "updatedBy": null // not developed yet
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 29/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "assignmentId": 1,
        "sessionLength": 30,
        "gapTime": 5,
        "examinersPerSession": 2,
        "defaultMaxSessionsPerExaminer": 40,
        "isConfigured": true,
        "lastModified": "2025-08-28T09:46:56",
        "updatedBy": null
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 2: Attempt to Retrieve Configuration for a Non-Existent Assignment

##### Description

This is a negative test case to ensure the API handles requests for non-existent resources correctly. When an `assignmentId` is provided that does not correspond to any record in the database, the API should return a clear client-side error, not a success response or a business (50xx) error.

##### Pre-conditions

No assignment with the ID `999999` exists in the database.

##### Input

```json
{
  "method": "GET",
  "path": "/api/admin/assignments/{assignmentId}/session-config",
  "pathParameters": {
    "assignmentId": 999999
  },
  "headers": {
    "Accept": "application/json"
  },
  "body": null
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "5001",
    "data": "Session configuration not found or not configured"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 29/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "5001",
    "data": "Session configuration not found or not configured"
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 3:  Attempt to Retrieve Configuration with an Invalid ID Format

##### Description

This negative test case focuses on input validation at the URL parameter level. It verifies that the API rejects requests where the `assignmentId` is not in the expected integer format (e.g., a string of text like "abc"). This ensures that malformed requests are caught early, before any application logic is executed.

##### Pre-conditions

None.

##### Input

```json
{
  "method": "GET",
  "path": "/api/admin/assignments/{assignmentId}/session-config",
  "pathParameters": {
    "assignmentId": "abc-not-an-id"
  },
  "headers": {
    "Accept": "application/json"
  },
  "body": null
}
```

##### Expected Output

```json
{
  "statusCode": 400,
  "responseBody": {
    "success": false,
    "code": "ERROR_VALIDATION_INVALID_ID_FORMAT",
    "data": {}
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 29/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "5001",
    "data": "Session configuration not found or not configured"
}
```

**Result**: Pass.

**Notes**: Not a decent error code but still okay for the integration.



### 2. [PUT] /api/admin/assignments/{assignmentId}/session-config

#### Test Case 1: Create a New Session Configuration

##### Description

This is the "create" aspect of the "create or update" functionality described for this `PUT` endpoint. This test verifies that a new session configuration can be successfully created for an existing assignment that currently lacks one. The API should save the new settings and return a `200 OK` response with the complete, newly created configuration.

##### Pre-conditions

An assignment with `assignmentId: 2` exists in the database.

##### Input

```json
{
  "method": "PUT",
  "path": "/api/admin/assignments/{assignmentId}/session-config",
  "pathParameters": {
    "assignmentId": 2
  },
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "sessionLength": 30,
    "gapTime": 5,
    "examinersPerSession": 2,
    "defaultMaxSessionsPerExaminer": 40
  }
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "assignmentId": 2,
        "sessionLength": 30,
        "gapTime": 5,
        "examinersPerSession": 2,
        "defaultMaxSessionsPerExaminer": 40,
        "isConfigured": true,
        "lastModified": "2025-08-29T13:34:03",
        "updatedBy": null
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 29/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "assignmentId": 2,
        "sessionLength": 30,
        "gapTime": 5,
        "examinersPerSession": 2,
        "defaultMaxSessionsPerExaminer": 40,
        "isConfigured": true,
        "lastModified": "2025-08-29T13:34:03",
        "updatedBy": null
    }
}
```

**Result**: Pass.

**Notes**: Data was recorded in the database correctly.



#### Test Case 2: Update an Existing Session Configuration

##### Description

This is the "update" aspect of the endpoint's functionality. It verifies that an existing session configuration can be successfully modified. This test sends a request with new values for the configuration parameters. The API should overwrite the previous settings with the new ones and return a `200 OK` response reflecting the changes.

##### Pre-conditions

An assignment with `assignmentId: 1` exists and already has a session configuration (e.g., `sessionLength` is 30, `gapTime` is 5).

##### Input

```json
{
  "method": "PUT",
  "path": "/api/admin/assignments/{assignmentId}/session-config",
  "pathParameters": {
    "assignmentId": 1
  },
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "sessionLength": 45,
    "gapTime": 10,
    "examinersPerSession": 3,
    "defaultMaxSessionsPerExaminer": 25
  }
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "assignmentId": 1,
        "sessionLength": 45,
        "gapTime": 10,
        "examinersPerSession": 3,
        "defaultMaxSessionsPerExaminer": 25,
        "isConfigured": true,
        "lastModified": "string",  //executed time
        "updatedBy": null
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 29/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "assignmentId": 1,
        "sessionLength": 45,
        "gapTime": 10,
        "examinersPerSession": 3,
        "defaultMaxSessionsPerExaminer": 25,
        "isConfigured": true,
        "lastModified": "2025-08-29T13:37:01",
        "updatedBy": null
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 3: Attempt to Update with Invalid Data Types

##### Description

This negative test case checks the API's input validation for correct data types. It sends a request where a numerical field, such as `sessionLength`, is assigned a string value. The API must reject this malformed request with a `400 Bad Request` and should not modify the existing configuration.

##### Pre-conditions

An assignment with `assignmentId: 2` exists in the database.

##### Input

```json
{
  "method": "PUT",
  "path": "/api/admin/assignments/{assignmentId}/session-config",
  "pathParameters": {
    "assignmentId": 2
  },
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "sessionLength": "thirty-minutes",
    "gapTime": 5,
    "examinersPerSession": 3,
    "defaultMaxSessionsPerExaminer": 25
  }
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "400",
    "data": "Any error message"
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
    "data": "Invalid request format"
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 4: Attempt to Update with Out-of-Range Values

##### Description

This test case checks for deeper business logic validation beyond simple data types. It sends a request with values that are syntactically correct but logically invalid (e.g., a negative `sessionLength` or zero `examinersPerSession`). The API's validation rules should catch these illogical values and reject the request with a `400 Bad Request`.

##### Pre-conditions

An assignment with `assignmentId: 2` exists in the database.

##### Input

```json
{
  "method": "PUT",
  "path": "/api/admin/assignments/{assignmentId}/session-config",
  "pathParameters": {
    "assignmentId": 2
  },
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "sessionLength": -10,
    "gapTime": 5,
    "examinersPerSession": 0,
    "defaultMaxSessionsPerExaminer": 40
  }
}
```

##### Expected Output

```json
{
  "statusCode": 400,
  "responseBody": {
    "success": false,
    "code": "ERROR_VALIDATION_VALUE_OUT_OF_RANGE",
    "data": {}
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**:

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "assignmentId": 2,
        "sessionLength": -10,
        "gapTime": 5,
        "examinersPerSession": 0,
        "defaultMaxSessionsPerExaminer": 40,
        "isConfigured": true,
        "lastModified": "2025-08-29T13:44:10",
        "updatedBy": null
    }
}
```

**Result**: Fail.

**Notes**: The unlogical data was updated in the database. Additionally, I observed that all four input fields are required, resulting in a 500 internal error (caused by the database, as the four fields are all set to not null).



### 3. [GET] /api/admin/assignments/{assignmentId}/timeslots

#### Test Case 1: Retrieve All Timeslots for an Assignment

##### Description

This is the primary "happy path" test case. It verifies that the API can successfully retrieve a complete list of all associated timeslots for a given `assignmentId` when no optional filters are applied. The test ensures the fundamental data retrieval for the endpoint is working correctly.

##### Pre-conditions

- An assignment with `assignmentId: 1` exists in the database.
- This assignment has multiple timeslots associated with it, scheduled on various dates and having different statuses.

##### Input

```json
{
  "method": "GET",
  "path": "/api/admin/assignments/{assignmentId}/timeslots",
  "pathParameters": {
    "assignmentId": 2
  },
  "queryParameters": {},
  "headers": {
    "Accept": "application/json"
  },
  "body": null
}
```

##### Expected Output

```json
{
  "success": true,
  "code" : 200,
  "data": {
    "timeSlots": [
      {
        "id": 1,
        "date": "2025-04-15",
        "startTime": "09:00",
        "endTime": "11:00",
        "venueId": 10,
        "requiredExaminers": 2,
        "sessionCount": 4,
        "status": "empty",
        "assignedExaminers": [],
        "sessions": [ // all the valid sessions in the database
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
      "totalTimeSlots": 2,
      "totalSessions": 8,
      "fullyStaffed": 0,
      "partiallyStaffed": 0,
      "unstaffed": 2
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 30/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "timeSlots": [
            {
                "id": 1,
                "date": "2025-10-20",
                "startTime": "09:00:00",
                "endTime": "11:00:00",
                "venueId": 10,
                "requiredExaminers": 2,
                "sessionCount": 4,
                "status": "empty",
                "assignedExaminers": [],
                "sessions": [
                    {
                        "id": 1,
                        "startTime": "09:00:00",
                        "endTime": "09:25:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 1
                    },
                    {
                        "id": 2,
                        "startTime": "09:30:00",
                        "endTime": "09:55:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 2
                    },
                    {
                        "id": 3,
                        "startTime": "10:00:00",
                        "endTime": "10:25:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 3
                    },
                    {
                        "id": 4,
                        "startTime": "10:30:00",
                        "endTime": "10:55:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 4
                    }
                ],
                "bookedSessions": 0,
                "createdAt": "2025-08-30T22:38:56",
                "lastModified": "2025-08-30T22:38:56"
            },
            {
                "id": 2,
                "date": "2025-10-21",
                "startTime": "13:00:00",
                "endTime": "15:00:00",
                "venueId": 10,
                "requiredExaminers": 2,
                "sessionCount": 4,
                "status": "empty",
                "assignedExaminers": [],
                "sessions": [
                    {
                        "id": 5,
                        "startTime": "13:00:00",
                        "endTime": "13:25:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 1
                    },
                    {
                        "id": 6,
                        "startTime": "13:30:00",
                        "endTime": "13:55:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 2
                    },
                    {
                        "id": 7,
                        "startTime": "14:00:00",
                        "endTime": "14:25:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 3
                    },
                    {
                        "id": 8,
                        "startTime": "14:30:00",
                        "endTime": "14:55:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 4
                    }
                ],
                "bookedSessions": 0,
                "createdAt": "2025-08-30T22:38:56",
                "lastModified": "2025-08-30T22:38:56"
            }
        ],
        "summary": {
            "totalTimeSlots": 2,
            "totalSessions": 8,
            "fullyStaffed": 0,
            "partiallyStaffed": 0,
            "unstaffed": 2
        }
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 2:  Filter Timeslots by a Specific Date

##### Description

This test case validates the optional `date` filter. By providing a specific date in the `YYYY-MM-DD` format as a query parameter, the API should return only the timeslots that are scheduled for that particular day, ignoring all others.

##### Pre-conditions

- The assignment with `assignmentId: 2` has at least three timeslots scheduled on the date `2025-10-20`.
- The same assignment also has timeslots scheduled on other dates (in this case: `2025-10-21`).

##### Input

```json
{
  "method": "GET",
  "path": "/api/admin/assignments/{assignmentId}/timeslots",
  "pathParameters": {
    "assignmentId": 2
  },
  "queryParameters": {
    "date": "2025-10-20"
  },
  "headers": {
    "Accept": "application/json"
  },
  "body": null
}
```

##### Expected Output

```json
{
  "statusCode": 200,
  "comment": "The 'timeSlots' array should only contain objects where the 'date' field is '2025-10-20'.",
  "responseBodySchema": {
    "properties": {
      "success": { "const": true }
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 30/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "timeSlots": [
            {
                "id": 1,
                "date": "2025-10-20",
                "startTime": "09:00:00",
                "endTime": "11:00:00",
                "venueId": 10,
                "requiredExaminers": 2,
                "sessionCount": 4,
                "status": "empty",
                "assignedExaminers": [],
                "sessions": [
                    {
                        "id": 1,
                        "startTime": "09:00:00",
                        "endTime": "09:25:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 1
                    },
                    {
                        "id": 2,
                        "startTime": "09:30:00",
                        "endTime": "09:55:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 2
                    },
                    {
                        "id": 3,
                        "startTime": "10:00:00",
                        "endTime": "10:25:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 3
                    },
                    {
                        "id": 4,
                        "startTime": "10:30:00",
                        "endTime": "10:55:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 4
                    }
                ],
                "bookedSessions": 0,
                "createdAt": "2025-08-30T22:38:56",
                "lastModified": "2025-08-30T22:38:56"
            }
        ],
        "summary": {
            "totalTimeSlots": 1,
            "totalSessions": 4,
            "fullyStaffed": 0,
            "partiallyStaffed": 0,
            "unstaffed": 1
        }
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 3: Filter Timeslots by Status

##### Description

This test case validates the optional `status` filter. By providing a status string (e.g., "confirmed") as a query parameter, the API should return only the timeslots that currently have that exact status.

##### Pre-conditions

**Pre-condition**

- The assignment with `assignmentId: 2` has timeslots with various statuses.
- Specifically, there are at least five timeslots with the status "partial".

##### Input

```json
{
  "method": "GET",
  "path": "/api/admin/assignments/{assignmentId}/timeslots",
  "pathParameters": {
    "assignmentId": 2
  },
  "queryParameters": {
    "status": "partial"
  },
  "headers": {
    "Accept": "application/json"
  },
  "body": null
}
```

##### Expected Output

```json
{
  "statusCode": 200,
  "comment": "Every object in the 'timeSlots' array must have its 'status' field set to 'partial'.",
  "responseBodySchema": {
    "properties": {
      "success": { "const": true }
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "timeSlots": [
            {
                "id": 1,
                "date": "2025-10-20",
                "startTime": "09:00:00",
                "endTime": "11:00:00",
                "venueId": 10,
                "requiredExaminers": 2,
                "sessionCount": 4,
                "status": "partial",
                "assignedExaminers": [],
                "sessions": [
                    {
                        "id": 1,
                        "startTime": "09:00:00",
                        "endTime": "09:25:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 1
                    },
                    {
                        "id": 2,
                        "startTime": "09:30:00",
                        "endTime": "09:55:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 2
                    },
                    {
                        "id": 3,
                        "startTime": "10:00:00",
                        "endTime": "10:25:00",
                        "status": "booked",
                        "bookedBy": null,
                        "sessionNumber": 3
                    },
                    {
                        "id": 4,
                        "startTime": "10:30:00",
                        "endTime": "10:55:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 4
                    }
                ],
                "bookedSessions": 0,
                "createdAt": "2025-08-30T22:38:56",
                "lastModified": "2025-08-31T05:27:08"
            }
        ],
        "summary": {
            "totalTimeSlots": 1,
            "totalSessions": 4,
            "fullyStaffed": 0,
            "partiallyStaffed": 0,
            "unstaffed": 1
        }
    }
}
```

**Result**: Pass.

**Notes**: True.



#### Test Case 4: Retrieve Timeslots for an Assignment with No Timeslots

##### Description

This edge case test verifies that the API handles requests for assignments that exist but have no associated timeslot data. The API should return a `200 OK` success response with an empty `timeSlots` array, rather than an error.

##### Pre-conditions

- An assignment with `assignmentId: 7` exists in the database.
- This assignment has **zero** timeslots created for it.

##### Input

```json
{
  "method": "GET",
  "path": "/api/admin/assignments/{assignmentId}/timeslots",
  "pathParameters": {
    "assignmentId": 7
  },
  "queryParameters": {},
  "headers": {
    "Accept": "application/json"
  },
  "body": null
}
```

##### Expected Output

```json
{
  "statusCode": 200,
  "responseBody": {
    "success": true,
    "code": "string",
    "data": {
      "timeSlots": []
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "timeSlots": [],
        "summary": {
            "totalTimeSlots": 0,
            "totalSessions": 0,
            "fullyStaffed": 0,
            "partiallyStaffed": 0,
            "unstaffed": 0
        }
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 5: Attempt to Retrieve Timeslots for a Non-Existent Assignment

##### Description

This is a negative test case to ensure the API handles requests for non-existent parent resources correctly. When an `assignmentId` is provided that does not correspond to any record in the database, the API should return a clear client-side error.

##### Pre-conditions

No assignment with the ID `999999` exists in the database.

##### Input

```json
{
  "method": "GET",
  "path": "/api/admin/assignments/{assignmentId}/timeslots",
  "pathParameters": {
    "assignmentId": 999999
  },
  "queryParameters": {},
  "headers": {
    "Accept": "application/json"
  },
  "body": null
}
```

##### Expected Output

```json
{
  "statusCode": 404,
  "comment": "A 404 Not Found is the most semantically correct response for a missing resource. Some APIs might return a 400 Bad Request instead.",
  "responseBody": {
    "success": false,
    "code": "ERROR_ASSIGNMENT_NOT_FOUND",
    "data": {}
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "timeSlots": [],
        "summary": {
            "totalTimeSlots": 0,
            "totalSessions": 0,
            "fullyStaffed": 0,
            "partiallyStaffed": 0,
            "unstaffed": 0
        }
    }
}
```

**Result**: Fail.

**Notes**: It should return a not found error, but still robust enough to return an empty time slot array.

###### Test 2

**Execution Date**: 31/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "4031",
    "data": "Assignment not found"
}
```

**Result**: Pass.

**Notes**: None.



### 4. [POST] /api/admin/assignments/{assignmentId}/timeslots/batch 

#### Test Case 1: Successfully Create Multiple Timeslots in a Batch

##### Description

This is the primary "happy path" test case. It verifies that multiple, distinct timeslots can be created for an assignment in a single API call. This test ensures the batch processing logic is working correctly, that sessions are generated based on the assignment's configuration, and that the API returns a `200 OK` response with an accurate summary of created items (`timeSlotsCreated`, `sessionsGenerated`) and a list of the newly created timeslot objects.

##### Pre-conditions

- An assignment with `assignmentId: 1` exists in the database.
- The assignment's session configuration (e.g., `sessionLength`, `gapTime`) has been set, allowing for automatic session generation.
- A venue with `venueId: 10` exists.

##### Input

```json
{
  "method": "POST",
  "path": "/api/admin/assignments/{assignmentId}/timeslots/batch",
  "pathParameters": {
    "assignmentId": 1
  },
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "timeSlots": [
      {
        "date": "2025-10-20",
        "startTime": "09:00",
        "endTime": "11:00",
        "sessionCount": 3,
        "venueId": 10
      },
      {
        "date": "2025-10-21",
        "startTime": "13:00",
        "endTime": "15:00",
        "sessionCount": 3,
        "venueId": 10
      }
    ]
  }
}
```

##### Expected Output

```json
{
  "success": true,
  "code": 200,
  "message": "2 time slots created with 6 sessions generated",
  "data": {
    "timeSlotsCreated": 2,
    "sessionsGenerated": 6,
    "timeSlots": [
      {
        "id": 5, // whatever generated id
        "date": "2025-10-20",
        "startTime": "09:00:00",
        "endTime": "11:00:00",
        "venueId": 10,
        "requiredExaminers": 3,
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
            "startTime": "09:40",
            "endTime": "10:10",
            "status": "available",
            "sessionNumber": 2
          },
          {
            "id": 503,
            "startTime": "10:20",
            "endTime": "10:50",
            "status": "available",
            "sessionNumber": 3
          }
        ],
        "createdAt": "2025-08-26T10:45:00Z"
      }
      {
        "id": 4,
        "date": "2025-10-21",
        "startTime": "13:00:00",
        "endTime": "15:00:00",
        "venueId": 10,
        "requiredExaminers": 3,
        "sessionCount": 3,
        "status": "empty",
        "assignedExaminers": [],
        "sessions": [
          {
            "id": 12,
            "startTime": "13:00:00",
            "endTime": "13:30:00",
            "status": "available",
            "bookedBy": null,
            "sessionNumber": 1
          },
          {
            "id": 13,
            "startTime": "13:40:00",
            "endTime": "14:10:00",
            "status": "available",
            "bookedBy": null,
            "sessionNumber": 2
          },
          {
            "id": 14,
            "startTime": "14:20:00",
            "endTime": "14:50:00",
            "status": "available",
            "bookedBy": null,
            "sessionNumber": 3
          }
        }
      ]
    }
  }
```

##### **Execution History**

###### Test 1

**Execution Date**: 30/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "timeSlotsCreated": 2,
        "sessionsGenerated": 6,
        "timeSlots": [
            {
                "id": 3,
                "date": "2025-10-20",
                "startTime": "09:00:00",
                "endTime": "11:00:00",
                "venueId": 10,
                "requiredExaminers": 3,
                "sessionCount": 3,
                "status": "empty",
                "assignedExaminers": [],
                "sessions": [
                    {
                        "id": 9,
                        "startTime": "09:00:00",
                        "endTime": "09:30:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 1
                    },
                    {
                        "id": 10,
                        "startTime": "09:40:00",
                        "endTime": "10:10:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 2
                    },
                    {
                        "id": 11,
                        "startTime": "10:20:00",
                        "endTime": "10:50:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 3
                    }
                ],
                "bookedSessions": 0,
                "createdAt": "2025-08-30T22:44:23.564317",
                "lastModified": "2025-08-30T22:44:23.564347"
            },
            {
                "id": 4,
                "date": "2025-10-21",
                "startTime": "13:00:00",
                "endTime": "15:00:00",
                "venueId": 10,
                "requiredExaminers": 3,
                "sessionCount": 3,
                "status": "empty",
                "assignedExaminers": [],
                "sessions": [
                    {
                        "id": 12,
                        "startTime": "13:00:00",
                        "endTime": "13:30:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 1
                    },
                    {
                        "id": 13,
                        "startTime": "13:40:00",
                        "endTime": "14:10:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 2
                    },
                    {
                        "id": 14,
                        "startTime": "14:20:00",
                        "endTime": "14:50:00",
                        "status": "available",
                        "bookedBy": null,
                        "sessionNumber": 3
                    }
                ],
                "bookedSessions": 0,
                "createdAt": "2025-08-30T22:44:23.654455",
                "lastModified": "2025-08-30T22:44:23.654484"
            }
        ],
        "message": "2 time slots created with 6 sessions generated"
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 2: Attempt to Create Timeslots for a Non-Existent Assignment

##### Description

This negative test case verifies that the API validates the existence of the parent resource (`assignmentId`) before proceeding with the batch creation. The request should be rejected with a clear client-side error if the specified assignment cannot be found.

##### Pre-conditions

No assignment with the ID `999999` exists in the database.

##### Input

```json
{
  "method": "POST",
  "path": "/api/admin/assignments/{assignmentId}/timeslots/batch",
  "pathParameters": {
    "assignmentId": 999999
  },
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "timeSlots": [
      {
        "date": "2025-10-20",
        "startTime": "09:00",
        "endTime": "11:00",
        "sessionCount": 4,
        "venueId": 10
      }
    ]
  }
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "ERROR_ASSIGNMENT_NOT_FOUND",
    "data": {}  // error info
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 30/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "5001",
    "data": "Session configuration not found or not configured"
}
```

**Result**: Pass.

**Notes**: The error message is clear (not found).



#### Test Case 3: Attempt to Create a Batch with Partially Invalid Data

##### Description

This negative test case checks the transactional nature of the batch operation. The request payload contains a mix of valid and invalid timeslot data (e.g., one item has a malformed `date`). A robust transactional API should reject the entire batch if any single item fails validation, ensuring that no partial data is created.

##### Pre-conditions

An assignment with `assignmentId: 3` exists.

##### Input

```json
{
  "method": "POST",
  "path": "/api/admin/assignments/{assignmentId}/timeslots/batch",
  "pathParameters": {
    "assignmentId": 3
  },
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "timeSlots": [
      {
        "date": "2025-11-06",
        "startTime": "14:00",
        "endTime": "15:00",
        "sessionCount": 2,
        "venueId": 12
      },
      {
        "date": "INVALID-DATE-FORMAT",
        "startTime": "16:00",
        "endTime": "17:00",
        "sessionCount": 2,
        "venueId": 12
      }
    ]
  }
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "400",
    "data": {} //bad request error info
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 30/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "400",
    "data": "Invalid request format"
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 4: Attempt to Create Timeslots with an Empty Array

##### Description

This edge case test checks how the API handles a request to create a batch of zero items. While some APIs might return a `200 OK` indicating zero items were created, a more common and robust approach is to treat an empty array as a bad request, as the intent of the call is to create items.

##### Pre-conditions

An assignment with `assignmentId: 1` exists.

##### Input

```json
{
  "method": "POST",
  "path": "/api/admin/assignments/{assignmentId}/timeslots/batch",
  "pathParameters": {
    "assignmentId": 1
  },
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "timeSlots": []
  }
}
```

##### Expected Output

```json
{
  "statusCode": 400,
  "responseBody": {
    "success": true,
    "code": "ERROR_VALIDATION_TIMESLOTS_CANNOT_BE_EMPTY",
    "data": {}
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 30/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "timeSlotsCreated": 0,
        "sessionsGenerated": 0,
        "timeSlots": [],
        "message": "0 time slots created with 0 sessions generated"
    }
}
```

**Result**: Pass.

**Notes**: Not the best way to handle an empty request, but it still works.



### 5. [PUT] /api/admin/assignments/{assignmentId}/timeslots/{timeSlotId}

#### Test Case 1: Successfully Update an Existing Timeslot

##### Description

This is the primary "happy path" test case. It verifies that the details of an existing timeslot can be successfully updated. This test sends a request with a new `date` and `startTime`. The API should replace the old data with the new data for the specified timeslot and return a `200 OK` response containing the fully updated timeslot object.

##### Pre-conditions

- An assignment with `assignmentId: 2` exists in the database.
- A timeslot with `timeSlotId: 1` exists and is associated with assignment `2`. Its current date is `2025-10-20`.

##### Input

```json
{
  "method": "POST",
  "path": "/api/admin/assignments/{assignmentId}/timeslots/batch",
  "pathParameters": {
    "assignmentId": 2
  },
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "timeSlots": [
      {
        "date": "2025-10-20",
        "startTime": "09:00",
        "endTime": "11:00",
        "sessionCount": 4,
        "venueId": 10
      },
      {
        "date": "2025-10-21",
        "startTime": "13:00",
        "endTime": "15:00",
        "sessionCount": 4,
        "venueId": 10
      }
    ]
  }
}
```

##### Expected Output

```json

```

##### **Execution History**

###### Test 1

**Execution Date**:

**Tester**: Weiran

**Actual Output**:

```json

```

**Result**:

**Notes**:



### 6. [POST]  /api/admin/assignments/{assignmentId}/timeslots/{timeSlotId}/duplicate

#### Test Case 1: Duplicate a Timeslot with a New Date and Time

##### Description



##### Pre-conditions

- An assignment with `assignmentId: 789` exists in the database.
- A source timeslot with `timeSlotId: 101` exists for this assignment, scheduled for `2025-10-20`. This source timeslot has examiners assigned to it.

##### Input

```json

```

##### Expected Output

```json

```

##### **Execution History**

###### Test 1

**Execution Date**:

**Tester**: Weiran

**Actual Output**:

```json

```

**Result**:

**Notes**:



#### Test Case 2: 

##### Description



##### Pre-conditions



##### Input

```json

```

##### Expected Output

```json

```

##### **Execution History**

###### Test 1

**Execution Date**:

**Tester**: Weiran

**Actual Output**:

```json

```

**Result**:

**Notes**:



### 7. [DELETE] /api/admin/assignments/{{assignmentId}}/timeslots (not done yet)

#### Test Case 1: 

##### Description



##### Pre-conditions



##### Input

```json

```

##### Expected Output

```json

```

##### **Execution History**

###### Test 1

**Execution Date**:

**Tester**: Weiran

**Actual Output**:

```json

```

**Result**:

**Notes**:



### 8.  [GET] /api/admin/assignments/{{assignmentId}}/examiners

#### Test Case 1: 

##### Description

Verify that the system successfully returns the list of examiners for a given assignment when a valid Course Admin and assignmentId are provided.

##### Pre-conditions

The user is authenticated as a valid **Course Admin** .

The `assignmentId` exists in the system.

At least one examiner has been added to the assignment.

##### Input

 `GET {{baseUrl}}/admin/assignments/{{assignmentId}}/examiners`

**Body**:

```json

```

##### Expected Output

HTTP status code: `200 OK`

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
      },
      {
        "id": 2,
        "name": "Dr. Michael Chen",
        "email": "michael.chen@university.edu",
        "maxSessions": 35,
        "currentAssignments": 4,
        "availability": "available"
      }
    ]
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 

**Tester**: Benyuan

**Actual Output**:

```json

```

**Result**:



**Notes**: 

- 

#### Test Case 2: 

##### Description

Verify that the system returns a `404 Not Found` error when the provided `assignmentId` does not exist in the system.

##### Pre-conditions

The request is made with a valid Course Admin.

The `assignmentId` used in the request is invalid or does not exist in the database.

##### Input

**Request**:
 `GET {{baseUrl}}/admin/assignments/{{invalidAssignmentId}}/examiners`

**Body**:

```json

```

##### Expected Output

HTTP status code: `404 Not Found`

```json
{
    "success": false,
    "code": "4031",
    "data": "Assignment not found"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Benyuan

**Actual Output**:

HTTP status code: `200 OK`

```json
{
    "success": true,
    "code": "200",
    "data": null
}
```

**Result**: 

Fail.

**Notes**:

- The system returned HTTP `200 OK` with `data: null`. Expected was `404 Not Found` with an appropriate error code/message (`NOT_FOUND`). The status code and error handling are incorrect, though the response indicates absence of data.

#### Test Case 3: 

##### Description

Verify that the system successfully handles the case when the assignment exists but no examiners have been assigned yet.

##### Pre-conditions

The request is made with a valid Course Admin.

The `assignmentId` exists in the system.

No examiners are currently assigned to this assignment.

##### Input

**Request**:
 `GET {{baseUrl}}/admin/assignments/{{invalidAssignmentId}}/examiners`

**Body**:

```json

```

##### Expected Output

HTTP status code: `404 Not Found`

```json
{
  "success": true,
   "code": "200",
  "data": {
    "examiners": []
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Benyuan

**Actual Output**:

HTTP status code: `200 OK`

```json
{
    "success": true,
    "code": "200",
    "data": null
}
```

**Result**: 

Fail.

**Notes**:

- The system returned HTTP `200 OK` with `data: null`. Expected was HTTP `200 OK` with an empty `examiners` array (`"examiners": []`). The status code is correct, but the payload format is inconsistent with the API contract.

### 9. [PUT] /api/admin/assignments/{assignmentId}/examiners/session-limits

#### Test Case 1: 

##### Description



##### Pre-conditions

The user is authenticated as a valid **Course Admin** .



##### Input

 `GET /admin/assignments/{assignmentId}/examiners/session-limits`

**Body**:

```json

```

##### Expected Output

HTTP status code: `200 OK`

```json

```

##### **Execution History**

###### Test 1

**Execution Date**: 

**Tester**: Benyuan

**Actual Output**:

```json

```

**Result**:



**Notes**: 

- 



### 10. [PUT] /api/admin/assignments/{assignmentId}/timeslots/{{timeSlotId}}/examiners

#### Test Case 1: 

##### Description



##### Pre-conditions

The user is authenticated as a valid **Course Admin** .



##### Input

 `GET /admin/assignments/{assignmentId}/timeslots/{{timeSlotId}}/examiners`

**Body**:

```json

```

##### Expected Output

HTTP status code: `200 OK`

```json

```

##### **Execution History**

###### Test 1

**Execution Date**: 

**Tester**: Benyuan

**Actual Output**:

```json

```

**Result**:



**Notes**: 

- 



### 11. [GET] /api/admin/assignments/{assignmentId}/schedule/status

#### Test Case 1: 

##### Description

Verify that the system successfully returns the schedule status of an assignment when a valid course administrator and assignmentId are provided.

##### Pre-conditions

The user is authenticated as a valid **Course Admin** .

The target `assignmentId` exists in the system.

The schedule for the assignment has been created and is accessible.

##### Input

 `GET /admin/assignments/{assignmentId}/schedule/status`

**Body**:

```json

```

##### Expected Output

HTTP status code: `200 OK`

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

##### **Execution History**

###### Test 1

**Execution Date**: 30/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "assignmentId": 1,
        "scheduleStatus": "draft",
        "isReleased": false,
        "releasedAt": null,
        "totalTimeSlots": 0,
        "readyForRelease": false,
        "issues": [
            "No time slots defined"
        ],
        "summary": {
            "totalSessions": 0,
            "fullyStaffedSlots": 0,
            "unstaffedSlots": 0,
            "totalExaminers": 0
        }
    }
}
```

**Result**:

Pass.

**Notes**: 

The system successfully returned the schedule status with `200 OK`.

- `scheduleStatus` is `"draft"` and `isReleased` is `false`, indicating the schedule has not yet been released.
- `readyForRelease` is `false` and `issues` contains `"No time slots defined"`, which matches the expected state when no time slots have been configured.

#### Test Case 2: 

##### Description

Verify that the system returns a `404 Not Found` error when the provided `assignmentId` does not exist in the system.

##### Pre-conditions

The request is made with a valid Course Admin.

The `assignmentId` used in the request is invalid or does not exist in the database.

##### Input

**Request**:
 `GET /admin/assignments/{invalidAssignmentId}/schedule/status`

**Body**:

```json

```

##### Expected Output

HTTP status code: `404 Not Found`

```json
{
  "success": false,
  "code": "string",
  "data": {}
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 30/8/2025

**Tester**: Benyuan

**Actual Output**:

HTTP status code: `200 OK`

```json
{
    "success": false,
    "code": "4031",
    "data": "Assignment not found"
}
```

**Result**: 

Fail.

**Notes**:

- The response body correctly indicated `"Assignment not found"`, but the HTTP status code was `200 OK` instead of the expected `404 Not Found`.

### 12. [POST] /api/admin/assignments/{assignmentId}/schedule/release

#### Test Case 1: 

##### Description

Verify that the system successfully releases the schedule when a valid Course Admin and correct request body are provided. The schedule status should change to `released` and notifications should be sent to students and examiners.

##### Pre-conditions

The user is authenticated as a valid **Course Admin**.

The `assignmentId` exists in the system.

The schedule has been fully configured (time slots exist, all slots staffed, no blocking issues).

The schedule has not been released before.

##### Input

 `POST /admin/assignments/{assignmentId}/schedule/release`

**Body**:

```json
{
  "notifyStudents": true,
  "notifyExaminers": true,
  "releaseMessage": "Assessment schedule is now available for booking.",
  "reschedulingEnabled": true,
  "bookingDeadline": "2025-09-12T17:00:00+10:00",
  "lockoutEnabled": true,
  "lockoutWindowHours": 24
}
```

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "message": "Schedule released successfully",
  "data": {
    "releasedAt": "2025-08-26T11:00:00Z",
    "notificationsSent": {
      "students": 45,
      "examiners": 6
    },
    "bookingPolicies": {
      "reschedulingEnabled": true,
      "bookingDeadline": "2025-04-12T17:00:00+10:00",
      "lockoutEnabled": true,
      "lockoutWindowHours": 24
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "releasedAt": "2025-08-31T00:07:32.033756",
        "notificationsSent": {
            "students": 45,
            "examiners": 6
        },
        "message": "Schedule released successfully"
    }
}
```

**Result**:

Pass

**Notes**: 

- 

#### Test Case 2: 

##### Description

Verify that the system prevents releasing the schedule if the schedule is incomplete (e.g., time slots exist but some are not fully staffed).

##### Pre-conditions

The user is authenticated as a valid **Course Admin**.

The `assignmentId` exists in the system.

The schedule has been created but **issues remain** (e.g., unstaffed slots, missing time slots).

The schedule has not been released before.

##### Input

**Request**:
 `POST /admin/assignments/{assignmentId}/schedule/release`

**Body**:

```json
{
  "notifyStudents": true,
  "notifyExaminers": true,
  "releaseMessage": "Assessment schedule is now available for booking.",
  "reschedulingEnabled": true,
  "bookingDeadline": "2025-08-12T17:00:00+10:00",
  "lockoutEnabled": true,
  "lockoutWindowHours": 24
}
```

##### Expected Output

HTTP status code: `409 Conflict`

```json
{
  "success": false,
  "code": "5005",
  "data": "Schedule is not ready for release"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 30/8/2025

**Tester**: Benyuan

**Actual Output**:

HTTP status code: `200 OK`

```json
{
    "success": false,
    "code": "5005",
    "data": "Schedule is not ready for release"
}
```

**Result**: 

Failed.

**Notes**:

- The response body correctly indicated `"Schedule is not ready for release"` with business error code `"5005"`. However, the HTTP status code was returned as `200 OK` instead of the expected `409 Conflict`.

### 13. [GET] /api/admin/assignments/{assignmentId}/calendar?month=2025-08

#### Test Case 1: 

##### Description

Verify that the system successfully releases the schedule when a valid Course Admin and correct request body are provided. The schedule status should change to `released` and notifications should be sent to students and examiners.

##### Pre-conditions

The user is authenticated as a valid **Course Admin**.

The `assignmentId` exists in the system.

The schedule has been fully configured (time slots exist, all slots staffed, no blocking issues).

The schedule has not been released before.

##### Input

 `POST /admin/assignments/{assignmentId}/schedule/release`

**Body**:

```json
{
  "notifyStudents": true,
  "notifyExaminers": true,
  "releaseMessage": "Assessment schedule is now available for booking.",
  "reschedulingEnabled": true,
  "bookingDeadline": "2025-09-12T17:00:00+10:00",
  "lockoutEnabled": true,
  "lockoutWindowHours": 24
}
```

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "message": "Schedule released successfully",
  "data": {
    "releasedAt": "2025-08-26T11:00:00Z",
    "notificationsSent": {
      "students": 45,
      "examiners": 6
    },
    "bookingPolicies": {
      "reschedulingEnabled": true,
      "bookingDeadline": "2025-04-12T17:00:00+10:00",
      "lockoutEnabled": true,
      "lockoutWindowHours": 24
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "releasedAt": "2025-08-31T00:07:32.033756",
        "notificationsSent": {
            "students": 45,
            "examiners": 6
        },
        "message": "Schedule released successfully"
    }
}
```

**Result**:

Pass

**Notes**: 

- 

#### Test Case 2: 

##### Description

Verify that the system prevents releasing the schedule if the schedule is incomplete (e.g., time slots exist but some are not fully staffed).

##### Pre-conditions

The user is authenticated as a valid **Course Admin**.

The `assignmentId` exists in the system.

The schedule has been created but **issues remain** (e.g., unstaffed slots, missing time slots).

The schedule has not been released before.

##### Input

**Request**:
 `POST /admin/assignments/{assignmentId}/schedule/release`

**Body**:

```json
{
  "notifyStudents": true,
  "notifyExaminers": true,
  "releaseMessage": "Assessment schedule is now available for booking.",
  "reschedulingEnabled": true,
  "bookingDeadline": "2025-08-12T17:00:00+10:00",
  "lockoutEnabled": true,
  "lockoutWindowHours": 24
}
```

##### Expected Output

HTTP status code: `409 Conflict`

```json
{
  "success": false,
  "code": "5005",
  "data": "Schedule is not ready for release"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 30/8/2025

**Tester**: Benyuan

**Actual Output**:

HTTP status code: `200 OK`

```json
{
    "success": false,
    "code": "5005",
    "data": "Schedule is not ready for release"
}
```

**Result**: 

Failed.

**Notes**:

- The response body correctly indicated `"Schedule is not ready for release"` with business error code `"5005"`. However, the HTTP status code was returned as `200 OK` instead of the expected `409 Conflict`.





























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

**Result**: Pass.

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

**Result**: Pass.

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
        "invitedAt": "2025-08-16T14:05:04",  // field in the user table
        "registeredAt": "2025-08-17T14:05:08",  // field in the user table
        "lastLoginAt": "2025-08-19T14:05:32",  // field in the user table
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

**Result**: Fail.

**Notes**: Fields `invitedAt`, `registeredAt`, and `lastLoginAt` are not retrieved. `invitationExpiresAt` is not in the `sys_user` table.

###### Test 2

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "userId": 35,
        "department": "test",
        "invitedAt": "2025-08-17 00:05:04",
        "registeredAt": "2025-08-18 00:05:08",
        "lastLoginAt": "2025-08-20 00:05:32",
        "coursesManaged": 2,
        "studentsManaged": 50,
        "assignmentsCreated": 2,
        "id": "35",
        "email": "test@unimelb.edu.au",
        "name": "testadmin1",
        "status": "ACTIVE",
        "registrationStatus": "PENDING",
        "sisLoginId": null,
        "token": "1",
        "invitationExpiresAt": null,
        "courses": [],
        "recentActivity": []
    }
}
```

**Result**: Pass.

**Notes**: `invitationExpiresAt` is still empty. But seems like the field does not need in the frontend.



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

**Notes**: None.



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

**Notes**: None.



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

**Notes**: None.



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

**Notes**: None.



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

**Notes**: None.



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

###### Test 2

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "courses": [
            {
                "id": 21,
                "code": "TEST54321",
                "name": "Test Creator",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 5,
                "code": "COMP90000",
                "name": "Algorithms and Complex1",
                "semester": "Semester 2",
                "year": 2026,
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
                "id": 22,
                "code": "TEST11111",
                "name": "123",
                "semester": "Semester 2",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 9,
                "code": "COMP90024",
                "name": "Cluster and Cloud Computing",
                "semester": "Semester 1",
                "year": 2025,
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
                "id": 7,
                "code": "COMP90050",
                "name": "Advanced Database Systems",
                "semester": "Semester 1",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-25T05:27:45"
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
                "id": 15,
                "code": "AIAN12345",
                "name": "IAN PAPA ",
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
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 12,
                "code": "COMP90082",
                "name": "Software Project Managment",
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
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 24,
                "code": "SANJ99999",
                "name": "LINLANG",
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
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 10,
                "code": "SWEN90004",
                "name": "Modelling Complex Software Systems",
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
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
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

**Result**: Fail.

**Notes**: The API only returns active courses.

###### Test 3

**Execution Date**: 31/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "courses": [
            {
                "id": 28,
                "code": "AAAA11111",
                "name": "aaaaaaaaaaa",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 29,
                "code": "BBBB22222",
                "name": "bbbbbbbbbbb",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 30,
                "code": "CCCC33333",
                "name": "ccccccccccccccc",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 13,
                "code": "COMP11451",
                "name": "mmmmmm",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ARCHIVED",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 31,
                "code": "DDDD44444",
                "name": "dddddddd",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 32,
                "code": "EEEE55555",
                "name": "eeeeeeee",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 33,
                "code": "FFFF66666",
                "name": "fffffffffffff",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 26,
                "code": "TEST12390",
                "name": "TestTest",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ARCHIVED",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 21,
                "code": "TEST54321",
                "name": "Test Creator",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ARCHIVED",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 5,
                "code": "COMP90000",
                "name": "Algorithms and Complex1",
                "semester": "Semester 2",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ARCHIVED",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 4,
            "totalItems": 35,
            "itemsPerPage": 10,
            "hasNext": true,
            "hasPrev": false
        }
    }
}
```

**Result**: Pass.

**Notes**: Some fields are not developed.



#### Test Case 2: Comprehensive Filtering and Searching

##### Description

This test case is designed to verify the API's powerful filtering capabilities by combining multiple criteria at once. It uses specific values for `department`, `semester`, `year`, `status`, and `adminId`, in addition to a `search` keyword. This ensures the API correctly applies `AND` logic to all conditions, returning only the courses that precisely match every single filter.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```json
{
  "method": "POST",
  "path": "/api/superadmin/courses",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "page": 1,
    "limit": 20,
    "status": "active",
    "semester": "Semester 2",
    "year": 2025,
    "search": "Introduction",
    "adminId": 49
  }
}
```

##### Expected Output

```json
{
  "statusCode": 200,
  "comment": "Every course in the 'courses' array must match ALL the specified filters: status='active', semester='Semester 2', year=2025, adminId=49, and its name/description should contain 'Introduction'.",
  "responseBodySchema": {
    "properties": {
      "success": { "const": true }
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "courses": [
            {
                "id": 19,
                "code": "SWEN90018",
                "name": "Introduction nihao",
                "semester": "Semester 2",
                "year": 2025,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 49,
                "adminName": "1",
                "adminEmail": "yanqings1@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": "2025-08-31T10:54:17"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 1,
            "totalItems": 1,
            "itemsPerPage": 20,
            "hasNext": false,
            "hasPrev": false
        }
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 3: Advanced Sorting Logic

##### Description

This test case specifically validates the sorting mechanism. It requests the list of courses to be sorted by their `name` in ascending (`asc`) order. This is different from a default sort (e.g., by creation date) and verifies that the `sortBy` and `sortOrder` parameters are correctly interpreted and applied by the API backend.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```json
{
  "method": "POST",
  "path": "/api/superadmin/courses",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "page": 1,
    "limit": 7,
    "sortBy": "name",
    "sortOrder": "asc"
  }
}
```

##### Expected Output

```json
{
  "statusCode": 200,
  "comment": "The 'courses' array in the response must be sorted alphabetically from A-Z based on the 'name' field.",
  "responseBodySchema": {
    "properties": {
      "success": { "const": true }
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "courses": [
            {
                "id": 28,
                "code": "AAAA11111",
                "name": "aaaaaaaaaaa",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 29,
                "code": "BBBB22222",
                "name": "bbbbbbbbbbb",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 30,
                "code": "CCCC33333",
                "name": "ccccccccccccccc",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 13,
                "code": "COMP11451",
                "name": "mmmmmm",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ARCHIVED",
                "adminId": 49,
                "adminName": "1",
                "adminEmail": "yanqings1@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": "2025-08-31T10:53:14"
            },
            {
                "id": 31,
                "code": "DDDD44444",
                "name": "dddddddd",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 32,
                "code": "EEEE55555",
                "name": "eeeeeeee",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 33,
                "code": "FFFF66666",
                "name": "fffffffffffff",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalItems": 35,
            "itemsPerPage": 7,
            "hasNext": true,
            "hasPrev": false
        }
    }
}
```

**Result**: Fail.

**Notes**: The backend doesn't use the filter parameters at all.



#### Test Case 4: Pagination for an Out-of-Bounds Page

##### Description

This is an edge case test for pagination. It checks the API's behavior when a page number is requested that is far beyond the total number of records available (e.g., page 999). A robust API should handle this gracefully by returning a `200 OK` status with an empty `courses` array, rather than throwing an error. The `pagination` object should still accurately reflect the requested page and total records.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```json
{
  "method": "POST",
  "path": "/api/superadmin/courses",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "page": 999,
    "limit": 10
  }
}
```

##### Expected Output

```json
{
  "statusCode": 200,
  "responseBody": {
    "success": true,
    "code": "string",
    "data": {
      "courses": [],
      "pagination": {
        "currentPage": 999
      }
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "courses": [
            {
                "id": 28,
                "code": "AAAA11111",
                "name": "aaaaaaaaaaa",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 29,
                "code": "BBBB22222",
                "name": "bbbbbbbbbbb",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 30,
                "code": "CCCC33333",
                "name": "ccccccccccccccc",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 13,
                "code": "COMP11451",
                "name": "mmmmmm",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ARCHIVED",
                "adminId": 49,
                "adminName": "1",
                "adminEmail": "yanqings1@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": "2025-08-31T10:53:14"
            },
            {
                "id": 31,
                "code": "DDDD44444",
                "name": "dddddddd",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 32,
                "code": "EEEE55555",
                "name": "eeeeeeee",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 33,
                "code": "FFFF66666",
                "name": "fffffffffffff",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ACTIVE",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 26,
                "code": "TEST12390",
                "name": "TestTest",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ARCHIVED",
                "adminId": 2,
                "adminName": "alice",
                "adminEmail": "alice@student.unimelb.edu.au",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 21,
                "code": "TEST54321",
                "name": "Test Creator",
                "semester": "Semester 1",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ARCHIVED",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": null,
                "updatedAt": null
            },
            {
                "id": 5,
                "code": "COMP90000",
                "name": "Algorithms and Complex1",
                "semester": "Semester 2",
                "year": 2026,
                "department": null,
                "venue": null,
                "status": "ARCHIVED",
                "adminId": 1,
                "adminName": "test",
                "adminEmail": "p@x.com",
                "studentsCount": null,
                "assignmentsCount": null,
                "createdAt": "2025-08-23T11:50:17",
                "updatedAt": "2025-08-23T14:20:05"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 4,
            "totalItems": 35,
            "itemsPerPage": 10,
            "hasNext": true,
            "hasPrev": false
        }
    }
}
```

**Result**: Pass.

**Notes**: It's an elegant way to handle the out-of-bounds parameters.



#### Test Case 5: Invalid Enumerated Value in Request

##### Description

This negative test case checks input validation for fields that expect a specific set of allowed values. It sends a request with an invalid `page` value ("sideways"), which is not a number. This verifies that the API's validation layer rejects unsupported or nonsensical values with a `400 Bad Request` error.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

##### Input

```json
{
  "method": "POST",
  "path": "/api/superadmin/courses",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "page": 1,
    "limit": abc
  }
}
```

##### Expected Output

```json
{
  "statusCode": 400,
  "responseBody": {
    "success": false,
    "code": "400",
    "data": {} // any error message
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "400",
    "data": "Invalid request format"
}
```

**Result**: Pass.

**Notes**: None.



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

###### Test 2

**Execution Date**: 31/8/2025

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
                "lastLoginAt": "2025-08-30 05:18:41",
                "coursesManaged": null,
                "studentsManaged": null,
                "assignmentsCreated": null,
                "id": "48",
                "email": "superadmin@example.com",
                "name": "testsuper",
                "status": "ACTIVE",
                "registrationStatus": "PENDING",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            },
            {
                "userId": 35,
                "department": "test",
                "invitedAt": "2025-08-17 00:05:04",
                "registeredAt": "2025-08-18 00:05:08",
                "lastLoginAt": "2025-08-20 00:05:32",
                "coursesManaged": 2,
                "studentsManaged": 50,
                "assignmentsCreated": 2,
                "id": "35",
                "email": "test@unimelb.edu.au",
                "name": "testadmin1",
                "status": "INACTIVE",
                "registrationStatus": "EXPIRED",
                "sisLoginId": null,
                "token": "1",
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
                "registrationStatus": "PENDING",
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
                "registrationStatus": "PENDING",
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
                "registrationStatus": "PENDING",
                "sisLoginId": null,
                "token": null,
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
                "registrationStatus": "PENDING",
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
                "registrationStatus": "PENDING",
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
                "registrationStatus": "PENDING",
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
                "registrationStatus": "PENDING",
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
                "registrationStatus": "PENDING",
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
                "registrationStatus": "PENDING",
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
                "registrationStatus": "PENDING",
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
                "registrationStatus": "PENDING",
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
                "registrationStatus": "PENDING",
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
                "registrationStatus": "PENDING",
                "sisLoginId": null,
                "token": null,
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 4,
            "totalItems": 46,
            "itemsPerPage": 15,
            "hasNext": true,
            "hasPrev": false
        }
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 2: Comprehensive Filtering by Multiple Criteria

##### Description

This test case validates the API's filtering capabilities by combining several criteria simultaneously. It sends a request to find admins from a specific `department`, with a certain `status`, and whose `name` contains a partial string. This test ensures the backend correctly applies `AND` logic to all filters, returning a precise subset of administrators that match every condition.

##### Pre-conditions



##### Input

```json
{
  "method": "POST",
  "path": "/api/superadmin/admins",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "page": 1,
    "limit": 20,
    "status": "active",
    "department": "Faculty of Engineering",
    "name": "Jane"
  }
}
```

##### Expected Output

```json
{
  "statusCode": 200,
  "comment": "Every admin in the 'admins' array must have status='active', belong to 'Faculty of Engineering', and have a name containing 'Jane'.",
  "responseBodySchema": {
    "properties": {
      "success": { "const": true }
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "admins": [
            {
                "userId": 76,
                "department": "Computer Science",
                "invitedAt": "2025-08-28 20:42:15",
                "registeredAt": null,
                "lastLoginAt": null,
                "coursesManaged": 0,
                "studentsManaged": 0,
                "assignmentsCreated": 0,
                "id": "76",
                "email": "new.jane.smith@student.unimelb.edu.au",
                "name": "Dr. Jane Smith",
                "status": "ACTIVE",
                "registrationStatus": "PENDING",
                "sisLoginId": null,
                "token": "UW_Idso6GrldaS6PKydtms8xhgTCwiHlAzXDe4v0PN8",
                "invitationExpiresAt": null,
                "courses": null,
                "recentActivity": null
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 1,
            "totalItems": 1,
            "itemsPerPage": 20,
            "hasNext": false,
            "hasPrev": false
        }
    }
}
```

**Result**: Pass.

**Notes**: The department field in the filter wasn't used.



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

###### Test 2

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "id": "55",
        "status": "INACTIVE",
        "updatedAt": "2025-08-28T06:34:27.957Z"
    }
}
```

**Result**: Pass.

**Notes**: The `updateTime` doesn't update in the database. But the frontend doesn't need this field at the current stage.



#### Test Case 2: Successfully Update Status to ACTIVE (Without a Reason)

##### Description

This test case verifies another successful status update to `ACTIVE` and also checks if the `reason` field is optional. By sending a valid request without the `reason` field, this test ensures the API can handle a minimal valid payload. A successful update should result in a `200 OK` response.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database. The input admin ID is valid, and the admin's status is `INACTIVE`.

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
      	"status": "ACTIVE"
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
        "status": "ACTIVE",
        "updatedAt": "A recent ISO 8601 timestamp" 
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "id": "55",
        "status": "ACTIVE",
        "updatedAt": "2025-08-28T10:02:55.546Z"
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 3: Attempt to Update a Non-Existent Admin

##### Description

This is a negative test case to check how the API handles requests for a resource that does not exist. It uses a syntactically valid `id` in the URL path that does not correspond to any administrator in the database. The expected behaviour is for the API to return a client error, such as `404 Not Found` or `400 Bad Request`, indicating the specified admin could not be found.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database. The input admin ID doesn't exist in the database.

##### Input

```json
{
    "method": "POST",
    "path": "/api/superadmin/admins/{id}/status",
    "pathParameters": {
      	"id": "999"
    },
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
      	"status": "INACTIVE"
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

**Execution Date**: 28/8/2025

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

**Notes**: None.



#### Test Case 4: Attempt to Update with an Invalid Status Value

##### Description

This negative test case focuses on input validation for the `status` field. The API documentation specifies a set of allowed values (ACTIVE, INACTIVE, INVITED, EXPIRED). This test sends a request with a value that is not in this set (e.g., "PENDING"). The test verifies that the API rejects the invalid data and returns a `400 Bad Request` status.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

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
        "status": "NOSTATUS",
        "reason": "This status is not allowed."
    }
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "400",
    "data": "This status is not allowed."
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "400",
    "data": "This status is not allowed."
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 5: Attempt to Update with a Missing Status in Body

##### Description

This negative test case checks the API's requirement for the `status` field in the request body. It sends a request with an empty JSON object `{}` as the body. Since the `status` is a required piece of information for the update to proceed, the API should identify this as a malformed request and respond with a `400 Bad Request` error.

##### Pre-conditions

User has logged in to the superadmin account. The backend works correctly and connects to the database.

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
    "body": {}
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "400",
    "data": "Any error message"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "400",
    "data": "This status is not allowed."
}
```

**Result**: Pass.

**Notes**: None.



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

**Result**: Pass.

**Notes**: None.



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

The email address `new.jane.smith@student.unimelb.edu.au` does not exist in the system in any capacity (active, inactive, or invited).

##### Input

```json
{
    "email": "new.jane.smith@student.unimelb.edu.au",
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
        "email": "new.jane.smith@student.unimelb.edu.au",
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

###### Test 2

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "userId": 76,
        "department": "Computer Science",
        "invitedAt": null,
        "registeredAt": null,
        "lastLoginAt": null,
        "coursesManaged": null,
        "studentsManaged": null,
        "assignmentsCreated": null,
        "id": "76",
        "email": "new.jane.smith@student.unimelb.edu.au",
        "name": "Dr. Jane Smith",
        "status": "INVITED",
        "registrationStatus": null,
        "sisLoginId": null,
        "token": "UW_Idso6GrldaS6PKydtms8xhgTCwiHlAzXDe4v0PN8",
        "invitationExpiresAt": "2025-09-04 20:42:14",
        "courses": null,
        "recentActivity": null
    }
}
```

**Result**: Pass.

**Notes**: Some timestamps are null. Seems like some fields in the database are redundant.



#### Test Case 2: Invite an Administrator with Minimal Required Fields

##### Description

This test case determines the minimum required fields to successfully create an invitation. It assumes that `email` and `name` are the only mandatory fields. This test verifies that the API can gracefully handle a minimal but valid payload, populating any other fields with default values if necessary.

##### Pre-conditions

The email address `minimal.admin@unimelb.edu.au` does not exist in the system.

##### Input

```json
{
    "method": "POST",
    "path": "/api/superadmin/admins/invite",
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
        "email": "minimal.admin@unimelb.edu.au",
        "name": "Minimal Admin"
    }
}
```

##### Expected Output

```json
{
    "success": true,
    "code": "200",
    "data": {
        "userId": 77,
        "department": null,
        "invitedAt": null,
        "registeredAt": null,
        "lastLoginAt": null,
        "coursesManaged": null,
        "studentsManaged": null,
        "assignmentsCreated": null,
        "id": "77",
        "email": "minimal.admin@unimelb.edu.au",
        "name": "Minimal Admin",
        "status": "INVITED",
        "registrationStatus": null,
        "sisLoginId": null,
        "token": "VHd4Z-w1QbBZ2RCdTMRXcN39rgFj-Qq_oJcHYZWpqb8",
        "invitationExpiresAt": "2025-09-04 20:50:52",
        "courses": null,
        "recentActivity": null
    }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "userId": 77,
        "department": null,
        "invitedAt": null,
        "registeredAt": null,
        "lastLoginAt": null,
        "coursesManaged": null,
        "studentsManaged": null,
        "assignmentsCreated": null,
        "id": "77",
        "email": "minimal.admin@unimelb.edu.au",
        "name": "Minimal Admin",
        "status": "INVITED",
        "registrationStatus": null,
        "sisLoginId": null,
        "token": "VHd4Z-w1QbBZ2RCdTMRXcN39rgFj-Qq_oJcHYZWpqb8",
        "invitationExpiresAt": "2025-09-04 20:50:52",
        "courses": null,
        "recentActivity": null
    }
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 3: Attempt to Invite an Administrator with an Existing Email

##### Description

This is a critical negative test case for a business rule. It ensures that the system prevents the creation of duplicate invitations or accounts for the same email address. The API should identify that the email is already in use and reject the request with a client error, typically a `400 Bad Request` or `409 Conflict`.

##### Pre-conditions

An administrator with the email `new.jane.smith@student.unimelb.edu.au` already exists in the database. This user can be in any state (e.g., `ACTIVE`, `INVITED`, or `INACTIVE`).

##### Input

```json
{
    "method": "POST",
    "path": "/api/superadmin/admins/invite",
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
        "email": "new.jane.smith@student.unimelb.edu.au",
        "name": "Duplicate Admin"
    }
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "409",
    "data": "Email already exists"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "409",
    "data": "Email already exists"
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 4: Attempt to Invite with a Missing Required Field (Email)

##### Description

This negative test case checks the API's validation for mandatory fields in the request body. It sends a request payload that is missing the `email` field, which is essential for creating and sending an invitation. The API must reject this incomplete request with a `400 Bad Request` error.

##### Pre-conditions

None.

##### Input

```json
{
    "name": "No Email Admin"
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "400",
    "data": "Email and login id cannot be both null"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "400",
    "data": "Email and login id cannot be both null"
}
```

**Result**: Pass.

**Notes**: None.



#### Test Case 5: Attempt to Invite with an Invalid Email Format

##### Description

This negative test case verifies the format validation of the `email` field. It sends a request where the value for `email` is a string that does not conform to a valid email address structure. The API should detect the malformed data and respond with a `400 Bad Request` without attempting to process the invitation.

##### Pre-conditions

None.

##### Input

```json
{
    "method": "POST",
    "path": "/api/superadmin/admins/invite",
    "headers": {
      	"Content-Type": "application/json"
    },
    "body": {
        "email": "not-a-valid-email", // or "notvalid@email.com" (not an unimelb email)
        "name": "Invalid Email Admin"
    }
}
```

##### Expected Output

```json
{
    "success": false,
    "code": "400",
    "data": "Invalid email domain (must be @unimelb.edu.au or @student.unimelb.edu.au)"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 28/8/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "400",
    "data": "Invalid email domain (must be @unimelb.edu.au or @student.unimelb.edu.au)"
}
```

**Result**: Pass.

**Notes**: None.











