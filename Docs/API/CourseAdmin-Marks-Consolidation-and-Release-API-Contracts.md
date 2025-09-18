# API Contracts — Admin Marks Consolidation & Release (US 6.1–6.3)

> **Design principles.** JWT **Bearer** auth, standardized wrapper `{ success, code, data }`, ISO‑8601 timestamps, RESTful resources. Paths are **assignment‑scoped** and use a **composite entity key** instead of a global `assessmentId`. This aligns with existing patterns and the examiner APIs while honoring the project decision that rubric is locked and **no snapshot** is needed for admin views. fileciteturn1file4 fileciteturn1file5

---

## 1) Conventions

- **Auth**: `Authorization: Bearer <accessToken>` (JWT).  
- **Wrapper**: `{ success: boolean, code: 'OK' | <ERROR_CODE>, data: <payload> }`.  
- **Time**: ISO‑8601 with timezone (e.g., `2025-10-20T09:00:00+11:00`).  
- **IDs**:  
  - `assignmentId`, `sessionId`, `examinerId`, `groupId`, `studentId`, `criterionId`, `levelId`.  
  - **EntityKey** = `(assignmentId, sessionId, entityKind, entityId)` where `entityKind ∈ { GROUP, INDIVIDUAL }` and `entityId = groupId | studentId`.  
- **Statuses**:  
  - Examiner submission: `DRAFT | SUBMITTED | REOPENED`. fileciteturn1file4  
  - Publication: `NOT_RELEASED | RELEASED`. Precedence (UI): `REOPENED > RELEASED > SUBMITTED > DRAFT`. fileciteturn1file11

---

## 2) Domain Models (TypeScript)

```ts
type AggregationMethod = 'average' | 'maximum' | 'minimum';

type EntityKind = 'GROUP' | 'INDIVIDUAL';

type EntityKey = {
  assignmentId: number;
  sessionId: number;
  kind: EntityKind;
  entityId: number; // groupId or studentId
};

type ConsolidatedRowDTO = {
  entity: {
    key: EntityKey;
    group?: { id: number; name?: string; memberCount?: number };
    student?: { id: number; name: string };
  };
  session: {
    id: number;
    start: string;
    end: string;
    timezone: string;
    durationMinutes: number;
    venue?: { venueId: number; name?: string; building?: string; room?: string };
    coExaminers: Array<{ examinerId: number; name: string }>; // names only
  };
  // examiner submissions for this entity
  assessments: Array<{
    examinerId: number;
    assessmentStatus: 'DRAFT' | 'SUBMITTED' | 'REOPENED';
    revision?: number;
    submittedAt?: string;
    examinerScorePct1dp?: number; // optional per-examiner computed (not shown to students)
  }>;
  aggregated: {
    method: AggregationMethod;
    finalScorePct1dp: number; // computed from examiner totals per current method
    effectiveFinalScorePct1dp: number; // final after applying optional override
    override?: { valuePct1dp: number; reason: string; by: { id: number; name?: string }; at: string };
    groupScorePct1dp?: number;      // for mixed display
    individualScorePct1dp?: number; // per student (when kind=INDIVIDUAL)
  };
  releaseStatus: 'NOT_RELEASED' | 'RELEASED';
  anomaly?: { highDivergence?: boolean; note?: string };
};

type AdminEntityDetailDTO = {
  entity: ConsolidatedRowDTO['entity'];
  assignment: {
    id: number;
    name: string;
    type: 'individual' | 'group' | 'mixed';
    aggregationMethod: AggregationMethod;
    groupWeight?: number;
    individualWeight?: number;
  };
  session: ConsolidatedRowDTO['session'];
  submissions: Array<{
    examinerId: number;
    examinerName: string;
    assessmentStatus: 'DRAFT' | 'SUBMITTED' | 'REOPENED';
    revision?: number;
    submittedAt?: string;
    items: Array<{
      criterionId: string;
      levelId: string;
      points?: number;
      comments?: Array<{ source: 'predefined' | 'custom'; text: string; predefinedId?: string }>;
    }>;
    overallFeedback?: string;
    notes?: string; // admin-visible only
    computed?: { rawPoints?: number; examinerScorePct1dp?: number };
  }>;
  aggregated: {
    method: AggregationMethod;
    finalScorePct1dp: number;
    effectiveFinalScorePct1dp: number;
    override?: { valuePct1dp: number; reason: string; by: { id: number; name?: string }; at: string };
    perCriterion?: Array<{ criterionId: string; derivedPoints: number }>; // optional extension
  };
  releaseStatus: 'NOT_RELEASED' | 'RELEASED';
};

type AggregationGetDTO = { method: AggregationMethod };
type AggregationSetDTO = { method: AggregationMethod };

type ReleaseRequestDTO = {
  scope: 'ALL' | 'SELECTION';
  entities?: EntityKey[];
  notify?: boolean;
};

type WithdrawRequestDTO = {
  scope: 'ALL' | 'SELECTION';
  entities?: EntityKey[];
  reason: string;
};

type PublicationScheduleDTO = {
  status: 'SCHEDULED' | 'DISABLED';
  at?: string;     // ISO-8601
  notify?: boolean;
  lastRun?: string;
  createdBy?: { id: number; name?: string };
};

type ReviewRequestDTO = {
  // Unified operation: can target submitted or released records
  target: 'ALL_SUBMISSIONS' | 'EXAMINERS';
  examiners?: number[]; // when target = EXAMINERS
  reason: string;       // stored and shown to examiners
};
```

