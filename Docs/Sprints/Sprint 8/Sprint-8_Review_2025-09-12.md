# Sprint 8 — Review (12 Sep 2025)

## What We Shipped
**Delivered / demoed**
- Validation guardrails for assignment setup (date ranges, weight totals, release blockers surfaced inline).
- Zoom capacity now generates parallel sub-sessions with distinct links and staffing slots.
- Single-session disable/delete for generated series, including audit trail and UI confirmation.
- Release gating indicators with staffed/total counts and blocker list on the Release screen.
- CSV upload now supports selecting previous mappings with clearer error messaging.
- Regression smoke checklist executed on Create → Staff → Sessions → Release → Book paths; blockers resolved before demo.

**Partially done / needs finish**
- Venue/examiner overlap detection works for exact conflicts but misses multi-day edge cases.
- Course search refinements (backend) drafted but not wired into FE navigation.
- Release navigation polish and guided next steps still rely on placeholder copy.

**Deferred / out of scope for S8**
- Full resource-aware clash resolution (stretch goal) — moved to Sprint 9 backlog.
- Automated migration script for session model refactor (manual notes only).
