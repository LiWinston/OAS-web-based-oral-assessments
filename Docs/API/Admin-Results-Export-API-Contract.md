# Admin Results Export API Contract

> Status: Draft – awaiting backend review and estimation

## 1. Overview

This API enables Course Admins to download Canvas-compatible CSV files containing released assessment results. The contract aligns with the frontend user flow documented in `Docs/Design/Admin-Results-Export-Userflow.md` and supports three export variants:

1. **Individual Results** – one row per student.
2. **Group Results** – one row per group.
3. **Examiner Results** – group rows enriched with examiner + session metadata.

All exports must respect release state (only include participants whose results are already released to students) and return data filtered to the admin’s current context (assignment, session, filters).

## 2. Authentication & Authorisation

- Endpoint is available to authenticated **Course Admin** users only.
- Token-based auth (JWT) already handled by `Authorization: Bearer <accessToken>` header.
- Backend should verify the admin has ownership or delegated access to `subjectId` and `assignmentId`.

## 3. Endpoint Summary

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/subjects/{subjectId}/assignments/{assignmentId}/results/export` | Streams a CSV file for the requested variant. |

Optional (future) endpoints such as metadata previews can be discussed separately; current scope requires only the streaming download endpoint.

## 4. Request Specification

### 4.1 Path Parameters

| Name | Type | Description |
| --- | --- | --- |
| `subjectId` | integer | Internal subject/course identifier (matches existing admin results routes). |
| `assignmentId` | integer | Assignment ID. |

### 4.2 Query Parameters

| Name | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `variant` | enum (`individual`, `group`, `examiner`) | ✅ | – | Determines column schema. |
| `sessionId` | integer | ❌ | – | Limits export to a single session. If omitted, aggregate all sessions in assignment. |
| `type` | enum (`ALL`, `GROUP`, `INDIVIDUAL`) | ❌ | `ALL` | Mirrors session participant filter; backend should ignore `type` when variant is incompatible (e.g., `variant=group` forces group data). |
| `q` | string | ❌ | – | Optional search term (name/student number). Case-insensitive substring. |
| `releaseStatus` | enum (`released`, `not_released`, `all`) | ❌ | `released` | If a caller passes something other than `released`, backend must override/return 400 (we only export released data). |
| `timezone` | string | ❌ | Session timezone override for formatting (ISO TZ identifier). Defaults to session’s stored timezone. |
| `includeWarnings` | boolean | ❌ | `true` | When true, backend should populate warning headers (see §6). |

### 4.3 Headers

| Header | Value |
| --- | --- |
| `Authorization` | `Bearer <token>` |
| `Accept` | `text/csv` (frontend will set explicitly) |

## 5. Response Specification

### 5.1 Success – `200 OK`

- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="results-{assignmentId}-{variant}-{yyyyMMdd}.csv"`
- Body: CSV payload matching the selected variant. Example snippets:

#### Variant: `individual`

```csv
Student,ID,SIS User ID,SIS Login ID,Section,Student Id,{AssignmentName} ({AssignmentId})
"ABD WAHID, ZARIFFA NUR NAFEESA BINTI",12345,987654,student123,"COMP20008 2025 SM2 - Lecture 1",321,86.50
```

#### Variant: `group`

```csv
name,canvas_user_id,SIS ID,login_id,Section,group_name,canvas_group_id,{AssignmentName} ({AssignmentId})
"Leong, Matthew",556677,998877,mleong,"COMP20008 2025 SM2 - Tutorial 15",W01G1,509516,88.25
```

#### Variant: `examiner`

```csv
name,canvas_user_id,SIS ID,login_id,Section,group_name,canvas_group_id,examiner_name,examiner_username,exam_date,exam_time_slot,exam_venue,{AssignmentName} ({AssignmentId})
"Leong, Matthew",556677,998877,mleong,"COMP20008 2025 SM2 - Tutorial 15",W01G1,509516,Hasti Samadi,samadih,"Monday 20-10-2025","15:15 - 15:45","Zoom",88.25
```

### 5.2 Error Responses

