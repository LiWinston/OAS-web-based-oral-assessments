# API Test Documentation

## Test Environment

| Tester  | Processor          | RAM   | Java Edition                            | Postman Edition |
| ------- | ------------------ | ----- | --------------------------------------- | --------------- |
| Weiran  | Apple M1 Pro       | 32 GB | corretto-1.8 (java version "1.8.0_462") | 11.58.4         |
| Benyuan | AMD Ryzen 9 5900HX | 32 GB | corretto-1.8 (java version "1.8.0_422") | 11.59.0         |





## Epic 5

### 8.  /api/admin/assignments/{{assignmentId}}/examiners

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

**Execution Date**: 31/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "examiners": [
            {
                "id": 1,
                "name": "test",
                "email": "p@x.com",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 2,
                "name": "alice",
                "email": "alice@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 3,
                "name": "bob",
                "email": "bob@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 4,
                "name": "carol",
                "email": "carol@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 5,
                "name": "dave",
                "email": "dave@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 6,
                "name": "eve",
                "email": "eve@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 7,
                "name": "alice1",
                "email": "alice1@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 8,
                "name": "bob2",
                "email": "bob2@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 9,
                "name": "carol2",
                "email": "carol2@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 10,
                "name": "dave2",
                "email": "dave2@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 11,
                "name": "eve2",
                "email": "eve2@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 12,
                "name": "alice3",
                "email": "alice3@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 13,
                "name": "bob3",
                "email": "bob3@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 14,
                "name": "carol3",
                "email": "carol3@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 15,
                "name": "dave3",
                "email": "dave3@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 16,
                "name": "eve3",
                "email": "eve3@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 17,
                "name": "alice4",
                "email": "alice4@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 18,
                "name": "bob4",
                "email": "bob4@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 19,
                "name": "carol4",
                "email": "carol4@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 20,
                "name": "dave4",
                "email": "dave4@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 21,
                "name": "eve4",
                "email": "eve4@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 35,
                "name": "testadmin1",
                "email": "test@unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 48,
                "name": "testsuper",
                "email": "superadmin@example.com",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 49,
                "name": "1",
                "email": "yanqings1@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 55,
                "name": "lhc",
                "email": "jsmith@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 61,
                "name": "Haocheng Li",
                "email": "haochengl4@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 62,
                "name": "aaa",
                "email": "bob34@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 66,
                "name": "wqseeqweqewq",
                "email": "bob433@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 67,
                "name": "qweqeqweqweqweq",
                "email": "bob4wq@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 68,
                "name": "Yun Chen",
                "email": "yunchen6@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 70,
                "name": "adminYUN",
                "email": "yunchen@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 72,
                "name": "Nemo Xiong",
                "email": "yunpeng.xiong@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 73,
                "name": "Ian chi ",
                "email": "yungenc@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 74,
                "name": "Nemo Xiong",
                "email": "yunpengx@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 75,
                "name": "benyuanw",
                "email": "benyuanw@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 76,
                "name": "Dr. Jane Smith",
                "email": "new.jane.smith@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 77,
                "name": "Minimal Admin",
                "email": "minimal.admin@unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 80,
                "name": "No Email Admin",
                "email": "null@unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 81,
                "name": "qweqeqweqweqweq222",
                "email": "bob423131231wq@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 82,
                "name": "qweqeqweqweqweqqweqew45r345",
                "email": "awsaqweqweq31231wq@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 83,
                "name": "31313131322s",
                "email": "122231wq@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 100,
                "name": "Zhang",
                "email": "Zhang@student.unimelb.edu.au",
                "maxSessions": 0,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 101,
                "name": "Li",
                "email": "Li@student.unimelb.edu.au",
                "maxSessions": 0,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 102,
                "name": "Wang",
                "email": "Wang@student.unimelb.edu.au",
                "maxSessions": 0,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 103,
                "name": "Zhao",
                "email": "Zhao@student.unimelb.edu.au",
                "maxSessions": 0,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 104,
                "name": "Liu",
                "email": "Liu@student.unimelb.edu.au",
                "maxSessions": 0,
                "currentAssignments": 0,
                "availability": "available"
            }
        ]
    }
}
```

**Result**:

Fail.

**Notes**: 

- The API currently returns **all users** instead of only examiners assigned to the given `assignmentId`. This is inconsistent with the expected behavior — the endpoint should filter and return only examiners for the specified assignment.

###### Test 2

**Execution Date**: 1/9/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "examiners": [
            {
                "id": 4,
                "name": "carol",
                "email": "carol@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 5,
                "name": "dave",
                "email": "dave@student.unimelb.edu.au",
                "maxSessions": 40,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 100,
                "name": "Zhang",
                "email": "Zhang@student.unimelb.edu.au",
                "maxSessions": 15,
                "currentAssignments": 2,
                "availability": "available"
            },
            {
                "id": 101,
                "name": "Li",
                "email": "Li@student.unimelb.edu.au",
                "maxSessions": 10,
                "currentAssignments": 2,
                "availability": "available"
            },
            {
                "id": 102,
                "name": "Wang",
                "email": "Wang@student.unimelb.edu.au",
                "maxSessions": 5,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 103,
                "name": "Zhao",
                "email": "Zhao@student.unimelb.edu.au",
                "maxSessions": 10,
                "currentAssignments": 0,
                "availability": "available"
            },
            {
                "id": 104,
                "name": "Liu",
                "email": "Liu@student.unimelb.edu.au",
                "maxSessions": 10,
                "currentAssignments": 0,
                "availability": "available"
            }
        ]
    }
}
```

