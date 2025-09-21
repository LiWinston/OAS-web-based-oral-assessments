## API
`GET {{baseUrl}}/api/students/{{studentId}}/assignments?status=all&pageNum=0&pageSize=10&sort=date_asc`

### Issue 1: `sessionDurationMinutes` mismatch
The response contains `"sessionDurationMinutes": 30`, but the **session config** table shows 25 minutes.  
Expected: **25 minutes**.

---

### Issue 2: `booking.hasActiveBooking` logic error
Response:
```json
"booking": { 
    "hasActiveBooking": false
}
```
This is incorrect.  
Correct logic: As long as the `assignment.status` field is `released`, the value should be `true`.

---

### Issue 3: `availability` data source error
Response:
```json
"availability": { 
    "released": true,
    "availableSessions": 2,
    "earliestSession": "2025-10-15T09:00:00",
    "latestSession": "2025-10-16T15:00:00",
    "reschedulingEnabled": true,
    "bookingDeadline": "2025-10-30T16:10:41",
    "lockoutEnabled": true,
    "lockoutWindowHours": 24,
    "pollingHintSeconds": 30
}
```
Still reading from the **time slot table** instead of the **slot session table**, causing incorrect data.

---

## API
`GET {{baseUrl}}/api/assignments/{{assignmentId}}/availability?studentId={{studentId}}`

### Issue 1: `availability` data source error
Response example:
```json
"bookingDeadline": "2025-10-22T16:10:41",
"lockoutEnabled": true,
"lockoutWindowHours": 24,
"summary": {
    "totalSlots": 2,
    "totalSessions": 4,
    "availableSessions": 2,
    "daysWithAvailability": [
        "2025-10-16",
        "2025-10-15"
    ]
}
```
Problem: Still reading from **time slot table** instead of **slot session**.

---

## API
`GET {{baseUrl}}/api/assignments/{{assignmentId}}/sessions?studentId={{studentId}}&date=2025-10-01&includeReasons=true`

### Issue 1: `timeSlots` field data source error
Response example:
```json
{
    "success": true,
    "code": "200",
    "data": {
        "assignment": {
            "assignmentId": 1,
            "assignmentName": "Oral Presentation Test",
            "assessmentType": "group"
        },
        "calendar": {
            "date": "2025-10-01"
        },
        "timeSlots": []
    }
}
```
Problem: Still reading from **time slot table** instead of **slot session**.  
Also, stop using `timeSlots`; use `sessions` instead.