| HTTP | Code | When | Payload |
| --- | --- | --- | --- |
| `400` | `EXPORT_INVALID_VARIANT` | `variant` not recognised or incompatible with assignment type. | `{ "success": false, "code": "EXPORT_INVALID_VARIANT", "message": "Variant examiner not supported for individual-only assignment." }` |
| `400` | `EXPORT_RELEASE_ONLY` | Request tries to export non-released data (e.g., `releaseStatus!=released`). | `{ "success": false, "code": "EXPORT_RELEASE_ONLY", "message": "Only released results can be exported." }` |
| `404` | `ASSIGNMENT_NOT_FOUND` | Invalid `subjectId`/`assignmentId` or admin lacks access. | Standard error envelope. |
| `409` | `EXPORT_NO_DATA` | After applying filters + release rule there are zero rows. | `{ "success": false, "code": "EXPORT_NO_DATA", "message": "No released results available for export." }` |
| `500` | `EXPORT_FAILED` | Unexpected server error during CSV generation. | `{ "success": false, "code": "EXPORT_FAILED", "message": "Failed to generate export." }` |

All error bodies should follow existing convention: `{ success: false, code, message, data? }`.

## 6. Warning Propagation

When the export succeeds but data is incomplete (e.g., missing Canvas IDs), backend should:

- Still return `200 OK` with CSV containing placeholder values (`""`) for missing fields.
- Add warning metadata via `X-OAS-Export-Warnings` header (comma-delimited summary) and optionally `X-OAS-Export-Missing-Ids: studentId1,studentId2`.
- Include a footer row in the CSV when feasible, e.g., `# WARNING: Missing Canvas IDs for 2 participants`.

Frontend will surface these warnings to admins via toast/alert.

## 7. Business Rules

1. **Release Gate** – only rows with `releaseStatus=RELEASED` are eligible. Backend must enforce this even if the caller passes conflicting filters.
2. **Score Calculation** – exported score must match the released final score visible to students (post-aggregation). Do not export raw examiner totals.
3. **Timezone** – `exam_date` and `exam_time_slot` use the session timezone; if multiple sessions exist in one export, use each row’s timezone.
4. **Locale** – Numeric values should use `.` decimal separator and two decimal places (Canvas expectation).
5. **CSV Encoding** – UTF-8 with BOM to preserve non-ASCII names in Excel (`F` optional but recommended; current samples include BOM).
6. **Audit Logging** – Log export events with admin ID, assignment ID, sessionId, variant, row count, and warnings (if any).

## 8. Data Mapping Requirements

| Field | Source | Notes |
| --- | --- | --- |
| `Student` / `name` | Participant record (existing detail endpoint). | Use last-name-first format as per Canvas sample. |
| `ID` / `canvas_user_id` | Canvas user identifier stored against student. | Confirm column names in DB. |
| `SIS User ID`, `SIS ID`, `login_id` | Student LMS metadata. | Null-safe. |
| `Section` | Combined course + section string. | Current sample uses “Course Name (Code), Lecture…, Tutorial…”. Up to backend to replicate institutional format. |
| `Student Id` | Internal OAS student ID. |
| `group_name`, `canvas_group_id` | Group roster metadata. |
| `examiner_name`, `examiner_username` | Examiner profile associated with submission. |
| `exam_date`, `exam_time_slot`, `exam_venue` | Session entity fields (`start`, `end`, `venue.name`). |
| Final score column | Released final score (float). |

Backend should reuse the same underlying queries used by `getGroupResultDetail` / `getIndividualResultDetail` to ensure consistent calculations.

## 9. Performance Considerations

- Expect assignments with hundreds of groups/students. Use streaming CSV writer to avoid high memory usage.
- Apply pagination at DB level but stream results sequentially; do not require clients to paginate.
- Rate limit or throttle per admin if necessary (e.g., max 5 exports/minute).

## 10. Testing Checklist

1. Export succeeds for each variant with at least one released participant.
2. Export returns `EXPORT_NO_DATA` when no released rows exist (per assignment/session).
3. Filters (`sessionId`, `q`) reduce dataset correctly.
4. Mixed assignments: group variant returns group rows, individual variant returns individual rows. Examiner variant includes session data.
5. Missing Canvas IDs produce warnings but not hard failures.
6. Security: unauthorized admin receives 403, other roles blocked.

## 11. Outstanding Questions

1. Confirmation from data team that Canvas identifiers are stored for all students/groups. If not, document fallback behaviour.
2. Whether examiners with multiple submissions (e.g., reopened) need to appear multiple times in Examiner CSV or single consolidated row. Proposed approach: single row per participant with latest released data; examiner metadata should reference the current submission.
3. Should we offer asynchronous export (job queue) for very large datasets? Current scope assumes synchronous streaming is acceptable.

