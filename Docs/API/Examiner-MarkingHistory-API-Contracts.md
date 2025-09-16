# 2) API Contract — **Examiner Results History** (Read‑only + Versions)

> **Compatibility:** Mirrors your response wrapper `{ success, code, data }` and auth scheme; designed to sit alongside existing Marking APIs and session context. &#x20;

## 2.1 Conventions

- **Auth:** `Authorization: Bearer <accessToken>` (JWT).
- **Wrapper:** `{ success: boolean, code: 'OK' | <ERROR_CODE>, data: <payload> }`.
- **Time:** ISO‑8601 with timezone.
- **Rounding:** server returns **examinerScorePct1dp** as a number with **1 decimal**.
- **Visibility:** return **only this examiner’s marks**; co‑examiners as names only.&#x20;

## 2.2 Status model surfaced to examiners

Two orthogonal dimensions are exposed for clarity:

- **assessmentStatus:** `DRAFT | SUBMITTED | REOPENED` (examiner’s working/lock state).
- **releaseStatus:** `NOT_RELEASED | RELEASED` (admin publication state, read‑only to examiner).

**UI display precedence:**

- If `assessmentStatus=REOPENED` → show **Reopened**.
- Else if `releaseStatus=RELEASED` → show **Released**.
- Else show **Draft** or **Submitted**.

> This reflects the PRD’s publish step while keeping the marking state independent. (Examiners don’t need dates; UI won’t display them.)&#x20;

**关于 assessment Id, 无论是 examiner marking 的 userflow 还是这个看 results history 的 user flow 都应该针对的是一个 id，原先打算用 sessionId 的因为之前一个 session 就只会有一组人或者一个人，但是由于 client meeting 后 client 说一个 session 会有 group capacity 也就是说可能会有多个 group 同时在这个 session 参加同一个 session 的 assessment（测试/考试），也就是可能需要多一个 id 也就是 sessionid 底下再多一个 assessmentid 来区分开同一个 session 不同 group 的打分（个人理解，可能不对，需要 discussion） **

## 2.3 DTOs (Updated)

```ts
// Compact rows for list
type AssessmentHistoryItemDTO = {
  assessmentId: string;
  assignment: {
    id: number;
    name: string;
    type: "individual" | "group" | "mixed";
    courseId?: number;
    courseCode?: string; // e.g., COMP30023
    courseName?: string; // e.g., Computer Networks
  };
  session: {
    id: number;
    start: string;
    end: string;
    timezone: string;
    durationMinutes: number;
    venue?: {
      venueId: number;
      name?: string;
      building?: string;
      room?: string;
    };
    coExaminers: Array<{ examinerId: number; name: string }>;
  };
  entity: {
    kind: "GROUP" | "INDIVIDUAL";
    group?: { groupId: number; groupName?: string; memberCount?: number };
    student?: { studentId: number; name: string }; // name required for display
  };
  assessmentStatus: "DRAFT" | "SUBMITTED" | "REOPENED";
  releaseStatus: "NOT_RELEASED" | "RELEASED";
  revision: number; // latest working or submitted revision number
  examinerScorePct1dp?: number; // your mark for this entity, % at 1 dp
  isEditable: boolean; // true iff assessmentStatus = REOPENED and owned by this examiner
};

type AssessmentReadDTO = {
  assessmentId: string;
  assignment: {
    id: number;
    name: string;
    type: "individual" | "group" | "mixed";
    courseId?: number;
    courseCode?: string;
    courseName?: string;
    rubricMeta?: { name: string; totalPoints: number };
  };
  session: {
    id: number;
    start: string;
    end: string;
    timezone: string;
    durationMinutes: number;
    venue?: {
      venueId: number;
      name?: string;
      building?: string;
      room?: string;
    };
    coExaminers: Array<{ examinerId: number; name: string }>;
  };
  assessmentStatus: "DRAFT" | "SUBMITTED" | "REOPENED";
  releaseStatus: "NOT_RELEASED" | "RELEASED";
  revision: number;
  // Frozen rubric snapshot for exact historical rendering
  rubricFrozen: {
    rubricId?: string | number;
    version?: number;
    criteria: Array<{
      criterionId: string;
      text?: string; // criterion description
      // Either percentage weighting or explicit max points is provided
      weightPct?: number; // e.g., 30 for 30%
      maxPoints?: number; // e.g., 20
      appliesTo?: 'GROUP' | 'INDIVIDUAL' | 'BOTH';
      levels: Array<{
        levelId: string;
        levelLabel?: string;
        levelRange: { min: number; max: number };
        description?: string;
      }>;
    }>;
  };
  entities: Array<{
    kind: "GROUP" | "INDIVIDUAL";
    groupId?: number;
    studentId?: number;
    studentName?: string; // required for display in versions/read-only
    overallFeedback?: string;
    notes?: string; // examiner-private; included for read
    items: Array<{
      criterionId: string;
      levelId: string;
      points?: number;
      levelLabel?: string;
      levelRange?: { min: number; max: number };
      comments?: Array<{
        source: "predefined" | "custom";
        text: string;
        predefinedId?: string;
      }>;
    }>;
    computed?: {
      rawPoints?: number;
      examinerScorePct1dp?: number;
    };
  }>;
  submittedAt?: string; // submit time of current/selected version
  updatedAt: string;
};

type AssessmentVersionDTO = {
  version: number; // 1..N (submitted revisions only)
  status: "SUBMITTED" | "REOPENED" | "DRAFT";
  at: string; // submit or reopen timestamp, used on timeline
  by: { role: "ADMIN" | "EXAMINER"; id: number; name?: string };
  // minimal preview; detail is retrieved via read endpoint with version=N
  summary?: {
    examinerScorePct1dp?: number;
    entityKinds: Array<"GROUP" | "INDIVIDUAL">;
  };
};
```