> **Why composite EntityKey?** One session can host multiple groups/individuals; the admin review unit must include `sessionId` + entity context. This mirrors the “sessions‑only” scheduling model and avoids reliance on a global `assessmentId`. fileciteturn1file5

---

### Error response shape

The common error envelope mirrors the success envelope with `success=false` and an optional human‑readable `message`:

```json
{
  "success": false,
  "code": "ENTITY_NOT_FOUND",
  "data": null,
  "message": "EntityKey does not resolve to a session + student/group"
}
```

## 3) Endpoints

> All responses use the `{ success, code, data }` wrapper. Unless stated, `200 OK` indicates success.

### 3.1 List consolidated results (paged) — **US 6.1**
`GET /api/admin/assignments/{assignmentId}/marks/consolidated`  
**Query (optional):** `entityKind=GROUP|INDIVIDUAL|ALL`, `status`, `from`, `to`, `q`, `page=1`, `pageSize=20`, `sort=sessionStart|score`, `order=desc`  
**200 OK →** `{ page, pageSize, total, items: ConsolidatedRowDTO[] }`

- Includes per‑row `entity.key` (EntityKey), session info, per‑examiner submission statuses, and the **aggregated.finalScorePct1dp** using the current assignment method.  
- Intended to drive the list UI with filters and pagination. fileciteturn1file10

### 3.2 Read detail for an entity — **US 6.1**
`GET /api/admin/assignments/{assignmentId}/sessions/{sessionId}/entities/{kind}/{entityId}`  
**200 OK →** `AdminEntityDetailDTO`

- Returns per‑examiner **submissions** (immutable read for audit) and the **aggregated** view.  
- **Rubric**: Since rubric is locked after publish, admin reads rely on the **assignment rubric** already stored server‑side; no frozen snapshot is required for this flow. (If rubric editing is reintroduced, add `rubricFrozen` as in examiner history.) fileciteturn1file2

### 3.3 Get / Set aggregation method — **US 6.1**
`GET  /api/admin/assignments/{assignmentId}/marks/aggregation` → `AggregationGetDTO`  
`PATCH /api/admin/assignments/{assignmentId}/marks/aggregation` body `AggregationSetDTO` → `200 OK`

- Controls **Average/Max/Min**; recalculation occurs server‑side for consistency with student view. fileciteturn1file10

### 3.4 Release results (immediate) — **US 6.2**
`POST /api/admin/assignments/{assignmentId}/results/release` body `ReleaseRequestDTO` → `{ releasedCount, notifiedStudents }`

- Scope can be **ALL** eligible or **SELECTION** via `EntityKey[]`. Block entities with zero submitted examiner assessments (configurable policy). fileciteturn1file10

### 3.5 Schedule results publication — **US 6.3**
`PUT /api/admin/assignments/{assignmentId}/results/publication` body `PublicationScheduleDTO` → `200 OK`  
`GET /api/admin/assignments/{assignmentId}/results/publication` → `PublicationScheduleDTO`

- Assignment‑level schedule with TZ‑aware timestamp; can be updated/canceled prior to execution. fileciteturn1file13

