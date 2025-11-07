# Sprint 10 — Planning (Starting 3 Oct 2025)

**Sprint Goal:** Finalise the examiner execution experience, make booking + Canvas data flows production-ready, and harden authentication/governance so the client can self-serve across all user roles at handover.

## Must-Have (Commit)
1. **Examiner execution & feedback closure**
   - Land the full examiner UX (3.2–3.10): schedule visibility, streamlined marking workspace, independent submissions, comment library updates, and save-progress safeguards.
   - Ensure Epic 3 backend work stays in lockstep with FE so rubric data, notes, and submission states remain consistent in the API.
   - *Owners:* Crystallen1, TianyunLei, YulkonFU with xiongnemo on service parity.
2. **Scheduling & booking reliability**
   - Finish the 5.x series: admin slot generation (5.1 + 5.1.1/5.1.2), booking creation/edit, student reschedule (5.6) and examiner self-allocation (5.9) with availability management (5.8).
   - Close the remaining bug-fix follow-ups from the client meeting (Issues #339–#341) plus the timeslot reconstruction fix.
   - *Owners:* yungenchi, lihaocheng1006, LiWinston.
3. **Canvas CSV lifecycle**
   - Complete the upload/re-upload/preview/error loop (1.1–1.5) across FE + BE, including documentation for the mapping rules and the shared CSV components.
   - Keep the export surface (1.4) aligned with mark consolidation outputs so admins can round-trip student data without ad-hoc scripts.
   - *Owners:* TianyunLei (FE) with Crystallen1 on backend pairing.
4. **Authentication & governance**
   - Deliver the login, password reset and onboarding stories (2.1–2.4, 2.2.1–2.2.3) and connect them to Canvas notifications (2.1.2/2.1.3).
   - Stand up Super Admin management (9.1–9.5) plus the supporting API/doc tasks so access control matches university expectations.
   - *Owners:* lihaocheng1006, Crystallen1, Kruase, yungenchi.

## Should-Have (Stretch)
- **API & documentation hardening** — Epic 4/9 API testing, endpoint doc review, sequence diagram updates, and architecture design refresh.
- **Prototype/presentation polish** — Apply the UI prototype adjustments for examiner/course admin, acceptance-criteria refresh, and prep the next client demo deck.
- **Testing enablement** — Research + outline the end-to-end testing plan, including Virtual Private Network requirements for staging and booking API analysis.

## Acceptance Criteria (Samples)
- Examiner can navigate from schedule (3.2) into the consolidated marking workspace (3.3) and submit individual + group feedback (3.4/3.5) independently; save-progress survives refresh and is reflected in the admin summary (6.5).
- Admins generate slots with session parameters (5.1.1/5.1.2), students/group bookings respect quotas (5.4/5.5) and can reschedule once per policy (5.6) while examiner self-allocation honors min/max limits (5.9).
- CSV upload warns before overwriting, shows diffs (1.2/1.3) and surfaces validation errors (1.5); the export matches Canvas template headers and totals (1.4).
- Logging in via password or invite email (2.2.1 + 2.1.2/2.1.3) issues the correct role-based dashboard; Super Admins can provision/revoke course admins (9.2–9.4) with audit history.

## Risks & Mitigations
- **Auth + email dependencies** — Canvas notification and email gateway integration may lag; stage with mock providers and capture resend tooling early.
- **Booking edge cases** — Reconstructing legacy timeslots can regress confirmed bookings; run data migrations on a clone dataset before touching prod-like data.
- **CSV drift** — Multiple owners touching CSV logic risks schema mismatch; centralise headers in a shared module and gate merges on template snapshot tests.
- **Documentation debt** — Architecture and API docs already trail implementation; time-box doc reviews mid-sprint so they do not bunch up before demo.

## Owners (High Level)
- **Examiner UX + booking FE:** TianyunLei, YulkonFU, yungenchi, LiWinston.
- **Backend / data:** Crystallen1, DongqiaoHe, wangxiang13, xiongnemo.
- **Auth & admin workflows:** lihaocheng1006, Kruase.
- **Documentation, testing & presentations:** BENYUANWANG, weiranxu-unimelb, yungenchi.
