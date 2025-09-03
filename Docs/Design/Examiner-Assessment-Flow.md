## Examiner Assessment — End‑to‑End Flow (MVP+)

This document defines the **Examiner assess students’ assignments** flow for OAS. It aligns with the existing rubric system, schedule/booking model, and our project PRD. It follows the same structure and tone as our “Timeslot Self‑Assignment” flow doc so that the team can implement consistently across features.

> **Scope position**: This flow starts when an Examiner opens the marking interface for a student/group **in a session they’re assigned to** and **with an active booking**. It ends when the Examiner **submits** or **saves a draft** of the assessment. Results are stored at the assignment scope and are visible to all Course Admins and examiners who have rights on this assignment (read‑only after submission; admins can reopen).

### 1) Goals & Non‑Goals
**Goals**
- Provide a clear, low‑friction UI for marking during/after an oral exam.
- Ensure consistent scoring via **assignment‑level rubric** with **non‑overlapping performance level ranges** and **predefined comments** grouped by level.
- Support **group**, **individual**, and **mixed** assignments (group + individual component weighting) with minimal complexity.
- Allow **Save Draft** at any time; **Submit** to lock Examiner’s assessment (Admin can reopen).

**Non‑Goals (MVP)**
- No student release/appeal workflow here (admin/export feature).
- No live co‑authoring between examiners (each examiner’s submission is independent for MVP; aggregation policy is an admin/reporting concern).
- No hard marking deadline enforcement (per requirements).

### 2) Roles & Permissions
- **Examiner**: Can view sessions they’re assigned to; can create/update **their own** assessment for a booked session; can **save draft** or **submit**; can add assignment‑scoped predefined comments (cannot edit/delete others’ comments).
- **Course Admin**: Full visibility; can manage rubric and **predefined comments** (view/add/edit/delete); can **reopen** submitted assessments for correction; sees results in admin reports.
- **Student**: Not involved in this UI. Notes are internal (not visible to students).

> Rubric data is configured on the assignment (meta + criteria + performance levels), and the frontend already enforces **no overlapping level ranges** and weight = 100% for criteria. fileciteturn0file6 fileciteturn0file8 fileciteturn0file9 fileciteturn0file10

### 3) Preconditions
- Examiner is **assigned** to the timeslot/session (self‑assignment/admin assignment). Related schedule & booking APIs exist for examiner schedule and student booking. fileciteturn0file11
- The session has an **active booking** (student or group). fileciteturn0file11
- The assignment has a configured **rubric** (meta + criteria + levels). (Frontend model maps to backend `rubricMetaInfo` + `rubricsInfo`.) fileciteturn0file6 fileciteturn0file11

### 4) Key Concepts
- **Assessment** (per Examiner × per Session × per Entity):
  - **Entity**: `GROUP` or `INDIVIDUAL(studentId)` when mixed or individual components exist.
  - **Status**: `DRAFT` | `SUBMITTED` | `REOPENED` (admin only).
  - **Items**: One entry per rubric **criterion** with selected **performance level** and optional **points** and **comments**.
  - **Notes**: Internal only (visible to admins/examiners; not student‑facing).
  - **Overall Feedback**: Optional text for the entity.
- **Rubric** (assignment‑level):
  - **Meta**: `name`, `description`, `totalPoints`.
  - **Criteria**: `{ id, description, weight, markingScale }` with **Performance Levels** `{ description, minPoints, maxPoints }` (non‑overlap validation in UI). fileciteturn0file8 fileciteturn0file9
  - **Predefined Comments**: Assignment‑scoped, grouped by **criterion + performance level**. Examiners can **view + add**; Admins can **view + add + edit + delete**. fileciteturn0file7

- **Mixed Assignment** minimal model (MVP):
  - Add `appliesTo` on each criterion: `GROUP` | `INDIVIDUAL` | `BOTH`.
  - Assessment collects **group‑level items** for `GROUP/BOTH`, and **per‑student items** for `INDIVIDUAL/BOTH`.
  - Assignment stores **component weights**, e.g., `groupWeight: 0.8`, `individualWeight: 0.2`. Final per‑student score = `groupScore * groupWeight + individualScore(student) * individualWeight` (see Open Questions).

### 5) High‑Level Journey
1) **Open Marking Interface**  
   Examiner opens the scheduled session they’re assigned to; the page shows: student or group id/members, session time, co‑examiners, and a rubric panel with criteria and performance levels. For mixed/group, the UI provides a toggle or tabs to mark **group** and each **individual**. (Prototype baseline supports toggle and tabs.)

2) **Select Levels & Enter Feedback**  
   For each criterion, Examiner selects a **performance level** (UI ensures level ranges are visible and non‑overlapping). They may:
   - Enter **optional numeric points** (within the selected level range) if the scale is numeric.
   - Add **predefined comments** (via dropdown/autocomplete per level) and **custom comments**; optionally add the custom text to the **assignment comment library** for that criterion/level. fileciteturn0file7