> DTOs intentionally echo your current **Assessment** shapes used by the marking UI and contracts (rubric items, comments, notes), so the frontend can reuse **RubricTable** and **TotalsPanel** in read‑only mode. &#x20;

## 2.4 Endpoints

### 2.4.1 List my results (paged)

`GET /api/examiners/{examinerId}/results`

**Query (all optional):**
`assignmentId` (number|number\[]), `status` (`DRAFT|SUBMITTED|REOPENED|RELEASED`), `entityKind` (`GROUP|INDIVIDUAL`), `from` (YYYY‑MM‑DD), `to` (YYYY‑MM‑DD), `q` (name/id), `page` (default 1), `pageSize` (default 20, max 100), `sort` (`sessionStart|assignmentName|score`), `order` (`asc|desc`)

**200 OK**

```json
{
  "success": true,
  "code": "OK",
  "data": {
    "page": 1,
    "pageSize": 20,
    "total": 125,
    "items": [
      /* AssessmentHistoryItemDTO[] */
    ]
  }
}
```

**Notes**

- Returns **only this examiner’s** items.
- `durationMinutes = end - start` (server computes).
- Filtering by `status=RELEASED` means `releaseStatus=RELEASED` (irrespective of assessmentStatus).&#x20;

### 2.4.2 Read detail (latest working by default, or a specific submitted version)

** 之所以需要 version 来记录版本快照原因是有可能存在情况 examiner 打分 submit 了 course admin 又去改评分 rubric。需要跟后端商量一下怎么解决这个问题。也可以先不管这个。。。**
`GET /api/examiners/{examinerId}/results/{assessmentId}?version=latest`

- `version`: `latest` (default) or integer (`1..N`) to fetch an immutable submitted snapshot.
- Returns **AssessmentReadDTO** (notes included for examiner; UI won’t print/export). Includes `rubricFrozen` with full criteria/levels for versioned rendering.
- If `assessmentStatus=REOPENED`, the payload represents the **working copy**; previous submitted versions are discoverable via `/versions`.

**Errors**: `403 FORBIDDEN`, `404 NOT_FOUND`

### 2.4.3 Versions timeline

`GET /api/examiners/{examinerId}/results/{assessmentId}/versions`

**200 OK**

```json
{
  "success": true,
  "code": "OK",
  "data": {
    "versions": [
      /* AssessmentVersionDTO[] */
    ]
  }
}
```

> Used to render the Versions tab. Keeps a clean audit trail consistent with your marking flow (Admin reopen → new revision on next submit).&#x20;

> **Removed (per your decision):** examiner print/PDF/export endpoints. (Admins retain CSV/exports elsewhere.)&#x20;

## 2.5 Snapshotting (near‑term best practice)

Your backend currently stores rubric as a **single JSON** with meta + criteria + levels. For stable historical rendering:

- **When submitting**, persist a **minimal snapshot** with each version containing: frozen `levelLabel`, `levelRange`, criterion text, and any computed aggregates used by display.
- If full snapshotting isn’t yet implemented, **materialize a frozen view** for `version=N` by resolving against the rubric JSON **as it existed at submit time** (e.g., rubricVersionId).
- Expose `rubricFrozen` with full criteria/levels, plus `levelLabel/levelRange` alongside IDs in read calls for versioned reads to avoid drift.
  Frontend renders exactly what the examiner saw at submission time, including criterion weights or max points as configured by Admin.