**Result**:

Fail.

**Notes**: 

- The API currently returns **all examiners** instead of only examiners assigned to the given `assignmentId`. This is inconsistent with the expected behavior — the endpoint should filter and return only examiners for the specified assignment.

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

### 9.  /api/admin/assignments/{assignmentId}/examiners/session-limits

#### Test Case 1: 

##### Description

Verify that the system successfully updates examiner session limits for a given assignment when valid data is provided by a Course Admin.

##### Pre-conditions

The user is authenticated as a valid **Course Admin** .

The `assignmentId` exists in the system.

The examiners referenced in the request body exist and are assigned to the given assignment.

##### Input

 `PUT {{baseUrl}}/admin/assignments/{{assignmentId}}/examiners/session-limits`

**Body**:

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

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "message": "Session limits updated for 2 examiners"
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

Verify that the system rejects the request with a `400 Bad Request` error when an invalid examinerId (not existing in the system) is provided.

##### Pre-conditions

The user is authenticated as a valid **Course Admin** .

The `assignmentId` exists in the system.

At least one examinerId in the request body does not exist.

##### Input

**Request**:
 `PUT {{baseUrl}}/admin/assignments/{{assignmentId}}/examiners/session-limits`

**Body**:

```json
{
  "examinerLimits": [
    {
      "examinerId": 999, 
      "maxSessions": 30
    }
  ]
}
```

##### Expected Output