### 3.6 Withdraw (unrelease)
`POST /api/admin/assignments/{assignmentId}/results/withdraw` body `WithdrawRequestDTO` → `200 OK`

- Sets `releaseStatus=NOT_RELEASED` for selected entities; logs an audit record with the reason. fileciteturn1file13

### 3.7 **Review** (unified reopen) — *replaces separate withdraw + reopen*
`POST /api/admin/assignments/{assignmentId}/sessions/{sessionId}/entities/{kind}/{entityId}:review` body `ReviewRequestDTO` → `200 OK`

**Behavior**
- If entity is **RELEASED**, system first **unreleases** it (same outcome as Withdraw) for that EntityKey.  
- Then for the targeted examiner submission(s): set **REOPENED** (latest submitted copy), attach `reason` (visible to examiner in their history/detail).  
- This mirrors the examiner status model and keeps precedence `REOPENED > RELEASED`. fileciteturn1file11

**Interop with existing reopen endpoint**  
- If the backend already exposes `POST /api/marking/sessions/{sessionId}/assessments/{assessmentId}:reopen`, the Admin **Review** handler can map internally by looking up the latest submitted record(s) for `(sessionId, examinerId, entity)` to obtain `assessmentId`. fileciteturn1file16

### 3.8 Recompute aggregates (optional helper)
`POST /api/admin/assignments/{assignmentId}/marks:recompute` → `{ updated: true }`  
- Forces refresh of cached aggregates; useful after review/resubmission cycles. fileciteturn1file9

### 3.9 Override final score (admin manual adjustment)
`PATCH /api/admin/assignments/{assignmentId}/sessions/{sessionId}/entities/{kind}/{entityId}/override`  
Body: `{ finalOverridePct1dp: number, reason: string }` → `200 OK` (returns `AdminEntityDetailDTO`)

- Stores an explicit override for the entity’s final score. The system keeps both the computed score and the override; `effectiveFinalScorePct1dp` reflects the override when present.
- Creates an audit record capturing admin, timestamp, and reason.

### 3.10 Clear override
`DELETE /api/admin/assignments/{assignmentId}/sessions/{sessionId}/entities/{kind}/{entityId}/override` → `200 OK`

- Removes the manual override and reverts `effectiveFinalScorePct1dp` to `finalScorePct1dp`.

---

## 4) Request/Response Examples

### 4.1 Consolidated list — example item
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "items": [{
      "entity": {
        "key": { "assignmentId": 101, "sessionId": 90011, "kind": "INDIVIDUAL", "entityId": 200045 },
        "student": { "id": 200045, "name": "Alice Tan" }
      },
      "session": {
        "id": 90011,
        "start": "2025-04-14T10:00:00+10:00",
        "end": "2025-04-14T10:30:00+10:00",
        "timezone": "Australia/Melbourne",
        "durationMinutes": 30,
        "coExaminers": [{ "examinerId": 44, "name": "Dr. Smith" }]
      },
      "assessments": [
        { "examinerId": 33, "assessmentStatus": "SUBMITTED", "revision": 1, "submittedAt": "2025-04-14T10:40:00+10:00", "examinerScorePct1dp": 84.3 },
        { "examinerId": 44, "assessmentStatus": "SUBMITTED", "revision": 1, "submittedAt": "2025-04-14T10:41:00+10:00", "examinerScorePct1dp": 81.0 }
      ],
      "aggregated": { "method": "average", "finalScorePct1dp": 82.7 },
      "releaseStatus": "NOT_RELEASED"
    }]
  }
}
```

### 4.2 Entity detail — example
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "entity": {
      "key": { "assignmentId": 101, "sessionId": 90011, "kind": "GROUP", "entityId": 501 },
      "group": { "id": 501, "name": "Team Lambda", "memberCount": 3 }
    },
    "assignment": { "id": 101, "name": "Oral Exam 1", "type": "mixed", "aggregationMethod": "maximum", "groupWeight": 0.8, "individualWeight": 0.2 },
    "session": { "id": 90011, "start": "2025-04-14T10:00:00+10:00", "end": "2025-04-14T10:30:00+10:00", "timezone": "Australia/Melbourne", "durationMinutes": 30, "coExaminers": [{ "examinerId": 44, "name": "Dr. Smith" }] },
    "submissions": [{
      "examinerId": 44,
      "examinerName": "Dr. Smith",
      "assessmentStatus": "SUBMITTED",
      "revision": 1,
      "submittedAt": "2025-04-14T10:41:00+10:00",
      "items": [{ "criterionId": "C1", "levelId": "L3", "points": 18 }],
      "computed": { "examinerScorePct1dp": 83.0 }
    }],
    "aggregated": { "method": "maximum", "finalScorePct1dp": 83.0 },
    "releaseStatus": "NOT_RELEASED"
  }
}
```

