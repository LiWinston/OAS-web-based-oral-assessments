Client Feedback — Backend Changes for Assignment Setup Progress

Summary

- Add three explicit setup-step statuses per assignment so the frontend can render green/grey dots and a 0/33/66/100% progress bar.
- Steps: rubric configured, time slots configured, results released.
- Provide these flags in the assignment list endpoint and a dedicated status endpoint.

Why

- Client wants a clear, three-step visual on the course admin assignment cards: Rubric, Time Slots, Results.
- Progress increases by 33% per completed step; when all three are done, progress is 100% and appears green.

API Changes

- GET /api/assignments/subject/{courseId}

  - For each assignment object, include a new status block. Either embed fields at the root or under a nested object. Recommended (explicit and future-proof):
  - Shape:
    {
      id: number,
      name: string,
      ...
      setupStatus: {
        rubricConfigured: boolean,
        timeSlotsConfigured: boolean,
        resultsReleased: boolean,
        lastUpdated: string // ISO-8601 optional
      }
    }

- GET /api/assignments/{assignmentId}/status

  - Returns the same status block (useful for detail pages and polling):
    {
      assignmentId: number,
      setupStatus: {
        rubricConfigured: boolean,
        timeSlotsConfigured: boolean,
        resultsReleased: boolean,
        progress: number
      }
    }

- POST /api/assignments/{assignmentId}/results/release
  - Triggers “results released” state and (optionally) sends notifications.
  - Request: { notifyStudents?: boolean }
  - Response: { success: boolean, releasedOn: string }
  - Idempotent: calling again should be a no-op.

- Rubric Create/Update (Assignment PUT)
  - Extend the payload to support the client-requested weighting basis toggle.
  - Add to `rubricMetaInfo`:
    - `totalPoints: number` (existing)
    - `weightBasis: 'percentage' | 'points'` (new)
  - Validation rules:
    - If `weightBasis='percentage'`, sum of `rubricsInfo[].weight` must equal 100.
    - If `weightBasis='points'`, sum of `rubricsInfo[].weight` must equal `rubricMetaInfo.totalPoints`.
  - Return `weightBasis` and `totalPoints` in assignment GET and rubric reads so the UI can render labels and validate accurately.

Field Semantics (source of truth)

- rubricConfigured: true if a rubric exists and is published/frozen for that assignment.
- timeSlotsConfigured: true if at least one valid time slot exists for the assignment (and is not soft-deleted). If you have a concept of “ready for release to students” for schedule, this is separate; we only need “configured exists” for the 33% step.
- resultsReleased: true if results are visible to students (finalised/aggregated marks are published). Include releasedOn in detailed read if available.
- weightBasis: basis for interpreting criteria weights ('percentage' | 'points').

Progress Calculation

- If backend supplies progress, use fixed mapping:
  - 0: none
  - 33: rubric only
  - 66: rubric + time slots
  - 100: all three (including results released)
- If backend omits progress, frontend will compute using the three booleans.

Backward Compatibility

- Older frontend used hasRubric, hasTimeSlots, hasExaminers. We are deprecating hasExaminers and replacing it with resultsReleased.
- For a transitional period, you may return both shapes. The new frontend already looks for resultsReleased and ignores hasExaminers.
- If `weightBasis` isn’t returned, the UI will assume 'percentage'. Please begin returning it (with `totalPoints`) to avoid mismatches.

Suggested Response Example (list)
[
{
"id": 42,
"name": "Final Presentation",
"type": "mixed",
"startDate": "2025-05-20T00:00:00",
"endDate": "2025-06-05T00:00:00",
"weight": 40,
"rubricMetaInfo": { "name": "Final Presentation Rubric", "totalPoints": 100, "weightBasis": "percentage" },
"setupStatus": {
"rubricConfigured": true,
"timeSlotsConfigured": false,
"resultsReleased": false,
"progress": 33
}
}
]

Suggested Response Example (status)
{
"assignmentId": 42,
"setupStatus": {
"rubricConfigured": true,
"timeSlotsConfigured": true,
"resultsReleased": true,
"progress": 100,
"releasedOn": "2025-06-12T13:00:00+10:00"
}
}

Persistence Hints

- rubricConfigured: check rubric table for assignmentId and a “published/frozen” flag.
- timeSlotsConfigured: count rows in timeslot table for assignmentId (exclude soft-deleted).
- resultsReleased: boolean column on assignment or results table (e.g., results_visibility = RELEASED) plus timestamp.

Acceptance Criteria

- Assignment list payload includes setupStatus with the three booleans.
- Progress reflects 0/33/66/100 as per booleans.
- Releasing results flips resultsReleased to true and sets releasedOn.
- No breaking changes for existing consumers; older fields may remain during transition.
- Rubric endpoints accept and return `weightBasis` and enforce sums according to basis.

Notes

- The student booking flow already uses schedule availability and a separate “release schedule” concept. This document focuses on the client-requested three-step visual for the assignment card: Rubric, Time Slots, Results.
