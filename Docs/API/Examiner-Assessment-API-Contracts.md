## Examiner Assessment — API Contracts (MVP+)

This contract aligns with our existing API patterns/wrappers and mirrors the structure of the self‑assignment contracts doc. It introduces **session‑level assessment APIs**, **rubric access**, and **predefined comment** endpoints required by the Examiner flow.

### 1) Conventions
- **Auth**: `Authorization: Bearer <accessToken>` (JWT).
- **Paths**: Assignment‑centric and session‑centric resources: `/api/assignments/*`, `/api/sessions/*`, `/api/marking/*`, `/api/rubrics/*`.
- **Wrapper**: `{ success: boolean, code: 'OK' | <ERROR_CODE>, data: <payload> }`. (Existing pattern.) fileciteturn0file11
- **Time**: ISO 8601 with timezone, e.g., `2025-04-14T10:00:00+10:00`.
- **IDs**: `assignmentId`, `sessionId`, `examinerId`, `studentId`, `groupId`, `criterionId`, `levelId`, `assessmentId`.
- **Status**: `DRAFT` | `SUBMITTED` | `REOPENED`.

### 2) Dependencies & Existing APIs
- Assignment & rubric fields (`rubricMetaInfo`, `rubricsInfo`) live on **Assignment**. Use existing endpoints to fetch assignment by id. fileciteturn0file11
- Examiner schedule & self‑assignment; student booking & sessions are already defined and used as **prerequisites** to determine what a given examiner can mark. fileciteturn0file11

### 3) Domain Models (new)
```ts
// Core session context returned to the marking UI
type MarkingSessionContextDTO = {
  assignment: {
    id: number
    name: string
    type: 'individual' | 'group' | 'mixed'
    // optional mixed weights
    groupWeight?: number // 0..1
    individualWeight?: number // 0..1
    rubricMeta?: { name: string; description?: string; totalPoints: number } // from rubricMetaInfo
    rubric: RubricDTO // derived from rubricsInfo
  }
  session: {
    sessionId: number
    slotId: number
    start: string
    end: string
    timezone: string
    venue?: { venueId: number; name?: string; building?: string; room?: string }
    coExaminers: Array<{ examinerId: number; name: string }>
  }
  entity: {
    kind: 'GROUP' | 'INDIVIDUAL'
    group?: { groupId: number; groupName?: string; members: Array<{ studentId: number; name: string; email?: string }> }
    // if mixed or individual: list individuals to mark
    individuals?: Array<{ studentId: number; name: string; email?: string }>
  }
  predefinedComments: PredefinedCommentLibraryDTO
  existingAssessment?: AssessmentDTO // this examiner’s latest draft/submission if any
}

type RubricDTO = {
  criteria: Array<{
    criterionId: string // stable within assignment
    description: string
    weight: number // must sum to 100 across criteria
    markingScale: 'descriptive' | 'numeric' | 'letter'
    appliesTo?: 'GROUP' | 'INDIVIDUAL' | 'BOTH' // for mixed
    levels: Array<{
      levelId: string
      description: string
      minPoints: number
      maxPoints: number
    }>
  }>
}

type PredefinedCommentLibraryDTO = {
  // grouped by criterion -> level
  [criterionId: string]: {
    [levelId: string]: Array<{ id: string; text: string; createdBy: number; createdAt: string }>
  }
}

type AssessmentDTO = {
  assessmentId: string
  assignmentId: number
  sessionId: number
  examinerId: number
  status: 'DRAFT' | 'SUBMITTED' | 'REOPENED'
  revision: number
  // One top-level record per entity being marked
  entities: Array<{
    kind: 'GROUP' | 'INDIVIDUAL'
    groupId?: number
    studentId?: number
    overallFeedback?: string // student-visible when released
    notes?: string // internal only
    items: Array<{
      criterionId: string
      levelId: string // selected level
      points?: number // optional override; must be within [min,max] of selected level
      comments?: Array<{ source: 'predefined' | 'custom'; text: string; predefinedId?: string }>
    }>
    computed?: {
      rawPoints: number // sum(points or derived) across criteria with weight
      weightedScore: number // 0..rubric.totalPoints or % depending on config
    }
  }>
  totals?: {
    perStudent?: Array<{ studentId: number; finalScore: number }>
    groupScore?: number
  }
  submittedAt?: string
  updatedAt: string
}
```

> Rubric DTO mirrors current frontend objects built from `rubricsInfo` and `rubricMetaInfo`. Level ranges must not overlap (frontend already validates). fileciteturn0file6 fileciteturn0file8

### 4) Endpoints