HTTP status code: `400 Bad Request`

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Invalid examinerId",
  "details": {
    "invalidId": 999
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "timestamp": "2025-08-31 22:29:45",
    "status": 500,
    "error": "Internal Server Error",
    "path": "/api/admin/assignments/1/examiners/session-limits"
}
```

**Result**:

Fail.

**Notes**: 

- When testing with a non-existent `examinerId`, the API returned `500 Internal Server Error`. Expected was `400 Bad Request` with a clear validation error.

#### 

#### Test Case 3:

##### Description

Verify that the system rejects the request with a `400 Bad Request` error when an invalid `maxSessions` value (negative number) is provided.

##### Pre-conditions

The user is authenticated as a valid **Course Admin** .

The `assignmentId` exists in the system.

The examinerId exists, but `maxSessions` value is invalid (negative).

##### Input

**Request**:
 `PUT {{baseUrl}}/admin/assignments/{{assignmentId}}/examiners/session-limits`

**Body**:

```json
{
  "examinerLimits": [
    {
      "examinerId": 103,
      "maxSessions": 0
    }
  ]
}
```

##### Expected Output

HTTP status code: `400 Bad Request`

```json
{
    "success": false,
    "code": "1001",
    "data": "Invalid parameters"
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 1/9/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": "Session limits updated for 2 examiners"
}
```

**Result**:

Fail.

**Notes**: 

- When testing with invalid input (`maxSessions = 0`), the API returned HTTP `200 OK` with `"success": true` and a success message. Expected was an error response with `"success": false`, error code `1001`, and `"data": "Invalid parameters"`. This indicates that input validation is missing or not enforced on `maxSessions` values.

 

### 10.  /api/admin/assignments/{assignmentId}/timeslots/{{timeSlotId}}/examiners

#### Test Case 1: 

##### Description

Verify that the system successfully assigns examiners to a specific time slot when a valid Course Admin , assignmentId, timeSlotId, and examinerIds are provided.

##### Pre-conditions

The user is authenticated as a valid **Course Admin** .

The `assignmentId` exists in the system.

The `timeSlotId` exists under the given assignment.

The examiners to be assigned exist in the system and have available capacity.

##### Input

##### Input

 `PUT {{baseUrl}}/admin/assignments/{{assignmentId}}/timeslots/{{timeSlotId}}/examiners`

**Body**:

```json
{
  "examinerIds": [100]
}
```

##### Expected Output

HTTP status code: `200 OK`

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

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Benyuan

**Actual Output**:

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

- No implementation.

###### Test 2

**Execution Date**: 31/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "id": 11,
        "date": "2025-10-15",
        "startTime": "09:00:00",
        "endTime": "10:00:00",
        "venueId": 10,
        "requiredExaminers": 1,
        "sessionCount": 2,
        "status": "full",
        "assignedExaminers": [
            {
                "id": 100,
                "name": "Zhang",
                "email": "Zhang@student.unimelb.edu.au",
                "maxSessions": null,
                "currentAssignments": null,
                "availability": null
            }
        ],
        "sessions": [
            {
                "id": 55,
                "startTime": "09:00:00",
                "endTime": "09:25:00",
                "status": "booked",
                "bookedBy": null,
                "sessionNumber": 1
            },
            {
                "id": 56,
                "startTime": "09:30:00",
                "endTime": "09:55:00",
                "status": "available",
                "bookedBy": null,
                "sessionNumber": 2
            }
        ],
        "bookedSessions": 0,
        "createdAt": "2025-08-31T20:14:54",
        "lastModified": "2025-09-01T03:08:14"
    }
}
```

**Result**:

Pass.

**Notes**: 

- The API returned the expected response. The status code and response body matched the documented specification, indicating the system handled the request as intended.

###### Test 3

**Execution Date**: 1/9/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "id": 11,
        "date": "2025-10-15",
        "startTime": "09:00:00",
        "endTime": "10:00:00",
        "venueId": 10,
        "requiredExaminers": 1,
        "sessionCount": 2,
        "status": "full",
        "assignedExaminers": [
            {
                "id": 100,
                "name": "Zhang",
                "email": "Zhang@student.unimelb.edu.au",
                "maxSessions": null,
                "currentAssignments": null,
                "availability": null
            },
            {
                "id": 104,
                "name": "Liu",
                "email": "Liu@student.unimelb.edu.au",
                "maxSessions": null,
                "currentAssignments": null,
                "availability": null
            }
        ],
        "sessions": [
            {
                "id": 55,
                "startTime": "09:00:00",
                "endTime": "09:25:00",
                "status": "booked",
                "bookedBy": null,
                "sessionNumber": 1
            },
            {
                "id": 56,
                "startTime": "09:30:00",
                "endTime": "09:55:00",
                "status": "available",
                "bookedBy": null,
                "sessionNumber": 2
            }
        ],
        "bookedSessions": 1,
        "createdAt": "2025-08-31T20:14:54",
        "lastModified": "2025-09-01T03:08:14"
    }
}
```

**Result**:

Fail.

**Notes**: 

- The API returned `200 OK` with two examiners assigned to the slot, but the expected behavior was different:
  - The slot requires only **1 examiner**, yet a **second examiner was successfully assigned**, which violates the `requiredExaminers` rule.
  - The schedule had already been **released**, so no further modifications to time slots should have been allowed.



### 11.  /api/admin/assignments/{assignmentId}/schedule/status

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

###### Test 2

**Execution Date**: 31/8/2025

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
        "totalTimeSlots": 2,
        "readyForRelease": true,
        "issues": [],
        "summary": {
            "totalSessions": 4,
            "fullyStaffedSlots": 2,
            "unstaffedSlots": 0,
            "totalExaminers": 2
        }
    }
}
```

