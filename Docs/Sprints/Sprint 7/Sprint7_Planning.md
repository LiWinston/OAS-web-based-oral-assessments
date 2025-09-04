# Sprint 7 Planning — 1–7 Sep 2025

## Sprint Goal
Deliver **Epic 5 end‑to‑end** (scheduling + examiner self‑assignment) integrated on DEV for the **Fri client demo**, and complete **CSV import → DB + invitation emails**. Kick off scaffolding & API contracts for key **Epic 3/6 assessment pages**.

## Scope (Stories/Epics)
- **Epic 5 — Scheduling & Booking**
  - 5.x: List/create/update time slots & venues; examiner self‑assignment; admin availability.
  - Server‑side search, pagination, and status filters.
- **Epic 1 — CSV IO**
  - Persist imported students/groups; return import summary; trigger invite queue.
- **Epic 7 — Notifications**
  - Email invites for new accounts post‑CSV import.
- **Epic 3/6 — Assessment Execution & Results (scaffolds)**
  - Examiner marking page baseline, examiner results view, student results view; API contract drafts.

## Deliverables
- DEV environment demonstrating EP5 flow end‑to‑end.  
- Working CSV import that persists rows and enqueues **invite emails**.  
- Draft API docs for assessment pages (EP3/6) reviewed by FE & BE.

## Work Breakdown & Owners
### Frontend
- **EP5 FE integration (search/pagination/status):** Tianyun, Yukun
- **Criteria editor polish (Title≈Description, remove colors):** Yukun
- **CSV import UI → backend hooks (success/error states):** Tianyun
- **Assessment pages scaffolding (examiner mark/results, student results):** Yanqing (lead), Haocheng (baseline scaffolds)

### Backend
- **EP5 endpoints (POST + filters), data correctness:** Yongchun (lead), Yunpeng, Xiang
- **CSV persist + import summary API:** Yunpeng, Dongqiao
- **Invite email endpoint + templates (Epic 7):** Yongchun (endpoint), Yunpeng (mail service)
- **Add `title` to level model (or confirm unified field):** Backend team

### Testing
- **Daily DEV smoke** on pushed features; log API‑doc mismatches → assign owners. (Lead: Benyuan)
- **End‑to‑end rehearsal** for client demo checklist by Thu.

## Milestones & Dates (AEST)
- **Mon–Tue (1–2 Sep):** Resolve merges; EP5 endpoints stable on DEV; FE search wiring.  
- **Wed (3 Sep):** Mid‑semester presentation (selected speakers); CSV persist working.  
- **Thu (4 Sep):** Full E2E walkthrough on DEV; demo script freeze.  
- **Fri (5 Sep):** Client demo (EP5 + CSV→invites + criteria editor).

## Risks & Mitigations
- **Backend bandwidth:** parallelise across Yongchun/Yunpeng/Dongqiao/Xiang; PO to de‑scope non‑critical UI polish.  
- **API drift:** lock a minimal contract; Testing to gate merges with quick conformance checks.  
- **Time constraints:** nightly merges + auto‑deploy to DEV; keep scope tight to demo pathways.

## Definition of Done (This Sprint)
- EP5 user flow navigable on DEV without console/API errors.  
- CSV import persists data and returns a visible summary; invite emails can be triggered and observed in logs/sandbox.  
- Updated API docs published; FE reads from them (no hard‑coded assumptions).
