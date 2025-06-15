# OAS Backend API Documentation

## Overview

This document provides comprehensive documentation for the OAS (Oral Assessment System) backend API. The API is built using Spring Boot and follows RESTful principles.

## Base URL

```
http://localhost:8081/api
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Most endpoints require a valid JWT token in the Authorization header.

### Authentication Endpoints

#### Login

Authenticates a user and returns access and refresh tokens.

- **URL**: `/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "code": "0",
      "result": {
        "userId": 1,
        "username": "string",
        "role": "ROLE_ADMIN",
        "accessToken": "string",
        "refreshToken": "string",
        "tokenType": "Bearer",
        "expiresIn": 3600
      }
    }
    ```

#### Refresh Token

Refreshes an expired access token using a valid refresh token.

- **URL**: `/token/refresh`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "code": "0",
      "result": {
        "accessToken": "string",
        "refreshToken": "string",
        "tokenType": "Bearer",
        "expiresIn": 3600
      }
    }
    ```

#### Register

Registers a student account using a token received via email.

- **URL**: `/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "token": "string",
    "password": "string"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "code": "0"
    }
    ```

## CSV Import/Export

### CSV Endpoints

#### Preview CSV Import

Previews the data from a CSV file before importing.

- **URL**: `/api/csv/preview`
- **Method**: `POST`
- **Auth Required**: Yes (Admin)
- **Content-Type**: `multipart/form-data`
- **Request Parameters**:
  - `file`: CSV file to preview
  - `type`: Type of CSV data (`student` or `group`)
- **Success Response**:
  - **Code**: 200
  - **Content for Student CSV**:
    ```json
    {
      "success": true,
      "code": "0",
      "result": {
        "newStudents": [
          {
            "student": "John Doe",
            "id": "12345",
            "sisUserId": "jdoe",
            "sisLoginId": "jdoe@example.com",
            "section": "Section A",
            "studentId": "12345"
          }
        ],
        "existingStudents": [],
        "totalCount": 1,
        "newCount": 1,
        "existingCount": 0
      }
    }
    ```
  - **Content for Group CSV**:
    ```json
    {
      "success": true,
      "code": "0",
      "result": {
        "newStudentRecords": [
          {
            "name": "John Doe",
            "canvasUserId": "12345",
            "userId": "jdoe",
            "loginId": "jdoe@example.com",
            "sections": "Section A",
            "groupName": "Group 1",
            "canvasGroupId": "G1",
            "groupId": "1"
          }
        ],
        "existingStudentRecords": [],
        "totalCount": 1,
        "newCount": 1,
        "existingCount": 0,
        "groupCount": 1
      }
    }
    ```

#### Import CSV

Imports data from a CSV file.

- **URL**: `/api/csv/import`
- **Method**: `POST`
- **Auth Required**: Yes (Admin)
- **Content-Type**: `multipart/form-data`
- **Request Parameters**:
  - `file`: CSV file to import
  - `type`: Type of CSV data (`student` or `group`)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "code": "0",
      "result": {
        "totalImported": 10,
        "newRecords": 8,
        "updatedRecords": 2
      }
    }
    ```

## Error Handling

The API uses consistent error responses across all endpoints.

### Error Response Format

```json
{
  "success": false,
  "code": "error_code",
  "message": "Error message describing the issue"
}
```

### Common Error Codes

| Code   | Description                                             |
| ------ | ------------------------------------------------------- |
| "401"  | Unauthorized access                                     |
| "404"  | Resource not found                                      |
| "500"  | Internal server error                                   |
| "400"  | Bad request                                             |
| "1001" | Invalid parameters                                      |
| "1002" | Authentication failed                                   |
| "1003" | Operation not permitted                                 |
| "1004" | Account is disabled                                     |
| "1005" | Resource already exists                                 |
| "2001" | Booking validation failed                               |
| "2002" | CSV read failed                                         |
| "2003" | CSV write failed                                        |
| "2004" | User not found                                          |
| "2005" | Invalid CSV type                                        |
| "3001" | Invalid username or password                            |
| "3002" | Account is locked due to multiple failed login attempts |
| "3003" | Account has been disabled                               |
| "3004" | Account has expired                                     |
| "3005" | User has insufficient privileges for this operation     |
| "3006" | Invalid or expired authentication token                 |
| "3007" | Authentication token is missing                         |

## User Roles

The system supports the following user roles:

1. **SUPER_ADMIN**: Super administrator with system-wide access
2. **ADMIN**: Course administrator
3. **EXAMINER**: Assessment examiner
4. **STUDENT**: Student user

## Data Models

### User

```json
{
  "userId": 1,
  "userName": "string",
  "status": "0",
  "createTime": "2025-01-01T00:00:00Z",
  "creator": 1,
  "updateTime": "2025-01-01T00:00:00Z",
  "updater": 1
}
```

### Student

```json
{
  "userId": 1,
  "token": "string",
  "studentNumber": "string",
  "sisUserId": "string"
}
```

### Group

```json
{
  "groupId": 1,
  "groupName": "string",
  "canvasGroupId": "string",
  "createTime": "2025-01-01T00:00:00Z",
  "creator": 1
}
```

### Role

```json
{
  "roleId": 1,
  "roleName": "string",
  "roleKey": "string"
}
```

## Request Tracing

The API includes a request tracing system that assigns a unique trace ID to each request. This trace ID is included in the response headers as `X-Trace-ID` and can be used for debugging and monitoring purposes.

### Trace ID Header

The trace ID can be included in requests to maintain correlation across service calls:

```
X-Trace-ID: abc123
```

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) with the following configuration:

- **Allowed Origins**: Configurable (default: `http://localhost:3000`, `http://localhost:3001`, `http://127.0.0.1:3000`, `http://127.0.0.1:3001`)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD
- **Allowed Headers**: Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers, X-Trace-ID, X-CSRF-TOKEN
- **Exposed Headers**: Authorization, Content-Disposition, X-Trace-ID, Access-Control-Allow-Origin, Access-Control-Allow-Credentials
- **Max Age**: 3600 seconds
- **Allow Credentials**: true

## Deployment Information

The API provides a deployment timestamp endpoint for monitoring:

- **URL**: `/deploy-time`
- **Method**: `GET`
- **Auth Required**: No
- **Success Response**:
  - **Code**: 200
  - **Content**: `"2025-06-15T10:30:45.123Z"`

## Security Features

The API implements several security features:

1. **JWT Authentication**: Secure token-based authentication
2. **Password Encryption**: Passwords are encrypted using BCrypt
3. **Role-Based Access Control**: Endpoints are secured based on user roles
4. **XSS Protection**: Input is sanitized to prevent cross-site scripting attacks
5. **Request Logging**: All requests are logged for audit purposes
6. **CORS Protection**: Strict CORS policy to prevent unauthorized cross-origin requests
7. **Duplicate Submission Prevention**: Prevents duplicate form submissions

## API Versioning

The current API version is v1, which is the default and does not require explicit versioning in the URL.

## Rate Limiting

There is currently no rate limiting implemented on the API.

## Pagination

For endpoints that return lists of items, pagination is supported with the following query parameters:

- `page`: Page number (0-based)
- `size`: Number of items per page
- `sort`: Sort field and direction (e.g., `name,asc`)

## Future Endpoints

The following endpoints are planned for future implementation:

1. User management endpoints
2. Assessment configuration endpoints
3. Booking system endpoints
4. Assessment rubric endpoints
5. Feedback and results endpoints

## Support

For API support, please contact the development team at [yunpengx@student.unimelb.edu.au](mailto:yunpengx@student.unimelb.edu.au).