**Result**:

Pass.

**Notes**: 

- The system successfully returned the schedule status with `200 OK`and correct data.

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

### 12.  /api/admin/assignments/{assignmentId}/schedule/release

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

**Execution Date**: 31/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "releasedAt": "2025-08-31T21:13:28.131",
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

- notificationsSent is mocked, need implementation.

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

### 13.  /api/admin/assignments/{assignmentId}/calendar?month=2025-10

#### Test Case 1: 

##### Description

Verify that the system successfully returns aggregated calendar data for the given month (`2025-10`) when a valid Course Admin and assignmentId are provided.

##### Pre-conditions

The user is authenticated as a valid **Course Admin**.

The `assignmentId` exists in the system.

Time slots have been defined in October 2025 for the given assignment.

##### Input

 `GET /admin/assignments/{{assignmentId}}/calendar?month=2025-10`

**Body**:

```json

```

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "data": {
    "month": "2025-10",
    "dates": {
      "2025-10-05": {
        "timeSlots": 2,
        "status": "full",
        "sessions": 6
      },
      "2025-10-12": {
        "timeSlots": 1,
        "status": "partial",
        "sessions": 3
      },
      "2025-10-20": {
        "timeSlots": 0,
        "status": "empty",
        "sessions": 0
      }
    }
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "month": "2025-10",
        "dates": {
            "2025-10-15": {
                "timeSlots": 1,
                "status": "full",
                "sessions": 2
            }
        }
    }
}
```

**Result**:

Pass

**Notes**: 

- The API returned HTTP `200 OK` with correct calendar data for the requested month. The response includes `month` and `dates` fields.



### 19./api/students/{{studentId}}/assignments?status=all&pageNum=0&pageSize=10&sort=date_asc

#### Test Case 1:

##### Description

Verify that the system successfully returns the list of assignments for the given student, including both bookable and booked assignments, when valid input parameters and a valid student are provided.

##### Pre-conditions

The user is authenticated as a valid **Student** .

The `studentId` exists in the system.

The student has at least one assignment associated with their courses.

##### Input

**Request**:
 `GET {{baseUrl}}/api/students/{{studentId}}/assignments?status=all&pageNum=0&pageSize=10&sort=date_asc`

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "code": "200",
  "data": {
    "pageNum": 0,
    "pageSize": 10,
    "total": 1,
    "data": [
      {
        "assignmentId": 101,
        "assignmentName": "Oral Exam 1",
        "courseCode": "COMP90082",
        "assessmentType": "GROUP",
        "sessionDurationMinutes": 30,
        "booking": { "hasActiveBooking": false },
        "availability": {
          "released": true,
          "availableSessions": 5,
          "earliestSession": "2025-04-14T09:00:00+10:00",
          "latestSession": "2025-04-16T15:00:00+10:00",
          "reschedulingEnabled": true,
          "bookingDeadline": "2025-04-12T17:00:00+10:00",
          "lockoutEnabled": true,
          "lockoutWindowHours": 24,
          "pollingHintSeconds": 30
        }
      }
    ]
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "pageNum": 0,
        "pageSize": 10,
        "total": 1,
        "data": [
            {
                "assignmentId": 1,
                "assignmentName": "Oral Presentation Test",
                "courseCode": "SWEN90017",
                "assessmentType": "INDIVIDUAL",
                "sessionDurationMinutes": 30,
                "booking": {
                    "hasActiveBooking": false
                },
                "availability": {
                    "released": true,
                    "availableSessions": 4,
                    "earliestSession": "2025-04-16T14:00:00",
                    "latestSession": "2025-10-15T10:00:00",
                    "reschedulingEnabled": true,
                    "bookingDeadline": "2025-08-23T16:10:41",
                    "lockoutEnabled": true,
                    "lockoutWindowHours": 24,
                    "pollingHintSeconds": 30
                }
            }
        ]
    }
}
```

**Result**:

Pass.

**Notes**: 

