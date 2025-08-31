## Sprint 6 Review

**Sprint Window:** 22–29 Aug 2025  
**Sprint Goal:** Progress Epic 5 (Scheduling/Examiner self‑assignment) to demo‑ready state; stabilise criteria editing; prepare CSV import and invites.

### Completed / Demo‑Ready
- **Criteria editor** baseline flow working (create/edit/delete levels & criteria).  
- **UI unification** on criteria cards and form interactions.  
- **Backend**: listing endpoints reworked to **POST** with status filtering (pending merge to `dev`).  
- **DEV environment** stood up for joint FE/BE testing during the meeting.

### Partially Done / In Progress
- **Server‑side search** (pagination‑aware) — FE wiring pending; BE supports filters.  
- **Status propagation** — FE to pass explicit status to avoid default “active‑only” filter.  
- **CSV import → DB persist** — API under development; FE preview exists.  
- **Invitation emails** — endpoint and templates outstanding.  
- **Branch conflicts** between FE branches (display & criteria flows).

### Not Completed / Deferred
- Distinct **level `title`** field in BE (currently mirrors `description`).  
- **Color persistence** for levels (removed/replaced by default on FE).

### Demos & Evidence
- Live walkthrough on DEV during meeting; screenshots and notes captured by PO (see minutes).

### Stakeholder Feedback
- Keep scope tight for the **client demo (Fri)**: scheduling flow + criteria editor; polish over breadth.  
- Prioritise integration reliability over new surface features.

### Risks
- BE capacity and late merges could compress testing time.  
- API documentation drift → addressed via “push→test→log gaps→fix” loop with Testing Lead.

### Next Sprint Focus (pre‑read for Planning)
- Finish EP5 end‑to‑end; complete CSV import & invites; begin EP3/6 assessment pages scaffolding and API contracts.
