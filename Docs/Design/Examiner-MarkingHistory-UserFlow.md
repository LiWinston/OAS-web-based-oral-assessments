# 1) User Flow — **Examiner: View Students’ Marking Results History**

## 1.1 Goals & non‑goals

** Goals **

- Give examiners a **read‑only** history of **their** assessments across sessions/assignments, including **Drafts**. If the status is draft navaigate examiner back to the marking interface to continue marking.
- Provide per‑item **detail pages** with rubric breakdown and a **version timeline** (when Admin reopens).
- Show clear **status** chips with the sequence: **Draft → Submitted → Released / Reopened** (no dates displayed).
- Respect privacy: examiners see **only their own marks** (“Your mark”), **co‑examiner names** (no others’ scores).

**Non‑goals**

- No cross‑assignment analytics; no CSV or PDF export in examiner UI; no visibility of other examiners’ raw marks. (Exports remain Admin‑only; analytics are out of scope.)&#x20;

## 1.2 Navigation & IA

- **Entry:** `**/examiner/results**` (new list page).
- **Detail:** `**/examiner/results/[assessmentId]**` (read‑only view with tabs).
- **Reopen hand‑off:** When a submission is **REOPENED** by Admin, the detail page surfaces a **“Resume in Marking UI”** link to `**/examiner/assessment/[sessionId]**` (existing route). &#x20;

## 1.3 Status & visibility rules (per your decisions)

- **Score shown:** **Your mark** (this examiner’s computed %), rounded to **1 decimal place** everywhere.
- **Status chips (display only, no dates):**

  - **Draft** — saved but not submitted.
  - **Submitted** — finalized by the examiner; not yet released.
  - **Released** — results published by Admin (examiner sees the label only; no released date displayed).
  - **Reopened** — Admin created a new editable copy; prior submissions remain visible as immutable snapshots.

- **Co‑examiners:** names only, no marks.
- **Duration:** **session length** (end − start).
- **No print / no CSV** in examiner UI.
  (All above reflect the PRD and your clarifications.) &#x20;

> _Note on “Final (aggregated) score”_: **Not shown** in this feature. If policy changes later, the UI/API can surface `finalScorePct1dp` alongside “Your mark”. (Future extension; omitted for MVP.)&#x20;

## 1.4 List page

**Filters (top bar or left rail):**

- Assignment (multi‑select), Status (`Draft | Submitted | Released | Reopened`), Entity (`Individual | Group`), Session date range, Search (`student name/id`, `group`, `assignment`).

**Columns:**

1. **Student / Group** — pill shows `INDIVIDUAL`/`GROUP`.
2. **Assignment** — name.
3. **Session** — date & time + **Duration** + venue label.
4. **Co‑examiners** — names list (no scores).
5. **Status** — chips as above.
6. **Your mark** — `% (1 dp)`; for **mixed**, show **Group** and **per‑student** marks inline (compact).
7. **Actions** — `View details` (always), `Resume` (only when **Reopened**).

**Default sort:** `sessionStart desc`.
**Drafts:** **Included by default** (your request).
**Empty states:** “No results yet” / “No matches”.
**Cards vs table:** Table at desktop; stacked cards for narrow widths; reuse your Shadcn table styles.&#x20;

## 1.5 Detail page

**Header (sticky):**

- **Identity**: student/group (for mixed, chip select lets you jump to Group vs each Student).
- **Assignment** & **Session** (time, **Duration**, venue).
- **Examiners**: “You + \[co‑examiner names]”.
- **Status chip**: Draft / Submitted / Released / Reopened.
- **Action (conditional)**: `Resume in Marking UI` → `/examiner/assessment/[sessionId]` when **Reopened**.&#x20;

**Tabs:**

1. **Summary**

   - **Your mark** (`xx.x%`) at current selection (Group or selected Student in mixed).
   - **Overall feedback** (student‑visible post‑release).
   - For **mixed**, show a compact **weighting** explainer consistent with your `TotalsPanel` copy.&#x20;

2. **Rubric breakdown**

   - Read‑only **RubricTable** rendering (criteria, selected level, level range, points, comments). Matches current marking UI’s structure for familiarity.&#x20;

3. **Notes (private)**

   - Examiner’s internal notes; visible to examiner/admin. (No print/export in examiner UI per your decision.)

4. **Versions**

   - Timeline showing `Draft saved`, `Submitted (Rev N)`, `Reopened`, etc., with actor (“Admin” for reopen). Selecting a version shows its **immutable snapshot** (read‑only).
   - Until backend snapshotting is implemented, server should return a **frozen view** per submitted revision (see API §2.5).&#x20;

## 1.6 Mixed assignments

- **List:** show **one row per entity** (one for the Group result; one per Student).
- **Detail:** entity switcher (Group + per‑student chips); each selection shows its **Summary** and **Rubric**.
- **Computation:** per entity, compute examinerScore based on rubric and assignment component weighting as already done in `TotalsPanel`.&#x20;

## 1.7 Edge cases & messages

- **Drafts:** details clearly labeled; prompt to complete submission via marking UI.
- **Reopened:** banner explains “Reopened for correction — edit in the marking UI”; versions tab retains prior submitted snapshots.
- **Rubric changed after submission:** non‑blocking banner; snapshots remain stable. (See API snapshot guidance.)

## 1.8 Accessibility & UX

- Keyboard navigable tabs and timeline; semantic lists; chip groups are buttons with ARIA pressed states.
- Clear tooltips on disabled actions (e.g., submit edits locked for submitted/released items).
- Truncation with tooltips for long group names and venues.

---