#### 4.1 Get sessions to mark (for an examiner)
`GET /api/examiners/{examinerId}/assignments/{assignmentId}/marking-sessions?status=upcoming|draft|submitted&date=YYYY-MM-DD`

**Purpose**: List booked sessions where the examiner is assigned, with markers for **Draft/Submitted/Unmarked**.

**Response (200 OK)**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "assignment": { "id": 101, "name": "Mid-Sem Oral", "type": "mixed" },
    "sessions": [{
      "sessionId": 90011,
      "slotId": 5001,
      "start": "2025-04-14T10:00:00+10:00",
      "end": "2025-04-14T10:30:00+10:00",
      "timezone": "Australia/Melbourne",
      "entity": { "kind": "GROUP", "groupId": 501, "members": 3 },
      "status": "unmarked|draft|submitted",
      "coExaminers": [{ "examinerId": 44, "name": "Dr. Smith" }]
    }]
  }
}
```

**Errors**  
- `403 FORBIDDEN` — examiner not authorized for this assignment  
- `404 NOT_FOUND` — assignment not found

> Leverages existing examiner schedule & booking relationships but provides a marking‑focused view. fileciteturn0file11

#### 4.2 Get session context for marking
`GET /api/marking/sessions/{sessionId}/context?examinerId=XXX`

**Purpose**: Return all data needed to render the marking UI in one call: assignment rubric, participants, predefined comments, and current examiner’s latest assessment (if any).

**Response (200 OK)** — `MarkingSessionContextDTO`

**Errors**  
- `403 FORBIDDEN` — examiner not assigned to this session  
- `404 NOT_FOUND` — session/booking not found  

> Frontend currently composes rubric from `rubricMetaInfo` + `rubricsInfo`; server should return the composed DTO to simplify the UI. fileciteturn0file6 fileciteturn0file11

#### 4.3 Save draft (create/update)
`POST /api/marking/sessions/{sessionId}/assessments`

**Purpose**: Create or update the **current examiner’s** assessment as **DRAFT** (idempotent by `examinerId + sessionId`).

**Request (JSON)**
```json
{
  "examinerId": 33,
  "assignmentId": 101,
  "status": "DRAFT",
  "entities": [
    {
      "kind": "GROUP",
      "groupId": 501,
      "overallFeedback": "Clear articulation.",
      "notes": "Needed prompt on Q3.",
      "items": [
        { "criterionId": "C1", "levelId": "L3", "points": 74, "comments": [{ "source": "predefined", "predefinedId": "P12" }] },
        { "criterionId": "C2", "levelId": "L2" }
      ]
    },
    {
      "kind": "INDIVIDUAL",
      "studentId": 201,
      "items": [{ "criterionId": "C3", "levelId": "L4", "points": 88 }]
    }
  ]
}
```

**Response (200 OK)**
```json
{ "success": true, "code": "OK", "data": { "assessmentId": "A-901", "status": "DRAFT", "revision": 2, "updatedAt": "2025-04-14T10:22:00+10:00" } }
```

**Errors**
- `400 INVALID_POINTS_RANGE` — points outside selected level `[min,max]`
- `400 MISSING_CRITERIA` — required criterion missing selection
- `403 FORBIDDEN` — not assigned / not authorized
- `409 RUBRIC_OUTDATED` — rubric changed since the draft’s `updatedAt` (client should fetch context again)

> Level range & criteria validations mirror frontend logic (non‑overlap, weight sum). fileciteturn0file8 fileciteturn0file6

#### 4.4 Submit assessment (finalize)
`PATCH /api/marking/sessions/{sessionId}/assessments/{assessmentId}`

**Purpose**: Finalize the current draft to **SUBMITTED** (locks it for the examiner).

**Request (JSON)**
```json
{ "status": "SUBMITTED" }
```

**Response (200 OK)**
```json
{ "success": true, "code": "OK", "data": { "assessmentId": "A-901", "status": "SUBMITTED", "submittedAt": "2025-04-14T10:40:00+10:00" } }
```

**Errors**
- `400 MISSING_CRITERIA` — some required items not filled
- `403 FORBIDDEN` — not owner of draft or not assigned
- `409 ALREADY_SUBMITTED` — assessment already finalized

#### 4.5 Reopen submission (Admin only)
`POST /api/marking/sessions/{sessionId}/assessments/{assessmentId}:reopen`

**Purpose**: Admin reopens a submitted assessment for correction. Creates a new working copy with `status = REOPENED` and increments `revision` on next submit.

**Response (200 OK)**
```json
{ "success": true, "code": "OK", "data": { "assessmentId": "A-901", "status": "REOPENED" } }
```

#### 4.6 Get current examiner’s assessment
`GET /api/marking/sessions/{sessionId}/assessments?examinerId=XXX`

**Purpose**: Retrieve the latest draft or submission of this examiner for the session (used to resume editing).

**Response (200 OK)**
```json
{ "success": true, "code": "OK", "data": { /* AssessmentDTO */ } }
```

#### 4.7 Predefined comments — list
`GET /api/assignments/{assignmentId}/rubric/comments?criterionId=C1&levelId=L2`

**Purpose**: Get predefined comments for a specific criterion+level in this assignment.

**Response (200 OK)**
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "comments": [
      { "id": "P11", "text": "Clear structure", "createdBy": 9, "createdAt": "2025-04-10T12:00:00Z" },
      { "id": "P12", "text": "Accurate terminology", "createdBy": 9, "createdAt": "2025-04-10T12:05:00Z" }
    ]
  }
}
```