## 2.6 Validation, security, performance

- **AuthZ:** only the owning examiner can access their records; co‑examiner marks are never returned.&#x20;
- **Pagination:** index on `(examinerId, session.start)`; paging defaults 20 items; sort stable.
- **ETag/Last‑Modified:** optional for detail and versions to reduce payload churn.
- **Error examples:** `FORBIDDEN`, `NOT_FOUND`, `INVALID_VERSION`.

---

# 3) Integration Checklist (tailored to your repo)

> Follows your foldering, hooks, service patterns, and Shadcn UI.&#x20;

## 3.1 Routes & pages

- **`app/examiner/results/page.jsx`** — list + filters + table/cards.
- **`app/examiner/results/[assessmentId]/page.jsx`** — detail with tabs (`Summary`, `Rubric`, `Notes`, `Versions`) and conditional `Resume in Marking UI` button.
  - Support `?version=N` query param to view a specific submitted version.

## 3.2 Services (Axios via `apiClient.js`)

Create **`services/examinerResultsService.js`**:

```js
// pseudo-signatures aligning to API §2.4
listResults(examinerId, params); // GET /api/examiners/{id}/results
getResultDetail(examinerId, assessmentId, ({ version = "latest" } = {}));
// GET /api/examiners/{id}/results/{assessmentId}
getResultVersions(examinerId, assessmentId);
// GET /api/examiners/{id}/results/{assessmentId}/versions
```

Leverage your existing client and wrapper `{ success, code, data }`.&#x20;

## 3.3 React Query hooks

Add under **`hooks/examiner/results/`**:

- `useExaminerResultsQuery(params)` → wraps `listResults`.
- `useExaminerResultDetailQuery(assessmentId, opts)` → wraps `getResultDetail`.
- `useAssessmentVersionsQuery(assessmentId)` → wraps `getResultVersions`.

Naming/structure consistent with `useMarkingSessionQuery` family.&#x20;

## 3.4 Components (reuse + light new)

- **Reuse**

  - `components/examiner/assessment/RubricTable.jsx` in **read‑only** mode (prop `disabled={true}`); pass frozen `levelLabel`/`levelRange` if available.&#x20;
  - Existing status badge styles from Examiner session list for consistent chips.&#x20;

- **New** under `components/examiner/results/`

  - `ResultsFilters.jsx` — assignment picker, status, date, search.
  - `ResultsTable.jsx` — responsive table/cards, shows **Your mark** (1 dp), **Status** chips, and **Duration**.
  - `ResultDetailHeader.jsx` — identity (courseCode, courseName, assignment), session, co‑examiners, status, `Resume` button (if Reopened).
  - `ResultTabs.jsx` — tabs scaffold; Rubric tab reuses examiner `RubricTable.jsx` in read‑only, passing `rubricFrozen.criteria` and selected levels from entity items.
  - `VersionsTimeline.jsx` — vertical timeline using `AssessmentVersionDTO`.

## 3.5 State & UX notes

- Default include **Drafts** in list; status filter chips: `All | Draft | Submitted | Released | Reopened`.
- **Status precedence** (UI): `Reopened > Released > Submitted > Draft` (as §2.2).
- **Mixed** list rows: render **one row per entity** (group + each student), grouped visually by session/assignment.
- **No export/print** buttons in examiner UI (ensure any placeholders from marking UI are hidden).&#x20;

## 3.6 Testing scenarios

- **Draft visible** → open detail → shows read‑only rubric & notes; no resume button.
- **Submitted** (not released) → correct status chip; versions shows Rev 1.
- **Released** → chip shows Released (no dates).
- **Reopened** → banner + `Resume in Marking UI` link; versions includes prior submitted rev(s).
- **Mixed** → rows for group + each student; detail switcher works; `%` to **1 dp** everywhere.

---

> Any remaining ambiguity (implementation detail): If an assessment is **Released** and later **Reopened**, this spec treats **Reopened** as overriding the display (**Reopened** chip) and implies `releaseStatus=NOT_RELEASED` until it’s submitted again and re‑released by Admin. This is consistent with “released results must reflect the latest submitted revision.” (Policy can be revisited if you prefer “Released + Reopened” dual chips, but the single‑chip precedence keeps the UI simple.)