3) **Notes & Overall Feedback**  
   Examiner fills **Overall Feedback** (visible to admins/students based on release policy) and **Internal Notes** (visible to admins/examiners only; e.g., “Needed prompting on Q3”).

4) **Save Draft**  
   Examiner can save a draft at any time. Drafts appear in the Examiner’s “Sessions” list with a **Draft** badge. Drafts are editable.

5) **Submit**  
   When satisfied, Examiner **submits**. The assessment becomes **read‑only** to that Examiner. An admin may **reopen** if a correction is needed (then status = `REOPENED`, editable again and a new submission version is saved on submit).

6) **Navigate to Next**  
   Provide actions: “Back to Schedule” and **Next Session** (next session the Examiner is assigned & booked).

### 6) Detailed UI Model (per Session Context)
- **Header**: Student/Group info, session time/venue, examiner(s), timer (optional).
- **Entity Switcher** (mixed/group): “Group” tab + one tab per student; or a toggle and per‑student selector.
- **Rubric Panel** (Examiner view mirrors preview): criteria with weight, levels with ranges & descriptions, optional marking scale indicator, and **predefined comments** block. fileciteturn0file10
- **Validation & Computation**:
  - **Criteria weights** sum to 100% (frontend already enforced on configuration). fileciteturn0file6
  - **Level ranges** must not overlap (frontend validation already in place). fileciteturn0file8
  - For each criterion: compute `criterionPoints` based on selected level and optional point entry. Aggregate to `entityScore` with weight; then compute per‑student final score using component weights (for mixed).
- **Actions**: **Save as Draft**, **Complete Assessment**, **Print Preview** (optional), **Cancel**.

### 7) States & Transitions
- **DRAFT** → **SUBMITTED** (Examiner submit)  
- **SUBMITTED** → **REOPENED** (Admin only) → **SUBMITTED**  
- Versioning: increment `revision` on each submit; retain immutable snapshots for audit.

### 8) Edge Cases & Rules
- Examiner can only mark sessions **they’re assigned to** and that are **booked** (or marked as **attended** if live entry after session). fileciteturn0file11
- **Multiple Examiners** per session: Each submits independently (MVP). Aggregation (e.g., average) is deferred to admin/reporting; we store separate assessments by `examinerId`. (See Open Questions).
- **Mixed**: If some individuals are absent/unmarked, system allows partial submission only if policy permits; otherwise prompt to save draft.
- **No deadlines**: There is **no hard deadline** for examiners to finish assessing (per requirement).
- **Permissions on comments**: Examiner may **add** predefined comments; **edit/delete** is Admin only. fileciteturn0file7
- **Rubric evolution**: If rubric changes after drafts exist, surface a banner “Rubric updated on <date> — verify before submission” and lock submit until each criterion is revisited.

### 9) Accessibility & UX Notes
- Keyboard and screen‑reader friendly rubric navigation; aria‑live feedback for validation.
- Clear badges for `Draft` / `Submitted`.
- Inline **reasons** for disabled actions (e.g., can’t submit because **criterion X missing selection**).

### 10) Success Metrics
- Examiner completes an assessment in ≤ **5 minutes** typical case.
- **Zero** overlapping level ranges at config; **100%** criteria coverage at submit.
- **< 2%** reopen rate due to UX confusion.

### 11) Data Visibility & Storage
- Stored under the **assignment** domain and visible to **Course Admins** and **authorized examiners** on that assignment. (#1 input)
- **Notes** are internal (visible to admins/examiners only). (#8/PRD)
- **Predefined comments** are **assignment‑scoped** and grouped by performance levels for each criterion. (#10 input; admin full management; examiner add‑only). fileciteturn0file7

### 12) Open Questions (needs confirmation)
1) **Level → points mapping** on “descriptive” scales: Should the system take `min`, `max`, or **midpoint** of the selected level as default points (with optional manual override within the range)? (Proposed: default **midpoint**; allow override within range.)
2) **Mixed aggregation**: Confirm final formula and rounding — per‑student final = `groupScore * groupWeight + individualScore * individualWeight`. Are weights stored on the assignment, and are they enforced to sum to 1.0?
3) **Multiple examiners aggregation**: How should the course finalize a single grade when n>1 examiners marked the same entity? (MVP leaves to reporting; future could average, median or designated “lead examiner”.)
4) **Reopen policy**: Who can reopen (admin only assumed), and do we keep the prior submission as immutable snapshot for audit?
5) **Partial submission** rules for mixed/group when an individual tab is unmarked (save draft vs block submit).

---

**References used**: rubric configuration & preview components and validation rules; current assignment schema carrying `rubricMetaInfo`/`rubricsInfo`; existing schedule/booking/self‑assignment endpoints for prerequisites. fileciteturn0file6 fileciteturn0file7 fileciteturn0file8 fileciteturn0file9 fileciteturn0file10 fileciteturn0file11
