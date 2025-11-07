# Sprint 10 — Retrospective (10 Oct 2025)

## Reflection
**Went well**
- Cross-squad pairing (Crystallen1 + TianyunLei + YulkonFU) kept the examiner UX stories aligned; FE/BE handoffs landed with minimal rework.
- Booking features benefitted from early data seeding plus yungenchi/lihaocheng1006 rotations, so client meeting fixes shipped alongside core stories.
- Auth + Super Admin governance closed without last-minute firefighting thanks to reusing the Canvas notification infrastructure and a shared checklist.

**Didn’t go well**
- We still relied on manual regression; the “testing plan” ticket produced documentation but no executable suite, leaving gaps before handover.
- Deployment/wrunbook artifacts lag behind the architecture refresh, so onboarding new contributors still requires tribal knowledge.
- Backlog items marked “Not Doing” (self-service onboarding resets, generic admin management) were not re-scoped early, causing confusion during review.

**Improvements**
- Treat the automated regression suite as a planned deliverable (definition of done: scripts runnable in CI) and schedule ownership before Sprint 11 starts.
- Time-box runbook updates alongside architecture work—same reviewers, same PR—to keep operational docs from drifting.
- Add an explicit “Backlog/Deferred” section in planning and review notes so stakeholders see which Jira issues are intentionally parked.
