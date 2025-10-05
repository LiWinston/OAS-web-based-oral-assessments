# Mixed Rubric Configuration Refactor

**Status**: Draft  
**Last Updated**: 2025-09-25  
**Owners**: Frontend Guild (Codex), Backend Services Team

## 1. Background & Problem Statement
- The rubric configuration page currently assumes a single rubric shared across all criterion types of an assignment. Mixed assignments (individual + group) cannot assign separate criteria to each criterion type, preventing accurate examiner marking and downstream score aggregation.
- Backend APIs (see `RubricMetaInfo` / `RubricsInfoDto` in Swagger) lack metadata to distinguish whether a criterion targets individual or group assessment. They also expose a `scaleType` field that the frontend no longer needs (all scoring is numeric/points-based).
- Customers want the admin experience to allow configuring which criterion type (`INDIVIDUAL` vs `GROUP`) each criterion belongs to, while retaining the existing "weighting basis" UI toggle (percentage vs points) for display purposes only.

## 2. Goals & Non-Goals
### Goals
1. Allow course admins to configure mixed assignments by assigning each rubric criterion to an `INDIVIDUAL` or `GROUP` criterion type (persisted as the `component` field).
2. Maintain parity for existing individual-only or group-only rubrics with minimal backend migration overhead.
3. Preserve predefined comment behaviour at the performance-level granularity.
4. Provide clear validation feedback when per-type weights do not sum correctly (per basis).
5. Document backend changes required so both teams implement the refactor consistently.

### Non-Goals
- Changing the persistence model for predefined comments beyond the existing `preDefinedComment[]` per level.
- Altering assignment creation workflows outside of the rubric step.
- Implementing non-numeric grading scales (letter/descriptive display remains optional client-side only).

## 3. High-Level Solution Outline
- **Backend**: Extend `RubricsInfoDto` with an explicit `component` attribute (enum `INDIVIDUAL`/`GROUP`) while keeping existing fields for backwards compatibility. No new top-level weighting object is necessary; per-type weight totals are derived from the sum of criterion weights.
- **Frontend**: Update the rubric builder to capture criterion `title`, `description`, and `component` while presenting the field to users as "Criterion Type". Show per-type weight totals. Remove the "Scale Type" selector and reuse the space for the criterion-type switcher. Downstream examiner and results UIs filter criteria by criterion type and compute totals accordingly.

## 4. Backend Changes
### 4.1 Contract Additions
| Field | Location | Type | Required | Notes |
|-------|----------|------|----------|-------|
| `component` | `RubricsInfoDto` | enum `INDIVIDUAL`/`GROUP` (string) | Yes | Determines which criterion type (displayed as "Criterion Type" in the UI) uses the criterion. Existing data without this field should default to `BOTH` or be migrated—frontend will prompt for selection. |
| `title` | `RubricsInfoDto` | string | Optional | Human-readable title; if omitted, clients may derive from `description`. |
| `criterionId` | `RubricsInfoDto` | string | Optional but recommended | Stable identifier used by clients when duplicating/editing criteria. |

> Note: `scaleType` can remain nullable; frontend will ignore it. Backend may hardcode `"points"` for legacy clients.

### 4.2 Validation Rules
- For `weightBasis = "percentage"`: the sum of `weight` for criteria belonging to the **entire rubric** must equal `100`. Frontend will also show per-criterion-type rollups; backend may optionally enforce per-type totals if desired.
- For `weightBasis = "points"`: the sum of `weight` (interpreted as absolute points) must equal `rubricMetaInfo.totalPoints`.
- `component` values must align with assignment type: individual assignments only accept `INDIVIDUAL`; group assignments only accept `GROUP`; mixed assignments accept both. Backend should reject invalid combinations.
- Allow zero-weight criterion types (i.e., all criteria assigned to one type) but return warnings if that is considered misconfiguration.

### 4.3 Final Rubric Response Example
```json
{
  "rubricId": 42,
  "rubricMetaInfo": {
    "name": "Project Demo Rubric",
    "description": "Mixed assessment rubric",
    "totalPoints": 100,
    "weightBasis": "percentage"
  },
  "rubricsInfo": [
    {
      "criterionId": "crit-communication",
      "title": "Communication",
      "description": "Clarity, structure, interaction",
      "component": "INDIVIDUAL",
      "weight": 40,
      "scaleType": "points",
      "performanceLevel": [
        {
          "description": "Excellent",
          "startPoint": 36,
          "endPoint": 40,
          "preDefinedComment": [
            "Clear and concise delivery",
            "Handled Q&A with confidence"
          ]
        },
        {
          "description": "Good",
          "startPoint": 28,
          "endPoint": 35,
          "preDefinedComment": [
            "Structure was sound but pacing fluctuated"
          ]
        }
      ]
    },
    {
      "criterionId": "crit-analysis",
      "title": "Analysis Depth",
      "description": "Quality of requirement analysis",
      "component": "GROUP",
      "weight": 60,
      "scaleType": "points",
      "performanceLevel": [
        {
          "description": "Exemplary",
          "startPoint": 54,
          "endPoint": 60,
          "preDefinedComment": []
        },
        {
          "description": "Competent",
          "startPoint": 45,
          "endPoint": 53,
          "preDefinedComment": []
        }
      ]
    }
  ]
}
```