### 4.3 Review — request example
`POST /api/admin/assignments/101/sessions/90011/entities/INDIVIDUAL/200045:review`
```json
{ "target": "EXAMINERS", "examiners": [44], "reason": "Please re-check criterion C2 justification." }
```

### 4.3b Review — response example
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "entity": { "assignmentId": 101, "sessionId": 90011, "kind": "INDIVIDUAL", "entityId": 200045 },
    "review": {
      "target": "EXAMINERS",
      "examiners": [44],
      "reason": "Please re-check criterion C2 justification.",
      "timestamp": "2025-04-14T12:00:00+10:00"
    },
    "effects": {
      "releaseStatus": "NOT_RELEASED",
      "reopenedAssessments": [{ "examinerId": 44, "status": "REOPENED" }]
    }
  }
}
```

### 4.4 Get aggregation — response example
`GET /api/admin/assignments/101/marks/aggregation`
```json
{ "success": true, "code": "OK", "data": { "method": "average" } }
```

### 4.5 Set aggregation — request/response
`PATCH /api/admin/assignments/101/marks/aggregation`
```json
{ "method": "maximum" }
```
```json
{ "success": true, "code": "OK", "data": { "method": "maximum" } }
```

### 4.6 Release results (immediate) — request/response
`POST /api/admin/assignments/101/results/release`
```json
{ "scope": "SELECTION", "entities": [
  { "assignmentId": 101, "sessionId": 90011, "kind": "INDIVIDUAL", "entityId": 200045 },
  { "assignmentId": 101, "sessionId": 90012, "kind": "GROUP", "entityId": 501 }
], "notify": true }
```
```json
{ "success": true, "code": "OK", "data": { "releasedCount": 2, "notifiedStudents": 4 } }
```

### 4.7 Get schedule — response
`GET /api/admin/assignments/101/results/publication`
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "status": "SCHEDULED",
    "at": "2025-05-01T09:00:00+10:00",
    "notify": true,
    "lastRun": null,
    "createdBy": { "id": 9001, "name": "Course Admin" }
  }
}
```

### 4.8 Put schedule — request/response
`PUT /api/admin/assignments/101/results/publication`
```json
{ "status": "SCHEDULED", "at": "2025-05-01T09:00:00+10:00", "notify": true }
```
```json
{ "success": true, "code": "OK", "data": { "status": "SCHEDULED", "at": "2025-05-01T09:00:00+10:00", "notify": true } }
```

### 4.9 Withdraw (unrelease) — request/response
`POST /api/admin/assignments/101/results/withdraw`
```json
{ "scope": "SELECTION", "entities": [
  { "assignmentId": 101, "sessionId": 90011, "kind": "INDIVIDUAL", "entityId": 200045 }
], "reason": "Detected error in level mapping." }
```
```json
{ "success": true, "code": "OK", "data": { "unreleasedCount": 1 } }
```

### 4.10 Recompute aggregates — response
`POST /api/admin/assignments/101/marks:recompute`
```json
{ "success": true, "code": "OK", "data": { "updated": true } }
```

### 4.11 Override final score — request/response
`PATCH /api/admin/assignments/101/sessions/90011/entities/INDIVIDUAL/200045/override`
```json
{ "finalOverridePct1dp": 85.5, "reason": "Moderation panel decision" }
```
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "entity": {
      "key": { "assignmentId": 101, "sessionId": 90011, "kind": "INDIVIDUAL", "entityId": 200045 },
      "student": { "id": 200045, "name": "Alice Tan" }
    },
    "assignment": { "id": 101, "name": "Oral Exam 1", "type": "individual", "aggregationMethod": "average" },
    "session": { "id": 90011, "start": "2025-04-14T10:00:00+10:00", "end": "2025-04-14T10:30:00+10:00", "timezone": "Australia/Melbourne", "durationMinutes": 30 },
    "submissions": [],
    "aggregated": {
      "method": "average",
      "finalScorePct1dp": 83.0,
      "effectiveFinalScorePct1dp": 85.5,
      "override": { "valuePct1dp": 85.5, "reason": "Moderation panel decision", "by": { "id": 9001, "name": "Course Admin" }, "at": "2025-04-14T12:00:00+10:00" }
    },
    "releaseStatus": "NOT_RELEASED"
  }
}
```

### 4.12 Clear override — response
`DELETE /api/admin/assignments/101/sessions/90011/entities/INDIVIDUAL/200045/override`
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "cleared": true,
    "entity": { "assignmentId": 101, "sessionId": 90011, "kind": "INDIVIDUAL", "entityId": 200045 }
  }
}
```

