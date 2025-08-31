# Meeting Minutes - OAS Project Team Meeting

**Date:** Friday, 29 August 2025  
**Time:** 16:00–17:00 (AEST)  
**Meeting Type:** Weekly Team Meeting (Progress, Integration, Next Sprint Prep)

## Attendees
- Ian CHI (PO)
- Haocheng Li (Frontend Lead)
- Tianyun Lei (Frontend)
- Yukun Fu (Frontend)
- Yunpeng Xiong (Backend/DevOps)
- Yongchun Li (Backend)
- Benyuan Wang (Testing Lead)
- Xiang Wang (Backend)
- Yanqing SHI (Frontend)
- *Note:* Dongqiao He (Backend) — in interview during part of the meeting

## Agenda
1. Frontend demo & progress (criteria editor, assignment flow)
2. Backend integration status (Epic 5 scheduling APIs, query semantics)
3. Data model/API gaps (level title/description, status filter, search)
4. CSV import & email invites
5. Conflict resolution & branch merging
6. Presentation planning (mid‑week internal, client demo end of week)
7. Tasks & ownership for the coming week

---

## 1) Frontend Progress & Demo
- **Criteria editor & flows** (Tianyun): core flow working; UI of “criteria cards” unified; able to create, edit, delete criteria and levels; minor issues remain.
- **Observed issues during walkthrough:**
  - Some table views not receiving the full dataset; pagination wiring to backend incomplete.
  - “Interactive/Status” not reflecting after certain actions due to API contract mismatch.
  - “Description” saved; **“Title” currently mirrors Description** due to backend field constraints.
- **Environment:** temporary DEV backend opened during call for live testing.

## 2) Backend Integration Notes
- **Calls listing** endpoint behavior updated to **POST** and supports status filters (per Yongchun); FE/BE branches still need merge & sync.
- Current backend returns only **active** items if status not provided; FE to supply explicit status where needed.
- **Server‑side search** required (frontend pagination prevents client‑only filtering).

## 3) Data Model / UI Decisions
- **Level Title vs Description:** Backend currently exposes a single field; FE will:
  - Treat Title ≈ Description for now; surface as one editable field.
  - Once backend adds a distinct `title`, FE will map accordingly.
- **Level Color:** Backend does not persist color.
  - Decision: **remove color** for now; optionally default to a single light‑blue accent for all levels. If needed later, FE can derive color from score ranges purely client‑side.
- **Search:** move to backend query param/body; FE to pass pagination + filters.

## 4) CSV Import & Email Invites
- CSV upload preview works; **persist to DB and invitation emails still to be wired.**
- After import, system must: create users/groups where applicable → send invitation emails for registration.
- Ownership: **Backend (Yunpeng/Yongchun/Dongqiao)** for persistence & email endpoints; **Frontend (Tianyun)** to trigger flows and handle success/error states.

## 5) Conflicts & Branch Merging
- **FE merge conflict** between Tianyun and Yongchun’s branches (both touched display fixes and criteria flows). Action: pair this evening to resolve and retest end‑to‑end on DEV.
- Code quality reminder: avoid dumping everything into a single page & global CSS; follow componentization/KISS; PO/FE lead to provide baseline scaffolds when helpful.

## 6) Presentations & External Milestones
- **Internal check (Thu)**: end‑to‑end flow for **Epic 5** must run (“whole path” walk‑through).
- **Client demo (Fri)**: show scheduling + examiner self‑assignment and related flows.
- **Mid‑semester presentation (Wed)**: each member must present at least once across the course; tentative speakers for this checkpoint: **Yunpeng**, **Dongqiao**, **Tianyun**, **Ian** (TBC for the remaining slots). Timebox ~2 min each; avoid overlap with final presenters.

## 7) Decisions (Snapshot)
- Use **POST** for listing endpoints where defined; pass explicit **status**.
- **Title/Description** unified on FE until BE adds `title`.
- **Remove colors** (or use uniform light‑blue) for level chips/badges.
- **Backend‑driven search + pagination**; FE sends filters.
- Tonight: **resolve FE merge conflicts** (Tianyun ↔ Yongchun) and run DEV test.

## 8) Action Items
| Item | Owner(s) | Due |
|---|---|---|
| FE merge conflicts resolved; push to `dev` and smoke test | Tianyun, Yongchun | **Tonight (29 Aug)** |
| Implement server‑side search wiring (FE → BE) | Tianyun, Yukun; backend support: Yongchun | 31 Aug |
| Expose explicit `status` filter; confirm POST contracts | Yongchun (BE), FE team | 31 Aug |
| CSV import → persist to DB; return import summary | Yunpeng, Dongqiao | 1 Sep |
| Invitation email API & templates; FE trigger | Yunpeng, Yongchun; FE: Tianyun | 2 Sep |
| Criteria field mapping (Title≈Description); remove color or default light‑blue | Yukun | 31 Aug |
| EP5 E2E dry‑run on DEV; record gaps | All FE/BE + Testing (Benyuan) | **Thu 4 Sep** |
| Client demo prep deck & rehearsal | Ian (PO), Haocheng (FE lead) | **Thu 4 Sep** |

## 9) Risks & Mitigations
- **API drift / undocumented changes** → Adopt “push → testing team cross‑check API doc → immediate integration test → log gaps → owners fix” loop.
- **Backend capacity** for EP5 and email integration → spread tasks across **Yunpeng/Yongchun/Dongqiao/Xiang**; PO to help with prioritisation.
- **Time pressure before client demo** → nightly merges & DEV deployments; keep scope to EP5 + CSV import + invites.

---

**Next Meeting:** Mon 1 Sep 2025, 16:00 AEST (stand‑up & integration check)
