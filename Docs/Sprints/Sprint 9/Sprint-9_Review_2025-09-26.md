# Sprint 9 — Review (26 Sep 2025)

## What We Shipped
**Delivered / demoed**
- **Exports + reporting bundle** — Completed the Canvas-compatible marks export (1.4) and surfaced the three CSVs plus sanity checks through the admin UI; Epic 6 reporting views (6.4–6.7) now present scheduling, examiner and student visibility data aligned with the reference templates.
- **Examiner marking workflow** — Issues 3.7–3.10 closed out the save-progress flow, rubric per‑criterion capture, independent submissions and shared comment library updates so assessors can finish Sprint 9 assessments without depending on admins.
- **Schedule + rescheduling loop** — Examiner schedule visibility (3.1), booking management (5.1–5.9) and student reschedule (5.6) were stabilised, giving both admins and students the complete end-to-end scheduling surface for release.
- **Access & account hygiene** — Admin account management (2.4) plus the refined Canvas upload/re-upload tooling ensure we can onboard courses, fix data, and keep permissions locked down ahead of the client handover.

**Partially done / needs finish**
- **Regression sweep depth** — We only exercised the flows tied to the export/reporting areas; the backlog user stories still need a full smoke pass before the release candidate.
- **Handover doc refresh** — The dual-environment deployment/runbook updates referenced in the plan are still in draft on the wiki and need review before sharing externally.
- **Submission artefacts** — Endeavour ZIP + client email tracking lives outside GitHub; we still need to archive the confirmation receipts with the rest of the sprint package.

**Deferred / out of scope for S9**
- Wider **system regression automation** and overlap with low-priority bugs were moved to Sprint 10 once the export/report scope was locked.
- **Documentation polish (wiki parity with Jira handover)** slipped so we could focus on making the reporting deliverables demo-ready.
