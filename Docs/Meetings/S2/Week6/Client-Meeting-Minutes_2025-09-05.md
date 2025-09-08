# Client Meeting Minutes — 5 Sep 2025

**Attendees:** Hasti Samadi (Client), Geela Chee (Mentor), Ian Chi (PO/FE), Haocheng “Caspar” Li (BE), Yunpeng “Nemo” Xiong (FE), Benyuan Wang (BE), Yanqing Shi (BE)

## Agenda
- End-to-end demo: course → assignment → staffing → session generation → release → student booking
- Clarify **sessions vs venues vs capacity** (including Zoom)
- CSV import (examiners/students) and re-use from prior assignments
- Validation, release rules, and UI feedback

## Key Requirement Clarifications / Changes
- **Date validation**
  - If **end date < start date**, the form must **reject** with a clear error.
  - Default time can be pre-filled (e.g., midnight) but **admin can change** it.
- **Session model & capacity (venues and Zoom)**
  - A “session” occurs at a **time block** and may exist in **parallel across multiple venues** (rooms **or** Zoom links).
  - **Overlaps are acceptable** when venues/examiners differ; disallow if they conflict for the **same** examiner/venue.
  - For **Zoom-based** assessments (no physical venue), capacity must appear as **distinct session instances** (i.e., if capacity = 3, show **3 separate sessions** at the same time, one per group/Zoom link). Avoid a single card with “capacity=3” ambiguity.
- **Examiner assignment & staffing rules**
  - Examiners can **self-assign** (or be assigned) to sessions.
  - **Cannot release** a schedule that includes **unstaffed** sessions. System should block release and list what’s missing.
- **CSV import**
  - Admins can upload examiner/student **CSV** for a given assignment.
  - **New:** Allow selecting an **existing CSV previously uploaded** to another assignment (re-use). If formats differ, show a mapping prompt or clear error.
- **Session generation & editing**
  - Generator should create sessions from **date/time range + duration + (optional) gap**.
  - Must support **deleting or disabling a single generated session** in the series (soft-delete is acceptable).
  - Support **mass-edit** basics (e.g., venue/time tweaks without recreating all sessions).
- **UI/Feedback expectations**
  - Show **counts** (e.g., “staffed / total sessions”) near **Release**.
  - Clear errors for invalid totals (e.g., grading criteria/weights over 100%), invalid dates, or CSV format issues.
  - Courses/assignments navigation should be intuitive: after creating an assignment, the next step to **staff → create sessions → release** should be obvious.

## Issues Observed (Things to Fix)
- End < Start date currently **accepted** → add validation and error message.
- CSV upload had **format issues**; “re-use from previous assignment” not surfaced in UI.
- Zoom sessions currently modeled as one session with capacity; needs **split into distinct parallel sessions**.
- **Delete/disable one session** in a generated series not obvious/complete.
- **Release** allowed/appeared available even when staffing incomplete; add **pre-release checks & blocking**.
- Counts/indicators (e.g., number of staffed sessions) not **displayed near Release**.
- Some admin navigation friction (e.g., confusion about where to define assignment vs course mgmt).
- Overlap rules not enforced consistently (should allow multi-venue overlap, but prevent examiner/venue conflicts).

## Decisions
- Adopt the **one-session-per-group** representation for Zoom capacity.
- Implement **strict release gating**: no release if any session is unstaffed or invalid.
- Support **single-session delete/disable** within a generated series.
- Provide **CSV re-use** from prior assignments with clear format guidance/mapping.
- Permit **venue/examiner-based overlaps**; block same-resource conflicts.

## Action Items
- **Validation:** End/Start date rules; weight totals; pre-release gating — *FE+BE: Caspar + Ian*
- **Zoom capacity as parallel sessions** (model + UI) — *BE: Caspar; FE: Nemo*
- **Single-session delete/disable** (soft delete + UI affordance) — *BE: Benyuan; FE: Ian*
- **CSV re-use** (picker UI + mapping/format errors) — *BE: Benyuan; FE: Ian*
- **Release screen indicators** (staffed/total, blockers list) — *FE: Nemo*
- **Overlap constraints** (resource-aware checks) — *BE: Caspar*
- **Navigation polish** (clear stepping from Assign → Staff → Sessions → Release) — *FE: Ian*
