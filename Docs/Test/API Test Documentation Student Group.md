# API Test Documentation

## Test Environment

| Tester | Processor    | RAM   | Java Edition                            | Postman Edition |
| ------ | ------------ | ----- | --------------------------------------- | --------------- |
| Weiran | Apple M1 Pro | 32 GB | corretto-1.8 (java version "1.8.0_462") | 11.58.4         |



## Epic 5.2 Student Group

### 1. [GET] /api/students/{studentId}/groups

#### Test Case 1: Successfully Retrieve a Student's Active Groups

##### Description

This is the primary happy path test case. It verifies that the API, using the default `status=active` filter, correctly retrieves only the groups that are currently active for the specified student. It also confirms the default pagination and sorting behaviour.

##### Pre-conditions

A student with `studentId: 12345` exists. This student is a member of two groups with `status: "ACTIVE"` and one group with `status: "ARCHIVED"`.

##### Input

```json
{
  "method": "GET",
  "path": "/api/students/{studentId}/groups",
  "pathParameters": {
    "studentId": 12345
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
  "comment": "The 'data.data' array should contain exactly two group objects, both with status: 'ACTIVE'.",
  "responseBody": {
    "success": true,
    "code": "OK",
    "data": {
      "pageNum": 0,
      "pageSize": 20,
      "total": 2,
      "data": [
        {
          "status": "ACTIVE"
        },
        {
          "status": "ACTIVE"
        }
      ]
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 14/9/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "total": 3,
        "data": [
            {
                "groupId": 2,
                "groupName": "Lori Torres",
                "assignmentId": 1,
                "assignmentName": "Oral Presentation Test",
                "courseCode": "SWEN90017",
                "semester": "2024 S1",
                "memberCount": 2,
                "status": "ACTIVE"
            },
            {
                "groupId": 3,
                "groupName": "Justin Barnes",
                "assignmentId": 1,
                "assignmentName": "Oral Presentation Test",
                "courseCode": "SWEN90017",
                "semester": "2024 S1",
                "memberCount": 1,
                "status": "ACTIVE"
            },
            {
                "groupId": 11,
                "groupName": "bob team",
                "assignmentId": 1,
                "assignmentName": "Oral Presentation Test",
                "courseCode": "SWEN90017",
                "semester": "2024 S1",
                "memberCount": 3,
                "status": "ACTIVE"
            }
        ],
        "pageSize": 20,
        "pageNum": 0
    }
}
```

**Result**: Fail.

**Notes**: The `assignment` part was wrong. It should be a field in the table rather than calculating the same subject among the group members. The `status` was always `ACTIVE` as the table didn't include the field. `pageNum` was also wrong.





## Epic 6.4 Student Result

### 1. [GET] /api/students/{studentId}/results

#### Test Case 1: Successfully Retrieve Released Results for the Current Semester

##### Description

This is the primary happy path test case. It verifies that the API, using the default filters (`status=released`, `semester=current`), correctly retrieves only the assignment results that have been released to the student for the current semester.

##### Pre-conditions

A student with `studentId: 3` exists. The system's current semester is "2025 S2". The student has results for three assignments in this semester: two are `status: "RELEASED"` and one is `status: "PENDING"`. The student has also released results from a past semester ("2025 S1").

##### Input

```json
{
  "method": "GET",
  "path": "/api/students/{studentId}/results",
  "pathParameters": {
    "studentId": 3
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
  "comment": "The 'data.data' array should contain exactly two result objects, both with status 'RELEASED' from the current semester.",
  "responseBody": {
    "success": true,
    "code": "OK",
    "data": {
      "pageNum": 1,
      "pageSize": 20,
      "total": 2,
      "data": [
        {
          "status": "RELEASED"
        },
        {
          "status": "RELEASED"
        }
      ]
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 14/9/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "pageNum": 1,
        "pageSize": 20,
        "total": 0,
        "data": [],
        "cachingHintSeconds": 3600
    }
}
```

**Result**: Fail.

**Notes**: The `subject_type` can never be `Student`, thus the result was always empty.



### 2. [GET] /api/students/{studentId}/assignments/{assignmentId}/result

#### Test Case 1: Successfully Retrieve a Released Result Summary

##### Description

This is the primary happy path test case. It verifies that a student can retrieve the full result summary for a specific assignment once it has been officially released. The test confirms a `200 OK` response containing the detailed `assignment`, `result`, and `summary` objects.

##### Pre-conditions

A student with `studentId: 3` exists. An assignment with `assignmentId: 1` exists. The student has a result for this assignment, and its `resultStatus` is "released".

##### Input

```json
{
  "method": "GET",
  "path": "/api/students/{studentId}/assignments/{assignmentId}/result",
  "pathParameters": {
    "studentId": 3,
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
  "statusCode": 200,
  "responseBodySchema": {
    "type": "object",
    "properties": {
      "success": { "const": true },
      "data": {
        "type": "object",
        "properties": {
          "assignment": { "type": "object" },
          "result": {
            "type": "object",
            "properties": {
              "resultStatus": { "const": "released" }
            }
          },
          "summary": { "type": "object" }
        },
        "required": ["assignment", "result", "summary"]
      }
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 14/9/2025

**Tester**: Weiran

**Actual Output**:

```json
{
    "success": false,
    "code": "You weren't assessed for this assignment.",
    "data": "423"
}
```

**Result**: Fail.

**Notes**: The `subject_type` can never be `Student`, thus the result was always empty, then an error was pumped.