## Save / Submit Draft Assessment

**API**
`POST {{baseUrl}}/api/examiner/assessments/draft/save`  
`POST {{baseUrl}}/api/examiner/assessments/submit`

### Issue 1: Criterion not validated
It is possible to save a draft without selecting all criteria. The database also does not auto-fill default values.

---

### Issue 2: `selectedLevel` not validated
The fields inside `selectedLevel` (`description`, `startPoint`, `endPoint`) can be arbitrarily filled. No validation against metadata.

---

### Issue 3: `scaleType` abnormal
When `scaleType = "descriptive"`, score calculation behaves incorrectly. Changing `inputPoints` makes no difference.

Example payload:
```json
{
  "assignmentId": 1,
  "sessionId": 623,
  "subjectType": "group",
  "subjectId": 1,
  "overallFeedback": "Good work",
  "adminNote": "Needs review",
  "scores": [
    {
      "description": "Communication Skills1",
      "scaleType": "points",
      "weight": 50,
      "inputPoints": 70,
      "selectedLevel": {
        "description": "1",
        "startPoint": 70.0,
        "endPoint": 84.0
      },
      "comment": "Well done"
    },
    {
      "description": "New Criterion1",
      "scaleType": "descriptive",
      "weight": 50,
      "inputPoints": 50,
      "selectedLevel": {
        "description": "1",
        "startPoint": 0.0,
        "endPoint": 9.0
      },
      "comment": "Pass"
    }
  ]
}
```

---

## Get Assessments Summary

**API**
`GET {{baseUrl}}/api/examiner/assessments/summary`

### Issue 1: Abnormal response data
The `"byAssignment"` field in the response is `null`.

Response:
```json
{
    "success": true,
    "code": "200",
    "data": {
        "draftCount": 0,
        "submittedCount": 1,
        "byAssignment": null
    }
}
```