### 4.4 Required Backend Work
1. Update DTOs/entities for rubric persistence to include `component`, `title`, and optional `criterionId`.
2. Migrate existing rubrics to populate `component` appropriately (e.g., default to assignment type, or set `INDIVIDUAL` and rely on admins to adjust).
3. Adjust validation in assignment update endpoints (`PUT /api/assignments/{id}`) to enforce allowed criterion-type combinations and weight totals.
4. Ensure downstream consumers (examiner assessment endpoints, results endpoints) propagate the new fields so frontend views have consistent data.
5. Update Swagger documentation (`RubricsInfoDto`) to reflect new fields and mark `scaleType` as optional/legacy.
6. Communicate any migration scripts or defaulting strategy to the frontend team before deployment.

## 5. Frontend Changes
### 5.1 Data & Service Layer
- Extend rubric state shape to include `title` and `component` per criterion. Generate a stable `criterionId` when creating new criteria (e.g., `uuidv4`). Surface `component` in the UI as "Criterion Type".
- When loading existing rubrics, default missing `component` to:
  - `INDIVIDUAL` if assignment type is individual.
  - `GROUP` if assignment type is group.
  - `BOTH` (flag) or prompt user to choose if assignment type is mixed.
- Update `rubricService.createRubric` / `updateRubric` payload mapping to include the new fields and omit `scaleType` if unnecessary (or keep for compatibility by hardcoding `"points"`).

### 5.2 Admin Rubric Builder UI
- Add text input for criterion **Title** in the expanded panel header (current static label becomes editable).
- Replace the existing "Scale Type" selector with a **Criterion Type** selector (`INDIVIDUAL` / `GROUP`). Provide inline helper text summarising what each option means.
- Display per-criterion-type weight summaries above the criteria list, e.g.:
  - `Group: 60% ✅` / `Individual: 40% ✅`
  - Show warning states when totals differ from expected basis (80% vs 20%, etc.).
- Retain the top-level "Weighting Basis" dropdown purely for presentation. Validation logic should map `percentage` → sum=100, `points` → sum=`totalPoints`.
- Maintain existing predefined comment modal/inputs at the performance level.

### 5.3 Validation & UX
- Disable save when overall weight total fails validation; highlight criterion-type totals causing issues.
- Offer both criterion-type options by default; recommend (but do not lock) the type implied by the assignment.
- When duplicating a criterion, copy criterion type, `title`, `description`, `weight`, and all performance levels/comments.

### 5.4 Downstream Consumers
- **Examiner Marking**: Filter criteria by criterion type (persisted as `component` field in backend); render separate tabs/sections for group vs individual. Update weighted score calculation to use type-specific totals.
- **Admin & Student Results**: Include new metadata in breakdowns. If a criterion type has zero weight, show "Not assessed" rather than zero score. Update tooltip/labels to explain weighting basis.
- **Global Search / Previews**: Where rubric summaries appear, include criterion-type annotations so admins understand the structure at a glance.

### 5.5 Migration Handling
- When a rubric loads with missing criterion type (backend `component` field), display a banner prompting admins to assign criterion types before saving.
- Provide a one-time automatic guess based on assignment type to reduce manual effort.

### 5.6 QA & Testing
- Regression tests for rubric creation/editing (percentage & points modes).
- Mixed assignment end-to-end: configure rubric → examiner marking (group + individual) → admin review → student results.
- Verify predefined comments still save per level and appear in examiner dropdowns.

## 6. Timeline & Dependencies
1. Backend implements DTO changes and deploys behind a feature flag or by versioning the API.
2. Frontend consumes the new schema once available; until then we can stub `component` in mocks for UI work.
3. Coordinate data migration (default criterion-type assignments) before rolling out to production courses.

## 7. Open Questions
- Do we need an explicit `BOTH` criterion type for legacy rubrics? Recommendation: no—force admins to choose `INDIVIDUAL` or `GROUP` when editing mixed assignments.
- Should backend enforce per-criterion-type totals? Current plan is to enforce only overall totals and let frontend guide admins.

## 8. Next Steps
- Backend: confirm timeline for DTO/schema update and share migration plan.
- Frontend: ✅ **COMPLETED** - UI adjustments implemented, service layer extended with criterion type support (frontend uses `criterionType` internally, maps to backend `component` field).
- QA/PM: update acceptance criteria for mixed assignments to cover the new configuration flow.
