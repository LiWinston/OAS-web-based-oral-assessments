# Admin Mark Consolidation Report — Proposed API Additions

## 1. Context

The redesigned `/admin/reports/mark-consolidation` page requires richer, pre-aggregated data to surface readiness metrics, highlight at-risk assessments, and visualise examiner progress trends. Existing endpoints (`GET /assessments`, `GET /sessions`) provide row-level data but do not expose assignment-level summaries or time-based analytics.  

This proposal introduces lightweight, read-only endpoints under the existing admin results namespace. The payloads are designed to be cache-friendly and to reuse the current authorization model (Course Admin JWT).

---

## 2. Endpoint Summary

| Endpoint | Purpose |
| -------- | ------- |
| `GET /mark-consolidation/overview` | Aggregate snapshot for hero + summary strip (counts, ratios, freshness). |
| `GET /mark-consolidation/trends` | Time-series data for examiner submissions & releases. |
| `GET /mark-consolidation/alerts` | Curated list of participants requiring urgent follow-up (reopened, overdue). |

All endpoints sit under:  
`/api/admin/subjects/{subjectId}/assignments/{assignmentId}/mark-consolidation`

---

## 3. Shared Behaviour

- **Auth**: `Authorization: Bearer <JWT>` (Course Admin scope).  
- **Response wrapper**: `{ success: boolean, code: string, data: <payload> }`  
- **Errors**: align with existing admin results services (`SUBJECT_NOT_FOUND`, `ASSIGNMENT_NOT_FOUND`, `FORBIDDEN`).  
- **Time zone**: ISO-8601 with offset; when aggregating by day, normalise to assignment default timezone or `Australia/Melbourne` as fallback.  
- **Caching**: mark responses cacheable for up to 60s unless mutation occurs (manual override, examiner submission, release).  

---

## 4. `GET /mark-consolidation/overview`

> Aggregated snapshot used for the hero bar, summary strip, and insight rail.

### Query Parameters
| Name | Type | Required | Notes |
| ---- | ---- | -------- | ----- |
| `sessionId` | number | no | Filter metrics to a specific session. |
| `includeProgressBreakdown` | boolean | no (default `true`) | Toggle `progress` structure (allows lightweight polling). |

### Response (`data`)
```jsonc
{
  "assignment": {
    "id": 101,
    "name": "Group Project Viva",
    "courseCode": "COMP20008",
    "courseName": "Elements of Data Processing"
  },
  "totals": {
    "participants": 128,
    "groups": 42,
    "individuals": 86
  },
  "progress": {
    "ready": 80,
    "needsAttention": 12,
    "awaiting": 36
  },
  "release": {
    "released": 54,
    "notReleased": 74,
    "lastReleasedAt": "2025-08-14T11:42:03+10:00"
  },
  "examinerSubmissions": {
    "total": 210,
    "submitted": 168,
    "draft": 22,
    "reopened": 6,
    "pending": 14,
    "submittedRatio": 0.8
  },
  "manualOverrides": {
    "count": 7,
    "lastUpdatedAt": "2025-08-14T09:12:55+10:00"
  },
  "freshness": {
    "lastActivityAt": "2025-08-14T12:15:30+10:00",
    "lastExaminerSubmissionAt": "2025-08-14T11:58:20+10:00"
  }
}
```

### Notes
- `progress` categories align with UI badges:  
  - `ready`: all examiners submitted, no reopen.  
  - `needsAttention`: at least one examiner reopened.  
  - `awaiting`: default when submissions are still pending.  
- `freshness.lastActivityAt` should be the max of manual override update, examiner submission, or release event.

---

## 5. `GET /mark-consolidation/trends`

> Drives trend visualisations (e.g., cumulative submissions, releases over time).

### Query Parameters
| Name | Type | Required | Notes |
| ---- | ---- | -------- | ----- |
| `rangeStart` | date (ISO) | no | Inclusive start date; defaults to 14 days prior to today. |
| `rangeEnd` | date (ISO) | no | Inclusive end date; defaults to today. |
| `interval` | enum | no | `day` (default) or `week`. |
| `sessionId` | number | no | Optional focus on a single session. |

