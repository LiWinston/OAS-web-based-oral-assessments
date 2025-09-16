# Sprint 8 — Planning (Starting 5 Sep 2025)

**Sprint Goal:** Make scheduling **release-ready** — correct model for sessions/venues/Zoom, enforce validations/gating, polish CSV & Release UX, and support targeted edits (single-session delete).

## Must-Have (Commit)
1. **Validation pack**
   - End < Start date; criteria/weight totals; pre-release blockers surfaced and enforced.
2. **Zoom capacity → parallel sessions**
   - Represent capacity as **N distinct sessions** at the same time (one per group/link).
3. **Session management**
   - Single-session **delete/disable** in a generated series; minimal mass-edit.
4. **Release hard-gating + indicators**
   - Block release if unstaffed/invalid; show “staffed/total” and list of blockers.
5. **CSV re-use & robustness**
   - Picker to select previously uploaded CSV; mapping/help; clear error handling.

## Should-Have (Stretch)
- **Overlap constraints** (resource-aware conflicts for venue/examiner).
- **Course search (backend)** refinement (Yanqing).
- **Navigation polish** after assignment creation (guided next steps).

## Acceptance Criteria (Samples)
- Creating an assignment with **end < start** shows inline error and **blocks save**.
- Setting Zoom capacity to **3** produces **three** bookable sessions at the same datetime.
- Attempting Release when any session is **unstaffed** shows a blockers list and **disables** the Release action.
- Deleting one generated session removes it without regenerating the series; audit shows it as **disabled**.
- On assignment setup, “Upload CSV” offers **“Select existing CSV”** from prior assignments; wrong columns trigger a clear mapping/error prompt.

## Risks & Mitigations
- **Model change ripple** → pair FE/BE on sessions API; add migration note.
- **Edge-case overlaps** → write unit tests for venue/examiner conflict rules.
- **CSV variability** → include sample templates & mapping UI.

## Owners (High Level)
- **BE:** Caspar (sessions/overlap/gating), Benyuan (delete/disable, CSV), Yanqing (search).
- **FE:** Ian (Release UI/validation/navigation), Nemo (Zoom sessions list, indicators).
- **QA:** Whole team using test checklist on each flow.