- The API returned HTTP `200 OK` with correct assignment list data. The response includes pagination fields (`pageNum`, `pageSize`, `total`) and the assignment details with `availability` and `booking` status.

### 20./api/assignments/{assignmentId}/availability?studentId={studentId}

#### Test Case 1:

##### Description

Verify that the system successfully returns the availability summary of an assignment when the user is a valid student.

##### Pre-conditions

The user is authenticated as a valid **Student** .

The `assignmentId` exists in the system.

The `studentId` exists in the system.

The assignment has at least one time slot configured.

##### Input

**Request**:
 `GET {{baseUrl}}/api/assignments/{{assignmentId}}/availability?studentId={{studentId}}`

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "code": "200",
  "data": {
    "assignmentId": 101,
    "assignmentName": "Oral Exam 1",
    "courseCode": "COMP90082",
    "assessmentType": "GROUP",
    "summary": {
      "totalTimeSlots": 6,
      "availableSessions": 4,
      "earliestSession": "2025-04-14T09:00:00+10:00",
      "latestSession": "2025-04-16T15:00:00+10:00"
    },
    "policies": {
      "bookingDeadline": "2025-04-12T17:00:00+10:00",
      "reschedulingEnabled": true,
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

```

**Result**:



**Notes**: 

- 

### 21./api/assignments/{assignmentId}/sessions?studentId={studentId}&date=2025-04-14&includeReasons=true

#### Test Case 1:

##### Description

Verify that the system successfully returns the list of sessions for a given assignment and date when the user is a valid student.

##### Pre-conditions

The user is a valid student.

The `assignmentId` exists in the system.

The `studentId` exists in the system.

There are sessions defined for the given date (`2025-04-14`).

##### Input

**Request**:
 `GET {{baseUrl}}/api/assignments/{{assignmentId}}/sessions?studentId={{studentId}}&date=2025-04-14&includeReasons=true`

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "code": "200",
  "data": {
    "assignment": {
      "assignmentId": 101,
      "assignmentName": "Oral Exam 1",
      "courseCode": "COMP90082",
      "assessmentType": "GROUP"
    },
    "timeSlots": [
      {
        "slotId": 5001,
        "start": "2025-04-14T10:00:00+10:00",
        "end": "2025-04-14T11:00:00+10:00",
        "venue": {
          "venueId": 31,
          "name": "Engineering",
          "building": "ENG",
          "room": "405"
        },
        "sessions": [
          {
            "sessionId": 90011,
            "sessionNumber": 1,
            "status": "available",
            "bookedBy": null,
            "canBook": true
          },
          {
            "sessionId": 90012,
            "sessionNumber": 2,
            "status": "full",
            "bookedBy": "studentGroup42",
            "canBook": false,
            "reason": "SESSION_FULL"
          }
        ]
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

### 22./api/assignments/{assignmentId}/bookings

#### Test Case 1:

##### Description

Verify that the system successfully creates a booking for a student when valid session information is provided.

##### Pre-conditions

The user is a valid student.

The `assignmentId` exists in the system.

The `studentId` exists in the system.

The target session is available (not full, within booking deadline, no lockout window conflict).

The student (or group) does not already have an active booking for this assignment.

##### Input

**Request**:
 `POST {{baseUrl}}/api/assignments/{{assignmentId}}/bookings`

**Body**:

```json
{
  "studentId": 105,
  "sessionId": 55,
  "groupId": 11
}
```

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "code": "200",
  "data": {
    "bookingId": 70001,
    "assignmentId": 101,
    "studentId": 2001,
    "groupId": 501,
    "sessionId": 90011,
    "status": "CONFIRMED",
    "createdAt": "2025-08-29T10:30:00+10:00"
  }
}
```

##### **Execution History**

###### Test 1

**Execution Date**: 31/8/2025

**Tester**: Benyuan

**Actual Output**:

```json
{
    "success": true,
    "code": "200",
    "data": {
        "bookingId": 55,
        "assignmentId": 1,
        "entity": {
            "type": "individual",
            "groupId": 11
        },
        "session": {
            "sessionId": 55,
            "slotId": 11,
            "start": "2025-10-15T09:00",
            "end": "2025-10-15T09:25",
            "timezone": "Australia/Melbourne",
            "venue": null
        },
        "notifications": {
            "emailQueued": true,
            "icsUrl": "/api/calendar/booking/55.ics"
        }
    }
}
```

**Result**:



**Notes**: 

- 

### 23./api/students/{studentId}/assignments/{assignmentId}/booking

#### Test Case 1:

##### Description

Verify that the system successfully returns the current booking details for a student in a given assignment when the user is a valid student.

##### Pre-conditions

The user is a valid student.

The `studentId` exists in the system.

The `assignmentId` exists in the system.

The student (or their group) has already made a booking for the assignment.

##### Input

**Request**:
 `GET {{baseUrl}}/api/students/{{studentId}}/assignments/{{assignmentId}}/booking`

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "code": "200",
  "data": {
    "hasActiveBooking": true,
    "bookingId": 70001,
    "studentId": 2001,
    "groupId": 501,
    "assignmentId": 101,
    "session": {
      "sessionId": 90011,
      "slotId": 5001,
      "start": "2025-04-14T10:00:00+10:00",
      "end": "2025-04-14T10:30:00+10:00",
      "venue": {
        "venueId": 31,
        "name": "Engineering",
        "building": "ENG",
        "room": "405"
      }
    },
    "status": "CONFIRMED",
    "createdAt": "2025-08-29T10:30:00+10:00"
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

### 24./api/assignments/{assignmentId}/bookings/{bookingId}/reschedule

#### Test Case 1:

##### Description

Verify that the system successfully reschedules an existing booking to a new session when the user is a valid student and the target session is available.

##### Pre-conditions

The user is a valid student.

The `assignmentId` exists in the system.

The `bookingId` exists and belongs to the given student (or their group).

The target session exists, is available, and does not conflict with existing bookings.

The booking deadline has not passed and the lockout window does not apply.

##### Input

**Request**:
 `POST {{baseUrl}}/api/assignments/{{assignmentId}}/bookings/{{bookingId}}/reschedule`

**Body**:

```json
{
  "studentId": 2001,
  "targetSessionId": 90021
}
```

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "code": "200",
  "data": {
    "bookingId": 70001,
    "assignmentId": 101,
    "studentId": 2001,
    "groupId": 501,
    "fromSessionId": 90011,
    "toSessionId": 90021,
    "status": "RESCHEDULED",
    "rescheduledAt": "2025-08-29T12:00:00+10:00"
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

### 25./api/assignments/{assignmentId}/bookings/{bookingId}?studentId={studentId}

#### Test Case 1:

##### Description

Verify that the system successfully cancels an existing booking when the user is a valid student and provides a valid bookingId.

##### Pre-conditions

The user is a valid student.

The `assignmentId` exists in the system.

The `bookingId` exists and belongs to the given student (or their group).

The booking is in a cancellable state (before the booking deadline, outside lockout window, and session not yet started).

##### Input

**Request**:
 `DELETE {{baseUrl}}/api/assignments/{{assignmentId}}/bookings/{{bookingId}}?studentId={{studentId}}`

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "code": "200",
  "data": {
    "bookingId": 70001,
    "assignmentId": 101,
    "studentId": 2001,
    "status": "CANCELLED",
    "cancelledAt": "2025-08-29T14:00:00+10:00"
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

### 26./api/students/{studentId}/assignments/{assignmentId}/group

#### Test Case 1:

##### Description

Verify that the system successfully returns the group information for a given student in an assignment when the user is a valid student.

##### Pre-conditions

The user is a valid student.

The `studentId` exists in the system.

The `assignmentId` exists in the system.

The student is part of a group for this assignment.

##### Input

**Request**:
 `GET {{baseUrl}}/api/students/{{studentId}}/assignments/{{assignmentId}}/group`

##### Expected Output

HTTP status code: `200 OK`

```json
{
  "success": true,
  "code": "200",
  "data": {
    "groupId": 501,
    "groupName": "Team Alpha",
    "assignmentId": 101,
    "members": [
      {
        "studentId": 2001,
        "name": "Alice Wang",
        "email": "alice@student.unimelb.edu.au"
      },
      {
        "studentId": 2002,
        "name": "Bob Zhang",
        "email": "bob@student.unimelb.edu.au"
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
