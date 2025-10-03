# Client Meeting Minutes – OAS Demo & Marking Flow

**Date:** Thu, 25 Sep 2025  
**Time:** ~04:16–05:04 UTC (≈ 47 min)  
**Attendees:** Hasti Samadi, Geela Chee, Ian CHI, Haocheng Li  
**Topic:** Demo of course/assignment flow, timeslot management, marking, CSV import, release policies

---

## 1) Context & Objectives
- Walk through the **end-to-end user flow**: find course/assignment → create/assign timeslots → booking → marking UI → results.
- Validate **CSV import formats** (students/examiners; mixed assignment types).
- Align on **release rules** (marks/comments) and **visibility** for students.
- Confirm **combine/aggregate** behaviour for multi-marker assessments.

---

## 2) Demo Highlights & Current Behaviour
- **Global search**: Quickly finds subjects (e.g., *SWEN900xx*), courses, and assignments.
- **Timeslot management**:
  - Batch create timeslots (start time, slot length, gap, venue).
  - Capacity field is **per session** (confirmation from Hasti).
  - Booked timeslots cannot be removed.
- **Booking & assignment**:
  - Can assign participants (e.g., Ian assigned to a slot) and confirm.
- **Marking interface**:
  - Group view with **Rubric** and **Feedback** tabs.
  - Supports multiple markers per team (per requirements).
- **CSV import**:
  - Student CSV works; **examiner CSV has an issue** currently.
  - Mixed-type assignments need a clear CSV schema.

---

## 3) Decisions & Agreements
1. **Capacity semantics**  
   - “Capacity” is **per timeslot/session** (not global), retained as-is.

2. **Rubric scoring constraints**  
   - **Prevent zero** for group-component criteria when it doesn’t make sense (show validation/error).  
   - Provide clear error messaging on invalid rubric entries.

3. **Release controls & permissions**
   - Two independent switches: **Release Marks** and **Release Comments**.  
   - **Admin should NOT edit examiner comments after release** (fairness/traceability).  
   - Keep admin’s control limited to toggling **release/not release**.

4. **Student visibility of comments**
   - Whether students see comments is governed by **Release Comments**.  
   - Avoid per-comment hidden states to reduce complexity.

5. **Combine/aggregate behaviour for multi-marker assessments**
   - Support **bulk “Combine All”** across groups—**do not** require doing it one group at a time.  
   - Distinguish clearly between **Average** vs **Final**:  
     - *Average*: aggregation of multiple markers’ rubric outcomes.  
     - *Final*: the officially released result after combine/resolve.

6. **Timeslot deletion guard**
   - Maintain protection: **cannot delete booked** timeslots. Consider a replace/reassign flow (not cancel) when necessary.

---

## 4) Clarifications & Open Questions
- **CSV for mixed assignments**:  
  - Exact columns and examples needed (students, groups, examiners, mapping to assignment type).
- **Replace vs cancel** in bookings:  
  - Operationally, replacements are changes (not cancellations). UI should reflect **change history** clearly (auditability).
- **Post-release amendments**:  
  - Confirm the policy for post-release corrections (likely via new version/change log rather than editing examiner comments).

---

## 5) Action Items
- **[Ian]** Fix **examiner CSV upload** bug and add robust error feedback.  
- **[Ian]** Add **validation** to prevent invalid (e.g., zero where disallowed) rubric entries; display clear inline errors.  
- **[Haocheng]** Implement **bulk “Combine All”** operation for multi-marker assessments; ensure Average vs Final is explicit in UI labels and summaries.  
- **[Ian + Haocheng]** Define and document **CSV schemas** (students, examiners, mixed assignments) with sample files.  
- **[Ian]** Enforce **no admin editing of comments after release**; keep release toggles (Marks/Comments) separate and auditable.  
- **[Team]** Provide a **replace/reassign** flow for booked timeslots with change history (avoid “cancel” semantics).  
- **[Ian]** Small UI polish: confirm labels (“capacity per session”), tooltips for Release toggles, and combine behaviour help text.

---

## 6) Risks / Dependencies
- CSV schema ambiguity may block admin imports; provide templates early.
- Post-release governance requires audit trails (versions/immutable comments) to avoid disputes.
- Bulk combine must handle edge cases (missing marker data, conflicting scores, partial submissions).

---

## 7) Next Steps
- Ship CSV fix + schemas and **retry import** with Hasti/Geela.  
- Demo **bulk combine** and **release toggles** with updated UI text.  
- Validate rubric constraints with sample data.  
- Confirm policy for replacements and display of change history.

