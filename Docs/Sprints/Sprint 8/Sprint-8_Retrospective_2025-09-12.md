# Sprint 8 — Retrospective (12 Sep 2025)

## Reflection
**Went well**
- BE/FE pairing on session model changes meant zero API breakages during the sprint.
- Daily smoke checklist kept release gating bugs visible and prioritised.
- CSV re-use flow benefitted from early QA feedback, cutting demo rework.

**Didn’t go well**
- Overlap detection lacked representative test data; edge cases surfaced late.
- Release indicators relied on manual data fixes before demo because seed scripts lagged behind schema updates.
- Documentation on the new gating rules wasn’t published in time, leaving QA to reverse-engineer behaviours.

**Improvements**
- Extend fixtures to cover multi-day venues/examiners and add automated tests before tackling stretch overlaps.
- Tie migration/seeding updates to the same PRs as model changes; add checklist item before merge.
- Publish short “what changed” notes for QA within 24h of feature merge so smoke tests stay aligned.