> Frontend already groups predefined comments by level under each criterion. fileciteturn0file7

#### 4.8 Predefined comments — add (Examiner + Admin)
`POST /api/assignments/{assignmentId}/rubric/comments`

**Request (JSON)**
```json
{ "criterionId": "C1", "levelId": "L2", "text": "Strong evidence and references" }
```

**Response (201 CREATED)**
```json
{ "success": true, "code": "OK", "data": { "id": "P24", "text": "Strong evidence and references", "createdBy": 33, "createdAt": "2025-04-14T11:05:00Z" } }
```

**Permissions**
- Examiner (invitee on assignment): **can add**.
- Admin: **can add/edit/delete**.

> Reflects the requirement: examiners invited to the assignment can **view & add** predefined comments; admins manage fully. fileciteturn0file7

#### 4.9 Predefined comments — edit/delete (Admin only)
`PUT /api/assignments/{assignmentId}/rubric/comments/{id}`  
`DELETE /api/assignments/{assignmentId}/rubric/comments/{id}`

**Response (200 OK / 204 No Content)**

**Errors**
- `403 FORBIDDEN` — not a Course Admin on this assignment
- `404 NOT_FOUND` — comment not found

#### 4.10 Compute totals (server‑side helper; optional)
`POST /api/marking/assessments/{assessmentId}:compute`

**Purpose**: Recompute weighted totals (useful if server needs a definitive calculation). By default, computation also occurs on `save draft` and `submit`.

**Response (200 OK)**
```json
{ "success": true, "code": "OK", "data": { "updated": true } }
```

### 5) Validation Rules (server)
- **Authorization**: Examiner must be a member of the assignment and assigned to the session.
- **Session state**: Session must be booked (or marked as attended if after the fact).  
- **Rubric**: Criteria weights sum to **100**; performance level ranges **must not overlap**; `points` (if provided) must be within the chosen level’s range. (Front‑end enforces; server re‑validates.) fileciteturn0file6 fileciteturn0file8
- **Mixed**: For criteria with `appliesTo = GROUP`, forbid `studentId`. For `INDIVIDUAL`, require `studentId`. For `BOTH`, accept both.
- **Idempotency**: Draft save is idempotent by `(examinerId, sessionId)`; server returns the same `assessmentId` for repeated saves.
- **Submission lock**: Once `SUBMITTED`, forbid mutation except via `:reopen` by Admin.

### 6) Error Codes (examples)
- `INVALID_POINTS_RANGE` — Out of bounds for selected level
- `MISSING_CRITERIA` — Not all required criteria have selections
- `RUBRIC_OUTDATED` — Rubric changed since client last fetched
- `FORBIDDEN` — Not assigned/authorized
- `NOT_FOUND` — Session/assignment not found
- `ALREADY_SUBMITTED` — Draft already finalized

### 7) Data Retention & Visibility
- Stored under the **assignment** domain; visible to **Course Admin** and **authorized examiners** on this assignment (read‑only after submission unless reopened). (Requirement #1)
- **Notes** are internal (not student‑visible).
- Predefined comments library is **assignment‑scoped** and grouped by performance level; examiner **can add**; admin **manages**. fileciteturn0file7

### 8) Performance & Freshness
- Minimize roundtrips by bundling rubric + predefined comments in the **context** endpoint.
- Use optimistic UI; server re‑validates on save/submit.
- Optional: ETags/`Last-Modified` on `context` and `comments` to avoid full reloads during long marking sessions.

---

**References used**: Current assignment model and API wrappers; examiner schedule/booking endpoints; rubric configuration & preview components and predefined comments UI; performance‑level validation logic. fileciteturn0file11 fileciteturn0file6 fileciteturn0file10 fileciteturn0file7 fileciteturn0file8