---

## 5) Validation Rules

- **Authorization**: Only Course Admins for the assignment can call these endpoints.
- **Entity existence**: `(assignmentId, sessionId, entityKind, entityId)` must resolve via the session roster (session ↔ student/group).
- **Rubric integrity**: criteria weights sum to 100; level ranges not overlapping; server enforces during examiner save/submit; admin reads rely on the locked rubric.
- **Aggregation**: apply method on **examiner totals** (not per‑criterion unless you opt into the optional extension). Mixed uses assignment weights.
- **Release eligibility**: an entity can be released only when **all assigned examiners have SUBMITTED** for that entity.
- **Review semantics**: When **Review** is called, set `releaseStatus=NOT_RELEASED` (if needed) and mark targeted submissions **REOPENED** with the stored reason.
- **Idempotency**: Repeated Review or Release with the same selection should be safe (no duplicate side‑effects).

Additional rules
- **Override bounds**: `finalOverridePct1dp` must be within `[0, 100]` (or assignment max scale).
- **Divergence handling**: `anomaly.highDivergence` triggers warnings in UI only and does not block Release.
- **Scheduling semantics**: `PublicationScheduleDTO.at` is an absolute, timezone‑aware timestamp; the system triggers at that exact instant without re‑interpreting server TZ.
- **Withdrawn student UX**: When results are withdrawn/unreleased, they disappear from the student results UI (no placeholder message).
- **Access scope**: Course Admins for the assignment can mutate; Super Admins have read‑only access for oversight.

---

## 6) Error Codes (examples)

- `ENTITY_NOT_FOUND` — EntityKey cannot be resolved to a session + student/group.  
- `INVALID_ENTITY_KEY` — Malformed kind/entityId or mismatched session.  
- `NO_SUBMISSIONS_FOR_ENTITY` — Attempted release without any `SUBMITTED`.  
- `ALREADY_RELEASED` — Redundant release call on already released entities.  
- `EXAMINER_SUBMISSIONS_INCOMPLETE` — Attempted release while one or more assigned examiners have not submitted.  
- `REVIEW_PENDING` — Re‑release attempted while examiner submission is `REOPENED`.  
- `FORBIDDEN` — Caller lacks admin rights on assignment.  
- `CONFLICT` — Aggregation change blocked while release is in progress.
- `OVERRIDE_ALREADY_SET` — Override operation attempted when an identical override already exists.  
- `OVERRIDE_NOT_FOUND` — Attempted to clear an override that does not exist.

---

## 7) Performance Considerations

- **Pagination & indexes**: paginate consolidated lists; index `(assignmentId, session.start, entityKey)`.  
- **Avoid N+1** by pre‑joining examiner totals and rubric data; provide stable sorting and ETags on detail reads. fileciteturn1file0  
- **Caching**: cache aggregated rows per EntityKey and invalidate on examiner submit/re‑submit, aggregation change, Review, withdraw/release, or schedule trigger.

---

## 8) Consistency & Interop

- **UI reuse**: Admin drill‑down renders the same rubric table used by examiner UIs (read‑only). fileciteturn1file12  
- **Examiner interop**: Admin **Review** maps to examiner **REOPENED**; if your backend already exposes `:reopen` on an `assessmentId`, the admin handler looks up the latest submitted record per `(sessionId, examinerId, entity)` to call it. fileciteturn1file16  
- **Student interop**: Only released entities surface to students; withdrawing + review hides results until re‑release. fileciteturn1file9

---

## 9) Notes against Swagger summary

The current Swagger summary shows examiner list/submit resources and a standard `{ success, code, data }` pattern for result DTOs; the admin endpoints specified here follow the same conventions and wrapper for ease of backend integration. fileciteturn1file19