### Response (`data`)
```jsonc
{
  "interval": "day",
  "timezone": "Australia/Melbourne",
  "series": [
    {
      "name": "Examiner submissions",
      "key": "submitted",
      "points": [
        { "bucket": "2025-08-01", "count": 12, "cumulative": 12 },
        { "bucket": "2025-08-02", "count": 18, "cumulative": 30 }
      ]
    },
    {
      "name": "Manual overrides",
      "key": "overrides",
      "points": [
        { "bucket": "2025-08-05", "count": 2, "cumulative": 2 }
      ]
    },
    {
      "name": "Reopened assessments",
      "key": "reopened",
      "points": [
        { "bucket": "2025-08-03", "count": 1, "cumulative": 1 }
      ]
    }
  ]
}
```

### Notes
- `points` should be present for each interval even when `count = 0` (UI plots zero baseline).  
- For `week` interval, `bucket` must be `YYYY-Www` (ISO week).  
- Back-end may compute cumulatives or leave to front-end if expensive; field is optional but recommended.

---

## 6. `GET /mark-consolidation/alerts`

> Supplies a concise list of participants needing attention for the insight rail.

### Query Parameters
| Name | Type | Required | Notes |
| ---- | ---- | -------- | ----- |
| `limit` | number | no | Default `10`, cap at `25`. |
| `sessionId` | number | no | Filter alerts to a specific session. |
| `types` | string | no | Comma-separated subset of alert categories (default all). |

### Alert Categories

| Type | Trigger |
| ---- | ------- |
| `REOPENED` | Any examiner status is `REOPENED`. |
| `OVERDUE` | Assigned examiners have not submitted after session end + configurable grace period. |
| `MISSING_EXAMINER` | No examiner assigned or no submissions at all. |
| `MANUAL_OVERRIDE_PENDING` | Manual override flagged for follow-up (e.g., missing release). |

### Response (`data`)
```jsonc
{
  "items": [
    {
      "participant": {
        "id": 3301,
        "type": "GROUP",
        "name": "W04 Tutorial Team 2",
        "session": {
          "id": 90045,
          "start": "2025-08-13T14:00:00+10:00",
          "end": "2025-08-13T14:30:00+10:00",
          "venueName": "Zoom"
        }
      },
      "alertType": "REOPENED",
      "message": "Examiner Dr Jones reopened on 13 Aug, waiting for resubmission.",
      "examinerSummary": {
        "total": 2,
        "submitted": 1,
        "reopened": 1,
        "pending": 0
      },
      "lastUpdatedAt": "2025-08-13T17:45:00+10:00"
    },
    {
      "participant": {
        "id": 200812,
        "type": "INDIVIDUAL",
        "name": "Nguyen, Kim",
        "session": {
          "id": 90047,
          "start": "2025-08-13T16:00:00+10:00",
          "end": "2025-08-13T16:30:00+10:00",
          "venueName": "PAR-379-B1-B113"
        }
      },
      "alertType": "OVERDUE",
      "message": "Awaiting submission from 1 examiner (overdue by 18h).",
      "examinerSummary": {
        "total": 2,
        "submitted": 1,
        "pending": 1
      },
      "lastUpdatedAt": "2025-08-14T08:10:00+10:00"
    }
  ]
}
```

### Notes
- `message` should be human-readable so the UI can display it directly.  
- Include `participant.session` for quick navigation and to let the UI deep-link to full result detail (`/admin/courses/.../results`).  
- Alerts should be ordered by severity, then most recent activity.

---

## 7. Security & Rate Limits

- Authorisation mirrors existing admin results endpoints; deny access if caller is not a Course Admin for the assignment.  
- Suggested rate limit: **30 requests/minute** per admin for each endpoint (dashboard polling + manual refresh).  
- Implement ETag/Last-Modified headers on `overview` and `trends` to avoid unnecessary data transfer.

---

## 8. Rollout Considerations

1. Backend implements the three endpoints alongside unit tests ensuring filters (`sessionId`, `types`) work against realistic datasets.  
2. Front-end feature flag or version guard to ensure UI only calls new endpoints when available.  
3. Observability: log counts of alerts emitted per type to validate business rules (e.g., overdue threshold).  
4. Update Swagger (`oas12025` server) with new schemas so future integrations can adopt them.

---

## 9. Open Questions

1. Should manual override alerts include approver workflow metadata (if moderation teams exist)?  
2. Do we need localisation support for alert messages, or is English sufficient for Course Admin tooling?  
3. What grace period defines “overdue” — fixed (e.g., 12 hours) or configurable per assignment?

These can be iterated once stakeholders review the new dashboard behaviour.
