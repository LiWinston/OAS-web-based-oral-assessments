# Sprint 10 — Review (10 Oct 2025)

## What We Shipped
**Delivered / demoed**
- **Examiner execution suite:** Issues 3.2–3.10 plus Epic 3 backend support now provide the full assessor flow—schedule context, consolidated marking workspace, per‑criterion input, save-progress/notes, independent submissions, and shared comment library curation.
- **Scheduling + booking loop:** Admin slot setup (5.1 + 5.1.1/5.1.2), booking lifecycle (5.3–5.8), student reschedule (5.6), and examiner self-allocation (5.9) reached parity with client expectations; the follow-up fixes from meeting actions (#339–#341, timeslot reconstruction) shipped with the release.
- **Canvas CSV lifecycle:** Upload/re-upload/preview/error handling (1.1–1.5) plus export parity (1.4) were completed end-to-end, letting admins round-trip Canvas data without manual SQL. Backend epics 1 & 4 were updated with shared headers/templates.
- **Auth + governance:** Secure login/password reset/invite notifications (2.1–2.2.3), Canvas-linked onboarding (2.1.2/2.1.3), user management (2.4) and the Super Admin suite (9.1–9.5) are now live, including supporting backend tasks and documentation.
- **Enablement & docs:** Architecture/sequence diagram refresh, API endpoint doc review, testing-plan research, VPN assessment, and updated UI prototypes/presentation decks were packaged for the client handover.

**Partially done / needs finish**
- **Automated regression/testing** — We documented the test approach and analysed the booking API, but the scripted regression suite is still pending; smoke tests remain manual.
- **Deployment/runbook polish** — Architecture/design artefacts were refreshed, yet the dual-environment run instructions referenced in Sprint 9 still need final review and screenshots before circulation.
- **Client comms artefacts** — Presentation materials were delivered, but the formal Endeavour/client email receipts are tracked outside the repo and must be archived with the sprint bundle.

**Deferred / out of scope for S10**
- Self-service student account creation/login variants (2.1, 2.2, 2.3) remain on the backlog because Canvas-first provisioning met the current stakeholder requirement.
- Generalised admin-less user management (2.4 “Not Doing” entry) stays deferred until the client prioritises decentralized provisioning.
